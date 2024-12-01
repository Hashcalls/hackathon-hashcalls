import {
  AccountId,
  Client,
  PrivateKey,
  Hbar,
  TransferTransaction,
  TokenWipeTransaction,
} from "@hashgraph/sdk";
import { hasNft } from "./hasNft";

export const exerciseCallOptionFcn = async (
  walletData,
  tokenId,
  serialNumber,
  buyerId,
  sellerId,
  strikePrice,
  payout
) => {
  const escrowAccountId = AccountId.fromString(process.env.REACT_APP_ESCROW_ID);
  const escrowAccountKey = PrivateKey.fromStringECDSA(
    process.env.REACT_APP_ESCROW_KEY
  );

  console.log("=== Exercise Option Process Started ===");
  console.log(`Token ID: ${tokenId}`);
  console.log(`Serial Number: ${serialNumber}`);
  console.log(`Amount of Tokens: ${payout}`);
  console.log(`Escrow Account ID: ${escrowAccountId.toString()}`);
  console.log(`Option Seller ID: ${sellerId}`);
  console.log(`Option Buyer ID: ${buyerId}`);
  console.log(`Strike Price (HBAR): ${strikePrice}`);
  console.log("--------------------------------------");

  const client = Client.forTestnet().setOperator(
    escrowAccountId,
    escrowAccountKey
  );
  console.log("Client configured with Escrow Account.");

  const hashconnect = walletData[0];
  const saveData = walletData[1];

  const provider = hashconnect.getProvider("testnet", saveData.topic, buyerId);
  const signer = hashconnect.getSigner(provider);

  try {
    // Check NFT ownership
    const ownsNft = await hasNft(buyerId, serialNumber);
    if (!ownsNft) {
      throw new Error(
        "The buyer does not own the NFT required to exercise this call option."
      );
    }

    // Step 1: Create the combined transaction
    console.log("Creating combined transfer transaction...");

    const tx = await new TransferTransaction()
      .addHbarTransfer(sellerId, new Hbar(strikePrice)) // Pay strike price to seller
      .addHbarTransfer(buyerId, new Hbar(-strikePrice)) // Deduct strike price from buyer
      .addTokenTransfer(tokenId, escrowAccountId, -payout) // Release tokens from escrow
      .addTokenTransfer(tokenId, buyerId, payout) // Send tokens to buyer
      .freezeWith(client);

    const signedTx = await tx.sign(escrowAccountKey);
    const txResponse = await signedTx.executeWithSigner(signer);

    const receipt = await provider.getTransactionReceipt(
      txResponse.transactionId
    );

    if (receipt.status._code !== 22) {
      throw new Error(
        `Transaction failed with status: ${receipt.status.toString()}`
      );
    }

    console.log(
      `${payout} tokens successfully transferred from Escrow (${escrowAccountId}) to Buyer (${buyerId}).`
    );
    console.log(
      `${strikePrice} HBAR successfully transferred from Buyer (${buyerId}) to Seller (${sellerId}).`
    );

    console.log("--------------------------------------");
    console.log("Wiping NFT from buyer account...");
    const nftId = process.env.REACT_APP_NFT_ID;
    const wipeTx = await new TokenWipeTransaction()
      .setTokenId(nftId)
      .setAccountId(buyerId)
      .setSerials([serialNumber])
      .freezeWith(client);

    const wipeTxSigned = await wipeTx.sign(escrowAccountKey);
    const wipeTxResponse = await wipeTxSigned.execute(client);
    const wipeReceipt = await wipeTxResponse.getReceipt(client);

    console.log(
      `NFT wiped successfully. Transaction status: ${wipeReceipt.status}`
    );
    console.log("=== Option Exercise Completed Successfully ===");

    return receipt;
  } catch (e) {
    console.error("Error during exerciseOptionFcn:", e);
    throw e;
  }
};
