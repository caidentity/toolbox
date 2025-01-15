'use client';

import OwnershipCalculator from '@/components/FinanceTools/OwnershipCalculator';

export default function FinanceToolsPage() {
  return (
    <div className="finance-tools-container p-6">
      <h1 className="text-3xl font-bold mb-6">Financial Analysis Tools</h1>
      <OwnershipCalculator />
    </div>
  );
} 