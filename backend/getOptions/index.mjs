import AWS from 'aws-sdk';

// Initialize resources.
const dynamoDb = new AWS.DynamoDB.DocumentClient();


export const handler = async (event) => {
    if (event.requestContext) {
        // Preflight request handling for CORS.
        if (event.requestContext.http.method === 'OPTIONS') {
            return createResponse(204, 'No Content', 'Preflight request.', {});
        } else if (event.requestContext.http.method !== 'GET') { // Require GET.
            return createResponse(405, 'Method Not Allowed', 'GET method is required.', {});
        }
    }


    // Take in body params with optional sort key
    let id, sk;
    try {
        const body = JSON.parse(event.body);

        if (!body.id) {
            throw new Error("Missing required id param.");
        }

        id = body.id;
        sk = body.sk;

    } catch (error) {
        return createResponse(400, 'Bad Request', 'Error parsing request body.', error);
    }


    // Query the database
    try {
        let params;
        if (!sk) {
            params = {
                TableName: process.env.TABLE_NAME,
                Key: {
                    PK: `ID#${id}`
                }
            };

        } else {
            params = {
                TableName: process.env.TABLE_NAME,
                Key: {
                    PK: `ID#${id}`,
                    SK: `METADATA#${sk}`
                }
            };
        }

        const data = await dynamoDb.get(params).promise();

        return createResponse(200, 'Success', 'Successfully fetched data.', data);

    } catch (error) {
        return createResponse(500, 'Internal Server Error', 'Error fetching data.', error);
    }
};