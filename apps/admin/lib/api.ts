const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export class ApiError extends Error {
  constructor(
    public status: number,
    public title: string,
    public detail?: string,
    public data?: any,
  ) {
    super(detail || title || `API Error ${status}`);
    this.name = 'ApiError';
  }
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sports_admin_token');
}

export function setStoredToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('sports_admin_token', token);
}

export function removeStoredToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('sports_admin_token');
  localStorage.removeItem('sports_admin_profile');
}

export function getStoredUser(): any | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('sports_admin_profile');
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: any) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('sports_admin_profile', JSON.stringify(user));
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorData: any = {};
    try {
      errorData = await res.json();
    } catch {
      errorData = { title: res.statusText };
    }
    throw new ApiError(
      res.status,
      errorData.title || 'Lỗi xử lý yêu cầu máy chủ',
      errorData.detail || errorData.message,
      errorData,
    );
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  auth: {
    login: async (phone: string, password: string) => {
      const res = await request<any>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
      });
      if (res.accessToken) {
        setStoredToken(res.accessToken);
        if (res.user) setStoredUser(res.user);
      }
      return res;
    },
    getMe: async () => {
      const user = await request<any>('/api/v1/auth/me');
      setStoredUser(user);
      return user;
    },
  },

  // Analytics & Dashboard (M17)
  analytics: {
    getExecutiveDashboard: async () => {
      return request<any>('/api/v1/admin/analytics/realtime');
    },
    getRevenueReport: async (from?: string, to?: string) => {
      const query = from && to ? `?from=${from}&to=${to}` : '';
      return request<any>(`/api/v1/admin/analytics/revenue${query}`);
    },
    getOccupancyReport: async (date?: string) => {
      const query = date ? `?date=${date}` : '';
      return request<any>(`/api/v1/admin/analytics/occupancy${query}`);
    },
  },

  // Facilities & Operating Hours (M03)
  facilities: {
    getResources: async () => {
      return request<any[]>('/api/v1/facility/resources');
    },
    createResource: async (data: any) => {
      return request<any>('/api/v1/admin/facilities/resources', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateResource: async (id: string, data: any) => {
      return request<any>(`/api/v1/admin/facilities/resources/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    getOperatingHours: async () => {
      return request<any>('/api/v1/facility/operating-hours');
    },
    getPriceRules: async () => {
      return request<any[]>('/api/v1/facility/pricing');
    },
    createPriceRule: async (data: any) => {
      return request<any>('/api/v1/admin/facilities/pricing', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    createClosure: async (data: any) => {
      return request<any>('/api/v1/admin/facilities/closures', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    getClosures: async () => {
      return request<any[]>('/api/v1/admin/facilities/closures');
    },
  },

  // Bookings (M04)
  bookings: {
    getAll: async (params?: { date?: string; sportType?: string; status?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<any[]>(`/api/v1/admin/bookings?${query}`);
    },
    checkIn: async (id: string) => {
      return request<any>(`/api/v1/admin/bookings/${id}/check-in`, { method: 'POST' });
    },
    complete: async (id: string) => {
      return request<any>(`/api/v1/admin/bookings/${id}/complete`, { method: 'POST' });
    },
    cancel: async (id: string, reason?: string) => {
      return request<any>(`/api/v1/bookings/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },
    holdWalkIn: async (data: any) => {
      return request<any>('/api/v1/bookings/reserve', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    cleanupExpired: async () => {
      return request<any>('/api/v1/admin/bookings/cleanup-expired', { method: 'POST' });
    },
  },

  // Gym (M10)
  gym: {
    getCapacity: async () => {
      return request<any>('/api/v1/gym/capacity');
    },
    resetCapacity: async (reason: string) => {
      return request<any>('/api/v1/admin/gym/capacity/reset', {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },
    getMemberships: async (params?: { status?: string; search?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<any[]>(`/api/v1/admin/gym/memberships?${query}`);
    },
    assignRfid: async (membershipId: string, rfidCode: string) => {
      return request<any>(`/api/v1/admin/gym/memberships/${membershipId}/rfid`, {
        method: 'POST',
        body: JSON.stringify({ rfidCode }),
      });
    },
    getAccessEvents: async () => {
      return request<any[]>('/api/v1/admin/gym/access-events');
    },
  },

  // PT & Classes (M11)
  ptClass: {
    getTrainers: async () => {
      return request<any[]>('/api/v1/admin/pt-class/trainers');
    },
    createTrainer: async (data: any) => {
      return request<any>('/api/v1/admin/pt-class/trainers', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    getClasses: async () => {
      return request<any[]>('/api/v1/admin/pt-class/classes');
    },
    createClass: async (data: any) => {
      return request<any>('/api/v1/admin/pt-class/classes', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    getPtBookings: async () => {
      return request<any[]>('/api/v1/admin/pt-class/pt-bookings');
    },
  },

  // Canteen, Retail & Shifts (M12)
  canteen: {
    getProducts: async () => {
      return request<any[]>('/api/v1/admin/canteen/products');
    },
    createProduct: async (data: any) => {
      return request<any>('/api/v1/admin/canteen/products', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateProduct: async (id: string, data: any) => {
      return request<any>(`/api/v1/admin/canteen/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    createStockIn: async (data: any) => {
      return request<any>('/api/v1/admin/canteen/stock/in', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    createStockOut: async (data: any) => {
      return request<any>('/api/v1/admin/canteen/stock/out', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    auditStock: async (data: any) => {
      return request<any>('/api/v1/admin/canteen/stock/audit', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    getLowStock: async () => {
      return request<any[]>('/api/v1/admin/canteen/stock/low');
    },
    getCurrentShift: async () => {
      return request<any>('/api/v1/canteen/shifts/current');
    },
    openShift: async (openingCash: number, idempotencyKey: string) => {
      return request<any>('/api/v1/canteen/shifts/open', {
        method: 'POST',
        body: JSON.stringify({ openingCash, idempotencyKey }),
      });
    },
    closeShift: async (shiftId: string, closingCashActual: number) => {
      return request<any>(`/api/v1/canteen/shifts/${shiftId}/close`, {
        method: 'POST',
        body: JSON.stringify({ closingCashActual }),
      });
    },
    createPosOrder: async (data: any) => {
      return request<any>('/api/v1/canteen/orders', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    cancelOrder: async (id: string, reason: string) => {
      return request<any>(`/api/v1/admin/canteen/orders/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },
    getProfitReport: async () => {
      return request<any>('/api/v1/admin/canteen/profit-report');
    },
  },

  // Equipment Rental (M13)
  rentals: {
    getEquipment: async () => {
      return request<any[]>('/api/v1/admin/rentals/equipment');
    },
    createEquipment: async (data: any) => {
      return request<any>('/api/v1/admin/rentals/equipment', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateEquipment: async (id: string, data: any) => {
      return request<any>(`/api/v1/admin/rentals/equipment/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    getTickets: async (status?: string) => {
      const query = status ? `?status=${status}` : '';
      return request<any[]>(`/api/v1/admin/rentals/tickets${query}`);
    },
    createTicket: async (data: any) => {
      return request<any>('/api/v1/admin/rentals/tickets', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    returnTicket: async (ticketId: string, data: any) => {
      return request<any>(`/api/v1/admin/rentals/tickets/${ticketId}/return`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    getUsageReport: async () => {
      return request<any>('/api/v1/admin/rentals/usage-report');
    },
  },

  // Gaming (M14a)
  gaming: {
    getStations: async () => {
      return request<any[]>('/api/v1/admin/gaming/stations');
    },
    startSession: async (data: any) => {
      return request<any>('/api/v1/admin/gaming/sessions/start', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    endSession: async (sessionId: string) => {
      return request<any>(`/api/v1/admin/gaming/sessions/${sessionId}/end`, {
        method: 'POST',
      });
    },
    addTime: async (sessionId: string, minutes: number) => {
      return request<any>(`/api/v1/admin/gaming/sessions/${sessionId}/add-time`, {
        method: 'POST',
        body: JSON.stringify({ minutes }),
      });
    },
    lockMachine: async (machineId: string) => {
      return request<any>(`/api/v1/admin/gaming/stations/${machineId}/lock`, {
        method: 'POST',
      });
    },
  },

  // Tournaments (M16)
  tournaments: {
    getList: async () => {
      return request<any[]>('/api/v1/admin/tournaments');
    },
    create: async (data: any) => {
      return request<any>('/api/v1/admin/tournaments', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    approveTeam: async (tourId: string, teamId: string) => {
      return request<any>(`/api/v1/admin/tournaments/${tourId}/teams/${teamId}/approve`, {
        method: 'POST',
      });
    },
    updateMatchScore: async (tourId: string, matchId: string, data: any) => {
      return request<any>(`/api/v1/admin/tournaments/${tourId}/matches/${matchId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
  },

  // Promotions & Combos (M15)
  promotions: {
    getVouchers: async () => {
      return request<any[]>('/api/v1/admin/promotions/vouchers');
    },
    createVoucher: async (data: any) => {
      return request<any>('/api/v1/admin/promotions/vouchers', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    getCombos: async () => {
      return request<any[]>('/api/v1/admin/promotions/combos');
    },
    createCombo: async (data: any) => {
      return request<any>('/api/v1/admin/promotions/combos', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  // Finance, Wallets & Payments (M05, M06)
  finance: {
    getWalletDetail: async (userId: string) => {
      return request<any>(`/api/v1/admin/wallets/${userId}`);
    },
    reconcileWallet: async (userId: string) => {
      return request<any>(`/api/v1/admin/wallets/${userId}/reconcile`, { method: 'POST' });
    },
    adjustWallet: async (userId: string, data: { amount: number; reason: string; idempotencyKey: string }) => {
      return request<any>(`/api/v1/admin/wallets/${userId}/adjust`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    getPayments: async (params?: { status?: string; provider?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<any[]>(`/api/v1/admin/payments?${query}`);
    },
    getMismatchPayments: async () => {
      return request<any[]>('/api/v1/admin/payments/mismatches');
    },
    processCashPayment: async (data: any) => {
      return request<any>('/api/v1/admin/payments/cash', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  // Invoices (M08)
  invoices: {
    getList: async (params?: { status?: string; date?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<any[]>(`/api/v1/admin/invoices?${query}`);
    },
    retry: async (id: string) => {
      return request<any>(`/api/v1/admin/invoices/${id}/retry`, { method: 'POST' });
    },
    cancel: async (id: string, reason: string) => {
      return request<any>(`/api/v1/admin/invoices/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },
    getUninvoicedReport: async () => {
      return request<any>('/api/v1/admin/invoices/uninvoiced-report');
    },
  },

  // Bridge & Hardware Devices (M22)
  bridge: {
    getAgents: async () => {
      return request<any[]>('/api/v1/admin/bridge/agents');
    },
    registerAgent: async (data: any) => {
      return request<any>('/api/v1/admin/bridge/agents/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    dispatchCommand: async (data: any) => {
      return request<any>('/api/v1/admin/bridge/commands/dispatch', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    getEvents: async () => {
      return request<any[]>('/api/v1/admin/bridge/events');
    },
  },

  // Users & RBAC (M02)
  users: {
    getList: async (params?: { role?: string; search?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<any[]>(`/api/v1/admin/users?${query}`);
    },
    assignRole: async (userId: string, role: string) => {
      return request<any>(`/api/v1/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      });
    },
    lockUser: async (userId: string, reason: string) => {
      return request<any>(`/api/v1/admin/users/${userId}/lock`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },
    unlockUser: async (userId: string) => {
      return request<any>(`/api/v1/admin/users/${userId}/unlock`, {
        method: 'POST',
      });
    },
    getAuditLogs: async (query?: any) => {
      const q = new URLSearchParams(query || {}).toString();
      return request<any[]>(`/api/v1/admin/users/audit-logs?${q}`);
    },
  },

  // Settings (M03 - Appendix C)
  settings: {
    getAll: async () => {
      return request<any[]>('/api/v1/admin/settings');
    },
    update: async (key: string, value: any, reason: string) => {
      return request<any>(`/api/v1/admin/settings/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value, reason }),
      });
    },
  },
};
