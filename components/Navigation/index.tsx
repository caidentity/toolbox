'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '../ThemeProvider';
import './Navigation.scss';

type Tool = {
  name: string;
  path: string;
};

const tools: Tool[] = [
  { name: 'Color Palette Generator', path: '/tools/color-palette' },
  { name: 'Tool Placeholder', path: '/tools/placeholder' },
  { name: 'Mesh Gradient Editor', path: '/tools/mesh-gradient' },
  { name: 'Finance', path: '/tools/finance-app' },
];

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  
  const currentTool = tools.find(tool => tool.path === pathname) ?? tools[0];

  return (
    <nav className="tools-navigation">
      <div className="tools-label">Tools</div>
      <div 
        className="tools-navigation__selector"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{currentTool.name}</span>
        <svg 
          className={`tools-navigation__arrow ${isOpen ? 'open' : ''}`}
          width="12" 
          height="8" 
          viewBox="0 0 12 8"
        >
          <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </div>
      
      {isOpen && (
        <div className="tools-navigation__dropdown">
          {tools.map((tool) => (
            <Link
              key={tool.path}
              href={tool.path}
              className={`tools-navigation__item ${
                pathname === tool.path ? 'active' : ''
              }`}
              onClick={() => setIsOpen(false)}
            >
              {tool.name}
            </Link>
          ))}
        </div>
      )}
      <button 
        onClick={toggleTheme}
        className="theme-toggle"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </nav>
  );
} 