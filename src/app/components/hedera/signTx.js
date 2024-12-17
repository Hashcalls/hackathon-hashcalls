import {
  addBuyerToOptionDynamo,
  uploadOptionToDynamo,
  wipeExercised,
} from "../../../api/actions.js";
import { hasNFT } from "../../../api/user.js";
import { TransferTransaction } from "@hashgraph/sdk";

export async function signTx(txBase64, signer, metadata, provider) {
  // Decode Base64 to bytes
  const txBytes = Buffer.from(txBase64, "base64");

  // Convert bytes to transaction object
  const transaction = TransferTransaction.fromBytes(txBytes);

  // Sign and execute the transaction
  const txResponse = await transaction.executeWithSigner(signer);

  const receipt = await provider.getTransactionReceipt(
    txResponse.transactionId
  );

  // If signed, unpack metadata object and upload to Dynamo
  if (receipt.status.toString() === "SUCCESS") {
    console.log("Transaction succeeded");

    const {
      serialNumber,
      transactionId,
      writerAccountId,
      tokenId,
      amount,
      strikePrice,
      isCall,
      premium,
      expiry,
    } = metadata;

    uploadOptionToDynamo(
      serialNumber,
      transactionId,
      writerAccountId,
      tokenId,
      amount,
      strikePrice,
      isCall,
      premium,
      expiry
    );
  } else {
    console.log("Transaction failed");
  }

  return receipt;
}

export async function signBuyTx(
  txBase64,
  signer,
  writerNftSerial,
  buyerId,
  provider,
  buyerNftSerial
) {
  // Decode Base64 to bytes
  const txBytes = Buffer.from(txBase64, "base64");

  // Convert bytes to transaction object
  const transaction = TransferTransaction.fromBytes(txBytes);

  // Sign and execute the transaction
  const txResponse = await transaction.executeWithSigner(signer);

  const receipt = await provider.getTransactionReceipt(
    txResponse.transactionId
  );

  // If signed, unpack metadata object and upload to Dynamo
  if (receipt.status.toString() === "SUCCESS") {
    console.log("Transaction succeeded");

    addBuyerToOptionDynamo(writerNftSerial, buyerId, buyerNftSerial);
  } else {
    console.log("Transaction failed");
  }

  return receipt;
}

export async function signExerciseTx(
  txBase64,
  signer,
  provider,
  buyerNftSerial,
  writerNftSerial
) {
  // Decode Base64 to bytes
  const txBytes = Buffer.from(txBase64, "base64");

  // Convert bytes to transaction object
  const transaction = TransferTransaction.fromBytes(txBytes);

  // Sign and execute the transaction
  const txResponse = await transaction.executeWithSigner(signer);

  const receipt = await provider.getTransactionReceipt(
    txResponse.transactionId
  );

  // If signed, unpack metadata object and upload to Dynamo
  if (receipt.status.toString() === "SUCCESS") {
    const result = await hasNFT("0.0.5275649", writerNftSerial);
    const writerAccountId = result.data;
    wipeExercised(writerNftSerial, buyerNftSerial, writerAccountId);
  } else {
    console.log("Transaction failed");
  }

  return receipt;
}
