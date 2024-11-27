import {
  AccountId,
  Client,
  PrivateKey,
  Hbar,
  TransferTransaction,
} from "@hashgraph/sdk";

export const exerciseOptionFcn = async (
  walletData,
  tokenId,
  buyerId,
  sellerId,
  strikePrice,
  payout
) => {
  const escrowAccountId = AccountId.fromString(process.env.REACT_APP_ESCROW_ID);
  const escrowAccountKey = PrivateKey.fromString(
    process.env.REACT_APP_ESCROW_KEY
  );

  console.log("=== Exercise Option Process Started ===");
  console.log(`Token ID: ${tokenId}`);
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

    console.log("=== Option Exercise Completed Successfully ===");
    return receipt;
  } catch (e) {
    console.error("Error during exerciseOptionFcn:", e);
    throw e;
  }
};
