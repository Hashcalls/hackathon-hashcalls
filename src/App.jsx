import React, { useState } from "react";
import MyGroup from "./components/MyGroup.jsx";
import walletConnectFcn from "./components/hedera/walletConnect.js";
import { sendHbarFcn } from "./components/hedera/hbarTransfer.js";
import "./styles/App.css";
import { tokenTransferFcn } from "./components/hedera/tokenTransfer.js";
import { exerciseOptionFcn } from "./components/hedera/exerciseOption.js";

function App() {
  const [walletData, setWalletData] = useState();
  const [accountId, setAccountId] = useState();
  const [connectTextSt, setConnectTextSt] = useState("🔌 Connect here...");
  const [connectLinkSt, setConnectLinkSt] = useState("");
  const [callOptions, setCallOptions] = useState([]);

  const [token, setToken] = useState("");
  const [amount, setAmount] = useState("");
  const [seller, setSeller] = useState("");
  const [premium, setPremium] = useState("");
  const [strike, setStrike] = useState("");
  const [expiry, setExpiry] = useState("");

  const [selectedOptionIndex, setSelectedOptionIndex] = useState("");

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

  async function addCallOption() {
    const newCallOption = {
      token,
      amount,
      seller: seller || accountId, // Use specified seller or default to connected wallet
      premium,
      strike,
      expiry,
      buyer: null,
    };

    // Escrow the token
    const senderAccountId = accountId; // Use the seller as the sender
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
    setSeller(""); // Reset seller input
  }

  async function handleBuyOption() {
    if (selectedOptionIndex === "") {
      alert("Please select a call option to buy.");
      return;
    }

    const selectedOptionIndexNum = parseInt(selectedOptionIndex, 10);
    const selectedOption = callOptions[selectedOptionIndexNum];
    console.log("Selected Option:", selectedOption);

    if (selectedOption.buyer) {
      console.log("This option is already owned by:", selectedOption.buyer);
      alert("This option has already been purchased.");
      return;
    }

    await sendHbarFcn(
      walletData,
      accountId,
      selectedOption.seller,
      selectedOption.premium
    );

    // Update the buyer of the selected call option
    const updatedOptions = [...callOptions];
    updatedOptions[selectedOptionIndexNum] = {
      ...selectedOption,
      buyer: accountId, // Set the buyer to the current wallet
    };

    setCallOptions(updatedOptions);

    // Log the updated state
    console.log("Updated Call Options:", updatedOptions);
    console.log(
      `Option ${selectedOptionIndexNum + 1} purchased by: ${accountId}`
    );
  }

  async function exerciseOption() {
    if (selectedOptionIndex === "") {
      alert("Please select an option to exercise.");
      return;
    }

    const selectedOptionIndexNum = parseInt(selectedOptionIndex, 10);

    if (
      isNaN(selectedOptionIndexNum) ||
      selectedOptionIndexNum < 0 ||
      selectedOptionIndexNum >= callOptions.length
    ) {
      alert("Invalid option selected.");
      return;
    }

    const selectedOption = callOptions[selectedOptionIndexNum];

    if (!selectedOption) {
      console.error("Selected option does not exist.");
      return;
    }

    if (selectedOption.buyer !== accountId) {
      alert("You do not own this option.");
      return;
    }

    // Check if the option has expired
    const currentTime = new Date().toISOString();
    if (currentTime > selectedOption.expiry) {
      alert("This option has expired.");
      return;
    }

    try {
      // Exercise the option using the external function
      await exerciseOptionFcn(
        walletData,
        selectedOption.token,
        accountId,
        selectedOption.seller,
        selectedOption.strike,
        selectedOption.amount
      );

      // Remove the exercised option from the state
      const updatedOptions = callOptions.filter(
        (_, index) => index !== selectedOptionIndexNum
      );
      setCallOptions(updatedOptions);

      alert("Option exercised successfully!");
      console.log("Updated Call Options:", updatedOptions);
    } catch (error) {
      console.error("Error exercising option:", error);
      alert("An error occurred while exercising the option. Please try again.");
    }
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
        <div>
          <label htmlFor="seller">
            Seller Account ID (optional: testing only):{" "}
          </label>
          <input
            id="seller"
            type="text"
            value={seller}
            onChange={(e) => setSeller(e.target.value)}
            placeholder={accountId || "Connected wallet ID"}
          />
        </div>
        <button onClick={addCallOption}>Add Call Option</button>
      </div>

      <div>
        <h2>Buy a Call Option</h2>
        <div>
          <label htmlFor="options">Select Call Option: </label>
          <select
            id="options"
            value={selectedOptionIndex}
            onChange={(e) => setSelectedOptionIndex(e.target.value)}
          >
            <option value="">-- Select an Option --</option>
            {callOptions.map((option, index) => (
              <option key={index} value={index}>
                Option {index + 1} - Token: {option.token}, Amount:{" "}
                {option.amount}
              </option>
            ))}
          </select>
        </div>
        <button onClick={handleBuyOption}>Buy Option</button>
      </div>

      <div>
        <h2>Exercise a Call Option</h2>
        <div>
          <label htmlFor="owned-options">Select Owned Option: </label>
          <select
            id="owned-options"
            value={selectedOptionIndex}
            onChange={(e) => setSelectedOptionIndex(e.target.value)}
          >
            <option value="">-- Select an Option --</option>
            {callOptions
              .filter((option) => option.buyer === accountId)
              .map((option, index) => (
                <option key={index} value={index}>
                  Option {index + 1} - Token: {option.token}, Amount:{" "}
                  {option.amount}
                </option>
              ))}
          </select>
        </div>
        <button onClick={exerciseOption}>Exercise Option</button>
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
