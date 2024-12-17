
export async function getNftSerialsOwned(accountId, nftId) {

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

export async function getHistoricNftSerialsWritten(accountId) {
  // TODO: Implement this function
}