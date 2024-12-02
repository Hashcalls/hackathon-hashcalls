import {
  Client,
  TokenMintTransaction,
  TransferTransaction,
  Hbar,
  PrivateKey,
  AccountId,
} from "@hashgraph/sdk";

export async function writePutFcn(
  walletData,
  writerAccountId,
  strikePrice // Only need strike price, no token parameters
) {
  const escrowAccountId = AccountId.fromString(process.env.REACT_APP_ESCROW_ID);
  const escrowAccountKey = PrivateKey.fromStringECDSA(
    process.env.REACT_APP_ESCROW_KEY
  );
  const WRITER_NFT_ID = process.env.REACT_APP_WRITER_NFT_ID;

  const client = Client.forTestnet().setOperator(
    escrowAccountId,
    escrowAccountKey
  );

  try {
    console.log("Minting Writer NFT...");
    console.log(`Writer Account: ${writerAccountId}`);
    console.log(`Strike Price: ${strikePrice} HBAR`);

    // Mint NFT
    const mintTx = new TokenMintTransaction()
      .setTokenId(WRITER_NFT_ID)
      .addMetadata(Buffer.from("Put Writer NFT"))
      .freezeWith(client);

    const mintTxSigned = await mintTx.sign(escrowAccountKey);
    const mintTxResponse = await mintTxSigned.execute(client);
    const mintReceipt = await mintTxResponse.getReceipt(client);
    const serialNumber = mintReceipt.serials[0].toNumber();

    console.log(`- Writer NFT minted with serial number: ${serialNumber}`);
    console.log(`\n=======================================`);

    // Transfer NFT to writer and HBAR to escrow
    const hashconnect = walletData[0];
    const saveData = walletData[1];
    const provider = hashconnect.getProvider(
      "testnet",
      saveData.topic,
      writerAccountId
    );
    const signer = hashconnect.getSigner(provider);

    const transferTx = await new TransferTransaction()
      .addNftTransfer(
        WRITER_NFT_ID,
        serialNumber,
        escrowAccountId.toString(),
        writerAccountId
      )
      .addHbarTransfer(writerAccountId, new Hbar(-strikePrice))
      .addHbarTransfer(escrowAccountId, new Hbar(strikePrice))
      .freezeWith(client);

    const signedTx = await transferTx.sign(escrowAccountKey);
    const txResponse = await signedTx.executeWithSigner(signer);
    const receipt = await provider.getTransactionReceipt(
      txResponse.transactionId
    );

    console.log(`- Transfer status: ${receipt.status.toString()}`);
    return serialNumber;
  } catch (error) {
    console.error("- Error during Put Writer NFT operation:", error);
    throw new Error(`Put Writer NFT operation failed: ${error.message}`);
  }
}
