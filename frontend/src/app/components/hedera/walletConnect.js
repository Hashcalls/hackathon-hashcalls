import { HashConnect } from "hashconnect";

async function walletConnectFcn() {
	console.log(`\n=======================================`);
	console.log("- Connecting wallet...");

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

	// Attempt to load previously saved data (if any) from localStorage
	const savedData = localStorage.getItem("hashconnectData") || "";
	const savedJson = savedData ? JSON.parse(savedData) : undefined;

	// Pass the restored data to init
	const initData = await hashconnect.init(appMetadata, savedJson, "testnet");

	// After initializing, update localStorage with the latest state
	localStorage.setItem("hashconnectData", JSON.stringify(hashconnect.hcData));

	saveData.privateKey = initData.privKey;
	console.log(`- Private key for pairing: ${saveData.privateKey}`);

	// Then connect, storing the new topic for later
	const state = await hashconnect.connect();
	saveData.topic = state.topic;
	console.log(`- Pairing topic is: ${saveData.topic}`);

	// Generate a pairing string, which you can display and generate a QR code from
	saveData.pairingString = hashconnect.generatePairingString(state, "testnet", false);

	// Find any supported local wallets and attempt to connect
	hashconnect.findLocalWallets();
	hashconnect.connectToLocalWallet(saveData.pairingString);

	return [hashconnect, saveData];
}

export default walletConnectFcn;