"use client"

import { useEffect, useState, useContext } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { getNftsOwned } from '@/api/user'
import { exerciseOption } from '@/api/actions'
import { WalletContext } from "../components/WalletProvider.jsx";
import ErrorScreen from '../components/ErrorScreen.jsx'
import LoadingScreen from '../components/LoadingScreen.jsx'
import SuccessPage from "../components/success-page.jsx";
import { signExerciseTx } from '../components/hedera/signTx.js'

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
      return
    }

    async function fetchOptions() {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getNftsOwned(accountId, '0.0.5275656')
        const metadata = data.data || {}
        const serials = Object.keys(metadata)

        if (serials.length === 0) {
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

        setHasFetchedOptions(true)
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

    setIsLoading(true);

    const selectedOption = options[index];
    try {
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
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  if (error) {
    return <ErrorScreen message={error} />
  }

  if (isSuccess) {
    return <SuccessPage message="You have exercised an option!" onBack={() => setIsSuccess(false)} />;
  }

  return (
    <div
      className={
        // Reduced padding on mobile, larger on md+
        "min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4 md:p-8"
      }
    >
      <motion.h1
        // Smaller text on mobile, larger on md+
        className="text-2xl md:text-4xl font-bold mb-8 text-center text-white"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Your Vault
      </motion.h1>
      <div
        className={
          // On mobile: full width, stacked layout; on md+: width is half, gap is larger
          "flex flex-col w-full md:w-1/2 mx-auto gap-4 md:gap-8 justify-center"
        }
      >
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-gray-800 border-purple-500">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl font-bold text-white">Your Options</CardTitle>
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
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                        <span className="text-lg md:text-xl font-bold text-white">{option.tokenId}</span>
                        <span
                          className={`text-sm mt-2 sm:mt-0 sm:ml-4 ${option.isCall ? 'text-green-400' : 'text-red-400'}`}
                        >
                          {option.isCall ? 'CALL' : 'PUT'}
                        </span>
                      </div>
                      {/*
                        On very small screens, a single column. On small+ screens, two columns.
                      */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-300">
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
      </div>
    </div>
  )
}