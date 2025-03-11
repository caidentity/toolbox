'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableFooter } from './Table';
import Button from '@/components/ui/Button';
import './StockReview.css';
import Tooltip from '@/components/ui/Tooltip';

// Define simplified grant types - only new hire and annual
type GrantType = 'newHire' | 'annual';

interface Grant {
  id: string;
  type: GrantType;
  name: string;
  value: number;
  vestingYears: number;
  startYear: number;
}

interface YearlyBreakdown {
  year: number;
  salary: number;
  newGrants: Grant[];
  vestingAmount: number;
  cumulativeVested: number;
}

const StockReviewCalculator: React.FC = () => {
  // Initial state for salary and years of projection
  const [baseSalary, setBaseSalary] = useState<number>(200000);
  const [salaryGrowth, setSalaryGrowth] = useState<number>(3); // 3% annual growth
  const [projectionYears, setProjectionYears] = useState<number>(10);
  
  // Leaving year setting - when you stop receiving new grants
  const [leavingYear, setLeavingYear] = useState<number>(10);
  
  // Stock growth rate filter
  const [stockGrowthRate, setStockGrowthRate] = useState<number>(8); // 8% annual stock growth
  
  // Bonus settings
  const [includeBonuses, setIncludeBonuses] = useState<boolean>(true);
  const [bonusPercent, setBonusPercent] = useState<number>(15); // 15% of salary
  const [treatBonusesAsEquity, setTreatBonusesAsEquity] = useState<boolean>(false);
  
  // New hire grant settings
  const [newHireGrant, setNewHireGrant] = useState<Grant>({
    id: 'new-hire',
    type: 'newHire',
    name: 'New Hire Grant',
    value: 180000, // $180k
    vestingYears: 4,
    startYear: 0, // Starts vesting at year 0 (displayed as year 1)
  });
  
  // Annual grant settings
  const [yearlyGrantPercent, setYearlyGrantPercent] = useState<number>(60); // 60% of salary
  const [annualGrantVestingYears, setAnnualGrantVestingYears] = useState<number>(4);
  
  // Grants array
  const [allGrants, setAllGrants] = useState<Grant[]>([]);
  
  // Filter options
  const [showVestingDetails, setShowVestingDetails] = useState<boolean>(true);
  const [showCumulativeValue, setShowCumulativeValue] = useState<boolean>(true);
  const [showNewHireGrants, setShowNewHireGrants] = useState<boolean>(true);
  const [showAnnualGrants, setShowAnnualGrants] = useState<boolean>(true);
  
  // Generate and update all grants when inputs change
  useEffect(() => {
    const grants: Grant[] = [];
    
    // Add new hire grant if enabled
    if (showNewHireGrants) {
      // Ensure new hire grant starts at year 0 for internal calculations
      // (it will be displayed as year 1 in the table)
      const adjustedNewHireGrant = {
        ...newHireGrant,
        startYear: 0 // Always ensure new hire grant starts at year 0 internally
      };
      grants.push(adjustedNewHireGrant);
    }
    
    // Generate annual grants if enabled
    if (showAnnualGrants) {
      let currentSalary = baseSalary;
      
      console.log(`Generating grants up to year ${Math.min(projectionYears, leavingYear - 1)} (Leaving year: ${leavingYear})`);
      
      // Generate annual grants for each year, up to (but not including) the leaving year
      // We want annual grants for years before the leaving year
      for (let year = 1; year < Math.min(projectionYears, leavingYear); year++) {
        // Calculate salary for this year with growth
        currentSalary = baseSalary * Math.pow(1 + salaryGrowth / 100, year);
        
        console.log(`Creating grant for year ${year}`);
        
        // Create annual grant
        const annualGrant: Grant = {
          id: `annual-${year}`,
          type: 'annual',
          name: `Year ${year + 1} Annual Grant`, // Increment displayed year by 1
          value: currentSalary * (yearlyGrantPercent / 100),
          vestingYears: annualGrantVestingYears,
          startYear: year,
        };
        
        grants.push(annualGrant);
      }
    }
    
    setAllGrants(grants);
  }, [
    baseSalary, 
    salaryGrowth, 
    projectionYears, 
    yearlyGrantPercent, 
    newHireGrant, 
    showNewHireGrants, 
    showAnnualGrants,
    annualGrantVestingYears,
    leavingYear
  ]);
  
  // Effect to ensure leavingYear doesn't exceed projectionYears
  useEffect(() => {
    if (leavingYear > projectionYears) {
      setLeavingYear(projectionYears);
    }
  }, [projectionYears, leavingYear]);
  
  // Calculate yearly breakdown based on inputs
  const calculateYearlyBreakdown = (): YearlyBreakdown[] => {
    const breakdown: YearlyBreakdown[] = [];
    let currentSalary = baseSalary;
    
    for (let year = 0; year < projectionYears; year++) {
      // Only apply salary increases for years before the leaving year
      if (year > 0 && year < leavingYear) {
        currentSalary = baseSalary * Math.pow(1 + salaryGrowth / 100, year);
      } else if (year >= leavingYear) {
        // After or at leaving year, set salary to 0 (no more salary)
        currentSalary = 0;
      }
      
      // Calculate vesting amount for this year from all grants
      let vestingAmount = 0;
      
      // Get all grants that apply to this year
      let yearGrants: Grant[] = [];
      
      // Add new hire grants to year 0 if they exist
      if (year === 0 && showNewHireGrants) {
        yearGrants.push(newHireGrant);
      }
      
      // Add all other grants that start in this year (but only if year < leavingYear)
      if (year < leavingYear) {
        yearGrants = [...yearGrants, ...allGrants.filter(g => g.startYear === year && g.type !== 'newHire')];
      }
      
      // Calculate vesting for all grants
      for (const grant of allGrants) {
        // If this year is in the vesting period for this grant
        const grantAge = year - grant.startYear;
        if (grantAge >= 0 && grantAge < grant.vestingYears && grant.startYear < leavingYear) {
          // Simple linear vesting (equal amounts per year)
          vestingAmount += grant.value / grant.vestingYears;
        }
      }
      
      // Calculate cumulative vested amount
      const previousCumulative = year > 0 ? breakdown[year - 1].cumulativeVested : 0;
      const cumulativeVested = previousCumulative + vestingAmount;
      
      // Add to breakdown
      breakdown.push({
        year,
        salary: currentSalary,
        newGrants: yearGrants,
        vestingAmount,
        cumulativeVested,
      });
    }
    
    return breakdown;
  };
  
  const yearlyBreakdown = calculateYearlyBreakdown();
  
  // Calculate total grant value - only count grants before leaving year
  const totalGrantValue = allGrants
    .filter(grant => grant.startYear < leavingYear)
    .reduce((sum, grant) => sum + grant.value, 0);
  
  // Format currency for display
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Helper function to calculate vesting amount for a specific grant in a specific year
  const getVestingForGrantInYear = (grant: Grant, year: number): number => {
    // Skip grants that start after or in the leaving year
    if (grant.startYear >= leavingYear) {
      return 0;
    }
    
    const grantAge = year - grant.startYear;
    
    if (grantAge >= 0 && grantAge < grant.vestingYears) {
      return grant.value / grant.vestingYears;
    }
    
    return 0;
  };
  
  // Calculate the total vesting amount for a specific year (without growth)
  const getTotalVestingForYear = (year: number): number => {
    return allGrants
      .filter(grant => grant.startYear < leavingYear) // Only consider grants before leaving year
      .reduce((sum, grant) => sum + getVestingForGrantInYear(grant, year), 0);
  };
  
  // Calculate the growth-adjusted value for a grant in a specific year
  const getGrowthAdjustedValueForGrant = (grant: Grant, year: number): number => {
    // Skip grants that start after or in the leaving year
    if (grant.startYear >= leavingYear) {
      return 0;
    }
    
    const grantAge = year - grant.startYear;
    
    // If grant hasn't started yet or has fully vested
    if (grantAge < 0 || grantAge >= grant.vestingYears) {
      return 0;
    }
    
    // Get base vesting value for this year (without growth)
    const baseVestingValue = grant.value / grant.vestingYears;
    
    // No growth for year 0
    if (year === grant.startYear) {
      return baseVestingValue;
    } else {
      // Apply compound growth based on the number of years since the grant started
      return baseVestingValue * Math.pow(1 + stockGrowthRate / 100, grantAge);
    }
  };
  
  // Get total growth-adjusted vesting for a specific year
  const getGrowthAdjustedVestingForYear = (year: number): number => {
    return allGrants
      .filter(grant => grant.startYear < leavingYear) // Only consider grants before leaving year
      .reduce((sum, grant) => sum + getGrowthAdjustedValueForGrant(grant, year), 0);
  };
  
  // Calculate the total per year including salary and growth-adjusted vesting
  const getTotalPerYear = (year: number): number => {
    // Calculate salary based on whether we're before or after the leaving year
    const salaryInYear = year >= leavingYear ? 0 : baseSalary * Math.pow(1 + salaryGrowth / 100, year);
    
    // Get vesting amount - vesting continues after leaving as long as the grant was issued before leaving
    const vestingInYear = getGrowthAdjustedVestingForYear(year);
    
    // Get bonus - only applies up to leaving year
    const bonusInYear = year >= leavingYear ? 0 : getGrowthAdjustedBonusForYear(year);
    
    return salaryInYear + vestingInYear + bonusInYear;
  };
  
  // Calculate bonus for a specific year
  const getBonusForYear = (year: number): number => {
    // No bonuses after leaving year, or if bonuses are disabled
    if (!includeBonuses || year >= leavingYear) {
      return 0;
    }
    
    const salaryInYear = baseSalary * Math.pow(1 + salaryGrowth / 100, year);
    const basicBonus = salaryInYear * (bonusPercent / 100);
    
    if (!treatBonusesAsEquity) {
      return basicBonus;
    }
    
    // If treating bonuses as equity, we only return the basic value here
    // Growth adjustments are handled in getGrowthAdjustedBonusForYear
    return basicBonus;
  };
  
  // Calculate growth-adjusted bonus through the years
  const getGrowthAdjustedBonusForYear = (year: number): number => {
    if (!includeBonuses || !treatBonusesAsEquity) {
      return getBonusForYear(year);
    }
    
    let totalBonus = 0;
    // Calculate all previous years' bonuses with compound growth
    for (let i = 0; i < Math.min(year + 1, leavingYear); i++) {
      // Get the bonus from previous years (already given)
      const salaryInYear = baseSalary * Math.pow(1 + salaryGrowth / 100, i);
      const yearlyBonus = salaryInYear * (bonusPercent / 100);
      
      // Apply compound growth for the years AFTER the bonus was given
      // For a bonus from year i, it grows for (year - i - 1) years
      // The -1 ensures growth starts from the next year after the bonus is given
      const growthFactor = Math.pow(1 + stockGrowthRate / 100, year - i - 1);
      totalBonus += yearlyBonus * growthFactor;
    }
    
    // No need to add current year's bonus separately - it's included in the loop above
    
    return totalBonus;
  };
  
  // Get cumulative bonuses up to a specific year
  const getCumulativeBonuses = (year: number): number => {
    if (!includeBonuses) {
      return 0;
    }
    
    let total = 0;
    for (let i = 0; i <= year; i++) {
      // Use growth-adjusted bonuses if treating bonuses as equity, otherwise use regular bonuses
      if (treatBonusesAsEquity) {
        total += getGrowthAdjustedBonusForYear(i);
      } else {
        total += getBonusForYear(i);
      }
    }
    return total;
  };
  
  // Get cumulative growth-adjusted bonuses up to a specific year
  const getCumulativeGrowthAdjustedBonuses = (year: number): number => {
    if (!includeBonuses || !treatBonusesAsEquity) {
      return getCumulativeBonuses(year);
    }
    
    // Accumulate growth-adjusted bonuses for each year
    let total = 0;
    for (let i = 0; i <= year; i++) {
      total += getGrowthAdjustedBonusForYear(i);
    }
    return total;
  };
  
  // Calculate cumulative total (salary + vesting) up to a specific year
  const getCumulativeTotal = (year: number): number => {
    let total = 0;
    for (let i = 0; i <= year; i++) {
      total += getTotalPerYear(i);
    }
    return total;
  };
  
  // Generate years array for table header - incrementing by 1 to change from 0-indexed to 1-indexed
  const years = Array.from({ length: projectionYears }, (_, i) => i + 1);
  
  // Get all annual grants to display as rows
  const annualGrants = allGrants.filter(grant => grant.type === 'annual' && grant.startYear < leavingYear);
  
  console.log('All grants:', allGrants);
  console.log('Filtered annual grants (should only show up to leaving year):', annualGrants);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Stock Grant Review</CardTitle>
        <CardDescription>
          Track your stock grants, vesting schedule, and potential value over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Filters Card */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Global Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stockGrowthRate">Stock Growth Rate (%)</Label>
                  <Input
                    id="stockGrowthRate"
                    type="number"
                    value={stockGrowthRate}
                    onChange={(e) => setStockGrowthRate(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leavingYear">
                    Leaving Year
                    <Tooltip
                      content="The last year you work at the company. You will receive salary and bonus in this year, but not beyond. Annual grants are only issued before this year. Existing grants continue vesting with stock growth after leaving."
                      position="top"
                      variant="light"
                      minWidth={250}
                      maxWidth={350}
                    >
                      <span className="ml-1 text-blue-500 hover:text-blue-700 cursor-help inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">ⓘ</span>
                    </Tooltip>
                  </Label>
                  <Input
                    id="leavingYear"
                    type="number"
                    min="1"
                    max={projectionYears}
                    value={leavingYear}
                    onChange={(e) => {
                      const value = Math.min(Number(e.target.value), projectionYears);
                      setLeavingYear(value);
                    }}
                  />
                </div>
                <div className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    id="showVestingDetails"
                    checked={showVestingDetails}
                    onChange={(e) => setShowVestingDetails(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="showVestingDetails">Show Vesting Details</Label>
                </div>
                <div className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    id="showCumulativeValue"
                    checked={showCumulativeValue}
                    onChange={(e) => setShowCumulativeValue(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="showCumulativeValue">Show Cumulative Value</Label>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Editor grid layout - all filters on one row */}
          <div className="grid-editor">
            {/* Salary section */}
            <div className="editor-section">
              <h3 className="editor-section-title">Salary Details</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="baseSalary">Base Salary</Label>
                  <Input
                    id="baseSalary"
                    type="number"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salaryGrowth">Annual Growth (%)</Label>
                  <Input
                    id="salaryGrowth"
                    type="number"
                    value={salaryGrowth}
                    onChange={(e) => setSalaryGrowth(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectionYears">Projection Years</Label>
                  <Input
                    id="projectionYears"
                    type="number"
                    value={projectionYears}
                    onChange={(e) => setProjectionYears(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
            
            {/* New Hire Grant section */}
            <div className="editor-section">
              <div className="flex items-center justify-between mb-2">
                <h3 className="editor-section-title">New Hire Grant</h3>
                <div className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    id="showNewHireGrants"
                    checked={showNewHireGrants}
                    onChange={(e) => setShowNewHireGrants(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="showNewHireGrants">Include</Label>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newHireGrant">Grant Value</Label>
                  <Input
                    id="newHireGrant"
                    type="number"
                    value={newHireGrant.value}
                    onChange={(e) => setNewHireGrant({...newHireGrant, value: Number(e.target.value)})}
                    disabled={!showNewHireGrants}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vestingYears">Vesting Years</Label>
                  <Input
                    id="vestingYears"
                    type="number"
                    value={newHireGrant.vestingYears}
                    onChange={(e) => setNewHireGrant({
                      ...newHireGrant, 
                      vestingYears: Number(e.target.value)
                    })}
                    disabled={!showNewHireGrants}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startYear">Start Year (Displayed as Year {newHireGrant.startYear + 1})</Label>
                  <Input
                    id="startYear"
                    type="number"
                    value={newHireGrant.startYear}
                    onChange={(e) => setNewHireGrant({
                      ...newHireGrant, 
                      startYear: Number(e.target.value)
                    })}
                    disabled={!showNewHireGrants}
                  />
                </div>
              </div>
            </div>
            
            {/* Annual Grants section */}
            <div className="editor-section">
              <div className="flex items-center justify-between mb-2">
                <h3 className="editor-section-title">Annual Grants</h3>
                <div className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    id="showAnnualGrants"
                    checked={showAnnualGrants}
                    onChange={(e) => setShowAnnualGrants(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="showAnnualGrants">Include</Label>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="yearlyGrantPercent">Percent of Salary</Label>
                  <Input
                    id="yearlyGrantPercent"
                    type="number"
                    value={yearlyGrantPercent}
                    onChange={(e) => setYearlyGrantPercent(Number(e.target.value))}
                    disabled={!showAnnualGrants}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annualGrantVestingYears">Vesting Years</Label>
                  <Input
                    id="annualGrantVestingYears"
                    type="number"
                    value={annualGrantVestingYears}
                    onChange={(e) => setAnnualGrantVestingYears(Number(e.target.value))}
                    disabled={!showAnnualGrants}
                  />
                </div>
              </div>
            </div>
            
            {/* Bonus section */}
            <div className="editor-section">
              <div className="flex items-center justify-between mb-2">
                <h3 className="editor-section-title">Annual Bonus</h3>
                <div className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    id="includeBonuses"
                    checked={includeBonuses}
                    onChange={(e) => setIncludeBonuses(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="includeBonuses">Include</Label>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bonusPercent">Percent of Salary</Label>
                  <Input
                    id="bonusPercent"
                    type="number"
                    value={bonusPercent}
                    onChange={(e) => setBonusPercent(Number(e.target.value))}
                    disabled={!includeBonuses}
                  />
                </div>
                <div className="checkbox-wrapper mt-4">
                  <input
                    type="checkbox"
                    id="treatBonusesAsEquity"
                    checked={treatBonusesAsEquity}
                    onChange={(e) => setTreatBonusesAsEquity(e.target.checked)}
                    disabled={!includeBonuses}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="treatBonusesAsEquity">Treat as Equity (Apply Stock Growth)</Label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Summary section */}
          <div className="summary-section">
            <h3 className="summary-title">Summary</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <div className="summary-item-label">
                  Base Salary
                  <Tooltip
                    content="Your annual base compensation before any additional benefits or equity"
                    position="top"
                    variant="light"
                    minWidth={200}
                    maxWidth={300}
                  >
                    <span className="ml-1 text-blue-500 hover:text-blue-700 cursor-help inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">ⓘ</span>
                  </Tooltip>
                </div>
                <div className="summary-item-value">{formatCurrency(baseSalary)}</div>
              </div>
              
              <div className="summary-item">
                <div className="summary-item-label">
                  New Hire Grant
                  <Tooltip
                    content="The initial equity grant offered when joining the company"
                    position="top"
                    variant="light"
                    minWidth={200}
                    maxWidth={300}
                  >
                    <span className="ml-1 text-blue-500 hover:text-blue-700 cursor-help inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">ⓘ</span>
                  </Tooltip>
                </div>
                <div className="summary-item-value">{showNewHireGrants ? formatCurrency(newHireGrant.value) : '$0'}</div>
              </div>
              
              <div className="summary-item">
                <div className="summary-item-label">
                  Total Grant Value
                  <Tooltip
                    content="The combined value of all equity grants (new hire and annual)"
                    position="top"
                    variant="light"
                    minWidth={200}
                    maxWidth={300}
                  >
                    <span className="ml-1 text-blue-500 hover:text-blue-700 cursor-help inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">ⓘ</span>
                  </Tooltip>
                </div>
                <div className="summary-item-value">{formatCurrency(totalGrantValue)}</div>
              </div>
              
              <div className="summary-item">
                <div className="summary-item-label">
                  Stock Growth Rate
                  <Tooltip
                    content="The annual percentage increase in stock value used for calculations"
                    position="top"
                    variant="light"
                    minWidth={200}
                    maxWidth={300}
                  >
                    <span className="ml-1 text-blue-500 hover:text-blue-700 cursor-help inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">ⓘ</span>
                  </Tooltip>
                </div>
                <div className="summary-item-value">{stockGrowthRate}% per year</div>
              </div>
              
              <div className="summary-item">
                <div className="summary-item-label">
                  Bonus Rate
                  <Tooltip
                    content="The annual bonus as a percentage of base salary"
                    position="top"
                    variant="light"
                    minWidth={200}
                    maxWidth={300}
                  >
                    <span className="ml-1 text-blue-500 hover:text-blue-700 cursor-help inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">ⓘ</span>
                  </Tooltip>
                </div>
                <div className="summary-item-value">
                  {includeBonuses ? `${bonusPercent}% of Salary` : 'Disabled'}
                </div>
              </div>
              
              <div className="summary-item">
                <div className="summary-item-label">
                  Total Stock Growth Value
                  <Tooltip
                    content="The additional value generated from stock price appreciation over the entire period"
                    position="top"
                    variant="light"
                    minWidth={200}
                    maxWidth={300}
                  >
                    <span className="ml-1 text-blue-500 hover:text-blue-700 cursor-help inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">ⓘ</span>
                  </Tooltip>
                </div>
                <div className="summary-item-value">
                  {formatCurrency(
                    getCumulativeTotal(projectionYears - 1) - 
                    (baseSalary * projectionYears + totalGrantValue + 
                     (includeBonuses ? (treatBonusesAsEquity ? 0 : getCumulativeBonuses(projectionYears - 1)) : 0))
                  )}
                </div>
              </div>
              
              <div className="summary-item">
                <div className="summary-item-label">
                  Cumulative Equity (Base)
                  <Tooltip
                    content="The total equity value vested over the entire period without stock growth"
                    position="top"
                    variant="light"
                    minWidth={200}
                    maxWidth={300}
                  >
                    <span className="ml-1 text-blue-500 hover:text-blue-700 cursor-help inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">ⓘ</span>
                  </Tooltip>
                </div>
                <div className="summary-item-value">
                  {formatCurrency(
                    yearlyBreakdown[yearlyBreakdown.length - 1]?.cumulativeVested || 0 + 
                    (includeBonuses && treatBonusesAsEquity ? getCumulativeBonuses(projectionYears - 1) : 0)
                  )}
                </div>
              </div>
              
              <div className="summary-item">
                <div className="summary-item-label">
                  Cumulative Equity (w/ Growth)
                  <Tooltip
                    content="The total equity value vested over the entire period with stock growth factored in"
                    position="top"
                    variant="light"
                    minWidth={200}
                    maxWidth={300}
                  >
                    <span className="ml-1 text-blue-500 hover:text-blue-700 cursor-help inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">ⓘ</span>
                  </Tooltip>
                </div>
                <div className="summary-item-value">
                  {formatCurrency(
                    getCumulativeTotal(projectionYears - 1) - 
                    (baseSalary * projectionYears + 
                     (includeBonuses ? (treatBonusesAsEquity ? 0 : getCumulativeBonuses(projectionYears - 1)) : 0))
                  )}
                </div>
              </div>
              
              <div className="summary-item">
                <div className="summary-item-label">
                  Cumulative Total ({projectionYears} years)
                  <Tooltip
                    content={`The total compensation package over ${projectionYears} years, including salary, equity, and bonuses (if enabled)`}
                    position="top"
                    variant="light"
                    minWidth={200}
                    maxWidth={300}
                  >
                    <span className="ml-1 text-blue-500 hover:text-blue-700 cursor-help inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">ⓘ</span>
                  </Tooltip>
                </div>
                <div className="summary-item-value">
                  {formatCurrency(getCumulativeTotal(projectionYears - 1))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Restructured Results Table */}
          <div className="enhanced-table-container">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Grant Type</TableHead>
                  {years.map(year => (
                    <TableHead key={`year-${year}`} className="text-center">
                      Year {year}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {/* Base Salary Row */}
                <TableRow className="bg-gray-50">
                  <TableCell className="font-medium">Base Salary</TableCell>
                  {years.map(year => {
                    // Adjust calculation to account for 1-indexed years in display
                    const yearIndex = year - 1;
                    // Only show salary up to leaving year (strictly)
                    const salaryInYear = yearIndex >= leavingYear 
                      ? 0 
                      : baseSalary * Math.pow(1 + salaryGrowth / 100, yearIndex);
                    return (
                      <TableCell key={`salary-${year}`} className="text-right table-text-sm">
                        {yearIndex >= leavingYear ? "—" : formatCurrency(salaryInYear)}
                      </TableCell>
                    );
                  })}
                </TableRow>
                
                {/* Bonus Row */}
                {includeBonuses && (
                  <TableRow className="bg-gray-50">
                    <TableCell className="font-medium">
                      Annual Bonus
                      <div className="text-xs text-gray-500 mt-1">
                        ({bonusPercent}% of salary, starts year 1)
                      </div>
                    </TableCell>
                    {years.map(year => {
                      const yearIndex = year - 1;
                      
                      // Don't show bonuses after leaving year
                      if (yearIndex >= leavingYear) {
                        return (
                          <TableCell key={`bonus-${year}`} className="text-right table-text-sm">
                            —
                          </TableCell>
                        );
                      }
                      
                      const basicBonus = getBonusForYear(yearIndex);
                      
                      if (treatBonusesAsEquity && year >= 1) {
                        const salaryInYear = baseSalary * Math.pow(1 + salaryGrowth / 100, yearIndex);
                        const currentYearBonus = salaryInYear * (bonusPercent / 100);
                        const growthAdjustedValue = getGrowthAdjustedBonusForYear(yearIndex);
                        // Calculate the growth only for the current year's bonus
                        const previousYearsCumulativeBonus = yearIndex > 0 ? getCumulativeBonuses(yearIndex - 1) : 0;
                        const growthAmount = growthAdjustedValue - (previousYearsCumulativeBonus + currentYearBonus);
                        
                        const tooltipContent = (
                          <div className="tooltip-calculation">
                            <div>Base Bonus: {formatCurrency(currentYearBonus)}</div>
                            <div>Growth Rate: {stockGrowthRate}%</div>
                            {growthAmount > 0 && (
                              <div>Growth Amount: +{formatCurrency(growthAmount)}</div>
                            )}
                            <div>Total Value: {formatCurrency(growthAdjustedValue)}</div>
                          </div>
                        );
                        
                        return (
                          <TableCell key={`bonus-${year}`} className="text-right table-text-sm">
                            <Tooltip
                              content={tooltipContent}
                              position="top"
                              variant="light"
                              minWidth={250}
                              maxWidth={350}
                            >
                              <span className="cursor-help">{formatCurrency(growthAdjustedValue)}</span>
                            </Tooltip>
                          </TableCell>
                        );
                      }
                      
                      return (
                        <TableCell key={`bonus-${year}`} className="text-right table-text-sm">
                          {formatCurrency(basicBonus)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                )}
                
                {/* New Hire Grant Row */}
                {showNewHireGrants && (
                  <TableRow>
                    <TableCell className="font-medium">
                      New Hire Grant
                      <div className="text-xs text-gray-500 mt-1">
                        ({formatCurrency(newHireGrant.value)} over {newHireGrant.vestingYears} years)
                      </div>
                    </TableCell>
                    {years.map(year => {
                      const yearIndex = year - 1;
                      const baseValue = getVestingForGrantInYear(newHireGrant, yearIndex);
                      const growthAdjustedValue = getGrowthAdjustedValueForGrant(newHireGrant, yearIndex);
                      const showGrowth = baseValue > 0 && growthAdjustedValue > baseValue;
                      
                      if (baseValue > 0) {
                        const tooltipContent = (
                          <div className="tooltip-calculation">
                            <div>Base Vesting: {formatCurrency(baseValue)}</div>
                            <div>Growth Rate: {stockGrowthRate}%</div>
                            {showGrowth && (
                              <div>Growth Amount: +{formatCurrency(growthAdjustedValue - baseValue)}</div>
                            )}
                            <div>Total Value: {formatCurrency(growthAdjustedValue)}</div>
                          </div>
                        );
                        
                        return (
                          <TableCell key={`newhire-${year}`} className="text-right table-text-sm">
                            <Tooltip
                              content={tooltipContent}
                              position="top"
                              variant="light"
                              minWidth={250}
                              maxWidth={350}
                            >
                              <span className="cursor-help">{formatCurrency(growthAdjustedValue)}</span>
                            </Tooltip>
                          </TableCell>
                        );
                      }
                      
                      return (
                        <TableCell key={`newhire-${year}`} className="text-right table-text-sm">
                          {formatCurrency(growthAdjustedValue)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                )}
                
                {/* Annual Grant Rows */}
                {showAnnualGrants && annualGrants.map(grant => (
                  <TableRow key={grant.id}>
                    <TableCell className="font-medium">
                      {grant.name}
                      <div className="text-xs text-gray-500 mt-1">
                        ({formatCurrency(grant.value)} over {grant.vestingYears} years)
                      </div>
                    </TableCell>
                    {years.map(year => {
                      const yearIndex = year - 1;
                      // Skip computation for grants that start at or after leaving year
                      if (grant.startYear >= leavingYear) {
                        return (
                          <TableCell key={`${grant.id}-${year}`} className="text-right table-text-sm">
                            —
                          </TableCell>
                        );
                      }
                      
                      const baseValue = getVestingForGrantInYear(grant, yearIndex);
                      const growthAdjustedValue = getGrowthAdjustedValueForGrant(grant, yearIndex);
                      const showGrowth = baseValue > 0 && growthAdjustedValue > baseValue;
                      
                      if (baseValue > 0) {
                        const tooltipContent = (
                          <div className="tooltip-calculation">
                            <div>Base Vesting: {formatCurrency(baseValue)}</div>
                            <div>Growth Rate: {stockGrowthRate}%</div>
                            {showGrowth && (
                              <div>Growth Amount: +{formatCurrency(growthAdjustedValue - baseValue)}</div>
                            )}
                            <div>Total Value: {formatCurrency(growthAdjustedValue)}</div>
                          </div>
                        );
                        
                        return (
                          <TableCell key={`${grant.id}-${year}`} className="text-right table-text-sm">
                            <Tooltip
                              content={tooltipContent}
                              position="top"
                              variant="light"
                              minWidth={250}
                              maxWidth={350}
                            >
                              <span className="cursor-help">{formatCurrency(growthAdjustedValue)}</span>
                            </Tooltip>
                          </TableCell>
                        );
                      }
                      
                      return (
                        <TableCell key={`${grant.id}-${year}`} className="text-right table-text-sm">
                          {formatCurrency(growthAdjustedValue)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
              
              <TableFooter>
                <TableRow className="footer-row">
                  <TableCell>
                    Total Vesting Per Year (Base)
                    <Tooltip
                      content="The total dollar amount of equity vesting each year without growth factored in"
                      position="right"
                      variant="light"
                      minWidth={250}
                      maxWidth={350}
                    >
                      <span className="ml-1 text-blue-500 hover:text-blue-700 cursor-help inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">ⓘ</span>
                    </Tooltip>
                  </TableCell>
                  {years.map(year => (
                    <TableCell key={`total-base-${year}`} className="text-right">
                      {formatCurrency(getTotalVestingForYear(year - 1))}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="footer-row">
                  <TableCell>
                    Total Vesting Per Year (w/ Growth)
                    <Tooltip
                      content="The total dollar amount of equity vesting each year with stock price growth factored in"
                      position="right"
                      variant="light"
                      minWidth={250}
                      maxWidth={350}
                    >
                      <span className="ml-1 text-blue-500 hover:text-blue-700 cursor-help inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">ⓘ</span>
                    </Tooltip>
                  </TableCell>
                  {years.map(year => {
                    const baseValue = getTotalVestingForYear(year - 1);
                    const growthValue = getGrowthAdjustedVestingForYear(year - 1);
                    const growthDiff = growthValue - baseValue;
                    
                    const tooltipContent = (
                      <div className="tooltip-calculation">
                        <div>Base Vesting: {formatCurrency(baseValue)}</div>
                        <div>Growth Rate: {stockGrowthRate}%</div>
                        {growthDiff > 0 && (
                          <div>Growth Amount: +{formatCurrency(growthDiff)}</div>
                        )}
                        <div>Total Value: {formatCurrency(growthValue)}</div>
                      </div>
                    );
                    
                    return (
                      <TableCell key={`total-growth-${year}`} className="text-right">
                        <Tooltip
                          content={tooltipContent}
                          position="top"
                          variant="light"
                          minWidth={250}
                          maxWidth={350}
                        >
                          <span className="cursor-help">{formatCurrency(growthValue)}</span>
                        </Tooltip>
                      </TableCell>
                    );
                  })}
                </TableRow>
                {showCumulativeValue && (
                  <>
                    <TableRow className="footer-row">
                      <TableCell>
                        Cumulative Equity (Base)
                        <Tooltip
                          content="The running total of all equity that has vested to date, without stock price growth factored in"
                          position="right"
                          variant="light"
                          minWidth={250}
                          maxWidth={350}
                        >
                          <span className="ml-1 text-blue-500 hover:text-blue-700 cursor-help inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">ⓘ</span>
                        </Tooltip>
                      </TableCell>
                      {years.map(year => {
                        // Calculate base vested equity
                        const baseEquity = yearlyBreakdown[year - 1]?.cumulativeVested || 0;
                        // Include bonuses as equity if option is enabled
                        const bonusAsEquity = (includeBonuses && treatBonusesAsEquity) 
                          ? getCumulativeBonuses(year - 1) 
                          : 0;
                        const totalValue = baseEquity + bonusAsEquity;
                        
                        const tooltipContent = (
                          <div className="tooltip-calculation">
                            <div>Base Equity: {formatCurrency(baseEquity)}</div>
                            {bonusAsEquity > 0 && (
                              <div>Bonus as Equity: {formatCurrency(bonusAsEquity)}</div>
                            )}
                            <div>Total Value: {formatCurrency(totalValue)}</div>
                          </div>
                        );
                        
                        return (
                          <TableCell key={`cumulative-base-${year}`} className="text-right">
                            <Tooltip
                              content={tooltipContent}
                              position="top"
                              variant="light"
                              minWidth={250}
                              maxWidth={350}
                            >
                              <span className="cursor-help">{formatCurrency(totalValue)}</span>
                            </Tooltip>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    <TableRow className="footer-row">
                      <TableCell>
                        Cumulative Equity (w/ Growth)
                        <Tooltip
                          content="The running total of all equity that has vested to date, with stock price growth factored in"
                          position="right"
                          variant="light"
                          minWidth={250}
                          maxWidth={350}
                        >
                          <span className="ml-1 text-blue-500 hover:text-blue-700 cursor-help inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">ⓘ</span>
                        </Tooltip>
                      </TableCell>
                      {years.map(year => {
                        // Calculate growth-adjusted vesting
                        let cumulativeWithGrowth = 0;
                        for (let i = 0; i <= year - 1; i++) {
                          cumulativeWithGrowth += getGrowthAdjustedVestingForYear(i);
                        }
                        
                        // Include growth-adjusted bonuses as equity if option is enabled
                        const bonusWithGrowth = (includeBonuses && treatBonusesAsEquity) 
                          ? getCumulativeGrowthAdjustedBonuses(year - 1) 
                          : 0;
                        
                        // Calculate the base value for comparison
                        const baseEquity = yearlyBreakdown[year - 1]?.cumulativeVested || 0;
                        const baseBonus = (includeBonuses && treatBonusesAsEquity) 
                          ? getCumulativeBonuses(year - 1) 
                          : 0;
                        const baseValue = baseEquity + baseBonus;
                        
                        // Calculate the total with growth
                        const totalWithGrowth = cumulativeWithGrowth + bonusWithGrowth;
                        const growthDiff = totalWithGrowth - baseValue;
                        
                        const tooltipContent = (
                          <div className="tooltip-calculation">
                            <div>Base Equity: {formatCurrency(baseEquity)}</div>
                            {baseBonus > 0 && (
                              <div>Base Bonus: {formatCurrency(baseBonus)}</div>
                            )}
                            <div>Growth Rate: {stockGrowthRate}%</div>
                            {growthDiff > 0 && (
                              <div>Growth Amount: +{formatCurrency(growthDiff)}</div>
                            )}
                            {bonusWithGrowth > 0 && (
                              <div>Bonus with Growth: {formatCurrency(bonusWithGrowth)}</div>
                            )}
                            <div>Total Value: {formatCurrency(totalWithGrowth)}</div>
                          </div>
                        );
                        
                        return (
                          <TableCell key={`cumulative-growth-${year}`} className="text-right">
                            <Tooltip
                              content={tooltipContent}
                              position="top"
                              variant="light"
                              minWidth={250}
                              maxWidth={350}
                            >
                              <span className="cursor-help">{formatCurrency(totalWithGrowth)}</span>
                            </Tooltip>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </>
                )}
                <TableRow className="footer-row-total">
                  <TableCell>
                    Total Per Year (Salary + Vesting{includeBonuses ? " + Bonus" : ""})
                    <Tooltip
                      content="The total compensation received each year, including salary, vesting equity, and bonuses (if enabled)"
                      position="right"
                      variant="light"
                      minWidth={250}
                      maxWidth={350}
                    >
                      <span className="ml-1 text-blue-500 hover:text-blue-700 cursor-help inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">ⓘ</span>
                    </Tooltip>
                  </TableCell>
                  {years.map(year => {
                    const yearIndex = year - 1;
                    const totalForYear = getTotalPerYear(yearIndex);
                    
                    // Correctly calculate for tooltip without redeclaring variables
                    const tooltipContent = (
                      <div className="tooltip-calculation">
                        {yearIndex < leavingYear && <div>Salary: {formatCurrency(yearIndex >= leavingYear ? 0 : baseSalary * Math.pow(1 + salaryGrowth / 100, yearIndex))}</div>}
                        <div>Vesting: {formatCurrency(getGrowthAdjustedVestingForYear(yearIndex))}</div>
                        {includeBonuses && yearIndex < leavingYear && (
                          <div>Bonus: {formatCurrency(yearIndex >= leavingYear ? 0 : getGrowthAdjustedBonusForYear(yearIndex))}</div>
                        )}
                        <div>Total: {formatCurrency(totalForYear)}</div>
                      </div>
                    );
                    
                    return (
                      <TableCell key={`total-with-salary-${year}`} className="text-right">
                        <Tooltip
                          content={tooltipContent}
                          position="top"
                          variant="light"
                          minWidth={250}
                          maxWidth={350}
                        >
                          <span className="cursor-help">{formatCurrency(totalForYear)}</span>
                        </Tooltip>
                      </TableCell>
                    );
                  })}
                </TableRow>
                <TableRow className="footer-row-highlight">
                  <TableCell>
                    Cumulative Total (Salary + Vesting{includeBonuses ? " + Bonus" : ""})
                    <Tooltip
                      content="The running total of all compensation received to date, including salary, vesting equity, and bonuses (if enabled)"
                      position="right"
                      variant="light"
                      minWidth={250}
                      maxWidth={350}
                    >
                      <span className="ml-1 text-blue-500 hover:text-blue-700 cursor-help inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">ⓘ</span>
                    </Tooltip>
                  </TableCell>
                  {years.map(year => {
                    const yearIndex = year - 1;
                    const cumulativeTotal = getCumulativeTotal(yearIndex);
                    
                    // Calculate components for tooltip
                    let cumulativeSalary = 0;
                    let cumulativeVesting = 0;
                    let cumulativeBonus = 0;
                    
                    for (let i = 0; i <= yearIndex; i++) {
                      // Only include salary and bonuses up to leaving year
                      if (i < leavingYear) {
                        const salary = baseSalary * Math.pow(1 + salaryGrowth / 100, i);
                        cumulativeSalary += salary;
                        if (includeBonuses) {
                          cumulativeBonus += getGrowthAdjustedBonusForYear(i);
                        }
                      }
                      cumulativeVesting += getGrowthAdjustedVestingForYear(i);
                    }
                    
                    const tooltipContent = (
                      <div className="tooltip-calculation">
                        <div>Cumulative Salary: {formatCurrency(cumulativeSalary)}</div>
                        <div>Cumulative Vesting: {formatCurrency(cumulativeVesting)}</div>
                        {includeBonuses && (
                          <div>Cumulative Bonus: {formatCurrency(cumulativeBonus)}</div>
                        )}
                        <div>Total: {formatCurrency(cumulativeTotal)}</div>
                      </div>
                    );
                    
                    return (
                      <TableCell key={`cumulative-total-${year}`} className="text-right">
                        <Tooltip
                          content={tooltipContent}
                          position="top"
                          variant="light"
                          minWidth={250}
                          maxWidth={350}
                        >
                          <span className="cursor-help">{formatCurrency(cumulativeTotal)}</span>
                        </Tooltip>
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockReviewCalculator;