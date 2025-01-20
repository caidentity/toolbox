import { useState } from 'react';
import { Menu } from '.';
import  Button from '../Button';

export const Example = () => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      label: 'Profile',
      leftIcon: 'user',  // Glyphkit icon name
      rightIcon: 'chevron-right',  // Glyphkit icon name
      onClick: () => console.log('Profile clicked'),
    },
    {
      label: 'Settings',
      leftIcon: 'settings',
      rightIcon: 'chevron-right',
      onClick: () => console.log('Settings clicked'),
    },
    {
      label: 'Logout',
      leftIcon: 'log-out',
      onClick: () => console.log('Logout clicked'),
      disabled: false,
    },
    // Example of custom content
    {
      children: (
        <div style={{ padding: '8px 0', borderTop: '1px solid var(--border-color)' }}>
          Custom Content
        </div>
      ),
    },
  ];

  return (
    <div style={{ position: 'relative' }}>
      <Button 
        onClick={() => setIsOpen(true)}
        variant="secondary"
        rightIcon="chevron-down"
      >
        Open Menu
      </Button>
      <Menu
        items={menuItems}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
};