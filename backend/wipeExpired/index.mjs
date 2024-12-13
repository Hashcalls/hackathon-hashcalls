import {
    TokenWipeTransaction,
    Client,
    TokenMintTransaction,
    TransferTransaction,
    PrivateKey,
} from "@hashgraph/sdk";
import AWS from 'aws-sdk';

const dynamo = new AWS.DynamoDB.DocumentClient();


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