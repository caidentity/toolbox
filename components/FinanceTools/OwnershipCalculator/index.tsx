'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/Select';
import { CustomSlider } from '@/components/ui/Slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import "./OwnershipCalculator.scss";

// Define the round type and order
type RoundKey = 'angel' | 'preSeed' | 'seed' | 'seriesA' | 'seriesB' | 'seriesC' | 'seriesD' | 'seriesE' | 'seriesF';

const roundOrder: RoundKey[] = [
  'angel',
  'preSeed',
  'seed',
  'seriesA',
  'seriesB',
  'seriesC',
  'seriesD',
  'seriesE',
  'seriesF'
] as const;

const rounds = {
  angel: { 
    name: 'Angel Round', 
    dilution: 2.3,
    range: '0-5%',
    typical: 'Under $500K'
  },
  preSeed: { 
    name: 'Pre-Seed', 
    dilution: 8.1,
    range: '5-15%',
    typical: '$500K-$1M'
  },
  seed: { 
    name: 'Seed', 
    dilution: 20.5,
    range: '10-30%',
    typical: '20-24.9% most common'
  },
  seriesA: { 
    name: 'Series A', 
    dilution: 19.9,
    range: '15-29.9%',
    typical: 'Peak at 15-24.9%'
  },
  seriesB: { 
    name: 'Series B', 
    dilution: 17.2,
    range: '10-24.9%',
    typical: '15-19.9% most common'
  },
  seriesC: { 
    name: 'Series C', 
    dilution: 12.6,
    range: '5-14.9%',
    typical: '66% under 15%'
  },
  seriesD: { 
    name: 'Series D', 
    dilution: 10.3,
    range: '5-14.9%',
    typical: '5-9.9% most common'
  },
  seriesE: { 
    name: 'Series E', 
    dilution: 10.3,
    range: '5-14.9%',
    typical: '5-9.9% most common'
  },
  seriesF: { 
    name: 'Series F', 
    dilution: 10.3,
    range: '5-14.9%',
    typical: '5-9.9% most common'
  }
} as const;

// Update the Select options to show more information
const getRoundLabel = (key: RoundKey) => {
  const round = rounds[key];
  return `${round.name} (${round.dilution}% dilution, ${round.range})`;
};

const OwnershipCalculator = () => {
  // Initial ownership inputs with proper typing
  const [ownershipType, setOwnershipType] = useState<'percentage' | 'shares'>('percentage');
  const [sharesOwned, setSharesOwned] = useState(10000);
  const [totalShares, setTotalShares] = useState(1000000);
  const [ownershipPercentage, setOwnershipPercentage] = useState(1);
  const [startRound, setStartRound] = useState<RoundKey>('angel');
  const [exitRound, setExitRound] = useState<RoundKey>('seed');
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

  // Calculate initial ownership percentage
  const calculatePercentage = () => {
    return (sharesOwned / totalShares) * 100;
  };

  // Calculate dilution between rounds
  const calculateRoundDilution = (): number => {
    let initialOwnership = ownershipType === 'percentage' ? ownershipPercentage : calculatePercentage();
    
    const startIndex = roundOrder.indexOf(startRound);
    const exitIndex = roundOrder.indexOf(exitRound);
    
    if (startIndex === exitIndex) return initialOwnership;
    
    // Calculate compounding dilution effect
    let remainingOwnership = initialOwnership;
    
    for (let i = startIndex + 1; i <= exitIndex; i++) {
      const round = roundOrder[i];
      const roundDilution = rounds[round].dilution;
      
      // Formula: New Ownership = Current Ownership * (1 - Dilution%)
      // Example: If you own 100% and dilution is 20%, after round you own: 100 * (1 - 0.20) = 80%
      remainingOwnership = remainingOwnership * (1 - (roundDilution / 100));
    }
    
    return remainingOwnership;
  };

  // Add a function to calculate cumulative dilution for each round
  const calculateCumulativeDilution = (initialOwnership: number): { [key in RoundKey]?: number } => {
    const dilutionByRound: { [key in RoundKey]?: number } = {};
    let currentOwnership = initialOwnership;
    
    const startIndex = roundOrder.indexOf(startRound);
    const exitIndex = roundOrder.indexOf(exitRound);
    
    // Add initial ownership
    dilutionByRound[startRound] = currentOwnership;
    
    // Calculate ownership after each round
    for (let i = startIndex + 1; i <= exitIndex; i++) {
      const round = roundOrder[i];
      const roundDilution = rounds[round].dilution;
      currentOwnership = currentOwnership * (1 - (roundDilution / 100));
      dilutionByRound[round] = currentOwnership;
    }
    
    return dilutionByRound;
  };

  // Update results calculation to include round-by-round breakdown
  const results = {
    initialOwnership: ownershipType === 'percentage' ? ownershipPercentage : calculatePercentage(),
    finalOwnership: calculateRoundDilution(),
    currentValue: ((ownershipType === 'percentage' ? ownershipPercentage : calculatePercentage()) / 100) * exitValue,
    dilutedValue: (calculateRoundDilution() / 100) * exitValue,
    dilutionBreakdown: calculateCumulativeDilution(
      ownershipType === 'percentage' ? ownershipPercentage : calculatePercentage()
    )
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
                  <div className="flex items-center space-x-4">
                    <Label htmlFor="ownership" className="w-[120px]">Ownership (%)</Label>
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
                      className="w-[200px]"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="shares">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-4">
                      <Label htmlFor="totalShares" className="w-[120px]">Total Shares</Label>
                      <Input
                        id="totalShares"
                        type="number"
                        min={1}
                        value={totalShares}
                        onChange={(e) => {
                          const value = Math.max(1, Number(e.target.value));
                          setTotalShares(value);
                        }}
                        className="w-[200px]"
                      />
                    </div>
                    <div className="flex items-center space-x-4">
                      <Label htmlFor="sharesOwned">Owned</Label>
                      <Input
                        id="sharesOwned"
                        type="number"
                        min={0}
                        value={sharesOwned}
                        onChange={(e) => {
                          const value = Math.max(0, Number(e.target.value));
                          setSharesOwned(value);
                        }}
                        className="w-[200px]"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-4">
                <div>
                  <Label>Starting Round</Label>
                  <Select 
                    options={roundOrder.map((key) => ({
                      value: key,
                      label: getRoundLabel(key)
                    }))}
                    value={startRound}
                    onChange={(value) => {
                      const newStartRound = value as RoundKey;
                      setStartRound(newStartRound);
                      if (roundOrder.indexOf(exitRound) < roundOrder.indexOf(newStartRound)) {
                        setExitRound(newStartRound);
                      }
                    }}
                  />
                </div>

                <div>
                  <Label>Exit Round</Label>
                  <Select 
                    options={roundOrder
                      .slice(roundOrder.indexOf(startRound))
                      .map((key) => ({
                        value: key,
                        label: rounds[key].name
                      }))}
                    value={exitRound}
                    onChange={(value) => setExitRound(value as RoundKey)}
                  />
                </div>
              </div>
            </div>

            {/* Exit Value Section */}
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
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
                  <td className="p-2">Initial Ownership</td>
                  <td className="p-2 font-medium">{results.initialOwnership.toFixed(2)}%</td>
                </tr>
                {Object.entries(results.dilutionBreakdown).map(([round, ownership]) => (
                  <tr key={round} className="border-b">
                    <td className="p-2">After {rounds[round as RoundKey].name}</td>
                    <td className="p-2 font-medium">{ownership.toFixed(2)}%</td>
                  </tr>
                ))}
                <tr className="border-b">
                  <td className="p-2">Final Exit Value</td>
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