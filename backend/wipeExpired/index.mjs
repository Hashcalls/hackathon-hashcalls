import {
    TokenWipeTransaction,
    Client,
    TransferTransaction,
    PrivateKey,
    Hbar
} from "@hashgraph/sdk";
import AWS from 'aws-sdk';

const dynamo = new AWS.DynamoDB.DocumentClient();

// Global variables
const escrowAccountId = AccountId.fromString(process.env.REACT_APP_ESCROW_ID);
const k = PrivateKey.fromStringECDSA(process.env.REACT_APP_ESCROW_KEY);
const writerNftId = process.env.REACT_APP_WRITER_NFT_ID;
const buyerNftId = process.env.REACT_APP_BUYER_NFT_ID;


// Has NFT function
const hasNft = async (NftId, NftSerial) => {
  const response = await fetch("https://5re3jroxrqvlb5l7mlymcrhuo40tjlxq.lambda-url.us-east-1.on.aws/", {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      NftId,
      NftSerial
    }),
  });

  const responseData = await response.json();

  return responseData.data;
};


export const handler = async (event) => {
    let expiredNfts = [];
    if (event.requestContext) {
        // Preflight request handling for CORS.
        if (event.requestContext.http.method === 'OPTIONS') {
            return createResponse(204, 'No Content', 'Preflight request.', {});
        } else if (event.requestContext.http.method !== 'POST') { // Require POST.
            return createResponse(405, 'Method Not Allowed', 'POST method is required.', {});
        }
    } else {
        // Query Dynamo for all items with an expiry date in the past
        try {
            const params = {
                TableName: process.env.TABLE_NAME,
                FilterExpression: "expiryDate < :now",
                ExpressionAttributeValues: {
                    ":now": new Date().toISOString(),
                },
            };

            const { Items } = await dynamo.scan(params).promise();
            expiredNfts = Items.map((item) => item.PK);

        } catch (error) {
            return createResponse(500, 'Failed to fetch items from Dynamo.', error);
        }
    }


    // TODO: Wipe all expired NFTs, return escrowed collateral 
    try {


    } catch (error) {
        return createResponse(500, 'Failed to wipe expired NFTs on-chain.', error);
    }


    // Delete all expired NFTs from Dynamo
    try {
        for (const nftId of expiredNfts) {
            const params = {
                TableName: process.env.TABLE_NAME,
                Key: {
                    PK: nftId,
                },
            };

            await dynamo.delete(params).promise();
        }

    } catch (error) {
        return createResponse(500, 'Failed to delete expired NFTs from Dynamo.', error);
    }


    // TODO: Delete all expired NFTs from S3
    try {

    } catch (error) {
        return createResponse(500, 'Failed to delete expired NFTs from S3.', error);
    }


    return createResponse(200, 'OK', 'Expired NFTs deleted.', {});

};

    // Function to return collaterals to writer and wipe option NFTs on chain
    //TODO: Possible optimization by batching NFT wipe transactions
async function wipeOptionOnchain (writerNftSerial, buyerNftSerial, strikePrice, tokenId, tokenAmount, isCall ) {
  const client = Client.forTestnet(escrowAccountId, k);
  const writerAccountId = await hasNft(writerNftId, writerNftSerial);
  let tx;
  let signedTx;
  let txResponse;
    if (isCall)
    {
        // Refund writer the escrowed token
        tx = await new TransferTransaction()
        .addTokenTransfer(tokenId, writerAccountId, tokenAmount) // Refund tokens to writer
        .addTokenTransfer(tokenId, escrowAccountId, -tokenAmount) // Release tokens from escrow
        .freezeWith(client);

        signedTx = await tx.sign(k);
        txResponse = await signedTx.execute(client);
    }

    else 
    {
        // Refund writer escrowed HBAR
        tx = await new TransferTransaction()
        .addHbarTransfer(writerAccountId, new Hbar(strikePrice)) // Refund strike price to writer
        .addHbarTransfer(escrowAccountId, new Hbar(-strikePrice)) // Deduct strike price from escrow
        .freezeWith(client);

        signedTx = await tx.sign(k);
        txResponse = await signedTx.execute(client);
    }

    
    const receipt = await provider.getTransactionReceipt(
        txResponse.transactionId
      );
  
      if (receipt.status._code !== 22) {
        throw new Error(
          `Transaction failed with status: ${receipt.status.toString()}`
        );
      }

      // Wipe writer NFT
      const wipeTx = await new TokenWipeTransaction()
      .setTokenId(writerNftId)
      .setAccountId(writerAccountId)
      .setSerials([writerNftSerial])
      .freezeWith(client);

    const wipeTxSigned = await wipeTx.sign(k);
    const wipeTxResponse = await wipeTxSigned.execute(client);
    const wipeReceipt = await wipeTxResponse.getReceipt(client);

    if (wipeReceipt.status !== 22) {
        throw new Error(`Failed to wipe writer NFT: ${wipeReceipt.status}`);
    }

    // Wipe buyer NFT if it exists
    if (buyerNftSerial) {
        const buyerAccountId = await hasNft(buyerNftId, buyerNftSerial);

        const buyerWipeTx = await new TokenWipeTransaction()
        .setTokenId(buyerNftId)
        .setAccountId(buyerAccountId)
        .setSerials([buyerNftSerial])
        .freezeWith(client);

        const buyerWipeTxSigned = await buyerWipeTx.sign(k);
        const buyerWipeTxResponse = await buyerWipeTxSigned.execute(client);
        const buyerWipeReceipt = await buyerWipeTxResponse.getReceipt(client);

        if (buyerWipeReceipt.status !== 22) {
            throw new Error(`Failed to wipe buyer NFT: ${buyerWipeReceipt.status}`);
        }
    }


}