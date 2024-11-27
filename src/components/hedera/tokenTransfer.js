import { TransferTransaction } from "@hashgraph/sdk";

export async function tokenTransferFcn(walletData, senderAccountId, tokenId, amount) {
    const escrowAccountId = process.env.REACT_APP_ESCROW_ID;
    console.log(escrowAccountId);
    console.log(`\n=======================================`);
    console.log(`- Escrowing ${amount} token ${tokenId} from option seller ${senderAccountId} to escrow account ${escrowAccountId}`);

    const hashconnect = walletData[0];
    const saveData = walletData[1];

    const provider = hashconnect.getProvider("testnet", saveData.topic, senderAccountId);
    const signer = hashconnect.getSigner(provider);

    try {
        const transferTx = await new TransferTransaction()
            .addTokenTransfer(tokenId,senderAccountId,-amount ) 
            .addTokenTransfer(tokenId, escrowAccountId, amount)
            .freezeWithSigner(signer);

        const signedTx = await transferTx.signWithSigner(signer);
        const txResponse = await signedTx.executeWithSigner(signer);
        const receipt = await provider.getTransactionReceipt(txResponse.transactionId);

       // console.log(`- Transaction status: ${receipt.status.toString()}`);
        return receipt.status.toString();
    } catch (error) {
        console.error("- Error during token transfer:", error);
        throw new Error(`Token transfer failed: ${error.message}`);
    }
}
