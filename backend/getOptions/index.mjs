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


    // Query the database by itterating through the array of ids
    let results = [];
    try {
        for (let i = 0; i < id.length; i++) {
            let params;
            if (!sk) {
                params = {
                    TableName: process.env.TABLE_NAME,
                    Key: {
                        PK: `ID#${id[i]}`
                    }
                };
            } else {
                params = {
                    TableName: process.env.TABLE_NAME,
                    Key: {
                        PK: `ID#${id[i]}`,
                        SK: `METADATA#${sk}`
                    }
                };
            }

            const result = await dynamoDb.get(params).promise();
            if (result.Item) {
                results.push(result.Item);
            }
        }
    } catch (error) {
        return createResponse(500, 'Failed to fetch data from Dynamo.', error);
    }

    return createResponse(200, 'Success', 'Successfully fetched data.', results);
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