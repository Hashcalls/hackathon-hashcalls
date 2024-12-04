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


export const handler = async (event, nftTokenId, serialNumber) => {
  if (event.requestContext) {
    // Preflight request handling for CORS.
    if (event.requestContext.http.method === 'OPTIONS') {
      return createResponse(204, 'No Content', 'Preflight request.', {});
    } else if (event.requestContext.http.method !== 'POST') { // Require POST.
      return createResponse(405, 'Method Not Allowed', 'POST method is required.', {});
    }
  }


  // Check if the buyer has enough funds to purchase the option
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