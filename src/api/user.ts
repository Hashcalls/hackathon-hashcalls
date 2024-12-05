// Has NFT Lambda
export async function hasNFT(nftTokenId: string, serialNumber: string) {
    const dynamoResponse = await fetch("https://5re3jroxrqvlb5l7mlymcrhuo40tjlxq.lambda-url.us-east-1.on.aws/", {
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