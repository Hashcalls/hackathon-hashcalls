'use client'

import React from 'react'
import { motion } from 'framer-motion'

export default function ErrorScreen({ message = "An error occurred." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <motion.div
        className="relative text-6xl font-bold mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.span
          className="absolute top-0 left-0 w-full h-full"
          style={{ clipPath: 'inset(0 0 0 0)' }}
          animate={{
            clipPath: [
              'inset(0 0 0 0)',
              'inset(100% 0 0 0)',
              'inset(0 0 100% 0)',
              'inset(0 0 0 100%)',
              'inset(0 0 0 0)',
            ],
          }}
          transition={{
            duration: 1,
            ease: 'easeInOut',
            times: [0, 0.25, 0.5, 0.75, 1],
            repeat: Infinity,
            repeatDelay: 3,
          }}
        >
          Error 404
        </motion.span>
        <span className="relative z-10">Error 404</span>
      </motion.div>
      <motion.p
        className="text-xl mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        {message}
      </motion.p>
      <motion.button
        className="px-6 py-3 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => window.location.reload()}
      >
        Go Back
      </motion.button>
    </div>
  )
}

