import {
  Client,
  TokenMintTransaction,
  TransferTransaction,
  PrivateKey,
  AccountId,
  Hbar,
} from "@hashgraph/sdk";
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';


// Global variables
const escrowAccountId = AccountId.fromString(process.env.REACT_APP_ESCROW_ID);
const k = PrivateKey.fromStringECDSA(process.env.REACT_APP_ESCROW_KEY);
const WRITER_NFT_ID = process.env.REACT_APP_WRITER_NFT_ID;
const client = Client.forTestnet().setOperator(escrowAccountId, k);


export const handler = async (event) => {
  if (event.requestContext) {
    // Preflight request handling for CORS.
    if (event.requestContext.http.method === 'OPTIONS') {
      return createResponse(204, 'No Content', 'Preflight request.', {});
    } else if (event.requestContext.http.method !== 'POST') { // Require POST.
      return createResponse(405, 'Method Not Allowed', 'POST method is required.', {});
    }
  }


  // Take in body params
  let writerAccountId, tokenId, amount, strikePrice, isCall, premium, expiry;
  try {
    const body = JSON.parse(event.body);

    if (!body.writerAccountId || !body.tokenId || !body.amount || !body.strikePrice || !body.isCall || !body.premium || !body.expiry) {
      throw new Error("Missing required parameters.");
    }

    writerAccountId = body.writerAccountId;
    tokenId = body.tokenId;
    amount = body.amount;
    strikePrice = body.strikePrice;
    isCall = body.isCall === true; // Ensure boolean
    premium = body.premium;
    expiry = body.expiry;

  } catch (error) {
    return createResponse(400, 'Bad Request', 'Error parsing request body.', error);
  }

  // Construct the image URL using the Lambda function that generates an SVG image
  const imageUrl = `https://yybmxsbwl77a7jmenjyjm2odau0ulkoc.lambda-url.us-east-1.on.aws/?isCall=${encodeURIComponent(isCall.toString())}&isWriter=true&token=${encodeURIComponent(tokenId)}&tokenAmount=${encodeURIComponent(amount)}&premium=${encodeURIComponent(premium)}&strikePrice=${encodeURIComponent(strikePrice)}&expiry=${encodeURIComponent(expiry)}`;


  // Determine option type
  const optionType = isCall ? "Call" : "Put";

  // Construct metadata
  const metadata = {
    name: `${optionType} Writer NFT`,
    description: `This NFT represents the writer position of a HashCalls ${optionType.toLowerCase()} option`,
    creator: "HashCalls",
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

    const s3 = new AWS.S3({ region: 'us-east-1' });
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: `${writerAccountId}/${uniqueId}.json`,
      Body: JSON.stringify(metadata),
      ContentType: 'application/json',
      ACL: 'public-read'
    };

    await s3.upload(params).promise();

    console.log(`- Metadata uploaded to S3 for writer ${writerAccountId} and token ${tokenId}`);

    url = `https://${process.env.S3_BUCKET}.s3.us-east-1.amazonaws.com/${writerAccountId}/${uniqueId}.json`;

  } catch (error) {
    return createResponse(500, "Failed to write to S3", error);
  }


  // Generate transaction to mint NFT for the user to sign
  try {
    console.log("Minting Writer NFT...");
    console.log(url);

    // Mint NFT
    const mintTx = new TokenMintTransaction()
      .setTokenId(WRITER_NFT_ID)
      .addMetadata(Buffer.from(url))
      .freezeWith(client);

    const mintTxSigned = await mintTx.sign(k);
    const mintTxResponse = await mintTxSigned.execute(client);
    const mintReceipt = await mintTxResponse.getReceipt(client);
    const serialNumber = mintReceipt.serials[0].toNumber();

    console.log(
      `- Writer NFT ID ${WRITER_NFT_ID} minted with serial number: ${serialNumber}`
    );

    let transferTx;

    if (isCall) {
      transferTx = await new TransferTransaction()
        .addNftTransfer(
          WRITER_NFT_ID,
          serialNumber,
          escrowAccountId.toString(),
          writerAccountId
        )
        .addTokenTransfer(tokenId, writerAccountId, -amount)
        .addTokenTransfer(tokenId, escrowAccountId, amount)
        .freezeWith(client);
      console.log(
        `- Call option writer ${writerAccountId} transferred ${amount} of token ${tokenId} to escrow ${escrowAccountId} - Transferred Writer NFT ID ${WRITER_NFT_ID} serial ${serialNumber} to writer ${writerAccountId}`
      );

    } else {
      transferTx = await new TransferTransaction()
        .addNftTransfer(
          WRITER_NFT_ID,
          serialNumber,
          escrowAccountId.toString(),
          writerAccountId
        )
        .addHbarTransfer(writerAccountId, new Hbar(-strikePrice))
        .addHbarTransfer(escrowAccountId, new Hbar(strikePrice))
        .freezeWith(client);
      console.log(
        `- Put option writer ${writerAccountId} transferred ${strikePrice} HBAR to escrow ${escrowAccountId} - Transferred Writer NFT ID ${WRITER_NFT_ID} serial ${serialNumber} to writer ${writerAccountId}`
      );
    }

    const metadata = { serialNumber, transactionId: mintTxResponse.transactionId.toString(), writerAccountId, tokenId, amount, strikePrice, isCall, premium, expiry };

    const signedTx = await transferTx.sign(k);
    const signedTxBytes = signedTx.toBytes();
    const signedTxBase64 = Buffer.from(signedTxBytes).toString("base64");

    return createResponse(200, "NFT minted", "Transaction to sign created", { signedTx: signedTxBase64, metadata });

  } catch (error) {
    return createResponse(500, "Internal Server Error", error);
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