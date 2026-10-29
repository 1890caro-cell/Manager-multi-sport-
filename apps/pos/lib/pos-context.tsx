'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getPosToken, setPosToken, setPosUser, getPosUser } from './api';
import { ShiftModal } from '@/components/ShiftModal';

export interface POSUser {
  id: string;
  fullName: string;
  phone: string;
  role: 'CASHIER' | 'MANAGER' | 'ADMIN';
  permissions: string[];
}

export interface POSShift {
  id: string;
  shiftCode?: string;
  cashierId?: string;
  cashierName?: string;
  openedAt: string;
  initialFloat: number;
  cashSales: number;
  vietQrSales: number;
  walletSales: number;
  expectedCash: number;
  totalOrdersCount: number;
  status?: 'OPEN' | 'CLOSED';
}

interface POSContextType {
  currentUser: POSUser | null;
  currentShift: POSShift | null;
  bridgeOnline: boolean;
  shiftModalMode: 'OPEN' | 'CLOSE' | null;
  isAuthModalOpen: boolean;
  openShiftModal: (mode?: 'OPEN' | 'CLOSE') => void;
  closeShiftModal: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  loginUser: (phone: string, pin: string) => Promise<POSUser>;
  switchUser: (targetRole: 'CASHIER' | 'MANAGER' | 'ADMIN') => Promise<void>;
  startShift: (initialFloat: number, notes?: string) => Promise<void>;
  endShift: (actualCash: number, notes?: string) => Promise<void>;
  refreshShift: () => Promise<void>;
  recordSale: (paymentMethod: string, amount: number) => void;
}

const DEFAULT_STAFF_ACCOUNTS: Record<'CASHIER' | 'MANAGER' | 'ADMIN', { phone: string; name: string; role: 'CASHIER' | 'MANAGER' | 'ADMIN' }> = {
  CASHIER: {
    phone: '0966666666',
    name: 'Thu ngân Quầy POS',
    role: 'CASHIER',
  },
  MANAGER: {
    phone: '0977777777',
    name: 'Giám đốc Vận hành',
    role: 'MANAGER',
  },
  ADMIN: {
    phone: '0988888888',
    name: 'Quản trị viên Hệ thống',
    role: 'ADMIN',
  },
};

const POSContext = createContext<POSContextType | undefined>(undefined);

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<POSUser | null>(null);
  const [currentShift, setCurrentShiftState] = useState<POSShift | null>(null);
  const [shiftModalMode, setShiftModalMode] = useState<'OPEN' | 'CLOSE' | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [bridgeOnline] = useState(true);

  // Initialize from localStorage or default cashier
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load stored shift
    const storedShift = localStorage.getItem('pos_active_shift');
    if (storedShift) {
      try {
        setCurrentShiftState(JSON.parse(storedShift));
      } catch {}
    } else {
      // Default initial mock shift if non-existent
      const initialShift: POSShift = {
        id: 'SHIFT-20261026-01',
        shiftCode: 'SHIFT-20261026-01',
        cashierName: 'Thu ngân Quầy POS',
        openedAt: '2026-10-26T07:00:00Z',
        initialFloat: 1000000,
        cashSales: 3450000,
        vietQrSales: 1820000,
        walletSales: 650000,
        expectedCash: 4450000,
        totalOrdersCount: 28,
        status: 'OPEN',
      };
      setCurrentShiftState(initialShift);
      localStorage.setItem('pos_active_shift', JSON.stringify(initialShift));
    }

    // Load stored user or auto-login default Cashier
    const storedUser = getPosUser();
    if (storedUser) {
      setCurrentUserState(storedUser);
    } else {
      // Auto-authenticate as default CASHIER
      loginUser('0966666666', 'Sports@123456').catch(() => {
        // Fallback local user if network glitch
        const defaultUser: POSUser = {
          id: 'pos_cashier_default',
          fullName: 'Thu ngân Quầy POS',
          phone: '0966666666',
          role: 'CASHIER',
          permissions: ['POS_CHECKOUT', 'RENTAL_DISPATCH'],
        };
        setCurrentUserState(defaultUser);
        setPosUser(defaultUser);
      });
    }

    // Cross-tab sync
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pos_active_shift') {
        setCurrentShiftState(e.newValue ? JSON.parse(e.newValue) : null);
      }
      if (e.key === 'pos_user') {
        setCurrentUserState(e.newValue ? JSON.parse(e.newValue) : null);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loginUser = async (phone: string, pin: string): Promise<POSUser> => {
    const res = await api.auth.login(phone, pin);
    const user = res.user;
    const posUser: POSUser = {
      id: user.id || user._id,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      permissions: user.permissions || [],
    };
    setCurrentUserState(posUser);
    setPosUser(posUser);
    return posUser;
  };

  const switchUser = async (targetRole: 'CASHIER' | 'MANAGER' | 'ADMIN') => {
    const account = DEFAULT_STAFF_ACCOUNTS[targetRole];
    await loginUser(account.phone, 'Sports@123456');
  };

  const refreshShift = useCallback(async () => {
    try {
      const active = await api.shifts.getCurrent();
      if (active) {
        const formatted: POSShift = {
          id: active.shiftCode || active._id,
          shiftCode: active.shiftCode,
          cashierId: active.cashierId,
          cashierName: active.cashierName || currentUser?.fullName || 'Thu ngân',
          openedAt: active.openedAt,
          initialFloat: active.openingCash || 1000000,
          cashSales: active.totalCashSales || 0,
          vietQrSales: active.totalQrSales || 0,
          walletSales: active.totalWalletSales || 0,
          expectedCash: (active.openingCash || 1000000) + (active.totalCashSales || 0),
          totalOrdersCount: active.totalOrders || 0,
          status: 'OPEN',
        };
        setCurrentShiftState(formatted);
        localStorage.setItem('pos_active_shift', JSON.stringify(formatted));
      }
    } catch {
      // Keep existing local shift
    }
  }, [currentUser]);

  const startShift = async (initialFloat: number, notes?: string) => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const shiftCode = `SHIFT-${todayStr}-${rand}`;

    const newShift: POSShift = {
      id: shiftCode,
      shiftCode,
      cashierId: currentUser?.id,
      cashierName: currentUser?.fullName || 'Thu ngân Quầy POS',
      openedAt: now.toISOString(),
      initialFloat,
      cashSales: 0,
      vietQrSales: 0,
      walletSales: 0,
      expectedCash: initialFloat,
      totalOrdersCount: 0,
      status: 'OPEN',
    };

    try {
      await api.shifts.open({ openingCash: initialFloat, notes });
    } catch {
      // Local fallback
    }

    setCurrentShiftState(newShift);
    localStorage.setItem('pos_active_shift', JSON.stringify(newShift));
    setShiftModalMode(null);
  };

  const endShift = async (actualCash: number, notes?: string) => {
    if (currentShift?.id && !currentShift.id.startsWith('SHIFT-20261026')) {
      try {
        await api.shifts.close(currentShift.id, { actualCash, notes });
      } catch {}
    }

    setCurrentShiftState(null);
    localStorage.removeItem('pos_active_shift');
    setShiftModalMode(null);
  };

  const recordSale = (paymentMethod: string, amount: number) => {
    setCurrentShiftState((prev) => {
      if (!prev) return null;
      const updated: POSShift = {
        ...prev,
        cashSales: paymentMethod === 'CASH' ? prev.cashSales + amount : prev.cashSales,
        vietQrSales: paymentMethod === 'VIETQR' ? prev.vietQrSales + amount : prev.vietQrSales,
        walletSales: paymentMethod === 'WALLET' ? prev.walletSales + amount : prev.walletSales,
        expectedCash: paymentMethod === 'CASH' ? prev.expectedCash + amount : prev.expectedCash,
        totalOrdersCount: prev.totalOrdersCount + 1,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_active_shift', JSON.stringify(updated));
      }
      return updated;
    });
  };

  return (
    <POSContext.Provider
      value={{
        currentUser,
        currentShift,
        bridgeOnline,
        shiftModalMode,
        isAuthModalOpen,
        openShiftModal: (mode = 'OPEN') => setShiftModalMode(mode),
        closeShiftModal: () => setShiftModalMode(null),
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        loginUser,
        switchUser,
        startShift,
        endShift,
        refreshShift,
        recordSale,
      }}
    >
      {children}

      {/* Global Unified Shift Modal */}
      {shiftModalMode && (
        <ShiftModal
          visible={!!shiftModalMode}
          onClose={() => setShiftModalMode(null)}
          mode={shiftModalMode}
          cashierName={currentUser?.fullName || 'Thu ngân Quầy POS'}
          currentShiftData={currentShift || undefined}
          onSuccess={() => {
            if (shiftModalMode === 'OPEN') {
              startShift(1000000);
            } else {
              endShift(currentShift?.expectedCash || 0);
            }
          }}
        />
      )}
    </POSContext.Provider>
  );
};

export const usePOS = (): POSContextType => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};
