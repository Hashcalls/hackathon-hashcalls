import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const mockOwnedOptions = [
  { id: 1, tokenId: 'ETH', amount: 1, strikePrice: 2000, expiryDate: '2023-12-31', type: 'call' },
  { id: 2, tokenId: 'BTC', amount: 0.5, strikePrice: 30000, expiryDate: '2023-12-31', type: 'put' },
]

export default function OptionExecution() {
  return (
    (<Card className="bg-gray-800 border-green-500">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-green-400">Execute Options</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockOwnedOptions.map((option) => (
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
                  <p>Strike Price: {option.strikePrice}</p>
                  <p>Expiry: {option.expiryDate}</p>
                </div>
                <Button className="w-full mt-4 bg-green-600 hover:bg-green-700">Execute Option</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>)
  );
}

