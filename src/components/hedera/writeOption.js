import {
  Client,
  TokenMintTransaction,
  TransferTransaction,
  PrivateKey,
  AccountId,
  Hbar,
} from "@hashgraph/sdk";

export async function writeOptionFcn(
  walletData,
  writerAccountId,
  tokenId,
  amount,
  strikePrice,
  isCall
) {
  const escrowAccountId = AccountId.fromString(process.env.REACT_APP_ESCROW_ID);
  const k = PrivateKey.fromStringECDSA(process.env.REACT_APP_ESCROW_KEY);
  const WRITER_NFT_ID = process.env.REACT_APP_WRITER_NFT_ID;

  const client = Client.forTestnet().setOperator(escrowAccountId, k);

  try {
    console.log("Minting Writer NFT...");

    // Mint NFT
    const mintTx = new TokenMintTransaction()
      .setTokenId(WRITER_NFT_ID)
      .addMetadata(Buffer.from("Writer NFT"))
      .freezeWith(client);

    const mintTxSigned = await mintTx.sign(k);
    const mintTxResponse = await mintTxSigned.execute(client);
    const mintReceipt = await mintTxResponse.getReceipt(client);
    const serialNumber = mintReceipt.serials[0].toNumber();

    console.log(
      `- Writer NFT ID ${WRITER_NFT_ID} minted with serial number: ${serialNumber}`
    );
    console.log(`\n=======================================`);

    // Transfer to writer
    const hashconnect = walletData[0];
    const saveData = walletData[1];
    const provider = hashconnect.getProvider(
      "testnet",
      saveData.topic,
      writerAccountId
    );
    const signer = hashconnect.getSigner(provider);

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
      console.log("=== Call Option Writing Initiated ===");
      console.log(
        `- Call option writer ${writerAccountId} transferred ${amount} of token ${tokenId} to escrow ${escrowAccountId}`
      );
      console.log(
        `Transferred Writer NFT ID ${WRITER_NFT_ID} serial ${serialNumber} to writer ${writerAccountId}`
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
      console.log("=== Put Option Writing Initiated ===");
      console.log(
        `- Put option writer ${writerAccountId} transferred ${strikePrice} HBAR to escrow ${escrowAccountId}`
      );
      console.log(
        `Transferred Writer NFT ID ${WRITER_NFT_ID} serial ${serialNumber} to writer ${writerAccountId}`
      );
    }

    const signedTx = await transferTx.sign(k);
    const txResponse = await signedTx.executeWithSigner(signer);
    const receipt = await provider.getTransactionReceipt(
      txResponse.transactionId
    );

    console.log(`- Transfer status: ${receipt.status.toString()}`);
    return serialNumber;
  } catch (error) {
    console.error("- Error during Writer NFT operation:", error);
    throw new Error(`Writer NFT operation failed: ${error.message}`);
  }
}
