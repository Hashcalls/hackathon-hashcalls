import React, { useState } from "react";
import walletConnectFcn from "./components/hedera/walletConnect.js";
import "./styles/App.css";
import { exerciseCallOptionFcn } from "./components/hedera/exerciseCallOption.js";
import { exercisePutOptionFcn } from "./components/hedera/exercisePut.js";
import { buyOptionFcn } from "./components/hedera/buyOption.js";
import { writeCallFcn } from "./components/hedera/writeCall.js";
import { writePutFcn } from "./components/hedera/writePut.js";

function App() {
  // State for connected wallet
  const [walletData, setWalletData] = useState();
  const [accountId, setAccountId] = useState();
  const [connectTextSt, setConnectTextSt] = useState("🔌 Connect here...");
  const [connectLinkSt, setConnectLinkSt] = useState("");

  //State for call options
  const [callOptions, setCallOptions] = useState([]);
  const [token, setToken] = useState("");
  const [amount, setAmount] = useState("");
  const [premium, setPremium] = useState("");
  const [strike, setStrike] = useState("");
  const [expiry, setExpiry] = useState("");

  const [selectedCallIndex, setselectedCallIndex] = useState("");

  // States for Put Options
  const [putOptions, setPutOptions] = useState([]);
  const [putToken, setPutToken] = useState("");
  const [putAmount, setPutAmount] = useState("");;
  const [putPremium, setPutPremium] = useState("");
  const [putStrike, setPutStrike] = useState("");
  const [putExpiry, setPutExpiry] = useState("");
  const [selectedPutIndex, setSelectedPutIndex] = useState("");

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
    const writerNftSerial = await writeCallFcn(walletData, accountId, token, amount);
    const newCallOption = {
      token,
      amount,
      premium,
      strike,
      expiry,
      buyer: null,
      nftSerial: null,
      writerNftSerial: writerNftSerial,
    };

    // Escrow the toke

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

  async function addPutOption() {
    const writerNftSerial = await writePutFcn(walletData, accountId, putStrike);
    const newPutOption = {
      token: putToken,
      amount: putAmount,
      premium: putPremium,
      strike: putStrike,
      expiry: putExpiry,
      buyer: null,
      nftSerial: null,
      writerNftSerial: writerNftSerial,
    };

    // Update the Put Options State
    const updatedPutOptions = [...putOptions, newPutOption];
    setPutOptions(updatedPutOptions);

    // Log all current put options
    console.log("Current Put Options:", updatedPutOptions);

    // Clear the input fields
    setPutToken("");
    setPutAmount("");
    setPutPremium("");
    setPutStrike("");
    setPutExpiry("");

  }

  async function buyCallOption() {
    if (selectedCallIndex === "") {
      alert("Please select a call option to buy.");
      return;
    }

    const selectedCallIndexNum = parseInt(selectedCallIndex, 10);
    const selectedOption = callOptions[selectedCallIndexNum];
    console.log("Selected Option:", selectedOption);

    if (selectedOption.buyer) {
      console.log("This option is already owned by:", selectedOption.buyer);
      alert("This option has already been purchased.");
      return;
    }

    const serialNumber = await buyOptionFcn(
      walletData,
      accountId,
      selectedOption.premium,
      selectedOption.writerNftSerial
    );
    console.log(serialNumber);

    // Update the buyer of the selected call option
    const updatedOptions = [...callOptions];
    updatedOptions[selectedCallIndexNum] = {
      ...selectedOption,
      buyer: accountId, // Set the buyer to the current wallet
      nftSerial: serialNumber,
    };

    setCallOptions(updatedOptions);

    // Log the updated state
    console.log("Updated Call Options:", updatedOptions);
    console.log(
      `Option ${selectedCallIndexNum + 1} purchased by: ${accountId}`
    );
  }

  async function buyPutOption() {
    if (selectedPutIndex === "") {
      alert("Please select a put option to buy.");
      return;
    }

    const selectedPutIndexNum = parseInt(selectedPutIndex, 10);
    const selectedOption = putOptions[selectedPutIndexNum];
    console.log("Selected Put Option:", selectedOption);

    if (selectedOption.buyer) {
      console.log("This put option is already owned by:", selectedOption.buyer);
      alert("This put option has already been purchased.");
      return;
    }

    try {
      const serialNumber = await buyOptionFcn(
        walletData,
        accountId,
        selectedOption.premium,
        selectedOption.writerNftSerial
      );
      console.log("NFT Serial Number:", serialNumber);

      // Update the buyer of the selected put option
      const updatedOptions = [...putOptions];
      updatedOptions[selectedPutIndexNum] = {
        ...selectedOption,
        buyer: accountId,
        nftSerial: serialNumber,
      };

      setPutOptions(updatedOptions);

      // Log the updated state
      console.log("Updated Put Options:", updatedOptions);
      console.log(
        `Put Option ${selectedPutIndexNum + 1} purchased by: ${accountId}`
      );
      alert("Put Option purchased successfully!");
    } catch (error) {
      console.error("Error purchasing put option:", error);
      alert(
        "An error occurred while purchasing the put option. Please try again."
      );
    }
  }

  async function exerciseCallOption() {
    if (selectedCallIndex === "") {
      alert("Please select an option to exercise.");
      return;
    }

    const selectedCallIndexNum = parseInt(selectedCallIndex, 10);

    if (
      isNaN(selectedCallIndexNum) ||
      selectedCallIndexNum < 0 ||
      selectedCallIndexNum >= callOptions.length
    ) {
      alert("Invalid option selected.");
      return;
    }

    const selectedOption = callOptions[selectedCallIndexNum];

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
      await exerciseCallOptionFcn(
        walletData,
        selectedOption.token,
        selectedOption.nftSerial,
        accountId,
        selectedOption.strike,
        selectedOption.amount,
        selectedOption.writerNftSerial
      );

      // Remove the exercised option from the state
      const updatedOptions = callOptions.filter(
        (_, index) => index !== selectedCallIndexNum
      );
      setCallOptions(updatedOptions);

      alert("Option exercised successfully!");
      console.log("Updated Call Options:", updatedOptions);
    } catch (error) {
      console.error("Error exercising option:", error);
      alert("An error occurred while exercising the option. Please try again.");
    }
  }
  async function exercisePutOption() {
    if (selectedPutIndex === "") {
      alert("Please select an option to exercise.");
      return;
    }

    const selectedPutIndexNum = parseInt(selectedPutIndex, 10);

    if (
      isNaN(selectedPutIndexNum) ||
      selectedPutIndexNum < 0 ||
      selectedPutIndexNum >= putOptions.length
    ) {
      alert("Invalid option selected.");
      return;
    }

    const selectedOption = putOptions[selectedPutIndexNum];

    if (!selectedOption) {
      console.error("Selected option does not exist.");
      return;
    }

    // if (selectedOption.buyer !== accountId) {
    //   alert("You do not own this option.");
    //   return;
    // }

    // Check if the option has expired
    const currentTime = new Date().toISOString();
    if (currentTime > selectedOption.expiry) {
      alert("This option has expired.");
      return;
    }

    try {
      // Exercise the put option using the external function
      await exercisePutOptionFcn(
        walletData,
        selectedOption.token,
        selectedOption.nftSerial,
        accountId, // Buyer
        selectedOption.strike,
        selectedOption.amount,
        selectedOption.writerNftSerial
      );

      // Remove the exercised option from the state
      const updatedOptions = putOptions.filter(
        (_, index) => index !== selectedPutIndexNum
      );
      setPutOptions(updatedOptions);

      alert("Put option exercised successfully!");
      console.log("Updated Put Options:", updatedOptions);
    } catch (error) {
      console.error("Error exercising put option:", error);
      alert(
        "An error occurred while exercising the put option. Please try again."
      );
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
        {/* Call  Options Section */}
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

      <div>
        <h2>Buy a Call Option</h2>
        <div>
          <label htmlFor="options">Select Call Option: </label>
          <select
            id="options"
            value={selectedCallIndex}
            onChange={(e) => setselectedCallIndex(e.target.value)}
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
        <button onClick={buyCallOption}>Buy Option</button>
      </div>

      <div>
        <h2>Exercise a Call Option</h2>
        <div>
          <label htmlFor="owned-options">Select Owned Option: </label>
          <select
            id="owned-options"
            value={selectedCallIndex}
            onChange={(e) => setselectedCallIndex(e.target.value)}
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
        <button onClick={exerciseCallOption}>Exercise Option</button>
      </div>

      {/* Put Options Section */}
      <div>
        <h2>Create a Put Option</h2>
        {/* Form Fields */}
        <div>
          <label htmlFor="putToken">Token: </label>
          <input
            id="putToken"
            type="text"
            value={putToken}
            onChange={(e) => setPutToken(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="putAmount">Amount: </label>
          <input
            id="putAmount"
            type="number"
            value={putAmount}
            onChange={(e) => setPutAmount(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="putPremium">Premium: </label>
          <input
            id="putPremium"
            type="number"
            value={putPremium}
            onChange={(e) => setPutPremium(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="putStrike">Strike Price: </label>
          <input
            id="putStrike"
            type="number"
            value={putStrike}
            onChange={(e) => setPutStrike(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="putExpiry">Expiry Date: </label>
          <input
            id="putExpiry"
            type="datetime-local"
            value={putExpiry}
            onChange={(e) => setPutExpiry(e.target.value)}
          />
        </div>
        <button onClick={addPutOption}>Add Put Option</button>
      </div>
      <div>
        <h2>Buy a Put Option</h2>
        <div>
          <label htmlFor="put-options">Select Put Option: </label>
          <select
            id="put-options"
            value={selectedPutIndex}
            onChange={(e) => setSelectedPutIndex(e.target.value)}
          >
            <option value="">-- Select an Option --</option>
            {putOptions.map((option, index) => (
              <option key={index} value={index}>
                Put Option {index + 1} - Token: {option.token}, Amount:{" "}
                {option.amount}
              </option>
            ))}
          </select>
        </div>
        <button onClick={buyPutOption}>Buy Put Option</button>
      </div>

      <div>
        <h2>Exercise a Put Option</h2>
        <div>
          <label htmlFor="owned-put-options">Select Owned Put Option: </label>
          <select
            id="owned-put-options"
            value={selectedPutIndex}
            onChange={(e) => setSelectedPutIndex(e.target.value)}
          >
            <option value="">-- Select an Option --</option>
            {putOptions
              .filter((option) => option.buyer === accountId)
              .map((option, index) => (
                <option key={index} value={index}>
                  Put Option {index + 1} - Token: {option.token}, Amount:{" "}
                  {option.amount}
                </option>
              ))}
          </select>
        </div>
        <button onClick={exercisePutOption}>Exercise Put Option</button>
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
