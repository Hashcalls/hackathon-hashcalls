"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PlusCircle, ShoppingCart, Wallet } from 'lucide-react'

const navItems = [
    { name: 'Create', href: '/', icon: PlusCircle },
    { name: 'Marketplace', href: '/marketplace', icon: ShoppingCart },
    { name: 'Vault', href: '/vault', icon: Wallet },
]

export default function Navigation() {
    const pathname = usePathname()

    return (
        <nav className="w-24 bg-gray-800 flex flex-col items-center py-8">
            {navItems.map((item) => (
                <Link
                    key={item.name}
                    href={item.href}
                    className={`w-16 h-16 mb-4 flex flex-col items-center justify-center rounded-lg transition-all ${pathname === item.href
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

