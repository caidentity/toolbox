'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const OwnershipCalculator = () => {
  // Initial ownership inputs
  const [ownershipType, setOwnershipType] = useState<'percentage' | 'shares'>('percentage');
  const [sharesOwned, setSharesOwned] = useState(10000);
  const [totalShares, setTotalShares] = useState(1000000);
  const [ownershipPercentage, setOwnershipPercentage] = useState(10);
  const [currentRound, setCurrentRound] = useState('pre-seed');

  // Exit projection inputs
  const [exitValue, setExitValue] = useState(1000000);
  const [exitRound, setExitRound] = useState('seed');

  const rounds = {
    'pre-seed': { name: 'Pre-seed', dilution: 15 },
    seed: { name: 'Seed', dilution: 20 },
    seriesA: { name: 'Series A', dilution: 20 },
    seriesB: { name: 'Series B', dilution: 15 },
    seriesC: { name: 'Series C', dilution: 12 },
    seriesD: { name: 'Series D', dilution: 12 },
    seriesE: { name: 'Series E', dilution: 12 },
    seriesF: { name: 'Series F', dilution: 12 }
  };

  // Format large numbers with B/M suffix
  const formatValue = (value: number) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${(value / 1000).toFixed(1)}K`;
  };

  // Calculate ownership percentage from shares
  const calculatePercentage = () => {
    return (sharesOwned / totalShares) * 100;
  };

  // Calculate dilution between current round and exit round
  const calculateRoundDilution = () => {
    let ownership = ownershipType === 'percentage' ? ownershipPercentage : calculatePercentage();
    const roundOrder = Object.keys(rounds);
    const currentIndex = roundOrder.indexOf(currentRound);
    const exitIndex = roundOrder.indexOf(exitRound);
    
    for (let i = currentIndex + 1; i <= exitIndex; i++) {
      const roundDilution = rounds[roundOrder[i]].dilution;
      ownership = ownership * (1 - roundDilution / 100);
    }
    
    return ownership;
  };

  const results = {
    initialOwnership: ownershipType === 'percentage' ? ownershipPercentage : calculatePercentage(),
    finalOwnership: calculateRoundDilution(),
    currentValue: ((ownershipType === 'percentage' ? ownershipPercentage : calculatePercentage()) / 100) * exitValue,
    dilutedValue: (calculateRoundDilution() / 100) * exitValue
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Ownership Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Initial Ownership Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Current Ownership</h3>
            <Tabs defaultValue="percentage" onValueChange={(v) => setOwnershipType(v as 'percentage' | 'shares')}>
              <TabsList>
                <TabsTrigger value="percentage">Percentage</TabsTrigger>
                <TabsTrigger value="shares">Share Count</TabsTrigger>
              </TabsList>
              
              <TabsContent value="percentage">
                <div>
                  <Label htmlFor="ownership">Ownership Percentage (%)</Label>
                  <Input
                    id="ownership"
                    type="number"
                    value={ownershipPercentage}
                    onChange={(e) => setOwnershipPercentage(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </TabsContent>

              <TabsContent value="shares">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sharesOwned">Shares Owned</Label>
                    <Input
                      id="sharesOwned"
                      type="number"
                      value={sharesOwned}
                      onChange={(e) => setSharesOwned(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalShares">Total Shares Outstanding</Label>
                    <Input
                      id="totalShares"
                      type="number"
                      value={totalShares}
                      onChange={(e) => setTotalShares(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div>
              <Label>Current Round</Label>
              <Select value={currentRound} onValueChange={setCurrentRound}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(rounds).map(([key, round]) => (
                    <SelectItem key={key} value={key}>
                      {round.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Exit Projection Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Exit Projection</h3>
            <div>
              <Label>Exit Value ({formatValue(exitValue)})</Label>
              <Slider
                value={[exitValue]}
                min={100000}
                max={20000000000}
                step={100000}
                onValueChange={(value) => setExitValue(value[0])}
                className="my-2"
              />
            </div>

            <div>
              <Label>Exit Round</Label>
              <Select value={exitRound} onValueChange={setExitRound}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(rounds).map(([key, round]) => (
                    <SelectItem key={key} value={key}>
                      {round.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Section */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Results</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left border">Metric</th>
                  <th className="p-2 text-left border">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border">Current Ownership</td>
                  <td className="p-2 border">{results.initialOwnership.toFixed(2)}%</td>
                </tr>
                <tr>
                  <td className="p-2 border">Current Value</td>
                  <td className="p-2 border">{formatValue(results.currentValue)}</td>
                </tr>
                <tr>
                  <td className="p-2 border">Post-Dilution Ownership</td>
                  <td className="p-2 border">{results.finalOwnership.toFixed(2)}%</td>
                </tr>
                <tr>
                  <td className="p-2 border">Exit Value</td>
                  <td className="p-2 border">{formatValue(results.dilutedValue)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnershipCalculator; 