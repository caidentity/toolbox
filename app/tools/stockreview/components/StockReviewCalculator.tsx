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
      
      // Generate annual grants for each year
      for (let year = 1; year < projectionYears; year++) {
        // Calculate salary for this year with growth
        currentSalary = baseSalary * Math.pow(1 + salaryGrowth / 100, year);
        
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
    annualGrantVestingYears
  ]);
  
  // Calculate yearly breakdown based on inputs
  const calculateYearlyBreakdown = (): YearlyBreakdown[] => {
    const breakdown: YearlyBreakdown[] = [];
    let currentSalary = baseSalary;
    
    for (let year = 0; year < projectionYears; year++) {
      // Calculate vesting amount for this year from all grants
      let vestingAmount = 0;
      
      // Get all grants that apply to this year
      let yearGrants: Grant[] = [];
      
      // Add new hire grants to year 0 if they exist
      if (year === 0 && showNewHireGrants) {
        yearGrants.push(newHireGrant);
      }
      
      // Add all other grants that start in this year
      yearGrants = [...yearGrants, ...allGrants.filter(g => g.startYear === year && g.type !== 'newHire')];
      
      // Calculate vesting for all grants
      for (const grant of allGrants) {
        // If this year is in the vesting period for this grant
        const grantAge = year - grant.startYear;
        if (grantAge >= 0 && grantAge < grant.vestingYears) {
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
      
      // Increase salary for next year
      currentSalary = currentSalary * (1 + salaryGrowth / 100);
    }
    
    return breakdown;
  };
  
  const yearlyBreakdown = calculateYearlyBreakdown();
  
  // Calculate total grant value
  const totalGrantValue = allGrants.reduce((sum, grant) => sum + grant.value, 0);
  
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
    const grantAge = year - grant.startYear;
    
    if (grantAge >= 0 && grantAge < grant.vestingYears) {
      return grant.value / grant.vestingYears;
    }
    
    return 0;
  };
  
  // Calculate the total vesting amount for a specific year (without growth)
  const getTotalVestingForYear = (year: number): number => {
    return allGrants.reduce((sum, grant) => sum + getVestingForGrantInYear(grant, year), 0);
  };
  
  // Calculate the growth-adjusted value for a grant in a specific year
  const getGrowthAdjustedValueForGrant = (grant: Grant, year: number): number => {
    const grantAge = year - grant.startYear;
    
    // If grant hasn't started yet or has fully vested
    if (grantAge < 0 || grantAge >= grant.vestingYears) {
      return 0;
    }
    
    // Get base vesting value for this year (without growth)
    const baseVestingValue = grant.value / grant.vestingYears;
    
    // Apply annual stock growth compounded for each year after grant started
    // Note: First year has no growth, as growth only applies from the following year
    if (grantAge === 0) {
      return baseVestingValue;
    } else {
      // Apply compound growth for (grantAge) years
      return baseVestingValue * Math.pow(1 + stockGrowthRate / 100, grantAge);
    }
  };
  
  // Get total growth-adjusted vesting for a specific year
  const getGrowthAdjustedVestingForYear = (year: number): number => {
    return allGrants.reduce((sum, grant) => sum + getGrowthAdjustedValueForGrant(grant, year), 0);
  };
  
  // Calculate the total per year including salary and growth-adjusted vesting
  const getTotalPerYear = (year: number): number => {
    const yearIndex = year; // The year is already 0-indexed at this point
    const salaryInYear = baseSalary * Math.pow(1 + salaryGrowth / 100, yearIndex);
    const vestingInYear = getGrowthAdjustedVestingForYear(year);
    const bonusInYear = getBonusForYear(year);
    return salaryInYear + vestingInYear + bonusInYear;
  };
  
  // Calculate bonus for a specific year
  const getBonusForYear = (year: number): number => {
    // Start bonus from year 1 instead of year 2 (0-indexed means year 0 is first year)
    if (!includeBonuses) {
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
    for (let i = 0; i <= year; i++) {
      const salaryInYear = baseSalary * Math.pow(1 + salaryGrowth / 100, i);
      const yearlyBonus = salaryInYear * (bonusPercent / 100);
      // Apply compound growth for (year - i) years
      const growthFactor = Math.pow(1 + stockGrowthRate / 100, year - i);
      totalBonus += yearlyBonus * growthFactor;
    }
    
    return totalBonus;
  };
  
  // Get cumulative bonuses up to a specific year
  const getCumulativeBonuses = (year: number): number => {
    if (!includeBonuses) {
      return 0;
    }
    
    let total = 0;
    for (let i = 0; i <= year; i++) {
      total += getBonusForYear(i);
    }
    return total;
  };
  
  // Get cumulative growth-adjusted bonuses up to a specific year
  const getCumulativeGrowthAdjustedBonuses = (year: number): number => {
    if (!includeBonuses || !treatBonusesAsEquity) {
      return getCumulativeBonuses(year);
    }
    
    return getGrowthAdjustedBonusForYear(year);
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
  const annualGrants = allGrants.filter(grant => grant.type === 'annual');
  
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
              <CardTitle className="text-lg">Display Options</CardTitle>
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
                    const salaryInYear = baseSalary * Math.pow(1 + salaryGrowth / 100, yearIndex);
                    return (
                      <TableCell key={`salary-${year}`} className="text-right table-text-sm">
                        {formatCurrency(salaryInYear)}
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
                      const basicBonus = getBonusForYear(yearIndex);
                      
                      if (treatBonusesAsEquity && year >= 1) {
                        const salaryInYear = baseSalary * Math.pow(1 + salaryGrowth / 100, yearIndex);
                        const currentYearBonus = salaryInYear * (bonusPercent / 100);
                        const growthAdjustedValue = getGrowthAdjustedBonusForYear(yearIndex);
                        const growthAmount = growthAdjustedValue - getCumulativeBonuses(yearIndex);
                        
                        return (
                          <TableCell key={`bonus-${year}`} className="text-right table-text-sm">
                            {formatCurrency(currentYearBonus)}
                            {growthAmount > 0 && (
                              <div className="text-xs text-green-600 mt-1">
                                (+{formatCurrency(growthAmount)})
                              </div>
                            )}
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
                      const baseValue = getVestingForGrantInYear(newHireGrant, year - 1);
                      const growthAdjustedValue = getGrowthAdjustedValueForGrant(newHireGrant, year - 1);
                      const showGrowth = baseValue > 0 && growthAdjustedValue > baseValue;
                      
                      return (
                        <TableCell key={`newhire-${year}`} className="text-right table-text-sm">
                          {formatCurrency(growthAdjustedValue)}
                          {showGrowth && (
                            <div className="text-xs text-green-600 mt-1">
                              (+{formatCurrency(growthAdjustedValue - baseValue)})
                            </div>
                          )}
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
                      const baseValue = getVestingForGrantInYear(grant, year - 1);
                      const growthAdjustedValue = getGrowthAdjustedValueForGrant(grant, year - 1);
                      const showGrowth = baseValue > 0 && growthAdjustedValue > baseValue;
                      
                      return (
                        <TableCell key={`${grant.id}-${year}`} className="text-right table-text-sm">
                          {formatCurrency(growthAdjustedValue)}
                          {showGrowth && (
                            <div className="text-xs text-green-600 mt-1">
                              (+{formatCurrency(growthAdjustedValue - baseValue)})
                            </div>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
              
              {/* Table Footer with Totals */}
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
                    return (
                      <TableCell key={`total-growth-${year}`} className="text-right">
                        {formatCurrency(growthValue)}
                        {growthDiff > 0 && (
                          <div className="text-xs text-green-600 mt-1">
                            (+{formatCurrency(growthDiff)})
                          </div>
                        )}
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
                        
                        return (
                          <TableCell key={`cumulative-base-${year}`} className="text-right">
                            {formatCurrency(totalValue)}
                            {bonusAsEquity > 0 && (
                              <div className="text-xs text-blue-600 mt-1">
                                (incl. {formatCurrency(bonusAsEquity)} bonus)
                              </div>
                            )}
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
                          ? getGrowthAdjustedBonusForYear(year - 1) 
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
                        
                        return (
                          <TableCell key={`cumulative-growth-${year}`} className="text-right">
                            {formatCurrency(totalWithGrowth)}
                            {growthDiff > 0 && (
                              <div className="text-xs text-green-600 mt-1">
                                (+{formatCurrency(growthDiff)})
                              </div>
                            )}
                            {bonusWithGrowth > 0 && (
                              <div className="text-xs text-blue-600 mt-1">
                                (incl. {formatCurrency(bonusWithGrowth)} bonus)
                              </div>
                            )}
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
                  {years.map(year => (
                    <TableCell key={`total-with-salary-${year}`} className="text-right">
                      {formatCurrency(getTotalPerYear(year - 1))}
                    </TableCell>
                  ))}
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
                  {years.map(year => (
                    <TableCell key={`cumulative-total-${year}`} className="text-right">
                      {formatCurrency(getCumulativeTotal(year - 1))}
                    </TableCell>
                  ))}
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