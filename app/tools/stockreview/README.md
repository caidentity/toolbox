# Stock Review App

This is a Next.js app for tracking and analyzing stock grants, vesting schedules, and their value over time.

## Features

- Track base salary and annual salary growth
- Configure new hire grant value and vesting schedule
- Set up annual grants based on salary percentage
- Filter to include/exclude specific grant types
- Visualize yearly breakdown of salary, grants, vesting, and cumulative value
- Customize display options to show/hide specific data points

## Usage

1. **Salary Details**:
   - Enter your base salary and expected annual growth percentage
   - Set the number of years for the projection

2. **New Hire Grant**:
   - Toggle to include/exclude new hire grants
   - Set the grant value, vesting years, and start year

3. **Annual Grants**:
   - Toggle to include/exclude annual grants
   - Set the percentage of salary and vesting years

4. **Display Options**:
   - Customize which details appear in the table
   - Toggle vesting details and cumulative values

## Components

The app is structured into the following components:

- `page.tsx` - Main page container
- `components/StockReviewCalculator.tsx` - Core calculator logic and UI
- `components/Table.tsx` - Custom table components
- `components/StockReview.css` - Custom styling

## Example Scenario

The default configuration models a scenario with:
- $200,000 base salary with 3% annual growth
- $180,000 new hire grant vesting over 4 years, starting after year 1
- Annual grants equal to 60% of current salary, vesting over 4 years
- 10-year projection period 