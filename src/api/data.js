// Get all purchasable options
export async function getBuyableOptions() {
    const dynamoResponse = await fetch("https://buca2nsffy6spiku2f6rtfiywa0onhts.lambda-url.us-east-1.on.aws/", {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    });

    const result = await dynamoResponse.json();

    return result;
}