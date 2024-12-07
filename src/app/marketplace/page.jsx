"use client"

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const mockOptions = [
  { id: 1, tokenId: 'ETH', amount: 1, premium: 0.1, strikePrice: 2000, expiryDate: '2023-12-31', type: 'call' },
  { id: 2, tokenId: 'BTC', amount: 0.5, premium: 0.05, strikePrice: 30000, expiryDate: '2023-12-31', type: 'put' },
  { id: 3, tokenId: 'LINK', amount: 100, premium: 0.01, strikePrice: 10, expiryDate: '2023-12-31', type: 'call' },
  { id: 4, tokenId: 'UNI', amount: 50, premium: 0.02, strikePrice: 5, expiryDate: '2023-12-31', type: 'put' },
]

export default function MarketplacePage() {
  return (
    (<div
      className="min-h-screen bg-gradient-to-br from-blue-900 via-teal-900 to-green-900 p-8">
      <motion.h1
        className="text-4xl font-bold mb-8 text-center text-white"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}>
        Options Marketplace
      </motion.h1>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}>
        {mockOptions.map((option, index) => (
          <motion.div
            key={option.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}>
            <Card className="bg-gray-800 border-teal-500 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold text-white">{option.tokenId}</span>
                  <span
                    className={`text-sm px-2 py-1 rounded ${option.type === 'call' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {option.type.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-2 text-gray-300">
                  <p>Amount: {option.amount}</p>
                  <p>Premium: {option.premium}</p>
                  <p>Strike Price: {option.strikePrice}</p>
                  <p>Expiry: {option.expiryDate}</p>
                </div>
                <Button className="w-full mt-4 bg-teal-600 hover:bg-teal-700 transition-colors">
                  Buy Option
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>)
  );
}

