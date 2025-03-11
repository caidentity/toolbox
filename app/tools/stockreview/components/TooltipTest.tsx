'use client';

import React from 'react';
import Tooltip from '@/components/ui/Tooltip';
import { Card, CardContent } from '@/components/ui/Card';

const TooltipTest: React.FC = () => {
  return (
    <Card className="max-w-lg mx-auto my-8">
      <CardContent className="p-6">
        <h2 className="text-xl font-bold mb-4">Tooltip Test</h2>
        
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <span>Default width:</span>
            <Tooltip content="This is a test tooltip with default width settings" position="top" variant="light">
              <span className="ml-1 text-blue-500 hover:text-blue-700 cursor-help inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">ⓘ</span>
            </Tooltip>
          </div>
          
          <div className="flex items-center space-x-2">
            <span>Custom min width (250px):</span>
            <Tooltip 
              content="This tooltip has a minimum width of 250px to ensure it has enough space for longer content"
              position="right" 
              variant="light"
              minWidth={250}
            >
              <span className="ml-1 text-blue-500 hover:text-blue-700 cursor-help inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">ⓘ</span>
            </Tooltip>
          </div>
          
          <div className="flex items-center space-x-2">
            <span>Custom max width (200px):</span>
            <Tooltip 
              content="This tooltip has a maximum width of 200px which will restrict how wide it can get even with long content"
              position="bottom" 
              variant="light"
              maxWidth={200}
            >
              <span className="ml-1 text-blue-500 hover:text-blue-700 cursor-help inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">ⓘ</span>
            </Tooltip>
          </div>
          
          <div className="flex items-center space-x-2">
            <span>Fixed width (300px):</span>
            <Tooltip 
              content="This tooltip has both min and max width set to 300px, effectively giving it a fixed width"
              position="left" 
              variant="light"
              minWidth={300}
              maxWidth={300}
            >
              <span className="ml-1 text-blue-500 hover:text-blue-700 cursor-help inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">ⓘ</span>
            </Tooltip>
          </div>
          
          <div className="flex items-center space-x-2">
            <span>Wide tooltip (400px):</span>
            <Tooltip 
              content="This is a wide tooltip that can accommodate longer explanations or descriptions. It's useful when you need to show more content in the tooltip without making it too tall."
              position="top" 
              variant="dark"
              minWidth={400}
            >
              <span className="ml-1 text-blue-500 hover:text-blue-700 cursor-help inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">ⓘ</span>
            </Tooltip>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TooltipTest; 