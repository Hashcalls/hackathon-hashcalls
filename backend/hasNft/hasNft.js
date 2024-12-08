import {
  TokenNftInfoQuery,
  Client,
  PrivateKey,
  AccountId,
  TokenId,
  NftId,
} from "@hashgraph/sdk";

// Global variables
const escrowAccountId = AccountId.fromString(process.env.REACT_APP_ESCROW_ID);
const escrowAccountKey = PrivateKey.fromStringECDSA(
  process.env.REACT_APP_ESCROW_KEY
);

const client = Client.forTestnet().setOperator(
  escrowAccountId,
  escrowAccountKey
);


export const handler = async (event) => {
  if (event.requestContext) {
    // Preflight request handling for CORS.
    if (event.requestContext.http.method === 'OPTIONS') {
      return createResponse(204, 'No Content', 'Preflight request.', {});
    } else if (event.requestContext.http.method !== 'GET') { // Require GET.
      return createResponse(405, 'Method Not Allowed', 'GET method is required.', {});
    }
  }


  // Take body params
  let nftTokenId, serialNumber;
  try {
    const body = JSON.parse(event.body);

    if (!nftTokenId || !serialNumber) {
      throw new Error("Missing required parameters.");
    }

    nftTokenId = body.nftTokenId;
    serialNumber = body.serialNumber;

  } catch (error) {
    return createResponse(400, 'Bad Request', 'Error parsing request body.', error);
  }


  // Check if the user has the NFT
  try {
    const nftTokenIdObj = TokenId.fromString(nftTokenId);

    const nftId = new NftId(nftTokenIdObj, serialNumber);

    const nftInfo = await new TokenNftInfoQuery()
      .setNftId(nftId)
      .execute(client);

    const ownerAccountId = nftInfo[0].accountId.toString();

    return createResponse(200, 'Success', 'NFT ownership checked.', ownerAccountId);

  } catch (error) {
    return createResponse(500, 'Internal Server Error', 'Error checking NFT ownership.', error);
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