import {
  TokenWipeTransaction,
  TokenBurnTransaction,
  Client,
  TransferTransaction,
  PrivateKey,
  Hbar,
} from "@hashgraph/sdk";
import AWS from "aws-sdk";

// Global variables
const escrowAccountId = AccountId.fromString(process.env.REACT_APP_ESCROW_ID);
const k = PrivateKey.fromStringECDSA(process.env.REACT_APP_ESCROW_KEY);
const writerNftId = process.env.REACT_APP_WRITER_NFT_ID;
const buyerNftId = process.env.REACT_APP_BUYER_NFT_ID;

// Has NFT function
const hasNft = async (NftId, NftSerial) => {
  const response = await fetch(
    "https://5re3jroxrqvlb5l7mlymcrhuo40tjlxq.lambda-url.us-east-1.on.aws/",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        NftId,
        NftSerial,
      }),
    }
  );

  const responseData = await response.json();

  return responseData.data;
};

export const handler = async (event) => {
  if (event.requestContext) {
    // Preflight request handling for CORS.
    if (event.requestContext.http.method === "OPTIONS") {
      return createResponse(204, "No Content", "Preflight request.", {});
    } else if (event.requestContext.http.method !== "POST") {
      // Require POST.
      return createResponse(
        405,
        "Method Not Allowed",
        "POST method is required.",
        {}
      );
    }
  }
  var writerNftSerial,
    buyerNftSerial,
    strikePrice,
    tokenId,
    tokenAmount,
    isCall;
  try {
    const body = JSON.parse(event.body);
    writerNftSerial = body.writerNftSerial;
    buyerNftSerial = body.buyerNftSerial;
    strikePrice = body.strikePrice;
    tokenId = body.tokenId;
    tokenAmount = body.tokenAmount;
    isCall = body.isCall;
    if (
      !writerNftSerial ||
      !tokenId ||
      !tokenAmount ||
      !strikePrice ||
      !isCall
    ) {
      throw new Error("Missing required parameters.");
    }
  } catch (error) {
    return createResponse(
      400,
      "Bad Request",
      "Error parsing request body.",
      error
    );
  }

  // Burn buyer NFT from escrow
  try {
    var client = Client.forTestnet(escrowAccountId, k);
    const burnTx = await new TokenBurnTransaction()
      .setTokenId(buyerNftId)
      .setSerials([buyerNftSerial])
      .freezeWith(client);

    const burnTxSigned = await burnTx.sign(k);
    const burnTxResponse = await burnTxSigned.execute(client);
    const burnReceipt = await burnTxResponse.getReceipt(client);
    if (burnReceipt.status !== 22) {
      throw new Error(`Failed to burn buyer NFT: ${burnReceipt.status}`);
    }
  } catch (error) {
    return createResponse(500, "Failed to burn buyer NFT.", error);
  }

  // Wipe writer NFT from writer's wallet

  try {
    const writerAccountId = await hasNft(writerNftId, writerNftSerial);
    const wipeTx = await new TokenWipeTransaction()
      .setTokenId(writerNftId)
      .setAccountId(writerAccountId)
      .setSerials([writerNftSerial])
      .freezeWith(client);

    const wipeTxSigned = await wipeTx.sign(k);
    const wipeTxResponse = await wipeTxSigned.execute(client);
    const wipeReceipt = await wipeTxResponse.getReceipt(client);
    if (wipeReceipt.status !== 22) {
      throw new Error(`Failed to wipe writer NFT: ${wipeReceipt.status}`);
    }
  } catch (error) {
    return createResponse(500, "Failed to wipe writer NFT.", error);
  }

  return createResponse(200, "OK", "Expired NFTs deleted.", {});
};

// Create response.
const createResponse = (statusCode, statusDescription, message, data) => {
  const response = {
    statusCode,
    statusDescription,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      data,
    }),
  };

  statusCode === 200
    ? console.log("RESPONSE:", response)
    : console.error("RESPONSE:", response);

  return response;
};
