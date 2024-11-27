import React, { useState } from "react";
import MyGroup from "./components/MyGroup.jsx";
import walletConnectFcn from "./components/hedera/walletConnect.js";
import { sendHbarFcn } from "./components/hedera/hbarTransfer.js";
import "./styles/App.css";
import { tokenTransferFcn } from "./components/hedera/tokenTransfer.js";

function App() {
  const [walletData, setWalletData] = useState();
  const [accountId, setAccountId] = useState();
  const [connectTextSt, setConnectTextSt] = useState("🔌 Connect here...");
  const [connectLinkSt, setConnectLinkSt] = useState("");
  const [callOptions, setCallOptions] = useState([]);

  const [token, setToken] = useState("");
  const [amount, setAmount] = useState("");
  const [premium, setPremium] = useState("");
  const [strike, setStrike] = useState("");
  const [expiry, setExpiry] = useState("");

  async function addCallOption() {
    const newCallOption = {
      token,
      amount,
      seller: accountId,
      premium,
      strike,
      expiry,
    };

    // Escrow the token
    const senderAccountId = accountId;
    const txStatus = await tokenTransferFcn(
      walletData,
      senderAccountId,
      token,
      amount
    );
    console.log(`- Transaction status: ${txStatus}`);

    const updatedCallOptions = [...callOptions, newCallOption];
    setCallOptions(updatedCallOptions);

    // Log all current call options
    console.log("Current Call Options:", updatedCallOptions);

    // Clear the input fields
    setToken("");
    setAmount("");
    setPremium("");
    setStrike("");
    setExpiry("");
  }

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
    }
  }

  //   async function sendHbar() {
  //     const senderAccountId = accountId;
  //     const txStatus = await sendHbarFcn(walletData, senderAccountId);
  //     console.log(`- Transaction status: ${txStatus}`);
  //   }

  //   async function sendToken() {
  //     const senderAccountId = accountId;
  //     const txStatus = await tokenTransferFcn(
  //       walletData,
  //       senderAccountId,
  //       "0.0.5067997",
  //       100
  //     );
  //     console.log(`- Transaction status: ${txStatus}`);
  //   }

  return (
    <div className="App">
      <h1 className="header">Let's buidl a dapp on Hedera!</h1>
      <MyGroup
        fcn={connectWallet}
        buttonLabel={"Connect Wallet"}
        text={connectTextSt}
        link={connectLinkSt}
      />

      {/* <MyGroup
                fcn={sendHbar}
                buttonLabel={"Send HBAR"}
                text={`🚀 Send 1 HBAR to escrow wallet`}
            />

            <MyGroup
                fcn={sendToken}
                buttonLabel={"Send Token"}
                text={`🚀 Send 100 tokens to escrow wallet`}
            /> */}

      <div>
        <h2>Create a Call Option</h2>
        <div>
          <label htmlFor="token">Token: </label>
          <input
            id="token"
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="amount">Amount: </label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="premium">Premium: </label>
          <input
            id="premium"
            type="number"
            value={premium}
            onChange={(e) => setPremium(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="strike">Strike Price: </label>
          <input
            id="strike"
            type="number"
            value={strike}
            onChange={(e) => setStrike(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="expiry">Expiry Date: </label>
          <input
            id="expiry"
            type="datetime-local"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          />
        </div>
        <button onClick={addCallOption}>Add Call Option</button>
      </div>

      <div className="logo">
        <div className="symbol">
          <svg
            id="Layer_1"
            data-name="Layer 1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 40 40"
          >
            <path
              d="M20 0a20 20 0 1 0 20 20A20 20 0 0 0 20 0"
              className="circle"
            ></path>
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
