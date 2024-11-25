import { ContractFunctionParameters, ContractExecuteTransaction, ContractCallQuery, Hbar } from "@hashgraph/sdk";

async function contractQueryFcn(walletData, accountId, contractId) {
	console.log(`\n=======================================`);
	console.log(`- Query the smart contract...`);

	const hashconnect = walletData[0];
	const saveData = walletData[1];
	const provider = hashconnect.getProvider("testnet", saveData.topic, accountId);
	const signer = hashconnect.getSigner(provider);

    const contractCallResult = await new ContractCallQuery()
    // Set the gas to execute a contract call
    .setGas(75000)
    // Set which contract
    .setContractId(contractId)
    // Set the function to call on the contract
    .setFunction("getGreeting")
    .setQueryPayment(new Hbar(1))
    .executeWithSigner(signer);

    console.log(contractCallResult);

// if (
//     contractCallResult.errorMessage != null &&
//     contractCallResult.errorMessage != ""
// ) {
//     console.log(
//         `error calling contract: ${contractCallResult.errorMessage}`,
//     );
// }

        // Get the message from the result
        // The `0` is the index to fetch a particular type from
        //
        // e.g.
        // If the return type of `get_message` was `(string[], uint32, string)`
        // then you'd need to get each field separately using:
        //      const stringArray = contractCallResult.getStringArray(0);
        //      const uint32 = contractCallResult.getUint32(1);
        //      const string = contractCallResult.getString(2);
        const message = contractCallResult; //TODO: This is returning null
        console.log(`contract message: ${message}`);

        return contractCallResult.transactionId;
}

export default contractQueryFcn;
