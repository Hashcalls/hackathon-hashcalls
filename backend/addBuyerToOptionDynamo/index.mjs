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


    // Take params from the event body
    let writerNftSerial, buyerId, buyerNftSerial;
    try {
        const body = JSON.parse(event.body);

        if (!body.writerNftSerial || !body.buyerId || !body.buyerNftSerial) {
            throw new Error("Missing required parameters.");
        }

        writerNftSerial = body.writerNftSerial;
        buyerId = body.buyerId;
        buyerNftSerial = body.buyerNftSerial;

    } catch (error) {
        return createResponse(400, 'Bad Request', 'Error parsing request body.', error);
    }


    // Mofidy the writer NFT metadata in Dynamo to have buyerId
    try {
        const params = {
            TableName: process.env.TABLE_NAME,
            Key: {
                PK: writerNftSerial,
                SK: "METADATA#WRITEOPTION"
            },
            UpdateExpression: "set buyerId = :buyerId, buyerNftSerial = :buyerNftSerial",
            ExpressionAttributeValues: {
                ":buyerId": buyerId,
                ":buyerNftSerial": buyerNftSerial
            },
        };

        await dynamo.update(params).promise();

        return createResponse(200, 'OK', 'Buyer added to writer NFT.', {});

    } catch (error) {
        return createResponse(500, 'Failed to add buyer to writer NFT.', error);
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