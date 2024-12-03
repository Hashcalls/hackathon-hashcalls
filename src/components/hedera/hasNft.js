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
    const nftTokenIdObj = TokenId.fromString(nftTokenId);

    const nftId = new NftId(nftTokenIdObj, serialNumber);

    const nftInfo = await new TokenNftInfoQuery()
      .setNftId(nftId)
      .execute(client);

    const ownerAccountId = nftInfo[0].accountId.toString();

    return ownerAccountId;
  } catch (error) {
    console.error("Error checking NFT ownership:", error);
    return null;
  }
}
