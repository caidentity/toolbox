import React from 'react';

interface TableProps {
  className?: string;
  children: React.ReactNode;
}

export const Table: React.FC<TableProps> = ({ className, children }) => (
  <table className={`w-full border-collapse border border-gray-200 ${className || ''}`}>
    {children}
  </table>
);

export const TableHeader: React.FC<TableProps> = ({ className, children }) => (
  <thead className={`bg-gray-50 border-b border-gray-300 ${className || ''}`}>
    {children}
  </thead>
);

export const TableBody: React.FC<TableProps> = ({ className, children }) => (
  <tbody className={`divide-y divide-gray-200 ${className || ''}`}>
    {children}
  </tbody>
);

export const TableRow: React.FC<TableProps> = ({ className, children }) => (
  <tr className={`border-b border-gray-200 hover:bg-gray-50 ${className || ''}`}>
    {children}
  </tr>
);

export const TableHead: React.FC<TableProps> = ({ className, children }) => (
  <th className={`py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0 ${className || ''}`}>
    {children}
  </th>
);

export const TableCell: React.FC<TableProps> = ({ className, children }) => (
  <td className={`py-4 px-6 border-r border-gray-200 last:border-r-0 ${className || ''}`}>
    {children}
  </td>
);

export const TableFooter: React.FC<TableProps> = ({ className, children }) => (
  <tfoot className={`bg-gray-50 border-t border-gray-300 font-semibold ${className || ''}`}>
    {children}
  </tfoot>
);

export default Table; 