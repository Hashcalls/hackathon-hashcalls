import React, { useState } from "react";
import walletConnectFcn from "./components/hedera/walletConnect.js";
import "./styles/App.css";
import { buyOptionFcn } from "./components/hedera/buyOption.js";
import { writeOptionFcn } from "./components/hedera/writeOption.js";
import { exerciseOptionFcn } from "./components/hedera/exerciseOption.js";


function App() {
  // State for connected wallet
  const [walletData, setWalletData] = useState();
  const [accountId, setAccountId] = useState();
  const [connectTextSt, setConnectTextSt] = useState("🔌 Connect here...");
  const [connectLinkSt, setConnectLinkSt] = useState("");

  // Unified state for options
  const [options, setOptions] = useState([]);
  const [token, setToken] = useState("");
  const [amount, setAmount] = useState("");
  const [premium, setPremium] = useState("");
  const [strike, setStrike] = useState("");
  const [expiry, setExpiry] = useState("");
  const [isCall, setIsCall] = useState(true); // Tracks whether adding a call or put
  const [selectedOptionIndex, setSelectedOptionIndex] = useState("");

  async function connectWallet() {
    if (accountId) {
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

  async function addOption() {

    const writerNftSerial = await writeOptionFcn(walletData, accountId, token, amount, strike, isCall);

    const newOption = {
      token,
      amount,
      premium,
      strike,
      expiry,
      nftSerial: null,
      writerNftSerial,
      isCall,
    };

    const updatedOptions = [...options, newOption];
    setOptions(updatedOptions);

    console.log("Current Options:", updatedOptions);

    // Clear input fields
    setToken("");
    setAmount("");
    setPremium("");
    setStrike("");
    setExpiry("");
  }

  async function buyOption() {
    if (selectedOptionIndex === "") {
      alert("Please select an option to buy.");
      return;
    }

    const index = parseInt(selectedOptionIndex, 10);
    const selectedOption = options[index];
    console.log("Selected Option:", selectedOption);

    const serialNumber = await buyOptionFcn(
      walletData,
      accountId,
      selectedOption.premium,
      selectedOption.writerNftSerial
    );

    const updatedOptions = [...options];
    updatedOptions[index] = {
      ...selectedOption,
      nftSerial: serialNumber,
    };

    setOptions(updatedOptions);

    console.log("Updated Options:", updatedOptions);
  }

  async function exerciseOption() {
    if (selectedOptionIndex === "") {
      alert("Please select an option to exercise.");
      return;
    }

    const index = parseInt(selectedOptionIndex, 10);
    const selectedOption = options[index];

    const currentTime = new Date().toISOString();
    if (currentTime > selectedOption.expiry) {
      alert("This option has expired.");
      return;
    }

    try {
              await exerciseOptionFcn(
          walletData,
          selectedOption.token,
          selectedOption.nftSerial,
          accountId,
          selectedOption.strike,
          selectedOption.amount,
          selectedOption.writerNftSerial,
          isCall
        );

      // if (selectedOption.isCall) {
      //   await exerciseCallOptionFcn(
      //     walletData,
      //     selectedOption.token,
      //     selectedOption.nftSerial,
      //     accountId,
      //     selectedOption.strike,
      //     selectedOption.amount,
      //     selectedOption.writerNftSerial,
      //     isCall
      //   );
      // } else {
      //   await exercisePutOptionFcn(
      //     walletData,
      //     selectedOption.token,
      //     selectedOption.nftSerial,
      //     accountId,
      //     selectedOption.strike,
      //     selectedOption.amount,
      //     selectedOption.writerNftSerial
      //   );
      // }

      const updatedOptions = options.filter((_, idx) => idx !== index);
      setOptions(updatedOptions);

      alert("Option exercised successfully!");
      console.log("Updated Options:", updatedOptions);
    } catch (error) {
      console.error("Error exercising option:", error);
      alert("An error occurred while exercising the option.");
    }
  }

  return (
    <div className="App">
      <h1 className="header">HASHCALLS</h1>
      <div>
        <button onClick={connectWallet} className="cta-button">
          {connectTextSt}
        </button>
        {connectLinkSt && (
          <a href={connectLinkSt} target="_blank" rel="noreferrer">
            View on HashScan
          </a>
        )}
      </div>

      <div>
        <h2>Create an Option</h2>
        <div>
          <label>
            <input
              type="radio"
              name="optionType"
              value="call"
              checked={isCall}
              onChange={() => setIsCall(true)}
            />
            Call
          </label>
          <label>
            <input
              type="radio"
              name="optionType"
              value="put"
              checked={!isCall}
              onChange={() => setIsCall(false)}
            />
            Put
          </label>
        </div>
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
        <button onClick={addOption}>Add Option</button>
      </div>

      <div>
        <h2>Buy an Option</h2>
        <div>
          <label htmlFor="options">Select Option: </label>
          <select
            id="options"
            value={selectedOptionIndex}
            onChange={(e) => setSelectedOptionIndex(e.target.value)}
          >
            <option value="">-- Select an Option --</option>
            {options.map((option, index) => (
              <option key={index} value={index}>
                {option.isCall ? "Call" : "Put"} Option {index + 1} - Token:{" "}
                {option.token}, Amount: {option.amount}
              </option>
            ))}
          </select>
        </div>
        <button onClick={buyOption}>Buy Option</button>
      </div>

      <div>
        <h2>Exercise an Option</h2>
        <div>
          <label htmlFor="owned-options">Select Owned Option: </label>
          <select
            id="owned-options"
            value={selectedOptionIndex}
            onChange={(e) => setSelectedOptionIndex(e.target.value)}
          >
            <option value="">-- Select an Option --</option>
            {options.map((option, index) => (
              <option key={index} value={index}>
                {option.isCall ? "Call" : "Put"} Option {index + 1} - Token:{" "}
                {option.token}, Amount: {option.amount}
              </option>
            ))}
          </select>
        </div>
        <button onClick={exerciseOption}>Exercise Option</button>
      </div>
    </div>
  );
}

export default App;
