import {
  Hbar,
  Client,
  TokenMintTransaction,
  TransferTransaction,
  PrivateKey,
} from "@hashgraph/sdk";
import { hasNft } from "./hasNft";

export async function buyOptionFcn(
  walletData,
  optionBuyerId,
  premium,
  writerNftSerial
) {
  const escrowAccountId = process.env.REACT_APP_ESCROW_ID;
  const escrowAccountKey = process.env.REACT_APP_ESCROW_KEY;
  const k = PrivateKey.fromStringECDSA(escrowAccountKey);
  const WRITER_NFT_ID = process.env.REACT_APP_WRITER_NFT_ID;
  const BUYER_NFT_ID = process.env.REACT_APP_NFT_ID;

  const client = Client.forTestnet().setOperator(escrowAccountId, k);

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
    console.log("=======================\n");

    console.log("=== Premium Payment and NFT Transfer Initated ===");
    console.log(`Premium Amount: ${premium} HBAR`);
    console.log(
      `From Buyer: ${optionBuyerId} , new owner of buyer NFT ID ${BUYER_NFT_ID} serial ${serialNumber}`
    );
    console.log(
      `To Writer: ${writerAccountId}, owner of writer NFT ID ${WRITER_NFT_ID} serial ${writerNftSerial}`
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
    console.log("Option Buy Complete!");
    console.log("====================================\n");

    return serialNumber;
  } catch (error) {
    console.error("\n=== Error During Option Purchase ===");
    console.error(`Error Details: ${error.message}`);
    console.error("=================================\n");
    throw new Error(`Option purchase failed: ${error.message}`);
  }
}
