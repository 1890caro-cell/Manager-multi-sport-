'use client';

import React from 'react';
import { POSProvider } from '@/lib/pos-context';
import { StaffAuthModal } from '@/components/StaffAuthModal';

export const POSClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <POSProvider>
      {children}
      <StaffAuthModal />
    </POSProvider>
  );
};
