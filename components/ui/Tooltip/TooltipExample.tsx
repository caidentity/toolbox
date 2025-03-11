'use client';

import React, { useState } from 'react';
import Tooltip from './index';
import styles from './Tooltip.module.scss';

const TooltipExample: React.FC = () => {
  const [controlledVisible, setControlledVisible] = useState(false);

  return (
    <div style={{ 
      padding: '40px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '20px', 
      alignItems: 'flex-start' 
    }}>
      <h2>Tooltip Examples</h2>
      
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <h3>Positions</h3>
        <Tooltip content="Top tooltip (default)" position="top">
          <button>Hover me (Top)</button>
        </Tooltip>
        
        <Tooltip content="Bottom tooltip" position="bottom">
          <button>Hover me (Bottom)</button>
        </Tooltip>
        
        <Tooltip content="Left tooltip" position="left">
          <button>Hover me (Left)</button>
        </Tooltip>
        
        <Tooltip content="Right tooltip" position="right">
          <button>Hover me (Right)</button>
        </Tooltip>
      </div>
      
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <h3>Variants</h3>
        <Tooltip content="Default (Dark)" variant="dark">
          <button>Dark</button>
        </Tooltip>
        
        <Tooltip content="Light variant" variant="light">
          <button>Light</button>
        </Tooltip>
        
        <Tooltip content="Primary variant" variant="primary">
          <button>Primary</button>
        </Tooltip>
        
        <Tooltip content="Success variant" variant="success">
          <button>Success</button>
        </Tooltip>
        
        <Tooltip content="Warning variant" variant="warning">
          <button>Warning</button>
        </Tooltip>
        
        <Tooltip content="Error variant" variant="error">
          <button>Error</button>
        </Tooltip>
      </div>
      
      <div>
        <h3>Rich Content</h3>
        <Tooltip 
          content={
            <div>
              <h4 style={{ margin: '0 0 8px 0' }}>Rich Content</h4>
              <p style={{ margin: 0 }}>Tooltips can contain rich HTML content including:</p>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '16px' }}>
                <li>Lists</li>
                <li>Headings</li>
                <li>Any HTML elements</li>
              </ul>
            </div>
          }
          position="top"
        >
          <button>Rich Content Example</button>
        </Tooltip>
      </div>
      
      <div>
        <h3>Controlled Mode</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Tooltip 
            content="This tooltip is controlled programmatically" 
            forceVisible={controlledVisible}
          >
            <button>Controlled Tooltip</button>
          </Tooltip>
          <button onClick={() => setControlledVisible(!controlledVisible)}>
            {controlledVisible ? 'Hide' : 'Show'} Tooltip
          </button>
        </div>
      </div>
    </div>
  );
};

export default TooltipExample; 