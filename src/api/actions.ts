// Upload buy option to DynamoDB
export async function buyOption(optionBuyerId: string, premium: number, writerNftSerial: string, walletData: any) {
    const dynamoResponse = await fetch("", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            optionBuyerId,
            premium,
            writerNftSerial,
            walletData,
        }),
    });

    const result = await dynamoResponse.json();

    return result;
}


// Upload exercise option to DynamoDB
export async function exerciseOption(optionBuyerId: string, premium: number, writerNftSerial: string, walletData: any, tokenId: string, buyerNftSerial: string, buyerId: string, strikePrice: number, payout: number, isCall: boolean) {
    const dynamoResponse = await fetch("", {
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


// Upload write option to DynamoDB
export async function writeOption(walletData: any, writerAccountId: string, tokenId: string, amount: number, strikePrice: number, isCall: boolean) {
    const dynamoResponse = await fetch("", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            walletData,
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