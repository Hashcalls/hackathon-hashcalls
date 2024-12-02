import {
  AccountId,
  Client,
  PrivateKey,
  Hbar,
  TransferTransaction,
  TokenWipeTransaction,
} from "@hashgraph/sdk";
import { hasNft } from "./hasNft";

export const exercisePutOptionFcn = async (
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

  console.log("=== Exercise Put Option Process Started ===");
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
    const nftTokenId = process.env.REACT_APP_NFT_ID;
    const ownsNft = await hasNft(buyerId, nftTokenId, serialNumber);
    if (!ownsNft) {
      throw new Error(
        "The buyer does not own the NFT required to exercise this put option."
      );
    }

    // Step 1: Create the combined transaction
    console.log("Creating combined transfer transaction...");

    const tx = await new TransferTransaction()
      .addTokenTransfer(tokenId, buyerId, -payout) // Buyer sends tokens to the seller
      .addTokenTransfer(tokenId, sellerId, payout) // Seller receives tokens
      .addHbarTransfer(escrowAccountId, new Hbar(-strikePrice)) // Escrow releases strike price
      .addHbarTransfer(buyerId, new Hbar(strikePrice)) // Buyer receives strike price
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
      `${payout} tokens successfully transferred from Buyer (${buyerId}) to Seller (${sellerId}).`
    );
    console.log(
      `${strikePrice} HBAR successfully transferred from Escrow (${escrowAccountId}) to Buyer (${buyerId}).`
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
    console.log("=== Put Option Exercise Completed Successfully ===");

    return receipt;
  } catch (e) {
    console.error("Error during exercisePutOptionFcn:", e);
    throw e;
  }
};
