import {
  Hbar,
  Client,
  TokenMintTransaction,
  TransferTransaction,
  PrivateKey,
} from "@hashgraph/sdk";
import AWS from "aws-sdk";
import { v4 as uuidv4 } from 'uuid';


// Global Variables
const escrowAccountId = process.env.REACT_APP_ESCROW_ID;
const escrowAccountKey = process.env.REACT_APP_ESCROW_KEY;
const k = PrivateKey.fromStringECDSA(escrowAccountKey);
const client = Client.forTestnet().setOperator(escrowAccountId, k);
const WRITER_NFT_ID = process.env.REACT_APP_WRITER_NFT_ID;
const BUYER_NFT_ID = process.env.REACT_APP_NFT_ID;


// Has NFT function
const hasNft = async (writerNftId, writerNftSerial) => {
  const response = await fetch("https://cvcjxnv5rqp2hzsavo2h7jxnci0yfbbo.lambda-url.us-east-1.on.aws/", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      nftTokenId: writerNftId,
      serialNumber: writerNftSerial
    }),
  });

  const responseData = await response.json();

  return responseData.data;
};


export const handler = async (event) => {
  if (event.requestContext) {
    // Preflight request handling for CORS.
    if (event.requestContext.http.method === 'OPTIONS') {
      return createResponse(204, 'No Content', 'Preflight request.', {});
    } else if (event.requestContext.http.method !== 'POST') { // Require POST.
      return createResponse(405, 'Method Not Allowed', 'POST method is required.', {});
    }
  }


  // Take params from the event body
  let writerNftSerial, optionBuyerId;
  try {
    const body = JSON.parse(event.body);

    writerNftSerial = body.writerNftSerial.split('#')[1];
    optionBuyerId = body.optionBuyerId;

    if (!body.writerNftSerial || !body.optionBuyerId) {
      throw new Error("Missing required parameters.");
    }

  } catch (error) {
    return createResponse(400, 'Bad Request', 'Error parsing request body.', error);
  }


  // Fetch writer NFT metadata from Dynamo
  let tokenId, amount, premium, strikePrice, expiry, isCall;
  try {
    const dynamo = new AWS.DynamoDB.DocumentClient();
    const params = {
      TableName: process.env.TABLE_NAME,
      Key: {
        PK: `ID#${writerNftSerial}`,
        SK: "METADATA#WRITEOPTION"
      },
    };

    const { Item } = await dynamo.get(params).promise();

    if (!Item) {
      throw new Error("Writer NFT not found in Dynamo");
    }

    tokenId = Item.tokenId;
    amount = Item.amount;
    premium = Item.premium;
    strikePrice = Item.strikePrice;
    expiry = Item.expiry;
    isCall = Item.isCall;

  } catch (error) {
    return createResponse(500, "Failed to fetch NFT metadata from Dynamo", error);
  }


  // Construct the image URL using the Lambda function that generates an SVG image
  const imageUrl = `https://yybmxsbwl77a7jmenjyjm2odau0ulkoc.lambda-url.us-east-1.on.aws/?isCall=${encodeURIComponent(isCall.toString())}&isWriter=false&token=${encodeURIComponent(tokenId)}&tokenAmount=${encodeURIComponent(amount)}&premium=${encodeURIComponent(premium)}&strikePrice=${encodeURIComponent(strikePrice)}&expiry=${encodeURIComponent(expiry)}`;

  // Determine option type based on IsCall
  const optionType = isCall ? "Call" : "Put";

  // Construct metadata
  const metadata = {
    name: `${optionType} Buyer NFT`,
    description: `This NFT represents the buyer position of a HashStrike ${optionType.toLowerCase()} option`,
    creator: "JBuilds",
    image: imageUrl,
    type: "image/svg+xml",
    attributes: [
      {
        trait_type: "Option Type",
        value: optionType,
      },
      {
        trait_type: "Token",
        value: tokenId,
      },
      {
        trait_type: "Token Amount",
        value: amount,
      },
      {
        trait_type: "Premium",
        value: premium,
      },
      {
        trait_type: "Strike Price",
        value: strikePrice,
      },
      {
        trait_type: "Expiry",
        value: expiry,
      },
    ],
  };


  // Upload metadata to S3 for NFT minting
  let url;
  try {
    const uniqueId = uuidv4().slice(0, 8);;

    const s3 = new AWS.S3({ region: "us-east-1" });
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: `${optionBuyerId}/${uniqueId}.json`,
      Body: JSON.stringify(metadata),
      ContentType: 'application/json',
      ACL: 'public-read'
    };

    await s3.upload(params).promise();

    console.log(`- Metadata uploaded to S3 for writer ${optionBuyerId} and token ${tokenId}`);

    url = `https://${process.env.S3_BUCKET}.s3.us-east-1.amazonaws.com/${optionBuyerId}/${uniqueId}.json`;

  } catch (error) {
    return createResponse(500, "Failed to write to S3", error);
  }


  // Mint the NFT and return tx to sign
  try {
    // Get current writer NFT owner
    let writerAccountId;
    try {
      writerAccountId = await hasNft(WRITER_NFT_ID, writerNftSerial);
      if (!writerAccountId) {
        throw new Error("Could not find owner of writer NFT");
      }

    } catch (error) {
      return createResponse(500, "Failed to check writer NFT ownership", error);
    }


    console.log("=== Option Buy Initiated ===");

    // Mint a new NFT with metadata
    const mintTx = new TokenMintTransaction()
      .setTokenId(BUYER_NFT_ID)
      .addMetadata(Buffer.from(url))
      .freezeWith(client);

    const mintTxSigned = await mintTx.sign(k);
    const mintTxResponse = await mintTxSigned.execute(client);

    const mintReceipt = await mintTxResponse.getReceipt(client);
    const serialNumber = mintReceipt.serials[0].toNumber();
    console.log(`Option Buyer NFT Minted - Serial Number: ${serialNumber}`);

    const transferTx = await new TransferTransaction()
      .addHbarTransfer(optionBuyerId, new Hbar(-premium))
      .addHbarTransfer(writerAccountId, new Hbar(premium))
      .addNftTransfer(
        BUYER_NFT_ID,
        serialNumber,
        escrowAccountId,
        optionBuyerId
      )
      .freezeWith(client);

    const signedTx = await transferTx.sign(k);
    const signedTxBytes = signedTx.toBytes();
    const signedTxBase64 = Buffer.from(signedTxBytes).toString("base64");

    return createResponse(200, "Option NFT minted", "Transaction to sign created", { signedTx: signedTxBase64 });

  } catch (err) {
    return createResponse(500, "Failed to mint buyer NFT", err);
  }
}


// Create response.
const createResponse = (statusCode, statusDescription, message, data) => {
  const response = {
    statusCode,
    statusDescription,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      data
    })
  };

  statusCode === 200 ? console.log('RESPONSE:', response) : console.error('RESPONSE:', response);

  return response;
};