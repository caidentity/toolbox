import React, { ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface FilterCardProps {
  /**
   * Title of the filter card
   */
  title: string;
  
  /**
   * Content to display in the card
   */
  children: ReactNode;
}

/**
 * FilterCard component for grouping related filters/global settings
 * with consistent styling and layout
 */
const FilterCard: React.FC<FilterCardProps> = ({
  title,
  children,
}) => {
  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};

export default FilterCard; 