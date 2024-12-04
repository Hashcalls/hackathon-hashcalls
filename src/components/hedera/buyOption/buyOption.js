import {
  Hbar,
  Client,
  TokenMintTransaction,
  TransferTransaction,
  PrivateKey,
} from "@hashgraph/sdk";
import { hasNft } from "./hasNft";

// Global Variables
const escrowAccountId = process.env.REACT_APP_ESCROW_ID;
const escrowAccountKey = process.env.REACT_APP_ESCROW_KEY;
const k = PrivateKey.fromStringECDSA(escrowAccountKey);
const client = Client.forTestnet().setOperator(escrowAccountId, k);
const WRITER_NFT_ID = process.env.REACT_APP_WRITER_NFT_ID;
const BUYER_NFT_ID = process.env.REACT_APP_NFT_ID;


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
  let optionBuyerId, premium, writerNftSerial, walletData;
  try {
    const body = JSON.parse(event.body);

    if (!body.optionBuyerId || !body.premium || !body.writerNftSerial || !body.walletData) {
      throw new Error("Missing required parameters.");
    }

    optionBuyerId = body.optionBuyerId;
    premium = body.premium;
    writerNftSerial = body.writerNftSerial;
    walletData = body.walletData;

  } catch (error) {
    return createResponse(400, 'Bad Request', 'Error parsing request body.', error);
  }


  // Check if the buyer has enough funds to purchase the option
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
      .addMetadata(Buffer.from("Option NFT"))
      .freezeWith(client);

    const mintTxSigned = await mintTx.sign(k);
    const mintTxResponse = await mintTxSigned.execute(client);

    const mintReceipt = await mintTxResponse.getReceipt(client);
    const serialNumber = mintReceipt.serials[0].toNumber();
    console.log(`Option Buyer NFT Minted - Serial Number: ${serialNumber}`);

    console.log(
      `=== Premium Payment and NFT Transfer Initated for amount: ${premium} HBAR From Buyer: ${optionBuyerId} , new owner of buyer NFT ID ${BUYER_NFT_ID} serial ${serialNumber} To Writer: ${writerAccountId}, owner of writer NFT ID ${WRITER_NFT_ID} serial ${writerNftSerial}`
    );

    const hashconnect = walletData[0];
    const saveData = walletData[1];

    const provider = hashconnect.getProvider(
      "testnet",
      saveData.topic,
      optionBuyerId
    );
    const signer = hashconnect.getSigner(provider);

    console.log("\nInitiating Transactions...");
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
    const txResponse = await signedTx.executeWithSigner(signer);
    const receipt = await provider.getTransactionReceipt(
      txResponse.transactionId
    );

    console.log(`Transaction Status: ${receipt.status.toString()}`);

    return createResponse(200, "Success", "Option Buy Complete", {
      serialNumber,
    });

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