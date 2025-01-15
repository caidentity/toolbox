'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/Select';
import { CustomSlider } from '@/components/ui/Slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import "./OwnershipCalculator.scss";
import { Download as DownloadIcon, Clipboard as ClipboardIcon } from 'lucide-react';
import Button from '@/components/ui/Button';

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

// Add this type for dilution data
type DilutionData = {
  round: string;
  ownership: number;
  dilution: number;
  shares: number;
  value: number;
};

// Add at the top with other type definitions
type VestingSchedule = '1_4' | '1_3' | 'immediate';

const vestingSchedules = {
  '1_4': { name: '1 Year Cliff, 4 Year Vest', cliff: 1, total: 4 },
  '1_3': { name: '1 Year Cliff, 3 Year Vest', cliff: 1, total: 3 },
  'immediate': { name: 'Immediate Vesting', cliff: 0, total: 0 }
} as const;

// Add these types near the top with other type definitions
type VestingYear = {
  year: number;
  shares: number;
  valueAtExit: number;
  percentVested: number;
  cumulative: {
    shares: number;
    valueAtExit: number;
    percentVested: number;
  };
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

  // Update the calculateCumulativeDilution function to include more data
  const calculateCumulativeDilution = (initialOwnership: number): DilutionData[] => {
    const dilutionData: DilutionData[] = [];
    let currentOwnership = initialOwnership;
    let previousOwnership = initialOwnership;
    
    const startIndex = roundOrder.indexOf(startRound);
    const exitIndex = roundOrder.indexOf(exitRound);
    
    // Add initial round data
    dilutionData.push({
      round: rounds[startRound].name,
      ownership: currentOwnership,
      dilution: 0,
      shares: Math.round((currentOwnership / 100) * totalShares),
      value: (currentOwnership / 100) * exitValue
    });
    
    // Calculate for subsequent rounds
    for (let i = startIndex + 1; i <= exitIndex; i++) {
      const round = roundOrder[i];
      const roundDilution = rounds[round].dilution;
      previousOwnership = currentOwnership;
      currentOwnership = currentOwnership * (1 - (roundDilution / 100));
      
      dilutionData.push({
        round: rounds[round].name,
        ownership: currentOwnership,
        dilution: previousOwnership - currentOwnership,
        shares: Math.round((currentOwnership / 100) * totalShares),
        value: (currentOwnership / 100) * exitValue
      });
    }
    
    return dilutionData;
  };

  // Update results calculation to include round-by-round breakdown
  const results = {
    initialOwnership: ownershipType === 'percentage' ? ownershipPercentage : calculatePercentage(),
    finalOwnership: calculateRoundDilution(),
    initialShares: ownershipType === 'shares' ? sharesOwned : Math.round((ownershipPercentage / 100) * totalShares),
    finalShares: Math.round((calculateRoundDilution() / 100) * totalShares),
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

  // Add state for vesting schedule
  const [vestingSchedule, setVestingSchedule] = useState<VestingSchedule>('1_4');

  // Add this function before the return statement
  const calculateYearlyVesting = (): VestingYear[] => {
    const totalShares = results.finalShares;
    const schedule = vestingSchedules[vestingSchedule];
    const yearlyBreakdown: VestingYear[] = [];

    let cumulativeShares = 0;
    
    // Handle immediate vesting
    if (schedule.total === 0) {
      return [{
        year: 0,
        shares: totalShares,
        valueAtExit: results.dilutedValue,
        percentVested: 100,
        cumulative: {
          shares: totalShares,
          valueAtExit: results.dilutedValue,
          percentVested: 100
        }
      }];
    }

    // Calculate monthly vesting amount
    const monthlyShares = totalShares / (schedule.total * 12);

    // Calculate for each year
    for (let year = 1; year <= schedule.total; year++) {
      let yearShares = 0;

      // Cliff year
      if (year === schedule.cliff) {
        yearShares = monthlyShares * 12 * schedule.cliff;
      } 
      // Regular vesting year
      else if (year > schedule.cliff) {
        yearShares = monthlyShares * 12;
      }

      cumulativeShares += yearShares;
      
      yearlyBreakdown.push({
        year,
        shares: yearShares,
        valueAtExit: (yearShares / totalShares) * results.dilutedValue,
        percentVested: (yearShares / totalShares) * 100,
        cumulative: {
          shares: cumulativeShares,
          valueAtExit: (cumulativeShares / totalShares) * results.dilutedValue,
          percentVested: (cumulativeShares / totalShares) * 100
        }
      });
    }

    return yearlyBreakdown;
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
            <div className="space-y-6">
              {/* Existing summary sections */}
              
              <div className="space-y-2">
                <h4 className="font-medium">Dilution Breakdown</h4>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Round</th>
                        <th className="text-right p-2">Ownership</th>
                        <th className="text-right p-2">Dilution</th>
                        <th className="text-right p-2">Shares</th>
                        <th className="text-right p-2">Value at Exit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculateCumulativeDilution(results.initialOwnership).map((data, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{data.round}</td>
                          <td className="text-right p-2">{data.ownership.toFixed(2)}%</td>
                          <td className="text-right p-2 text-red-500">
                            {data.dilution > 0 ? `-${data.dilution.toFixed(2)}%` : '0%'}
                          </td>
                          <td className="text-right p-2">{data.shares.toLocaleString()}</td>
                          <td className="text-right p-2">{formatValue(data.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Vesting schedule section */}
              <div className="space-y-2">
                <h4 className="font-medium">Vesting Schedule ({vestingSchedules[vestingSchedule].name})</h4>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Year</th>
                        <th className="text-right p-2">Shares Vesting</th>
                        <th className="text-right p-2">Value at Exit</th>
                        <th className="text-right p-2">% Vested</th>
                        <th className="text-right p-2">Cumulative Shares</th>
                        <th className="text-right p-2">Cumulative Value</th>
                        <th className="text-right p-2">Cumulative %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculateYearlyVesting().map((year) => (
                        <tr key={year.year} className="border-b">
                          <td className="p-2">
                            {year.year === 0 ? 'Immediate' : `Year ${year.year}`}
                          </td>
                          <td className="text-right p-2">
                            {year.shares.toLocaleString()}
                          </td>
                          <td className="text-right p-2">
                            {formatValue(year.valueAtExit)}
                          </td>
                          <td className="text-right p-2">
                            {year.percentVested.toFixed(1)}%
                          </td>
                          <td className="text-right p-2">
                            {year.cumulative.shares.toLocaleString()}
                          </td>
                          <td className="text-right p-2">
                            {formatValue(year.cumulative.valueAtExit)}
                          </td>
                          <td className="text-right p-2">
                            {year.cumulative.percentVested.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 font-medium">
                      <tr>
                        <td className="p-2">Total</td>
                        <td className="text-right p-2">
                          {results.finalShares.toLocaleString()}
                        </td>
                        <td className="text-right p-2">
                          {formatValue(results.dilutedValue)}
                        </td>
                        <td className="text-right p-2">100%</td>
                        <td className="text-right p-2">-</td>
                        <td className="text-right p-2">-</td>
                        <td className="text-right p-2">-</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              * Calculations are estimates based on typical dilution patterns
            </p>
            <div className="flex gap-2">
              {/* <Button
                onClick={() => {
                  // Add to clipboard
                  const data = calculateCumulativeDilution(results.initialOwnership);
                  navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                }}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ClipboardIcon className="w-4 h-4" />
                Copy Data
              </Button>
              <Button 
                onClick={handleExport}
                variant="outline"
                className="flex items-center gap-2"
              >
                <DownloadIcon className="w-4 h-4" />
                Export Results
              </Button> */}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default OwnershipCalculator; 