"use client"

import React, { useState, useEffect, useContext } from 'react'
import { buyOption } from '../../api/actions.js'
import { signBuyTx } from '../components/hedera/signTx.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { WalletContext } from '../components/WalletProvider.jsx'
import { getBuyableOptions } from '../../api/data.js'
import ErrorScreen from '@/app/components/ErrorScreen.jsx'
import LoadingScreen from '@/app/components/LoadingScreen.jsx'
import SuccessPage from "@/app/components/success-page.jsx";


export default function Marketplace() {
  const { accountId, walletData } = useContext(WalletContext)
  const [options, setOptions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchOptions() {
      try {
        setIsLoading(true)
        const data = await getBuyableOptions()
        setOptions(data.data)
      } catch (err) {
        console.error("Error fetching options:", err)
        setError("Failed to load options. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchOptions()
  }, [])

  async function handleBuyOption(index) {
    if (!accountId || !walletData) {
      alert("Please connect your wallet first.")
      return
    }

    const selectedOption = options[index]
    try {
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
      return <SuccessPage />

    } catch (err) {
      setError("Failed to buy option. Please try again.", err)
    }
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  if (error) {
    return <ErrorScreen message={error} />
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
                    className={`text-sm ${option.isCall ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {option.isCall ? 'CALL' : 'PUT'}
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