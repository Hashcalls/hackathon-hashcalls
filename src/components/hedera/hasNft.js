import {
  TokenNftInfoQuery,
  Client,
  PrivateKey,
  AccountId,
  TokenId,
  NftId,
} from "@hashgraph/sdk";

export async function hasNft(nftTokenId, serialNumber) {
  const escrowAccountId = AccountId.fromString(process.env.REACT_APP_ESCROW_ID);
  const escrowAccountKey = PrivateKey.fromStringECDSA(
    process.env.REACT_APP_ESCROW_KEY
  );

  const client = Client.forTestnet().setOperator(
    escrowAccountId,
    escrowAccountKey
  );

  try {
    console.log("=== Checking NFT Ownership ===");
    // console.log(`Token ID: ${nftTokenId}`);
    // console.log(`Serial Number: ${serialNumber}`);

    // Convert nftTokenId string to nftTokenId object
    const nftTokenIdObj = TokenId.fromString(nftTokenId);
    // console.log(`Token ID Object: ${nftTokenIdObj.toString()}`);

    // Create NftId from nftTokenIdObj and serial number
    const nftId = new NftId(nftTokenIdObj, serialNumber);
    console.log(`NFT ID: ${nftId.toString()}`);

    // Query NFT info
    const nftInfo = await new TokenNftInfoQuery()
      .setNftId(nftId)
      .execute(client);

    // console.log(`NFT Info: ${JSON.stringify(nftInfo)}`);

    const ownerAccountId = nftInfo[0].accountId.toString();
    console.log(
      `HASNFT CHECK: NFT Owner of NFT ID ${nftId} serial ${serialNumber}: ${ownerAccountId}`
    );

    return ownerAccountId;
  } catch (error) {
    console.error("Error checking NFT ownership:", error);
    return null;
  }
}
