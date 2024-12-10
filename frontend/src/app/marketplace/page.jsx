"use client"

import React, { useState, useEffect, useContext } from 'react'
import { buyOption } from '../../api/actions.js'
import { signBuyTx } from '../components/hedera/signTx.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { WalletContext } from '../components/WalletProvider.jsx'
import { getBuyableOptions } from '../../api/data.js'

export default function Marketplace() {
  const { accountId, walletData } = useContext(WalletContext)
  const [options, setOptions] = useState([])

  useEffect(() => {
    async function fetchOptions() {
      const data = await getBuyableOptions();
      setOptions(data.data);
    }
    fetchOptions();
  }, []);

  async function handleBuyOption(index) {
    if (!accountId || !walletData) {
      alert("Please connect your wallet first.")
      return
    }

    const selectedOption = options[index]
    const serialNumber = await buyOption(
      selectedOption.PK,
      accountId
    )

    const hashconnect = walletData[0]
    const saveData = walletData[1]
    const provider = hashconnect.getProvider("testnet", saveData.topic, accountId)
    const signer = hashconnect.getSigner(provider)

    const transferReceipt = await signBuyTx(
      serialNumber.data.signedTx,
      signer,
      accountId,
      selectedOption.PK,
      provider
    )
    console.log("Transfer receipt:", transferReceipt)
  }

  return (
    <Card className="bg-gray-800 border-blue-500">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-blue-400">Marketplace</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {options.map((option, index) => (
            <Card key={option.PK} className="bg-gray-700">
              <CardContent className="p-4 text-white">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-lg">{option.tokenId}</span>
                  <span
                    className={`text-sm ${option.type ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {option.type ? 'CALL' : 'PUT'}
                  </span>
                </div>
                <div className="text-sm space-y-1">
                  <p>Amount: {option.amount}</p>
                  <p>Premium: {option.premium}</p>
                  <p>Strike Price: {option.strikePrice}</p>
                  <p>Expiry: {option.expiry}</p>
                </div>
                <Button
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleBuyOption(index)}
                >
                  Buy Option
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}