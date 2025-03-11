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
import SummarySection from './SummarySection';
import FilterCard from './FilterCard';
import FormField from './FormField';
import EditorSection from './EditorSection';

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
  
  // ESPP settings
  const [includeESPP, setIncludeESPP] = useState<boolean>(false);
  const [esppContribution, setEsppContribution] = useState<number>(30000); // Max $30K per year
  
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
    
    // Get ESPP for the year
    const esppInYear = getYearlyESPPValue(year);
    
    return salaryInYear + vestingInYear + bonusInYear + esppInYear;
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
  
  // Calculate growth-adjusted bonus for a specific year
  const getGrowthAdjustedBonusForYear = (year: number): number => {
    // If bonuses are disabled, not treated as equity, or after leaving year
    if (!includeBonuses || !treatBonusesAsEquity || year >= leavingYear) {
      return getBonusForYear(year);
    }
    
    // Calculate the basic bonus for the current year (percentage of current salary)
    const salaryInYear = baseSalary * Math.pow(1 + salaryGrowth / 100, year);
    const currentYearBasicBonus = salaryInYear * (bonusPercent / 100);
    
    // For the first year (year 0), return just the basic bonus
    if (year === 0) {
      return currentYearBasicBonus;
    }
    
    // For subsequent years:
    // Total = Current year's basic bonus + ONLY the growth amount from previous year's bonus
    
    // Get previous year's total bonus value
    const previousYearBonus = getGrowthAdjustedBonusForYear(year - 1);
    
    // Calculate ONLY the growth amount from the previous year's bonus
    const growthFromPreviousBonus = previousYearBonus * (stockGrowthRate / 100);
    
    // Return the sum of the current year's basic bonus and ONLY the growth from previous year's bonus
    return currentYearBasicBonus + growthFromPreviousBonus;
  };
  
  // Calculate ESPP value for a specific year
  const getESPPForYear = (year: number): number => {
    // No ESPP after leaving year or if disabled
    if (!includeESPP || year >= leavingYear) {
      return 0;
    }

    // Base ESPP contribution with 15% discount
    const baseContribution = Math.min(esppContribution, 30000); // Cap at $30K
    const baseESPPValue = baseContribution * 1.15; // 15% instant addition
    
    // Calculate cumulative value with growth
    let cumulativeValue = 0;
    
    // For each year of contribution up to the current year
    for (let i = 0; i <= Math.min(year, leavingYear - 1); i++) {
      // Each year adds a new contribution
      // Apply growth based on how many years have passed since contribution
      const growthYears = year - i;
      const growthFactor = Math.pow(1 + stockGrowthRate / 100, growthYears);
      
      // Add this year's contribution with growth applied
      cumulativeValue += baseESPPValue * growthFactor;
    }
    
    return cumulativeValue;
  };
  
  // Get ESPP value for a specific year (non-cumulative, just for this year)
  const getYearlyESPPValue = (year: number): number => {
    // No ESPP after leaving year or if disabled
    if (!includeESPP || year >= leavingYear) {
      return 0;
    }
    
    // Base ESPP contribution with 15% discount for current year
    const baseContribution = Math.min(esppContribution, 30000); // Cap at $30K
    const baseESPPValue = baseContribution * 1.15; // 15% instant addition
    
    // First year is just the base value
    if (year === 0) {
      return baseESPPValue;
    }
    
    // For subsequent years:
    // 1. Current year's new contribution
    // 2. Growth on all previous years' contributions
    
    // Current year's contribution
    const currentYearContribution = baseESPPValue;
    
    // Get previous year's total value and calculate the growth amount
    const previousYearValue = getESPPForYear(year - 1);
    const growthOnPrevious = previousYearValue * (stockGrowthRate / 100);
    
    // For non-cumulative display, we only want to show:
    // 1. This year's new contribution
    // 2. The growth generated on previous contributions
    return currentYearContribution + growthOnPrevious;
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
          <FilterCard title="Global Settings">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                id="stockGrowthRate"
                label="Stock Growth Rate (%)"
                type="number"
                value={stockGrowthRate}
                onInputChange={(e) => setStockGrowthRate(Number(e.target.value))}
                layout="horizontal"
              />
              
              <FormField
                id="leavingYear"
                label="Leaving Year"
                type="number"
                value={leavingYear}
                onInputChange={(e) => {
                  const value = Number(e.target.value);
                  const constrainedValue = Math.min(value, projectionYears);
                  setLeavingYear(constrainedValue);
                }}
                min={1}
                max={projectionYears}
                tooltipContent="The last year you work at the company. You will receive salary and bonus in this year, but not beyond. Annual grants are only issued before this year. Existing grants continue vesting with stock growth after leaving."
                layout="horizontal"
              />
              
              <FormField
                id="showVestingDetails"
                label="Show Vesting Details"
                type="checkbox"
                value={showVestingDetails}
                onInputChange={(e) => setShowVestingDetails(e.target.checked)}
                layout="horizontal"
              />
              
              <FormField
                id="showCumulativeValue"
                label="Show Cumulative Value"
                type="checkbox"
                value={showCumulativeValue}
                onInputChange={(e) => setShowCumulativeValue(e.target.checked)}
                layout="horizontal"
              />
            </div>
          </FilterCard>
          
          {/* Editor grid layout - all filters on one row */}
          <div className="grid-editor">
            {/* Salary section */}
            <EditorSection title="Salary Details">
              <FormField
                id="baseSalary"
                label="Base Salary"
                type="number"
                value={baseSalary}
                onInputChange={(e) => setBaseSalary(Number(e.target.value))}
                layout="horizontal"
              />
              
              <FormField
                id="salaryGrowth"
                label="Annual Growth (%)"
                type="number"
                value={salaryGrowth}
                onInputChange={(e) => setSalaryGrowth(Number(e.target.value))}
                layout="horizontal"
              />
              
              <FormField
                id="projectionYears"
                label="Projection Years"
                type="number"
                value={projectionYears}
                onInputChange={(e) => setProjectionYears(Number(e.target.value))}
                layout="horizontal"
              />
            </EditorSection>
            
            {/* New Hire Grant section */}
            <EditorSection 
              title="New Hire Grant" 
              toggleable={true} 
              enabled={showNewHireGrants} 
              onToggleChange={(e) => setShowNewHireGrants(e.target.checked)}
            >
              <FormField
                id="newHireGrant"
                label="Grant Value"
                type="number"
                value={newHireGrant.value}
                onInputChange={(e) => setNewHireGrant({...newHireGrant, value: Number(e.target.value)})}
                disabled={!showNewHireGrants}
                layout="horizontal"
              />
              
              <FormField
                id="vestingYears"
                label="Vesting Years"
                type="number"
                value={newHireGrant.vestingYears}
                onInputChange={(e) => setNewHireGrant({...newHireGrant, vestingYears: Number(e.target.value)})}
                disabled={!showNewHireGrants}
                layout="horizontal"
              />
              
              <FormField
                id="startYear"
                label="Start Year (Displayed as Year {newHireGrant.startYear + 1})"
                type="number"
                value={newHireGrant.startYear}
                onInputChange={(e) => setNewHireGrant({...newHireGrant, startYear: Number(e.target.value)})}
                disabled={!showNewHireGrants}
                layout="horizontal"
              />
            </EditorSection>
            
            {/* Annual Grants section */}
            <EditorSection 
              title="Annual Grants" 
              toggleable={true} 
              enabled={showAnnualGrants} 
              onToggleChange={(e) => setShowAnnualGrants(e.target.checked)}
            >
              <FormField
                id="yearlyGrantPercent"
                label="Percent of Salary"
                type="number"
                value={yearlyGrantPercent}
                onInputChange={(e) => setYearlyGrantPercent(Number(e.target.value))}
                disabled={!showAnnualGrants}
                layout="horizontal"
              />
              
              <FormField
                id="annualGrantVestingYears"
                label="Vesting Years"
                type="number"
                value={annualGrantVestingYears}
                onInputChange={(e) => setAnnualGrantVestingYears(Number(e.target.value))}
                disabled={!showAnnualGrants}
                layout="horizontal"
              />
            </EditorSection>
            
            {/* Bonus Options */}
            <EditorSection 
              title="Bonus Options" 
              toggleable={true} 
              enabled={includeBonuses} 
              onToggleChange={(e) => setIncludeBonuses(e.target.checked)}
            >
              <FormField
                id="bonusPercent"
                label="Bonus Percent of Salary"
                type="number"
                value={bonusPercent}
                onInputChange={(e) => setBonusPercent(Number(e.target.value))}
                disabled={!includeBonuses}
                layout="horizontal"
              />
              
              <div className="flex items-center space-x-2 my-2">
                <input
                  type="checkbox"
                  id="treatBonusAsEquity"
                  checked={treatBonusesAsEquity}
                  onChange={(e) => setTreatBonusesAsEquity(e.target.checked)}
                  disabled={!includeBonuses}
                  className="rounded border-gray-300"
                />
                <Label 
                  htmlFor="treatBonusAsEquity"
                  className={!includeBonuses ? "text-gray-400" : ""}
                >
                  Treat bonuses as equity (apply stock growth)
                </Label>
              </div>
            </EditorSection>
            
            {/* ESPP Options */}
            <EditorSection 
              title="ESPP Options" 
              toggleable={true} 
              enabled={includeESPP} 
              onToggleChange={(e) => setIncludeESPP(e.target.checked)}
            >
              <FormField
                id="esppContribution"
                label="Annual Contribution ($)"
                type="number"
                value={esppContribution}
                onInputChange={(e) => setEsppContribution(Math.min(Number(e.target.value), 30000))}
                disabled={!includeESPP}
                layout="horizontal"
              />
              
              <div className="text-sm text-gray-500 mb-2">
                <p>ESPP contributions are capped at $30,000 per year.</p>
                <p>15% discount is automatically applied, and growth follows stock rate.</p>
              </div>
            </EditorSection>
          </div>
          
          {/* Summary section */}
          <SummarySection 
            baseSalary={baseSalary}
            showNewHireGrants={showNewHireGrants}
            newHireGrantValue={newHireGrant.value}
            totalGrantValue={totalGrantValue}
            stockGrowthRate={stockGrowthRate}
            includeBonuses={includeBonuses}
            bonusPercent={bonusPercent}
            projectionYears={projectionYears}
            treatBonusesAsEquity={treatBonusesAsEquity}
            formatCurrency={formatCurrency}
            getCumulativeTotal={getCumulativeTotal}
            getCumulativeBonuses={getCumulativeBonuses}
            yearlyBreakdown={yearlyBreakdown}
          />
          
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
                        const currentYearBasicBonus = salaryInYear * (bonusPercent / 100);
                        const growthAdjustedValue = getGrowthAdjustedBonusForYear(yearIndex);
                        
                        // Get previous year's bonus and calculate just the growth amount
                        const previousYearBonus = yearIndex > 0 ? getGrowthAdjustedBonusForYear(yearIndex - 1) : 0;
                        const growthFromPreviousBonus = previousYearBonus * (stockGrowthRate / 100);
                        
                        const tooltipContent = (
                          <div className="tooltip-calculation">
                            <div>Current Year Basic Bonus: {formatCurrency(currentYearBasicBonus)}</div>
                            {yearIndex > 0 && (
                              <>
                                <div>Previous Year Bonus: {formatCurrency(previousYearBonus)}</div>
                                <div>Growth Rate: {stockGrowthRate}%</div>
                                <div>Growth from Previous Bonus: +{formatCurrency(growthFromPreviousBonus)}</div>
                              </>
                            )}
                            <div>Total Bonus: {formatCurrency(growthAdjustedValue)}</div>
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
                
                {/* ESPP Row */}
                {includeESPP && (
                  <TableRow className="bg-gray-50">
                    <TableCell className="font-medium">
                      ESPP
                      <div className="text-xs text-gray-500 mt-1">
                        (${esppContribution.toLocaleString()} annual contribution with 15% discount)
                      </div>
                    </TableCell>
                    {years.map(year => {
                      const yearIndex = year - 1;
                      
                      // Don't show ESPP after leaving year
                      if (yearIndex >= leavingYear) {
                        return (
                          <TableCell key={`espp-${year}`} className="text-right table-text-sm">
                            —
                          </TableCell>
                        );
                      }
                      
                      const baseContribution = Math.min(esppContribution, 30000);
                      const baseESPPValue = baseContribution * 1.15; // 15% discount
                      const yearlyESPPValue = getYearlyESPPValue(yearIndex);
                      
                      // Calculate growth from previous years for the tooltip
                      const previousYearValue = yearIndex > 0 ? getESPPForYear(yearIndex - 1) : 0;
                      const growthAmount = yearIndex > 0 ? previousYearValue * (stockGrowthRate / 100) : 0;
                      
                      const tooltipContent = (
                        <div className="tooltip-calculation">
                          <div>New Contribution: {formatCurrency(baseContribution)}</div>
                          <div>With 15% Discount: {formatCurrency(baseESPPValue)}</div>
                          {yearIndex > 0 && (
                            <>
                              <div>Previous ESPP Total: {formatCurrency(previousYearValue)}</div>
                              <div>Growth Rate: {stockGrowthRate}%</div>
                              <div>Growth Amount: +{formatCurrency(growthAmount)}</div>
                            </>
                          )}
                          <div>This Year's Value: {formatCurrency(yearlyESPPValue)}</div>
                          <div>Cumulative ESPP Value: {formatCurrency(getESPPForYear(yearIndex))}</div>
                        </div>
                      );
                      
                      return (
                        <TableCell key={`espp-${year}`} className="text-right table-text-sm">
                          <Tooltip
                            content={tooltipContent}
                            position="top"
                            variant="light"
                            minWidth={250}
                            maxWidth={350}
                          >
                            <span className="cursor-help">{formatCurrency(yearlyESPPValue)}</span>
                          </Tooltip>
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
              </TableFooter>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockReviewCalculator;