import {
  Client,
  TokenMintTransaction,
  TransferTransaction,
  PrivateKey,
  AccountId,
  Hbar,
} from "@hashgraph/sdk";


// Global variables
const escrowAccountId = AccountId.fromString(process.env.REACT_APP_ESCROW_ID);
const k = PrivateKey.fromStringECDSA(process.env.REACT_APP_ESCROW_KEY);
const WRITER_NFT_ID = process.env.REACT_APP_WRITER_NFT_ID;
const client = Client.forTestnet().setOperator(escrowAccountId, k);


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
  let walletData, writerAccountId, tokenId, amount, strikePrice, isCall;
  try {
    const body = JSON.parse(event.body);

    if (!body.writerAccountId || !body.tokenId || !body.amount || !body.strikePrice || !body.isCall || !body.walletData) {
      throw new Error("Missing required parameters.");
    }

    writerAccountId = body.writerAccountId;
    tokenId = body.tokenId;
    amount = body.amount;
    strikePrice = body.strikePrice;
    isCall = body.isCall;
    walletData = body.walletData;

  } catch (error) {
    return createResponse(400, 'Bad Request', 'Error parsing request body.', error);
  }


  // Check if the buyer has enough funds to purchase the option
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
      console.log(
        `- Call option writer ${writerAccountId} transferred ${amount} of token ${tokenId} to escrow ${escrowAccountId} - Transferred Writer NFT ID ${WRITER_NFT_ID} serial ${serialNumber} to writer ${writerAccountId}`
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
      console.log(
        `- Put option writer ${writerAccountId} transferred ${strikePrice} HBAR to escrow ${escrowAccountId} - Transferred Writer NFT ID ${WRITER_NFT_ID} serial ${serialNumber} to writer ${writerAccountId}`
      );
    }

    const signedTx = await transferTx.sign(k);
    const txResponse = await signedTx.executeWithSigner(signer);
    const receipt = await provider.getTransactionReceipt(
      txResponse.transactionId
    );

    // Upload to DynamoDB
    try {
      const documentClient = new AWS.DynamoDB.DocumentClient();

      const params = {
        TableName: "CORE",
        Item: {
          PK: `ID#${serialNumber}`,
          SK: "METADATA#WRITEOPTION",
          transactionId: txResponse.transactionId.toString(),
          writerAccountId,
          tokenId,
          amount,
          strikePrice,
          isCall,
          transactionStatus: receipt.status.toString(),
          transactionDate: new Date().toISOString(),
        },
      };

      await documentClient.put(params).promise();
      return createResponse(200, "Success", "Writer NFT minted and transferred.", {
        serialNumber,
        receipt
      });


    } catch (err) {
      return createResponse(500, "Failed to upload to DynamoDB", err);
    }

  } catch (error) {
    return createResponse(500, "Internal Server Error", error);
  }
}


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