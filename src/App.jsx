import React, { useState } from "react";
import MyGroup from "./components/MyGroup.jsx";
import walletConnectFcn from "./components/hedera/walletConnect.js";
import "./styles/App.css";

function App() {
	const [walletData, setWalletData] = useState();
	const [accountId, setAccountId] = useState();
	const [tokenId, setTokenId] = useState();
	const [tokenSupply, setTokenSupply] = useState();
	const [contractId, setContractId] = useState();

	const [connectTextSt, setConnectTextSt] = useState("🔌 Connect here...");
	const [createTextSt, setCreateTextSt] = useState("");
	const [mintTextSt, setMintTextSt] = useState("");
	const [contractTextSt, setContractTextSt] = useState();
	const [trasnferTextSt, setTransferTextSt] = useState();

	const [connectLinkSt, setConnectLinkSt] = useState("");
	const [createLinkSt, setCreateLinkSt] = useState("");
	const [mintLinkSt, setMintLinkSt] = useState("");
	const [contractLinkSt, setContractLinkSt] = useState();
	const [trasnferLinkSt, setTransferLinkSt] = useState();

	async function connectWallet() {
		if (accountId !== undefined) {
			setConnectTextSt(`🔌 Account ${accountId} already connected ⚡ ✅`);
		} else {
			const wData = await walletConnectFcn();
			wData[0].pairingEvent.once((pairingData) => {
				pairingData.accountIds.forEach((id) => {
					setAccountId(id);
					console.log(`- Paired account id: ${id}`);
					setConnectTextSt(`🔌 Account ${id} connected ⚡ ✅`);
					setConnectLinkSt(`https://hashscan.io/#/testnet/account/${id}`);
				});
			});
			setWalletData(wData);
			setCreateTextSt();
		}
	}


	function prettify(txIdRaw) {
		const a = txIdRaw.split("@");
		const b = a[1].split(".");
		return `${a[0]}-${b[0]}-${b[1]}`;
	}

	return (
		<div className="App">
			<h1 className="header">Let's buidl a dapp on Hedera!</h1>
			<MyGroup
				fcn={connectWallet}
				buttonLabel={"Connect Wallet"}
				text={connectTextSt}
				link={connectLinkSt}
			/>

			<div className="logo">
				<div className="symbol">
					<svg
						id="Layer_1"
						data-name="Layer 1"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 40 40"
					>
						<path d="M20 0a20 20 0 1 0 20 20A20 20 0 0 0 20 0" className="circle"></path>
						<path
							d="M28.13 28.65h-2.54v-5.4H14.41v5.4h-2.54V11.14h2.54v5.27h11.18v-5.27h2.54zm-13.6-7.42h11.18v-2.79H14.53z"
							className="h"
						></path>
					</svg>
				</div>
				<span>Hedera</span>
			</div>
		</div>
	);
}
export default App;
