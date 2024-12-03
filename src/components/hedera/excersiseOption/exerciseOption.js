import {
  AccountId,
  Client,
  PrivateKey,
  Hbar,
  TransferTransaction,
  TokenBurnTransaction,
  TokenWipeTransaction,
} from "@hashgraph/sdk";
import { hasNft } from "./hasNft";

export const exerciseOptionFcn = async (
  walletData,
  tokenId,
  buyerNftSerial,
  buyerId,
  strikePrice,
  payout,
  writerNftSerial,
  isCall
) => {
  const escrowAccountId = AccountId.fromString(process.env.REACT_APP_ESCROW_ID);
  const k = PrivateKey.fromStringECDSA(
    process.env.REACT_APP_ESCROW_KEY
  );
  const writerNftId = process.env.REACT_APP_WRITER_NFT_ID;
  const writerAccountId = await hasNft(writerNftId, writerNftSerial);

  const client = Client.forTestnet().setOperator(
    escrowAccountId,
    k
  );

  const hashconnect = walletData[0];
  const saveData = walletData[1];

  const provider = hashconnect.getProvider("testnet", saveData.topic, buyerId);
  const signer = hashconnect.getSigner(provider);

  try {
    // Check NFT ownership
    const buyerNftId = process.env.REACT_APP_NFT_ID;
    const nftOwner = await hasNft( buyerNftId, buyerNftSerial);
    if (nftOwner !== buyerId) {
      throw new Error(
        "The buyer does not own the NFT required to exercise this call option."
      );
    }

    // Step 1: Create the combined transaction
    let tx;

    if (isCall) {
      tx = await new TransferTransaction()
      .addHbarTransfer(writerAccountId, new Hbar(strikePrice)) // Pay strike price to seller
      .addHbarTransfer(buyerId, new Hbar(-strikePrice)) // Deduct strike price from buyer
      .addTokenTransfer(tokenId, escrowAccountId, -payout) // Release tokens from escrow
      .addTokenTransfer(tokenId, buyerId, payout) // Send tokens to buyer
      .addNftTransfer(buyerNftId, buyerNftSerial, buyerId, escrowAccountId) // Transfer NFT to escrow
      .freezeWith(client);

      console.log("=== Call Option Exercise Initiated ===");
      console.log(`Transferring strike price ${strikePrice} from buyer ${buyerId} owner of ${buyerNftId} serial ${buyerNftSerial}`);
      console.log(`To ${writerAccountId} owner of ${writerNftId} serial ${writerNftSerial}`);
      console.log(`For ${payout} amount of ${tokenId} released from escrow ${escrowAccountId}`);
    }
    else {
      tx = await new TransferTransaction()
      .addTokenTransfer(tokenId, buyerId, -payout) // Buyer sends tokens to the seller
      .addTokenTransfer(tokenId, writerAccountId, payout) // Seller receives tokens
      .addHbarTransfer(escrowAccountId, new Hbar(-strikePrice)) // Escrow releases strike price
      .addHbarTransfer(buyerId, new Hbar(strikePrice)) // Buyer receives strike price
      .addNftTransfer(buyerNftId, buyerNftSerial, buyerId, escrowAccountId) // Transfer NFT to escrow
      .freezeWith(client);

      console.log("=== Put Option Exercise Initiated ===");
      console.log(`Transferring ${payout} amount of ${tokenId} from buyer ${buyerId} owner of ${buyerNftId} serial ${buyerNftSerial}`);
      console.log(`To ${writerAccountId} owner of ${writerNftId} serial ${writerNftSerial}`);
      console.log(`For ${strikePrice} HBAR released from escrow ${escrowAccountId}`);
    }

     

    const signedTx = await tx.sign(k);
    const txResponse = await signedTx.executeWithSigner(signer);

    const receipt = await provider.getTransactionReceipt(
      txResponse.transactionId
    );

    if (receipt.status._code !== 22) {
      throw new Error(
        `Transaction failed with status: ${receipt.status.toString()}`
      );
    }

    console.log(`=== Option Exercise Completed Successfully ===`);
    console.log("--------------------------------------");
    console.log("Burning Buyer NFT...");
    const nftId = process.env.REACT_APP_NFT_ID;
    const burnTx = await new TokenBurnTransaction()
      .setTokenId(nftId)
      .setSerials([buyerNftSerial])
      .freezeWith(client);

    const burnTxSigned = await burnTx.sign(k);
    const burnTxResponse = await burnTxSigned.execute(client);
    const burnReceipt = await burnTxResponse.getReceipt(client);

    console.log(
      `NFT burned successfully. Transaction status: ${burnReceipt.status}`
    );
    console.log("=== Option Exercise Completed Successfully ===");

    // Add writer NFT wipe
    console.log("--------------------------------------");
    console.log("Wiping Writer NFT...");
    console.log(`Token ID: ${writerNftId}`);
    console.log(`Serial Number: ${writerNftSerial}`);
    console.log(`Account to wipe: ${writerAccountId}`);

    const wipeTx = await new TokenWipeTransaction()
      .setTokenId(writerNftId)
      .setAccountId(writerAccountId)
      .setSerials([writerNftSerial])
      .freezeWith(client);

    const wipeTxSigned = await wipeTx.sign(k);
    const wipeTxResponse = await wipeTxSigned.execute(client);
    const wipeReceipt = await wipeTxResponse.getReceipt(client);

    console.log(
      `Writer NFT wiped successfully. Transaction status: ${wipeReceipt.status}`
    );
    console.log("=== Option Exercise Completed Successfully ===");

    return receipt;
  } catch (e) {
    console.error("Error during exerciseOptionFcn:", e);
    throw e;
  }
};
