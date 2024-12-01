import {
  Hbar,
  Client,
  TokenMintTransaction,
  TransferTransaction,
  PrivateKey,
} from "@hashgraph/sdk";

export async function buyOptionFcn(
  walletData,
  senderAccountId,
  receiverAccountId,
  premium
) {
  const escrowAccountId = process.env.REACT_APP_ESCROW_ID;
  const escrowAccountKey = process.env.REACT_APP_ESCROW_KEY;
  const k = PrivateKey.fromStringECDSA(escrowAccountKey);

  const client = Client.forTestnet().setOperator(escrowAccountId, k);
  const NFT_ID = process.env.REACT_APP_NFT_ID;

  try {
    console.log("Minting NFT...");

    // Mint a new NFT with metadata
    const mintTx = new TokenMintTransaction()
      .setTokenId(NFT_ID)
      .addMetadata(Buffer.from("Unique Metadata for NFT")) // Metadata for the NFT
      .freezeWith(client);

    // Sign and execute the mint transaction
    const mintTxSigned = await mintTx.sign(k);
    const mintTxResponse = await mintTxSigned.execute(client);

    // Get the receipt and confirm the serial number
    const mintReceipt = await mintTxResponse.getReceipt(client);
    const serialNumber = mintReceipt.serials[0];
    console.log(
      `- NFT minted successfully with serial number: ${serialNumber}`
    );

    console.log(`\n=======================================`);
    console.log(
      `- Sending premium from ${senderAccountId} to ${receiverAccountId} and transferring NFT ${serialNumber} to ${senderAccountId}`
    );

    const hashconnect = walletData[0];
    const saveData = walletData[1];

    const provider = hashconnect.getProvider(
      "testnet",
      saveData.topic,
      senderAccountId
    );
    const signer = hashconnect.getSigner(provider);
    const transferTx = await new TransferTransaction()
      .addHbarTransfer(senderAccountId, new Hbar(-premium))
      .addHbarTransfer(receiverAccountId, new Hbar(premium))
      .addNftTransfer(NFT_ID, serialNumber, escrowAccountId, senderAccountId)
      .freezeWith(client);

    const signedTx = await transferTx.sign(k);
    const txResponse = await signedTx.executeWithSigner(signer);
    const receipt = await provider.getTransactionReceipt(
      txResponse.transactionId
    );

    console.log(`- Transaction status: ${receipt.status.toString()}`);
    return serialNumber;
  } catch (error) {
    console.error("- Error during HBAR transfer:", error);
    throw new Error(`HBAR transfer failed: ${error.message}`);
  }
}
