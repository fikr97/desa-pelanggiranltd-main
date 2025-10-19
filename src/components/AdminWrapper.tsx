import React from 'react';
import { AdminThemeProvider } from '@/components/AdminThemeProvider';

interface AdminWrapperProps {
  children: React.ReactNode;
}

const AdminWrapper: React.FC<AdminWrapperProps> = ({ children }) => {
  return (
    <AdminThemeProvider defaultTheme="system" storageKey="desa-admin-theme">
      {children}
    </AdminThemeProvider>
  );
};

export default AdminWrapper;