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
      const res = await request<{ data: { accessToken: string; user: any } }>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password: pin }),
      });
      if (res?.data?.accessToken) {
        setPosToken(res.data.accessToken);
      }
      return res.data;
    },
    getProfile: async () => {
      const res = await request<{ data: any }>('/api/v1/auth/profile');
      return res.data;
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

  // Cashier Shifts (F12.5)
  shifts: {
    getCurrentShift: async () => {
      const res = await request<{ data: any }>('/api/v1/canteen/shifts/current');
      return res.data;
    },
    openShift: async (initialFloat: number, cashierId?: string) => {
      const res = await request<{ data: any }>('/api/v1/canteen/shifts/open', {
        method: 'POST',
        body: JSON.stringify({ initialFloat, cashierId }),
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
};
