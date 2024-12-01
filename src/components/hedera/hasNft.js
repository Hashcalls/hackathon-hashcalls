import {
  TokenNftInfoQuery,
  Client,
  PrivateKey,
  AccountId,
  TokenId,
  NftId,
} from "@hashgraph/sdk";

export async function hasNft(accountId, serialNumber) {
  const escrowAccountId = AccountId.fromString(process.env.REACT_APP_ESCROW_ID);
  const escrowAccountKey = PrivateKey.fromStringECDSA(
    process.env.REACT_APP_ESCROW_KEY
  );
  const tokenId = process.env.REACT_APP_NFT_ID;

  const client = Client.forTestnet().setOperator(
    escrowAccountId,
    escrowAccountKey
  );

  try {
    console.log("=== Checking NFT Ownership ===");
    console.log(`Account ID: ${accountId}`);
    console.log(`Token ID: ${tokenId}`);
    console.log(`Serial Number: ${serialNumber}`);

    // Convert tokenId string to TokenId object
    const tokenIdObj = TokenId.fromString(tokenId);
    console.log(`Token ID Object: ${tokenIdObj.toString()}`);

    // Create NftId from TokenId and serial number
    const nftId = new NftId(tokenIdObj, serialNumber);
    console.log(`NFT ID: ${nftId.toString()}`);

    // Query NFT info
    const nftInfo = await new TokenNftInfoQuery()
      .setNftId(nftId)
      .execute(client);

    console.log(`NFT Info: ${JSON.stringify(nftInfo)}`);

    const ownerAccountId = nftInfo[0].accountId.toString();
    console.log(`NFT Owner: ${ownerAccountId}`);
    console.log(`Checking Account: ${accountId}`);

    const ownsNft = ownerAccountId === accountId;
    console.log(`Owns NFT: ${ownsNft}`);
    console.log("===========================");

    return ownsNft;
  } catch (error) {
    console.error("Error checking NFT ownership:", error);
    return false;
  }
}
