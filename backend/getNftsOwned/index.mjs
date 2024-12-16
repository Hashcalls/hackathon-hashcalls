import AWS from 'aws-sdk';

// Initialise resources.
const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Global variables
const DEBUG = process.env.DEBUG;


export const handler = async (event) => {
    if (event.requestContext) {
        // Preflight request handling for CORS.
        if (event.requestContext.http.method === 'OPTIONS') {
            return createResponse(204, 'No Content', 'Preflight request.', {});
        } else if (event.requestContext.http.method !== 'POST') { // Require POST.
            return createResponse(405, 'Method Not Allowed', 'POST method is required.', {});
        }
    }


    // Parse and validate the request body
    let accountId, nftId;
    try {
        const body = JSON.parse(event.body);

        accountId = body.accountId;
        nftId = body.nftId;

        if (!accountId || !nftId) {
            throw new Error("Missing required parameters.");
        }

    } catch (error) {
        return createResponse(400, 'Bad Request', 'Error parsing request body.', error.message);
    }


    // Fetch NFTs serials owned by the account
    let serials;
    try {
        const url = `${process.env.REACT_APP_HEDERA_BASE_URL}/accounts/${accountId}/nfts?token.id=${nftId}`;
        DEBUG && console.log(`Fetching NFT data from: ${url}`);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const data = await response.json();
        if (!data || !data.nfts) {
            throw new Error(`Invalid response structure or missing NFT data.`);
        }

        if (data.nfts.length === 0) {
            // No NFTs found for the account
            return createResponse(200, 'OK', 'No NFTs found for the account.', { isNftOwner: false, serials: [] });
        }

        // Extract serial numbers of owned NFTs
        serials = data.nfts.map((nft) => nft.serial_number);
        DEBUG && console.log('NFTs serials:', serials);

    } catch (error) {
        return createResponse(500, 'Internal Server Error', 'Failed to fetch NFT data.', error.message);
    }


    // Fetch NFTs metadata from DynamoDB
    let metadata = {};
    try {
        const queries = serials.map(serial => {
            const params = {
                TableName: process.env.DYNAMODB_TABLE,
                IndexName: 'buyerNftSerial-index',
                KeyConditionExpression: 'buyerNftSerial = :val',
                ExpressionAttributeValues: {
                    ':val': Number(serial)
                }
            };
            return dynamoDb.query(params).promise();
        });

        const queryResults = await Promise.all(queries);
        const allItems = queryResults.flatMap(res => res.Items);
        metadata = allItems.map(item => {
            return {
                PK: item.PK.split('#')[1],
                tokenId: item.tokenId,
                amount: item.amount,
                premium: item.premium,
                strikePrice: item.strikePrice,
                expiry: item.expiry,
                isCall: item.isCall,
                buyerId: item.buyerId,
                buyerNftSerial: item.buyerNftSerial,
                writerAccountId: item.writerAccountId,
                transactionId: item.transactionId,
                timestamp: item.timestamp
            };
        });

    } catch (error) {
        return createResponse(500, 'Internal Server Error', 'Failed to fetch NFT metadata from DynamoDB.', error.message);
    }

    // Return the response with metadata
    return createResponse(200, 'OK', 'NFT metadata fetched successfully.', metadata);
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