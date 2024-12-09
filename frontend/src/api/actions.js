// Buy option lambda
export async function buyOption(writerNftSerial, optionBuyerId) {
    const dynamoResponse = await fetch("https://cq7w2aflxurbr2vzcf3ms2lsnq0ondne.lambda-url.us-east-1.on.aws/", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            writerNftSerial,
            optionBuyerId
        }),
    });

    const result = await dynamoResponse.json();

    return result;
}


// Excercise option lambda
export async function exerciseOption(optionBuyerId, premium, writerNftSerial, walletData, tokenId, buyerNftSerial, buyerId, strikePrice, payout, isCall) {
    const dynamoResponse = await fetch("https://odamc4dmgjxihjzt74hbrh6yo40phffh.lambda-url.us-east-1.on.aws/", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            optionBuyerId,
            premium,
            writerNftSerial,
            walletData,
            tokenId,
            buyerNftSerial,
            buyerId,
            strikePrice,
            payout,
            isCall
        }),
    });

    const result = await dynamoResponse.json();

    return result;
}


// Write option lambda
export async function writeOption(writerAccountId, tokenId, amount, strikePrice, isCall) {
    const dynamoResponse = await fetch("https://qy44huzg7fod57jkpaqvp7uwi40ojmdz.lambda-url.us-east-1.on.aws/", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            writerAccountId,
            tokenId,
            amount,
            strikePrice,
            isCall
        }),
    });

    const result = await dynamoResponse.json();

    return result;
}


// Upload option to Dynamo Lambda
export async function uploadOptionToDynamo(serialNumber, writerAccountId, tokenId, amount, strikePrice, isCall) {
    const dynamoResponse = await fetch("https://ulmpmp4ofacn343malpxfzgxeq0qbwba.lambda-url.us-east-1.on.aws/", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            serialNumber,
            writerAccountId,
            tokenId,
            amount,
            strikePrice,
            isCall
        }),
    });

    const result = await dynamoResponse.json();

    return result;
}


// Add buyer option to Dynamo Lambda
export async function addBuyerToOptionDynamo(buyerId, writerNftSerial) {
    const dynamoResponse = await fetch("https://ve4ripes4mgifatczmpjdsjwzm0moslr.lambda-url.us-east-1.on.aws/", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            buyerId,
            writerNftSerial
        }),
    });

    const result = await dynamoResponse.json();

    return result;
}