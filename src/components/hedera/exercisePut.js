import {
    AccountId,
    Client,
    PrivateKey,
    Hbar,
    TransferTransaction,
  } from "@hashgraph/sdk";
  
  export const exercisePutOptionFcn = async (
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
  
    console.log("=== Exercise Put Option Process Started ===");
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
        .addTokenTransfer(tokenId, buyerId, -payout) // Buyer sends tokens to the seller
        .addTokenTransfer(tokenId, sellerId, payout) // Seller receives tokens
        .addHbarTransfer(escrowAccountId, new Hbar(-strikePrice)) // Escrow releases strike price
        .addHbarTransfer(buyerId, new Hbar(strikePrice)) // Buyer receives strike price
        .freezeWith(client);
  
      console.log("Transaction frozen with Escrow Key.");
  
      const signedTx = await tx.sign(escrowAccountKey); // Sign with escrow account key
      console.log("Transaction signed with Escrow Key.");
  
      const txResponse = await signedTx.executeWithSigner(signer); // Sign and execute with buyer's wallet
      console.log("Transaction signed with Buyer's wallet and submitted.");
  
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
  
      console.log("=== Put Option Exercise Completed Successfully ===");
      return receipt;
    } catch (e) {
      console.error("Error during exercisePutOptionFcn:", e);
      throw e;
    }
  };
  