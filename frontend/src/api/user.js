// Has NFT Lambda
export async function hasNFT(nftTokenId, serialNumber) {
    const dynamoResponse = await fetch("https://cvcjxnv5rqp2hzsavo2h7jxnci0yfbbo.lambda-url.us-east-1.on.aws/", {
        method: 'POST',
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


// Check NFT ownership and return serials 
export async function getNftsOwned(accountId, nftId) {
    const dynamoResponse = await fetch("https://vglk6vrt7h4ywgsyjcuzhwhkm40uhqgx.lambda-url.us-east-1.on.aws/", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            accountId,
            nftId
        }),
    });

    const result = await dynamoResponse.json();

    return result;
}