import {
  Hbar,
  Client,
  TokenMintTransaction,
  TransferTransaction,
  PrivateKey,
} from "@hashgraph/sdk";
import AWS from "aws-sdk";

// Global Variables
const escrowAccountId = process.env.REACT_APP_ESCROW_ID;
const escrowAccountKey = process.env.REACT_APP_ESCROW_KEY;
const k = PrivateKey.fromStringECDSA(escrowAccountKey);
const client = Client.forTestnet().setOperator(escrowAccountId, k);
const WRITER_NFT_ID = process.env.REACT_APP_WRITER_NFT_ID;
const BUYER_NFT_ID = process.env.REACT_APP_NFT_ID;


// Has NFT function
const hasNft = async (writerNftId, writerNftSerial) => {
  const response = await fetch("https://5re3jroxrqvlb5l7mlymcrhuo40tjlxq.lambda-url.us-east-1.on.aws/", {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      writerNftId,
      writerNftSerial
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
  let writerNftSerial;
  try {
    const body = JSON.parse(event.body);

    if (!body.writerNftSerial) {
      throw new Error("Missing required parameters.");
    }

    writerNftSerial = body.writerNftSerial;

  } catch (error) {
    return createResponse(400, 'Bad Request', 'Error parsing request body.', error);
  }


  // Fetch writer NFT metadata from Dynamo
  let writerAccountId, tokenId, amount, premium, strikePrice, expiry, isCall;
  try {
    const dynamo = new AWS.DynamoDB.DocumentClient();
    const params = {
      TableName: process.env.TABLE_NAME,
      Key: {
        PK: writerNftSerial,
      },
    };

    const { Item } = await dynamo.get(params).promise();

    if (!Item) {
      throw new Error("Writer NFT not found in Dynamo");
    }

    writerAccountId = Item.writerAccountId;
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
    name: `${optionType} Buy NFT`,
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
    const s3 = new AWS.S3();
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: `${writerAccountId}/${tokenId}.json`,
      Body: JSON.stringify(metadata),
      ContentType: 'application/json',
    };

    await s3.upload(params).promise();

    console.log(`- Metadata uploaded to S3 for writer ${writerAccountId} and token ${tokenId}`);

    url = await s3.getSignedUrlPromise('getObject', {
      Bucket: process.env.S3_BUCKET,
      Key: `${writerAccountId}/${tokenId}.json`,
      Expires: 60 * 60
    });


  } catch (error) {
    return createResponse(500, "Failed to write to S3", error);
  }


  // Mint the NFT and return tx to sign
  try {
    // Get current writer NFT owner
    const writerAccountId = await hasNft(WRITER_NFT_ID, writerNftSerial);
    if (!writerAccountId) {
      throw new Error("Could not find owner of writer NFT");
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

    const metadata = { serialNumber, transactionId: mintTxResponse.transactionId.toString(), writerAccountId, tokenId, amount, strikePrice, isCall };

    const signedTx = await transferTx.sign(k);
    const signedTxBytes = signedTx.toBytes();
    const signedTxBase64 = Buffer.from(signedTxBytes).toString("base64");

    return createResponse(200, "Option NFT minted", "Transaction to sign created", { signedTx: signedTxBase64, metadata });

  } catch (err) {
    return createResponse(500, "Internal Server Error", err);
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