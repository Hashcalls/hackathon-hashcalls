import { HashConnect } from "hashconnect";

export const handler = async (event) => {
	if (event.requestContext) {
		// Preflight request handling for CORS.
		if (event.requestContext.http.method === 'OPTIONS') {
			return createResponse(204, 'No Content', 'Preflight request.', {});
		} else if (event.requestContext.http.method !== 'POST') { // Require POST.
			return createResponse(405, 'Method Not Allowed', 'POST method is required.', {});
		}
	}


	let saveData = {
		topic: "",
		pairingString: "",
		privateKey: "",
		pairedWalletData: null,
		pairedAccounts: [],
	};
	let appMetadata = {
		name: "Hashcalls",
		description: "HTS Options Marketplace",
		icon: "https://raw.githubusercontent.com/ed-marquez/hedera-dapp-days/testing/src/assets/hederaLogo.png",
	};
	let hashconnect = new HashConnect();

	// First init and store the pairing private key for later (this is NOT your account private key)
	const initData = await hashconnect.init(appMetadata);
	saveData.privateKey = initData.privKey;
	console.log(`- Private key for pairing: ${saveData.privateKey}`);

	// Then connect, storing the new topic for later
	const state = await hashconnect.connect();
	saveData.topic = state.topic;
	console.log(`- Pairing topic is: ${saveData.topic}`);

	// Generate a pairing string, which you can display and generate a QR code from
	saveData.pairingString = hashconnect.generatePairingString(state, "testnet", false);

	// Find any supported local wallets
	hashconnect.findLocalWallets();
	hashconnect.connectToLocalWallet(saveData.pairingString);

	return [hashconnect, saveData];
};


// Create response.
const createResponse = (statusCode, statusDescription, message, data) => {
	const response = {
		statusCode,
		statusDescription,
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			message,
			data
		})
	};

	statusCode === 200 ? console.log('RESPONSE:', response) : console.error('RESPONSE:', response);

	return response;
};