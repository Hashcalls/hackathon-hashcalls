"use client"

import { useEffect, useState, useContext } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { getNftsOwned } from '@/api/user'
import { exerciseOption } from '@/api/actions'
import { WalletContext } from "../components/WalletProvider.jsx";
import ErrorScreen from '@/app/components/ErrorScreen.jsx'
import LoadingScreen from '@/app/components/LoadingScreen.jsx'
import SuccessPage from "@/app/components/success-page.jsx";
import { signExerciseTx } from '../components/hedera/signTx.js'

const mockWrittenNFTs = [
  // { id: 1, name: 'CryptoPunk #3100', tokenId: 'PUNK3100', price: 5, expiryDate: '2023-12-31' },
  // { id: 2, name: 'Bored Ape #7495', tokenId: 'BAYC7495', price: 10, expiryDate: '2024-01-31' },
  // { id: 3, name: 'Azuki #9361', tokenId: 'AZUKI9361', price: 3, expiryDate: '2023-11-30' },
]

const mockEarnings = {
  // total: 25.5,
  // thisMonth: 7.2,
  // pendingClaims: 3.1,
}

export default function VaultPage() {
  const { accountId, walletData } = useContext(WalletContext)
  const [options, setOptions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [hasFetchedOptions, setHasFetchedOptions] = useState(false)

  useEffect(() => {
    if (!accountId && !hasFetchedOptions) {
      setError("Please connect your wallet first.")
      setIsLoading(false)
      return
    }

    if (!accountId && hasFetchedOptions) {
      // If we previously fetched options successfully, do nothing here.
      // Don't revert to "connect your wallet" error.
      return
    }

    async function fetchOptions() {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getNftsOwned(accountId, '0.0.5275656')
        console.log("Fetched options:", data)

        const metadata = data.data || {}
        const serials = Object.keys(metadata)

        if (serials.length === 0) {
          // No NFTs, no error
          setOptions([])
        } else {
          const fetchedOptions = serials.map((serial) => {
            const meta = metadata[serial]
            if (!meta) return null
            return {
              PK: meta.PK,
              tokenId: meta.tokenId,
              isCall: meta.isCall,
              amount: meta.amount,
              strikePrice: meta.strikePrice,
              expiryDate: meta.expiry,
              buyerNftSerial: meta.buyerNftSerial
            }
          }).filter(Boolean)
          setOptions(fetchedOptions)
        }

        setHasFetchedOptions(true) // Mark that we have successfully fetched
      } catch (err) {
        console.error("Error fetching options:", err)
        setError("Failed to load options. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    if (accountId) {
      fetchOptions()
    }

  }, [accountId, hasFetchedOptions])


  async function handleExcerciseOption(index) {
    if (!accountId || !walletData) {
      return setError("Failure. Please connect wallet")
    }

    const selectedOption = options[index];
    try {
      // Call your lambda/function to initiate exercise, passing needed params
      const transaction = await exerciseOption(
        selectedOption.tokenId,
        selectedOption.buyerNftSerial,
        accountId,
        selectedOption.strikePrice,
        selectedOption.amount,
        selectedOption.PK,
        selectedOption.isCall
      );

      const hashconnect = walletData[0]
      const saveData = walletData[1]
      const provider = hashconnect.getProvider("testnet", saveData.topic, accountId)
      const signer = hashconnect.getSigner(provider)

      // Sign and submit the transaction
      await signExerciseTx(
        transaction.data.signedTx,
        signer,
        provider,
        selectedOption.buyerNftSerial,
        selectedOption.PK

      )


      setIsSuccess(true);

    } catch (error) {
      console.error("Error exercising option:", error);
      setError("Failed to exercise option. Please try again.")
    }
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  if (error) {
    return <ErrorScreen message={error} />
  }

  if (isSuccess) {
    return <SuccessPage message="You have exercised an option!" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-8">
      <motion.h1
        className="text-4xl font-bold mb-8 text-center text-white"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Your Vault
      </motion.h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-gray-800 border-purple-500">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white">Your Options</CardTitle>
            </CardHeader>
            <CardContent>
              {options.map((option, index) => (
                <motion.div
                  key={option.PK}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="mb-4 bg-gray-700 border-indigo-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xl font-bold text-white">{option.tokenId}</span>
                        <span
                          className={`text-sm ${option.isCall ? 'text-green-400' : 'text-red-400'}`}
                        >
                          {option.isCall ? 'CALL' : 'PUT'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-gray-300">
                        <div>
                          <p className="font-semibold">Amount:</p>
                          <p>{option.amount}</p>
                        </div>
                        <div>
                          <p className="font-semibold">Strike Price:</p>
                          <p>{option.strikePrice}</p>
                        </div>
                        <div>
                          <p className="font-semibold">Expiry Date:</p>
                          <p>{option.expiryDate}</p>
                        </div>
                        <div>
                          <p className="font-lighter text-xs">serials:</p>
                          <p>BuyerNftSerial: {option.buyerNftSerial} WriterNftSerial: {option.PK}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleExcerciseOption(index)}
                        className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 transition-colors"
                      >
                        Exercise Option
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="bg-gray-800 border-blue-500">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white">Written NFTs</CardTitle>
              </CardHeader>
              <CardContent>
                {mockWrittenNFTs.map((nft, index) => (
                  <motion.div
                    key={nft.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="mb-4 bg-gray-700 border-blue-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xl font-bold text-white">{nft.name}</span>
                          <span className="text-sm text-gray-400">{nft.tokenId}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-gray-300">
                          <div>
                            <p className="font-semibold">Price:</p>
                            <p>{nft.price} ETH</p>
                          </div>
                          <div>
                            <p className="font-semibold">Expiry Date:</p>
                            <p>{nft.expiryDate}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {/* <Card className="bg-gray-800 border-green-500">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white">Your Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-gray-300">
                  <div>
                    <p className="font-semibold">Total Earnings:</p>
                    <p className="text-2xl text-green-400">{mockEarnings.total} ETH</p>
                  </div>
                  <div>
                    <p className="font-semibold">This Month:</p>
                    <p className="text-2xl text-green-400">{mockEarnings.thisMonth} ETH</p>
                  </div>
                  <div>
                    <p className="font-semibold">Pending Claims:</p>
                    <p className="text-2xl text-yellow-400">{mockEarnings.pendingClaims} ETH</p>
                  </div>
                </div>
                <Button className="w-full mt-6 bg-green-600 hover:bg-green-700 transition-colors">
                  Claim Earnings
                </Button>
              </CardContent>
            </Card> */}
          </motion.div>
        </div>
      </div>
    </div>
  )
}