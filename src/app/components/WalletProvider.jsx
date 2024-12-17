"use client";

import React, { createContext, useState } from 'react';
import walletConnectFcn from './hedera/walletConnect.js';

export const WalletContext = createContext();

export function WalletProvider({ children }) {
    const [walletData, setWalletData] = useState(null);
    const [accountId, setAccountId] = useState(null);
    const [connectTextSt, setConnectTextSt] = useState("🔌 Connect here...");
    const [connectLinkSt, setConnectLinkSt] = useState("");

    async function connectWallet() {
        if (accountId) {
            setConnectTextSt(`🔌 Account ${accountId} already connected ⚡ ✅`);
        } else {
            const wData = await walletConnectFcn();
            wData[0].pairingEvent.once((pairingData) => {
                pairingData.accountIds.forEach((id) => {
                    setAccountId(id);
                    setConnectTextSt(`🔌 Account ${id} connected ⚡ ✅`);
                    setConnectLinkSt(`https://hashscan.io/#/testnet/account/${id}`);
                });
            });
            setWalletData(wData);
        }
    }

    return (
        <WalletContext.Provider value={{ walletData, accountId, connectTextSt, connectLinkSt, connectWallet }}>
            {children}
        </WalletContext.Provider>
    );
}