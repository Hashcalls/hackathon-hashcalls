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

// Global variables
const escrowAccountId = AccountId.fromString(process.env.REACT_APP_ESCROW_ID);
const k = PrivateKey.fromStringECDSA(process.env.REACT_APP_ESCROW_KEY);
const writerNftId = process.env.REACT_APP_WRITER_NFT_ID;


export const handler = async (event) => {
  if (event.requestContext) {
    // Preflight request handling for CORS.
    if (event.requestContext.http.method === 'OPTIONS') {
      return createResponse(204, 'No Content', 'Preflight request.', {});
    } else if (event.requestContext.http.method !== 'POST') { // Require POST.
      return createResponse(405, 'Method Not Allowed', 'POST method is required.', {});
    }
  }


  // Take in body params
  let walletData, tokenId, buyerNftSerial, buyerId, strikePrice, payout, writerNftSerial, isCall;
  try {
    const body = JSON.parse(event.body);

    if (!body.tokenId || !body.buyerNftSerial || !body.buyerId || !body.strikePrice || !body.payout || !body.writerNftSerial || !body.isCall || !body.walletData) {
      throw new Error("Missing required parameters.");
    }

    tokenId = body.tokenId;
    buyerNftSerial = body.buyerNftSerial;
    buyerId = body.buyerId;
    strikePrice = body.strikePrice;
    payout = body.payout;
    writerNftSerial = body.writerNftSerial;
    isCall = body.isCall;
    walletData = body.walletData;

  } catch (error) {
    return createResponse(400, 'Bad Request', 'Error parsing request body.', error);
  }


  // Initialize Hedera client
  const writerAccountId = await hasNft(writerNftId, writerNftSerial);
  const client = Client.forTestnet().setOperator(
    escrowAccountId,
    k
  );
  const hashconnect = walletData[0];
  const saveData = walletData[1];
  const provider = hashconnect.getProvider("testnet", saveData.topic, buyerId);
  const signer = hashconnect.getSigner(provider);


  // Check if the buyer has enough funds to purchase the option
  try {
    // Check NFT ownership
    const buyerNftId = process.env.REACT_APP_NFT_ID;
    const nftOwner = await hasNft(buyerNftId, buyerNftSerial);
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

      console.log(`Transferring strike price ${strikePrice} from buyer ${buyerId} owner of ${buyerNftId} serial ${buyerNftSerial}To ${writerAccountId} owner of ${writerNftId} serial ${writerNftSerial} For ${payout} amount of ${tokenId} released from escrow ${escrowAccountId}`);
    }
    else {
      tx = await new TransferTransaction()
        .addTokenTransfer(tokenId, buyerId, -payout) // Buyer sends tokens to the seller
        .addTokenTransfer(tokenId, writerAccountId, payout) // Seller receives tokens
        .addHbarTransfer(escrowAccountId, new Hbar(-strikePrice)) // Escrow releases strike price
        .addHbarTransfer(buyerId, new Hbar(strikePrice)) // Buyer receives strike price
        .addNftTransfer(buyerNftId, buyerNftSerial, buyerId, escrowAccountId) // Transfer NFT to escrow
        .freezeWith(client);

      console.log(`Transferring ${payout} amount of ${tokenId} from buyer ${buyerId} owner of ${buyerNftId} serial ${buyerNftSerial} To ${writerAccountId} owner of ${writerNftId} serial ${writerNftSerial} For ${strikePrice} HBAR released from escrow ${escrowAccountId}`);
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

    // Add writer NFT wipe
    console.log(`Wiping Writer NFT... Token ID: ${writerNftId}, Serial Number: ${writerNftSerial}, Account to wipe: ${writerAccountId}`);

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

    return createResponse(200, "Success", "Option Exercise Complete", {
      receipt,
    });

  } catch (err) {
    return createResponse(500, "Internal Server Error", err);
  }
};


// Create response.
const createResponse = (statusCode, statusDescription, message, data) => {
  const response = {
    statusCode,
    statusDescription,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      data
    })
  };

  statusCode === 200 ? console.log('RESPONSE:', response) : console.error('RESPONSE:', response);

  return response;
};