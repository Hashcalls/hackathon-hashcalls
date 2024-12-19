'use client'

import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function SuccessPage({ message = "Your action has been completed successfully.", onBack }) {
  return (
    (<div
      className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-8 shadow-2xl max-w-md w-full">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex justify-center mb-6">
          <CheckCircle className="text-green-400 w-24 h-24" />
        </motion.div>
        <h1 className="text-4xl font-bold text-center text-white mb-4">Success!</h1>
        <p className="text-xl text-center text-gray-200 mb-8">
          {message}
        </p>
        <div className="flex justify-center">
          <button
            onClick={onBack}
            className="bg-white text-purple-600 font-semibold py-3 px-6 rounded-full"
          >
            Back to Home
          </button>
        </div>
      </motion.div>
      <CircuitAnimation />
    </div>)
  );
}

function CircuitAnimation() {
  return (
    (<svg
      className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
      xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern
          id="circuit-pattern"
          x="0"
          y="0"
          width="100"
          height="100"
          patternUnits="userSpaceOnUse">
          <motion.path
            d="M10 10 L90 10 L90 90 L10 90 Z"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }} />
          <motion.circle
            cx="50"
            cy="50"
            r="5"
            fill="white"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
        </pattern>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#circuit-pattern)" />
    </svg>)
  );
}

