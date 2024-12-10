import AWS from 'aws-sdk';

const dynamo = new AWS.DynamoDB.DocumentClient();

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
  let serialNumber, transactionId, writerAccountId, tokenId, amount, strikePrice, isCall, premium, expiry;
  try {
    const body = JSON.parse(event.body);

    if (!body.writerAccountId || !body.tokenId || !body.amount || !body.strikePrice || !body.isCall || !body.serialNumber || !body.transactionId || !body.premium || !body.expiry) {
      throw new Error("Missing required parameters.");
    }

    writerAccountId = body.writerAccountId;
    tokenId = body.tokenId;
    amount = body.amount;
    strikePrice = body.strikePrice;
    isCall = body.isCall;
    serialNumber = body.serialNumber;
    transactionId = body.transaction
    premium = body.premium;
    expiry = body.expiry;

  } catch (error) {
    return createResponse(400, 'Bad Request', 'Error parsing request body.', error);
  }


  // Check if unique in DynamoDB with query pk
  try {
    const params = {
      TableName: process.env.TABLE_NAME,
      Key: {
        PK: `ID#${serialNumber}`,
        SK: "METADATA#WRITEOPTION"
      },
    };

    const data = await dynamo.query(params).promise();

    if (data.Items) {
      return createResponse(400, 'Bad Request', 'Option already exists.', {});
    }
  } catch (error) {
    return createResponse(500, 'Internal Server Error', 'Error querying DynamoDB.', error);
  }


  // Write to DynamoDB
  try {
    const params = {
      TableName: process.env.TABLE_NAME,
      Item: {
        PK: `ID#${serialNumber}`,
        SK: "METADATA#WRITEOPTION",
        writerAccountId,
        tokenId,
        amount,
        strikePrice,
        isCall,
        premium,
        expiry,
        transactionId,
        timestamp: new Date().toISOString()
      }
    };

    await dynamo.put(params).promise();

  } catch (error) {
    return createResponse(500, 'Internal Server Error', 'Error writing to DynamoDB.', error);
  }

  return createResponse(200, 'Success', 'Option written to DynamoDB.', {});
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