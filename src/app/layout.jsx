import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from './components/Navigation'
import { WalletProvider } from './components/WalletProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'HashCalls',
  description: 'Create, purchase, and execute options on Hedera',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex h-screen bg-gray-900">
          <WalletProvider>
            <Navigation />
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </WalletProvider>
        </div>
      </body>
    </html>
  )
}
