// Has NFT Lambda
export async function hasNFT(nftTokenId: string, serialNumber: string) {
    const dynamoResponse = await fetch("", {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            nftTokenId,
            serialNumber
        }),
    });

    const result = await dynamoResponse.json();

    return result;
}