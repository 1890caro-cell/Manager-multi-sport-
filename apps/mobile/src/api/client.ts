/**
 * Typed Mobile API Client kết nối NestJS Backend API
 * Tuân thủ Rule 00-invariants.md và RFC 7807 Problem Details
 */

export class ApiError extends Error {
  status: number;
  type?: string;
  title?: string;
  detail?: string;
  invalidParams?: any[];

  constructor(status: number, data: any) {
    const message = data?.detail || data?.message || data?.title || 'Lỗi kết nối máy chủ';
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.type = data?.type;
    this.title = data?.title;
    this.detail = data?.detail || data?.message;
    this.invalidParams = data?.invalidParams;
  }
}

// In-memory token storage (persistable with SecureStore in production)
let authToken: string | null = null;
let currentApiBaseUrl = 'http://localhost:3000';

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export function setApiBaseUrl(url: string) {
  currentApiBaseUrl = url;
}

export function getApiBaseUrl(): string {
  return currentApiBaseUrl;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${currentApiBaseUrl}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    throw new ApiError(response.status, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth
  auth: {
    login: async (phone: string, password: string) => {
      const res = await request<{ data: { accessToken: string; user: any } }>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
      });
      if (res?.data?.accessToken) {
        setAuthToken(res.data.accessToken);
      }
      return res.data;
    },
    register: async (phone: string, fullName: string, password: string) => {
      const res = await request<{ data: { accessToken: string; user: any } }>('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({ phone, fullName, password }),
      });
      if (res?.data?.accessToken) {
        setAuthToken(res.data.accessToken);
      }
      return res.data;
    },
    getProfile: async () => {
      const res = await request<{ data: any }>('/api/v1/auth/profile');
      return res.data;
    },
    updateProfile: async (data: any) => {
      const res = await request<{ data: any }>('/api/v1/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return res.data;
    },
  },

  // Booking & Courts
  booking: {
    getCourts: async (sport?: string) => {
      const qs = sport ? `?sport=${sport}` : '';
      const res = await request<{ data: any[] }>(`/api/v1/facilities/courts${qs}`);
      return res.data || [];
    },
    getAvailability: async (courtId: string, date: string) => {
      const res = await request<{ data: any }>(`/api/v1/bookings/availability?courtId=${courtId}&date=${date}`);
      return res.data;
    },
    holdSlot: async (data: { courtId: string; date: string; slotIndex: number; idempotencyKey: string }) => {
      const res = await request<{ data: any }>('/api/v1/bookings/hold', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.data;
    },
    confirmBooking: async (data: { bookingId: string; paymentMethod: string; idempotencyKey: string }) => {
      const res = await request<{ data: any }>('/api/v1/bookings/confirm', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.data;
    },
    getMyBookings: async () => {
      const res = await request<{ data: any[] }>('/api/v1/bookings/my');
      return res.data || [];
    },
    cancelBooking: async (bookingId: string, reason: string, idempotencyKey: string) => {
      const res = await request<{ data: any }>(`/api/v1/bookings/${bookingId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason, idempotencyKey }),
      });
      return res.data;
    },
  },

  // Gym & Turnstile
  gym: {
    getCapacity: async () => {
      const res = await request<{ data: { currentCount: number; maxCapacity: number; percentage: number } }>(
        '/api/v1/gym/capacity',
      );
      return res.data || { currentCount: 0, maxCapacity: 100, percentage: 0 };
    },
    getMyMembership: async () => {
      const res = await request<{ data: any }>('/api/v1/gym/my-membership');
      return res.data;
    },
    getDynamicQr: async () => {
      const res = await request<{ data: { qrCode: string; expiresAt: string; ttlSeconds: number } }>(
        '/api/v1/gym/dynamic-qr',
      );
      return res.data;
    },
    buyMembership: async (planId: string, idempotencyKey: string) => {
      const res = await request<{ data: any }>('/api/v1/gym/membership/buy', {
        method: 'POST',
        body: JSON.stringify({ planId, idempotencyKey }),
      });
      return res.data;
    },
  },

  // PT & Classes
  ptClass: {
    getClasses: async () => {
      const res = await request<{ data: any[] }>('/api/v1/pt-classes/classes');
      return res.data || [];
    },
    registerClass: async (classId: string, idempotencyKey: string) => {
      const res = await request<{ data: any }>(`/api/v1/pt-classes/classes/${classId}/register`, {
        method: 'POST',
        body: JSON.stringify({ idempotencyKey }),
      });
      return res.data;
    },
    getTrainers: async () => {
      const res = await request<{ data: any[] }>('/api/v1/pt-classes/trainers');
      return res.data || [];
    },
    bookPt: async (data: { trainerId: string; date: string; slotIndex: number; idempotencyKey: string }) => {
      const res = await request<{ data: any }>('/api/v1/pt-classes/pt/book', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.data;
    },
  },

  // Internal Wallet
  wallet: {
    getMyWallet: async () => {
      const res = await request<{ data: { balance: number; held: number; available: number } }>(
        '/api/v1/wallets/me',
      );
      return res.data || { balance: 0, held: 0, available: 0 };
    },
    getTransactions: async () => {
      const res = await request<{ data: any[] }>('/api/v1/wallets/me/transactions');
      return res.data || [];
    },
    topupVietQr: async (amount: number, idempotencyKey: string) => {
      const res = await request<{ data: { paymentId: string; qrCodeUrl: string; emvco: string; transferContent: string; bankBin: string; accountNo: string; amount: number } }>(
        '/api/v1/payments/vietqr/topup',
        {
          method: 'POST',
          body: JSON.stringify({ amount, idempotencyKey }),
        },
      );
      return res.data;
    },
  },

  // Tournaments
  tournaments: {
    getAll: async () => {
      const res = await request<{ data: any[] }>('/api/v1/tournaments');
      return res.data || [];
    },
    registerTeam: async (tournamentId: string, data: any, idempotencyKey: string) => {
      const res = await request<{ data: any }>(`/api/v1/tournaments/${tournamentId}/register`, {
        method: 'POST',
        body: JSON.stringify({ ...data, idempotencyKey }),
      });
      return res.data;
    },
  },

  // Invoices
  invoices: {
    getMyInvoices: async () => {
      const res = await request<{ data: any[] }>('/api/v1/invoices/me');
      return res.data || [];
    },
    getPdfUrl: async (invoiceId: string) => {
      const res = await request<{ data: { pdfUrl: string } }>(`/api/v1/invoices/${invoiceId}/pdf`);
      return res.data;
    },
  },

  // Notifications
  notifications: {
    getAll: async () => {
      const res = await request<{ data: any[] }>('/api/v1/notifications/me');
      return res.data || [];
    },
    markAsRead: async (id: string) => {
      const res = await request<{ data: any }>(`/api/v1/notifications/me/${id}/read`, {
        method: 'PATCH',
      });
      return res.data;
    },
    markAllAsRead: async () => {
      const res = await request<{ data: any }>('/api/v1/notifications/me/read-all', {
        method: 'POST',
      });
      return res.data;
    },
  },
};
