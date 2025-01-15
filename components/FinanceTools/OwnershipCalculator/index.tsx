'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { CustomSlider } from '@/components/ui/Slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import "./OwnershipCalculator.scss";

// Define the round type and order
type RoundKey = 'pre-seed' | 'seed' | 'seriesA' | 'seriesB' | 'seriesC' | 'seriesD' | 'seriesE' | 'seriesF';

const roundOrder: RoundKey[] = [
  'pre-seed',
  'seed',
  'seriesA',
  'seriesB',
  'seriesC',
  'seriesD',
  'seriesE',
  'seriesF'
] as const;

const rounds = {
  'pre-seed': { name: 'Pre-seed', dilution: 15 },
  seed: { name: 'Seed', dilution: 20 },
  seriesA: { name: 'Series A', dilution: 20 },
  seriesB: { name: 'Series B', dilution: 15 },
  seriesC: { name: 'Series C', dilution: 12 },
  seriesD: { name: 'Series D', dilution: 12 },
  seriesE: { name: 'Series E', dilution: 12 },
  seriesF: { name: 'Series F', dilution: 12 }
} as const;

const OwnershipCalculator = () => {
  // Initial ownership inputs with proper typing
  const [ownershipType, setOwnershipType] = useState<'percentage' | 'shares'>('percentage');
  const [sharesOwned, setSharesOwned] = useState(10000);
  const [totalShares, setTotalShares] = useState(1000000);
  const [ownershipPercentage, setOwnershipPercentage] = useState(10);
  const [currentRound, setCurrentRound] = useState<RoundKey>('pre-seed');
  const [exitRound, setExitRound] = useState<RoundKey>('seed');

  // Exit projection inputs
  const [exitValue, setExitValue] = useState(1000000);

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
  const calculateRoundDilution = (): number => {
    let ownership = ownershipType === 'percentage' ? ownershipPercentage : calculatePercentage();
    
    const currentIndex = roundOrder.indexOf(currentRound);
    const exitIndex = roundOrder.indexOf(exitRound);
    
    // Only calculate dilution for rounds after current round up to exit round
    for (let i = currentIndex + 1; i <= exitIndex; i++) {
      const round = roundOrder[i];
      const roundDilution = rounds[round].dilution;
      // Apply dilution formula: new ownership = current ownership * (1 - dilution%)
      ownership *= (1 - roundDilution / 100);
    }
    
    return ownership;
  };

  const results = {
    initialOwnership: ownershipType === 'percentage' ? ownershipPercentage : calculatePercentage(),
    finalOwnership: calculateRoundDilution(),
    currentValue: ((ownershipType === 'percentage' ? ownershipPercentage : calculatePercentage()) / 100) * exitValue,
    dilutedValue: (calculateRoundDilution() / 100) * exitValue
  };

  // Type-safe handler for round selection
  const handleRoundChange = (value: string) => {
    // Verify the value is a valid RoundKey before setting state
    if (isRoundKey(value)) {
      setCurrentRound(value);
    }
  };

  const handleExitRoundChange = (value: string) => {
    if (isRoundKey(value)) {
      setExitRound(value);
    }
  };

  // Type guard to ensure string is a valid RoundKey
  const isRoundKey = (value: string): value is RoundKey => {
    return roundOrder.includes(value as RoundKey);
  };

  // Type-safe handler for tab changes
  const handleOwnershipTypeChange = (value: 'percentage' | 'shares') => {
    setOwnershipType(value);
    // Reset values when switching tabs
    if (value === 'percentage') {
      setOwnershipPercentage(calculatePercentage());
    } else {
      // When switching to shares, maintain the same percentage
      const newTotalShares = 1000000; // Default total shares
      const newSharesOwned = Math.round((ownershipPercentage / 100) * newTotalShares);
      setTotalShares(newTotalShares);
      setSharesOwned(newSharesOwned);
    }
  };

  return (
    <div className="ownership-calculator">
      {/* Sidebar */}
      <div className="sidebar">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Ownership Calculator</CardTitle>
            <CardDescription>
              Calculate your ownership dilution across different funding rounds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Current Ownership Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Current Ownership</h3>
              <Tabs 
                defaultValue="percentage" 
                value={ownershipType}
                onValueChange={handleOwnershipTypeChange}
              >
                <TabsList>
                  <TabsTrigger value="percentage">Percentage</TabsTrigger>
                  <TabsTrigger value="shares">Share Count</TabsTrigger>
                </TabsList>
                
                <TabsContent value="percentage">
                  <div className="space-y-2">
                    <Label htmlFor="ownership">Ownership Percentage (%)</Label>
                    <Input
                      id="ownership"
                      type="number"
                      min={0}
                      max={100}
                      value={ownershipPercentage}
                      onChange={(e) => {
                        const value = Math.min(100, Math.max(0, Number(e.target.value)));
                        setOwnershipPercentage(value);
                      }}
                      className="w-full"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="shares">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sharesOwned">Shares Owned</Label>
                      <Input
                        id="sharesOwned"
                        type="number"
                        min={0}
                        value={sharesOwned}
                        onChange={(e) => {
                          const value = Math.max(0, Number(e.target.value));
                          setSharesOwned(value);
                        }}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalShares">Total Shares Outstanding</Label>
                      <Input
                        id="totalShares"
                        type="number"
                        min={1}
                        value={totalShares}
                        onChange={(e) => {
                          const value = Math.max(1, Number(e.target.value));
                          setTotalShares(value);
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div>
                <Label>Current Round</Label>
                <Select value={currentRound} onValueChange={handleRoundChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roundOrder.map((key) => (
                      <SelectItem key={key} value={key}>
                        {rounds[key].name} ({rounds[key].dilution}% dilution)
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
                <CustomSlider
                  min={100000}
                  max={20000000000}
                  step={100000}
                  value={[exitValue]}
                  onChange={(values) => setExitValue(values[0])}
                  className="my-2"
                />
              </div>

              <div>
                <Label>Exit Round</Label>
                <Select value={exitRound} onValueChange={handleExitRoundChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roundOrder.map((key) => (
                      <SelectItem key={key} value={key}>
                        {rounds[key].name} ({rounds[key].dilution}% dilution)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Results */}
      <div className="main-content">
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">Metric</th>
                  <th className="p-2 text-left">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2">Current Ownership</td>
                  <td className="p-2 font-medium">{results.initialOwnership.toFixed(2)}%</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Current Value</td>
                  <td className="p-2 font-medium">{formatValue(results.currentValue)}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Post-Dilution Ownership</td>
                  <td className="p-2 font-medium">{results.finalOwnership.toFixed(2)}%</td>
                </tr>
                <tr>
                  <td className="p-2">Exit Value</td>
                  <td className="p-2 font-medium">{formatValue(results.dilutedValue)}</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              * Calculations are estimates based on typical dilution patterns
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default OwnershipCalculator; 