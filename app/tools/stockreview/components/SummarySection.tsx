import React, { ReactNode } from 'react';
import SummaryCard from './SummaryCard';

interface SummarySectionProps {
  /**
   * Base annual salary
   */
  baseSalary: number;
  
  /**
   * Whether to show new hire grants
   */
  showNewHireGrants: boolean;
  
  /**
   * Value of the new hire grant
   */
  newHireGrantValue: number;
  
  /**
   * Total value of all grants combined
   */
  totalGrantValue: number;
  
  /**
   * Annual stock growth rate percentage
   */
  stockGrowthRate: number;
  
  /**
   * Whether to include bonuses in calculations
   */
  includeBonuses: boolean;
  
  /**
   * Bonus as a percentage of salary
   */
  bonusPercent: number;
  
  /**
   * Number of years to project
   */
  projectionYears: number;
  
  /**
   * Whether to treat bonuses as equity (apply stock growth)
   */
  treatBonusesAsEquity: boolean;
  
  /**
   * Function to format currency values
   */
  formatCurrency: (amount: number) => string;
  
  /**
   * Function to get cumulative total for a year
   */
  getCumulativeTotal: (year: number) => number;
  
  /**
   * Function to get cumulative bonuses for a year
   */
  getCumulativeBonuses: (year: number) => number;
  
  /**
   * Yearly breakdown data
   */
  yearlyBreakdown: { cumulativeVested: number }[];
  
  /**
   * Custom class name for the section
   */
  className?: string;
  
  /**
   * Custom title for the section
   */
  title?: string;
  
  /**
   * Additional card components to render after the standard ones
   */
  additionalCards?: ReactNode;
}

/**
 * SummarySection component that displays a grid of summary cards
 * with financial information about stock grants and compensation
 */
const SummarySection: React.FC<SummarySectionProps> = ({
  baseSalary,
  showNewHireGrants,
  newHireGrantValue,
  totalGrantValue,
  stockGrowthRate,
  includeBonuses,
  bonusPercent,
  projectionYears,
  treatBonusesAsEquity,
  formatCurrency,
  getCumulativeTotal,
  getCumulativeBonuses,
  yearlyBreakdown,
  className = '',
  title = 'Summary',
  additionalCards,
}) => {
  return (
    <div className={`summary-section ${className}`}>
      <h3 className="summary-title">{title}</h3>
      <div className="summary-grid">
        <SummaryCard
          label="Base Salary"
          value={formatCurrency(baseSalary)}
          tooltipContent="Your annual base compensation before any additional benefits or equity"
        />
        
        <SummaryCard
          label="New Hire Grant"
          value={showNewHireGrants ? formatCurrency(newHireGrantValue) : '$0'}
          tooltipContent="The initial equity grant offered when joining the company"
        />
        
        <SummaryCard
          label="Total Grant Value"
          value={formatCurrency(totalGrantValue)}
          tooltipContent="The combined value of all equity grants (new hire and annual)"
        />
        
        <SummaryCard
          label="Stock Growth Rate"
          value={`${stockGrowthRate}% per year`}
          tooltipContent="The annual percentage increase in stock value used for calculations"
        />
        
        <SummaryCard
          label="Bonus Rate"
          value={includeBonuses ? `${bonusPercent}% of Salary` : 'Disabled'}
          tooltipContent="The annual bonus as a percentage of base salary"
        />
        
        <SummaryCard
          label="Total Stock Growth Value"
          value={formatCurrency(
            getCumulativeTotal(projectionYears - 1) - 
            (baseSalary * projectionYears + totalGrantValue + 
             (includeBonuses ? (treatBonusesAsEquity ? 0 : getCumulativeBonuses(projectionYears - 1)) : 0))
          )}
          tooltipContent="The additional value generated from stock price appreciation over the entire period"
        />
        
        <SummaryCard
          label="Cumulative Equity (Base)"
          value={formatCurrency(
            yearlyBreakdown[yearlyBreakdown.length - 1]?.cumulativeVested || 0 + 
            (includeBonuses && treatBonusesAsEquity ? getCumulativeBonuses(projectionYears - 1) : 0)
          )}
          tooltipContent="The total equity value vested over the entire period without stock growth"
        />
        
        <SummaryCard
          label="Cumulative Equity (w/ Growth)"
          value={formatCurrency(
            getCumulativeTotal(projectionYears - 1) - 
            (baseSalary * projectionYears + 
             (includeBonuses ? (treatBonusesAsEquity ? 0 : getCumulativeBonuses(projectionYears - 1)) : 0))
          )}
          tooltipContent="The total equity value vested over the entire period with stock growth factored in"
        />
        
        <SummaryCard
          label={`Cumulative Total (${projectionYears} years)`}
          value={formatCurrency(getCumulativeTotal(projectionYears - 1))}
          tooltipContent={`The total compensation package over ${projectionYears} years, including salary, equity, and bonuses (if enabled)`}
        />
        
        {additionalCards}
      </div>
    </div>
  );
};

export default SummarySection; 