import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'

const mockOptions = [
  { id: 1, tokenId: 'ETH', amount: 1, premium: 0.1, strikePrice: 2000, expiryDate: '2023-12-31', type: 'call' },
  { id: 2, tokenId: 'BTC', amount: 0.5, premium: 0.05, strikePrice: 30000, expiryDate: '2023-12-31', type: 'put' },
  { id: 3, tokenId: 'LINK', amount: 100, premium: 0.01, strikePrice: 10, expiryDate: '2023-12-31', type: 'call' },
]

export default function Marketplace() {
  return (
    (<Card className="bg-gray-800 border-blue-500">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-blue-400">Marketplace</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockOptions.map((option) => (
            <Card key={option.id} className="bg-gray-700">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-lg">{option.tokenId}</span>
                  <span
                    className={`text-sm ${option.type === 'call' ? 'text-green-400' : 'text-red-400'}`}>
                    {option.type.toUpperCase()}
                  </span>
                </div>
                <div className="text-sm space-y-1">
                  <p>Amount: {option.amount}</p>
                  <p>Premium: {option.premium}</p>
                  <p>Strike Price: {option.strikePrice}</p>
                  <p>Expiry: {option.expiryDate}</p>
                </div>
                <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">Buy Option</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>)
  );
}

