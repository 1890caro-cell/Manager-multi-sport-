/**
 * Typed POS API Client kết nối NestJS Backend API
 * Tuân thủ Rule 00-invariants.md và RFC 7807 Problem Details
 */

export class ApiError extends Error {
  status: number;
  type?: string;
  title?: string;
  detail?: string;

  constructor(status: number, data: any) {
    const message = data?.detail || data?.message || data?.title || 'Lỗi kết nối máy chủ';
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.type = data?.type;
    this.title = data?.title;
    this.detail = data?.detail || data?.message;
  }
}

let posToken: string | null = null;
let posUser: any | null = null;

export function setPosToken(token: string | null) {
  posToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('pos_token', token);
    } else {
      localStorage.removeItem('pos_token');
    }
  }
}

export function getPosToken(): string | null {
  if (posToken) return posToken;
  if (typeof window !== 'undefined') {
    posToken = localStorage.getItem('pos_token');
  }
  return posToken;
}

export function setPosUser(user: any | null) {
  posUser = user;
  if (typeof window !== 'undefined') {
    if (user) {
      localStorage.setItem('pos_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('pos_user');
    }
  }
}

export function getPosUser(): any | null {
  if (posUser) return posUser;
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('pos_user');
    if (raw) {
      try {
        posUser = JSON.parse(raw);
      } catch {}
    }
  }
  return posUser;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getPosToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errData: any = {};
    try {
      errData = await res.json();
    } catch {
      errData = { message: res.statusText };
    }
    throw new ApiError(res.status, errData);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

export const api = {
  // Auth
  auth: {
    login: async (phone: string, pin: string) => {
      const res = await request<any>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password: pin }),
      });
      const token = res?.accessToken || res?.tokens?.accessToken || res?.data?.accessToken;
      const user = res?.user || res?.data?.user;
      if (token) {
        setPosToken(token);
      }
      if (user) {
        setPosUser(user);
      }
      return { token, user };
    },
    getProfile: async () => {
      const res = await request<{ data: any }>('/api/v1/auth/profile');
      return res.data;
    },
  },

  // Shifts (M12 / F12.5)
  shifts: {
    getCurrent: async () => {
      try {
        const res = await request<{ data: any }>('/api/v1/canteen/shifts/current');
        return res.data;
      } catch {
        return null;
      }
    },
    getCurrentShift: async () => {
      const res = await request<{ data: any }>('/api/v1/canteen/shifts/current');
      return res.data;
    },
    open: async (dto: { openingCash: number; notes?: string }) => {
      const res = await request<{ data: any }>('/api/v1/canteen/shifts/open', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      return res.data;
    },
    openShift: async (initialFloat: number, cashierId?: string) => {
      const res = await request<{ data: any }>('/api/v1/canteen/shifts/open', {
        method: 'POST',
        body: JSON.stringify({ initialFloat, cashierId }),
      });
      return res.data;
    },
    close: async (shiftId: string, dto: { actualCash: number; notes?: string }) => {
      const res = await request<{ data: any }>(`/api/v1/canteen/shifts/${shiftId}/close`, {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      return res.data;
    },
    closeShift: async (shiftId: string, actualCash: number, notes?: string) => {
      const res = await request<{ data: any }>(`/api/v1/canteen/shifts/${shiftId}/close`, {
        method: 'POST',
        body: JSON.stringify({ actualCash, notes }),
      });
      return res.data;
    },
    getShiftHistory: async () => {
      const res = await request<{ data: any[] }>('/api/v1/canteen/shifts');
      return res.data || [];
    },
  },

  // Products Catalog (M12)
  products: {
    getAll: async (category?: string, search?: string) => {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (search) params.set('search', search);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await request<{ data: any[] }>(`/api/v1/canteen/products${qs}`);
      return res.data || [];
    },
    getByBarcode: async (barcode: string) => {
      const res = await request<{ data: any }>(`/api/v1/canteen/products/barcode/${barcode}`);
      return res.data;
    },
  },

  // Orders & Fast Checkout (F12.2 - F12.4)
  orders: {
    create: async (orderData: any) => {
      const res = await request<{ data: any }>('/api/v1/canteen/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });
      return res.data;
    },
    getAll: async (shiftId?: string) => {
      const qs = shiftId ? `?shiftId=${shiftId}` : '';
      const res = await request<{ data: any[] }>(`/api/v1/canteen/orders${qs}`);
      return res.data || [];
    },
    cancelOrder: async (orderId: string, managerPin: string, reason: string) => {
      const res = await request<{ data: any }>(`/api/v1/canteen/orders/${orderId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ managerPin, reason }),
      });
      return res.data;
    },
  },

  // Equipment Rental at POS (M13)
  rentals: {
    getEquipments: async () => {
      const res = await request<{ data: any[] }>('/api/v1/rentals/equipments');
      return res.data || [];
    },
    createRental: async (data: any) => {
      const res = await request<{ data: any }>('/api/v1/rentals/orders', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.data;
    },
    returnRental: async (rentalId: string, returnData: any) => {
      const res = await request<{ data: any }>(`/api/v1/rentals/orders/${rentalId}/return`, {
        method: 'POST',
        body: JSON.stringify(returnData),
      });
      return res.data;
    },
    getActiveRentals: async () => {
      const res = await request<{ data: any[] }>('/api/v1/rentals/orders/active');
      return res.data || [];
    },
  },

  // Voucher validation (M15)
  vouchers: {
    validate: async (code: string, amount: number) => {
      const res = await request<{ data: { valid: boolean; discountAmount: number; finalAmount: number } }>(
        '/api/v1/promotions/vouchers/validate',
        {
          method: 'POST',
          body: JSON.stringify({ code, amount }),
        },
      );
      return res.data;
    },
  },

  // Customers
  customers: {
    lookupByPhone: async (phone: string) => {
      const res = await request<{ data: any }>(`/api/v1/users/lookup?phone=${phone}`);
      return res.data;
    },
  },

  // Court Bookings & Check-in (M04 / F04.7)
  bookings: {
    getAll: async (filter?: { date?: string; resourceCode?: string; status?: string; search?: string }) => {
      const params = new URLSearchParams();
      if (filter?.date) params.set('date', filter.date);
      if (filter?.resourceCode) params.set('resourceCode', filter.resourceCode);
      if (filter?.status) params.set('status', filter.status);
      if (filter?.search) params.set('search', filter.search);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await request<{ data: { items: any[]; total: number } }>(`/api/v1/admin/bookings${qs}`);
      return res.data?.items || [];
    },
    getByIdOrCode: async (idOrCode: string) => {
      const res = await request<{ data: any }>(`/api/v1/admin/bookings/${idOrCode}`);
      return res.data;
    },
    checkIn: async (idOrCode: string) => {
      const res = await request<{ data: any }>(`/api/v1/admin/bookings/${idOrCode}/check-in`, {
        method: 'POST',
      });
      return res.data;
    },
    complete: async (idOrCode: string) => {
      const res = await request<{ data: any }>(`/api/v1/admin/bookings/${idOrCode}/complete`, {
        method: 'POST',
      });
      return res.data;
    },
  },
};
