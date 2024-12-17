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
const escrowAccountId = process.env.REACT_APP_ESCROW_ID;
const escrowAccountKey = process.env.REACT_APP_ESCROW_KEY;

const k = PrivateKey.fromStringECDSA(escrowAccountKey);

const client = Client.forTestnet().setOperator(escrowAccountId, k);

const writerNftId = process.env.REACT_APP_WRITER_NFT_ID;
const buyerNftId = process.env.REACT_APP_BUYER_NFT_ID;

export const handler = async (event) => {
  if (event.requestContext) {
    if (event.requestContext.http.method === "OPTIONS") {
      return createResponse(204, "No Content", "Preflight request.", {});
    } else if (event.requestContext.http.method !== "POST") {
      return createResponse(
        405,
        "Method Not Allowed",
        "POST method is required.",
        {}
      );
    }
  }

  let writerNftSerial, buyerNftSerial, writerAccountId;
  try {
    const body = JSON.parse(event.body);

    writerNftSerial = body.writerNftSerial;
    buyerNftSerial = body.buyerNftSerial;
    writerAccountId = body.writerAccountId;

    if (!writerNftSerial || !buyerNftSerial) {
      throw new Error("Missing required parameters.");
    }
  } catch (error) {
    console.error("Error Parsing Request Body:", error);
    return createResponse(
      400,
      "Bad Request",
      "Error parsing request body.",
      error.message
    );
  }

  // Burn buyer NFT from escrow
  try {
    const burnTx = await new TokenBurnTransaction()
      .setTokenId(buyerNftId)
      .setSerials([buyerNftSerial])
      .freezeWith(client);

    const burnTxSigned = await burnTx.sign(k);
    const burnTxResponse = await burnTxSigned.execute(client);
    const burnReceipt = await burnTxResponse.getReceipt(client);

    if (burnReceipt.status.toString() !== "SUCCESS") {
      throw new Error(`Failed to burn buyer NFT: ${burnReceipt.status}`);
    }
  } catch (error) {
    console.error("Error During TokenBurnTransaction:", error);
    return createResponse(500, "Failed to burn buyer NFT.", error.message, {});
  }

  // Wipe writer NFT from writer's wallet
  try {
    const wipeTx = await new TokenWipeTransaction()
      .setTokenId(writerNftId)
      .setAccountId(writerAccountId)
      .setSerials([writerNftSerial])
      .freezeWith(client);

    const wipeTxSigned = await wipeTx.sign(k);
    const wipeTxResponse = await wipeTxSigned.execute(client);
    const wipeReceipt = await wipeTxResponse.getReceipt(client);

    if (wipeReceipt.status.toString() !== "SUCCESS") {
      throw new Error(`Failed to wipe writer NFT: ${wipeReceipt.status}`);
    }
  } catch (error) {
    console.error("Error During TokenWipeTransaction:", error);
    return createResponse(500, "Failed to wipe writer NFT.", error.message, {});
  }

  return createResponse(200, "OK", "Expired NFTs deleted successfully.", {});
};

// Create response
const createResponse = (statusCode, statusDescription, message, data) => {
  return {
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
};
