
// export async function getNftSerialsOwned(accountId, nftId) {
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
    let accountId, nftId;
    try {
        const body = JSON.parse(event.body);

        accountId = body.accountId;
        nftId = body.nftId;

        if (!body.accountId || !body.nftId) {
            throw new Error("Missing required parameters.");
        }

    } catch (error) {
        return createResponse(400, 'Bad Request', 'Error parsing request body.', error);
    }


    // Fetch NFTs owned by the account
    try {
        if (!accountId || !nftId) {
            throw new Error("Account ID and NFT ID are required parameters.");
        }

        const url = `${process.env.REACT_APP_HEDERA_BASE_URL}/accounts/${accountId}/nfts?token.id=${nftId}`;
        console.log(`Fetching NFT data from: ${url}`);

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
            return { isNftOwner: false, serials: [] };
        }

        // Extract serial numbers of owned NFTs
        const serials = data.nfts.map((nft) => nft.serial_number);
        return { isNftOwner: true, serials };
    } catch (error) {
        console.error("Error fetching NFT data:", error.message);
        return { isNftOwner: false, serials: [] }; // Ensure a consistent return structure
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