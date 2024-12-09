"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Label } from '@/app/components/ui/label'
import { Input } from '@/app/components/ui/input'
import { Button } from '@/app/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'

export default function OptionCreation() {
  const [optionType, setOptionType] = useState('call')

  return (
    (<Card className="bg-gray-800 border-purple-500">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-purple-400">Create Option</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token-id">Token ID</Label>
            <Input id="token-id" placeholder="Enter token ID" className="bg-gray-700" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              className="bg-gray-700" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="premium">Premium</Label>
            <Input
              id="premium"
              type="number"
              placeholder="Enter premium"
              className="bg-gray-700" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="strike-price">Strike Price</Label>
            <Input
              id="strike-price"
              type="number"
              placeholder="Enter strike price"
              className="bg-gray-700" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiry-date">Expiry Date</Label>
            <Input id="expiry-date" type="date" className="bg-gray-700" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="option-type">Option Type</Label>
            <Select onValueChange={(value) => setOptionType(value)}>
              <SelectTrigger className="bg-gray-700">
                <SelectValue placeholder="Select option type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="put">Put</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full bg-purple-600 hover:bg-purple-700">Create Option</Button>
        </form>
      </CardContent>
    </Card>)
  );
}

