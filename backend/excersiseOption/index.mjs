import {
  AccountId,
  Client,
  PrivateKey,
  Hbar,
  TransferTransaction
} from "@hashgraph/sdk";

// Global variables
const escrowAccountId = AccountId.fromString(process.env.REACT_APP_ESCROW_ID);
const k = PrivateKey.fromStringECDSA(process.env.REACT_APP_ESCROW_KEY);
const writerNftId = process.env.REACT_APP_WRITER_NFT_ID;


// Has NFT function
const hasNft = async (NftId, NftSerial) => {
  const response = await fetch("https://cvcjxnv5rqp2hzsavo2h7jxnci0yfbbo.lambda-url.us-east-1.on.aws/", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      nftTokenId: NftId,
      serialNumber: NftSerial
    }),
  });

  const responseData = await response.json();

  return responseData.data;
};


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
  let tokenId, buyerNftSerial, buyerId, strikePrice, payout, writerNftSerial, isCall;
  try {
    const body = JSON.parse(event.body);

    if (!body.tokenId || !body.buyerNftSerial || !body.buyerId || !body.strikePrice || !body.payout || !body.writerNftSerial || typeof body.isCall === 'undefined') {
      throw new Error("Missing required parameters.");
    }

    buyerId = body.buyerId;
    tokenId = body.tokenId;
    buyerNftSerial = body.buyerNftSerial;
    strikePrice = body.strikePrice;
    payout = body.payout;
    writerNftSerial = body.writerNftSerial;
    isCall = body.isCall;

  } catch (error) {
    return createResponse(400, 'Bad Request', 'Error parsing request body.', error);
  }


  // Initialize Hedera client
  const writerAccountId = await hasNft(writerNftId, writerNftSerial);
  const client = Client.forTestnet().setOperator(
    escrowAccountId,
    k
  );


  // Create the transaction
  try {
    // Check NFT ownership
    const buyerNftId = process.env.REACT_APP_NFT_ID;
    const nftOwner = await hasNft(buyerNftId, buyerNftSerial);

    if (nftOwner !== buyerId) {
      throw new Error(
        "The buyer does not own the NFT required to exercise this call option."
      );
    }

    // Create the combined transaction
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
    const signedTxBytes = signedTx.toBytes();
    const signedTxBase64 = Buffer.from(signedTxBytes).toString("base64");

    return createResponse(200, "Excerise option initiated", "Transaction to sign created", { signedTx: signedTxBase64 });

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