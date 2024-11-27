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
    // Step 1: Pay the strike price from buyer to seller
    console.log("Initiating HBAR transfer for strike price...");
    const hbarTx = await new TransferTransaction()
      .addHbarTransfer(sellerId, new Hbar(strikePrice)) // Pay strike price to seller
      .addHbarTransfer(buyerId, new Hbar(-strikePrice)) // Deduct strike price from buyer
      .freezeWithSigner(signer);

    console.log(
      `HBAR Transfer Details:\n - From Buyer: ${buyerId}\n - To Seller: ${sellerId}\n - Amount: ${strikePrice} HBAR`
    );

    const hbarSignedTx = await hbarTx.signWithSigner(signer); // Sign with buyer's wallet
    const hbarTxResponse = await hbarSignedTx.executeWithSigner(signer); // Execute using buyer's wallet
    const hbarReceipt = await provider.getTransactionReceipt(
      hbarTxResponse.transactionId
    );

    if (hbarReceipt.status._code !== 22) {
      throw new Error(
        `HBAR transfer failed with status: ${hbarReceipt.status.toString()}`
      );
    }
    console.log(
      `${strikePrice} HBAR successfully transferred from Buyer (${buyerId}) to Seller (${sellerId}).`
    );

    // Step 2: Ask for user confirmation before transferring tokens
    console.log("Prompting user for confirmation to transfer tokens...");
    const userConfirmed = window.confirm(
      `The strike price of ${strikePrice} HBAR has been paid to the seller (${sellerId}). Do you want to proceed with transferring ${payout} tokens from escrow (${escrowAccountId}) to the buyer (${buyerId})?`
    );

    if (!userConfirmed) {
      console.log(
        "User canceled the token transfer. Strike price remains paid, and the process is terminated."
      );
      return;
    }

    // Step 3: Transfer tokens from escrow to buyer
    console.log("Initiating token transfer from escrow to buyer...");
    const tokenTx = await new TransferTransaction()
      .addTokenTransfer(tokenId, escrowAccountId, -payout) // Release tokens from escrow
      .addTokenTransfer(tokenId, buyerId, payout) // Send tokens to buyer
      .freezeWith(client)
      .sign(escrowAccountKey);

    console.log(
      `Token Transfer Details:\n - From Escrow: ${escrowAccountId}\n - To Buyer: ${buyerId}\n - Token ID: ${tokenId}\n - Amount: ${payout}`
    );

    const tokenTxResponse = await tokenTx.execute(client);
    const tokenReceipt = await tokenTxResponse.getReceipt(client);

    if (tokenReceipt.status._code !== 22) {
      throw new Error(
        `Token transfer failed with status: ${tokenReceipt.status.toString()}`
      );
    }
    console.log(
      `${payout} tokens successfully transferred from Escrow (${escrowAccountId}) to Buyer (${buyerId}).`
    );

    console.log("=== Option Exercise Completed Successfully ===");
  } catch (e) {
    console.error("Error during exerciseOptionFcn:", e);
    throw e;
  }
};
