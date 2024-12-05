import { uploadOptionToDynamo } from "../../api/actions";

async function signTx(tx, signer, metadata) {

    // Get user to sign transaction
    const txResponse = await tx.executeWithSigner(signer);

    const receipt = await provider.getTransactionReceipt(
        txResponse.transactionId
    );

    // If signed unpack metadata object and upload to Dynamo
    if (receipt.status._code == 200) {
        console.log("Transaction succeeded");

        const { serialNumber, transactionId, writerAccountId, tokenId, amount, strikePrice, isCall } = metadata;

        uploadOptionToDynamo(serialNumber, transactionId, writerAccountId, tokenId, amount, strikePrice, isCall);

    } else {
        console.log("Transaction failed");
    }

    return receipt;
}

export default signTx;