"use client";

import React, { useContext } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PlusCircle, ShoppingCart, Wallet } from 'lucide-react'
import { WalletContext } from './WalletProvider'

const navItems = [
    { name: 'Create', href: '/', icon: PlusCircle },
    { name: 'Marketplace', href: '/marketplace', icon: ShoppingCart },
    { name: 'Vault', href: '/vault', icon: Wallet },
]

export default function Navigation() {
    const pathname = usePathname()
    const { connectWallet, connectLinkSt, connectTextSt } = useContext(WalletContext)

    return (
        <nav className="w-36 bg-gray-800 flex flex-col items-center">
            {connectLinkSt && (
                <a
                    href={connectLinkSt}
                    target="_blank"
                    rel="noreferrer"
                    className="text-white text-xs mt-2 underline"
                >
                    View on HashScan
                </a>
            )}
            <button
                onClick={connectWallet}
                className="mt-4 px-3 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 text-xs text-center mb-8"
            >
                {connectTextSt}
            </button>

            {navItems.map((item) => (
                <Link
                    key={item.name}
                    href={item.href}
                    className={`w-36 h-16 mb-4 flex flex-col items-center justify-center rounded-lg transition-all ${pathname === item.href
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                >
                    <item.icon className="w-8 h-8 mb-1" />
                    <span className="text-xs">{item.name}</span>
                </Link>
            ))}
        </nav>
    )
}