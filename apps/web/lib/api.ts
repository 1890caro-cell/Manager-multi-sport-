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
  return localStorage.getItem('sports_access_token');
}

export function setStoredToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('sports_access_token', token);
}

export function removeStoredToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('sports_access_token');
  localStorage.removeItem('sports_user_profile');
}

export function getStoredUser(): any | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('sports_user_profile');
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: any) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('sports_user_profile', JSON.stringify(user));
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
      errorData.title || 'Lỗi xử lý yêu cầu',
      errorData.detail || errorData.message,
      errorData,
    );
  }

  // Handle 204 No Content
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
    register: async (data: { phone: string; password: string; fullName: string }) => {
      return request<any>('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    sendOtp: async (phone: string, purpose: string) => {
      return request<any>('/api/v1/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ phone, purpose }),
      });
    },
    verifyOtp: async (phone: string, code: string, purpose: string) => {
      return request<any>('/api/v1/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone, code, purpose }),
      });
    },
    getMe: async () => {
      const user = await request<any>('/api/v1/auth/me');
      setStoredUser(user);
      return user;
    },
    updateProfile: async (data: any) => {
      return request<any>('/api/v1/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
  },

  // Sân bãi & Đặt chỗ
  booking: {
    getResources: async (sportType?: string) => {
      const query = sportType ? `?sportType=${sportType}` : '';
      const res = await request<any>(`/api/v1/facility/resources${query}`);
      return Array.isArray(res) ? res : res?.data || [];
    },
    getAvailability: async (resourceId: string, date: string) => {
      const res = await request<any>(`/api/v1/bookings/availability?resourceId=${resourceId}&date=${date}`);
      return res?.data ?? res;
    },
    calculatePrice: async (data: { resourceId: string; date: string; slotIndices: number[] }) => {
      const res = await request<any>('/api/v1/pricing/calculate', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res?.data ?? res;
    },
    reserve: async (data: any) => {
      const res = await request<any>('/api/v1/bookings/reserve', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res?.data ?? res;
    },
    confirm: async (bookingId: string, data: any) => {
      const res = await request<any>(`/api/v1/bookings/${bookingId}/confirm`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res?.data ?? res;
    },
    getMyBookings: async () => {
      const res = await request<any>('/api/v1/bookings/me');
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.data)) return res.data;
      if (Array.isArray(res?.data?.items)) return res.data.items;
      return [];
    },
    getBookingDetail: async (id: string) => {
      const res = await request<any>(`/api/v1/bookings/${id}`);
      return res?.data ?? res;
    },
    getById: async (id: string) => {
      const res = await request<any>(`/api/v1/bookings/${id}`);
      return res?.data ?? res;
    },
    cancel: async (bookingId: string, reason?: string) => {
      const res = await request<any>(`/api/v1/bookings/${bookingId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      return res?.data ?? res;
    },
    reschedule: async (bookingId: string, data: { newDate: string; newSlotIndices: number[]; newResourceCode?: string }) => {
      const res = await request<any>(`/api/v1/bookings/${bookingId}/reschedule`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res?.data ?? res;
    },
  },

  // Thanh toán (M06)
  payments: {
    create: async (data: any) => {
      const res = await request<any>('/api/v1/payments', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res?.data ?? res;
    },
    getById: async (id: string) => {
      const res = await request<any>(`/api/v1/payments/${id}`);
      return res?.data ?? res;
    },
    getByOrderId: async (orderId: string) => {
      const res = await request<any>(`/api/v1/payments/by-order/${orderId}`);
      return res?.data ?? res;
    },
    verifyPayOs: async (paymentId: string) => {
      const res = await request<any>(`/api/v1/payments/${paymentId}/verify-payos`);
      return res?.data ?? res;
    },
    payWithWallet: async (paymentId: string, idempotencyKey: string) => {
      const res = await request<any>(`/api/v1/payments/${paymentId}/wallet-pay`, {
        method: 'POST',
        body: JSON.stringify({ idempotencyKey }),
      });
      return res?.data ?? res;
    },
    simulateSuccess: async (paymentId: string) => {
      const res = await request<any>(`/api/v1/payments/${paymentId}/simulate-success`, {
        method: 'POST',
      });
      return res?.data ?? res;
    },
  },

  // Gym
  gym: {
    getPackages: async () => {
      const res = await request<any>('/api/v1/gym/packages');
      return Array.isArray(res) ? res : res?.data || [];
    },
    getMyMemberships: async () => {
      const res = await request<any>('/api/v1/gym/memberships/me');
      return Array.isArray(res) ? res : res?.data || [];
    },
    purchase: async (data: any) => {
      const res = await request<any>('/api/v1/gym/memberships/purchase', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res?.data ?? res;
    },
    getDynamicQr: async (membershipId: string) => {
      const res = await request<any>(`/api/v1/gym/memberships/${membershipId}/dynamic-qr`);
      return res?.data ?? res;
    },
    getCapacity: async () => {
      const res = await request<any>('/api/v1/gym/capacity');
      return res?.data ?? res;
    },
  },

  // PT & Class
  ptClass: {
    getClasses: async () => {
      const res = await request<any>('/api/v1/classes');
      return Array.isArray(res) ? res : res?.data || [];
    },
    getTrainers: async () => {
      const res = await request<any>('/api/v1/trainers');
      return Array.isArray(res) ? res : res?.data || [];
    },
    registerClass: async (classId: string, data: any) => {
      const res = await request<any>(`/api/v1/classes/${classId}/register`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res?.data ?? res;
    },
    bookPt: async (data: any) => {
      const res = await request<any>('/api/v1/pt/book', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res?.data ?? res;
    },
  },

  // Giải đấu
  tournaments: {
    getList: async () => {
      const res = await request<any>('/api/v1/tournaments');
      return Array.isArray(res) ? res : res?.data || [];
    },
    getDetail: async (id: string) => {
      const res = await request<any>(`/api/v1/tournaments/${id}`);
      return res?.data ?? res;
    },
    getMatches: async (id: string) => {
      const res = await request<any>(`/api/v1/tournaments/${id}/matches`);
      return Array.isArray(res) ? res : res?.data || [];
    },
    registerTeam: async (id: string, data: any) => {
      const res = await request<any>(`/api/v1/tournaments/${id}/teams`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res?.data ?? res;
    },
  },

  // Ví nội bộ
  wallet: {
    getBalance: async () => {
      return request<any>('/api/v1/wallets/me');
    },
    topup: async (amount: number, idempotencyKey: string) => {
      return request<any>('/api/v1/wallets/me/topup', {
        method: 'POST',
        body: JSON.stringify({ amount, idempotencyKey }),
      });
    },
    getTransactions: async () => {
      return request<any>('/api/v1/wallets/me/transactions');
    },
  },

  // Thanh toán
  payment: {
    getDetail: async (paymentId: string) => {
      return request<any>(`/api/v1/payments/${paymentId}`);
    },
  },

  // Hóa đơn
  invoices: {
    getMyInvoices: async () => {
      return request<any>('/api/v1/invoices/me');
    },
    getPdfUrl: async (invoiceId: string) => {
      return request<any>(`/api/v1/invoices/${invoiceId}/pdf`);
    },
  },

  // Thông báo
  notifications: {
    getMyNotifications: async () => {
      return request<any>('/api/v1/notifications/me');
    },
    getUnreadCount: async () => {
      return request<any>('/api/v1/notifications/me/unread-count');
    },
    markAsRead: async (id: string) => {
      return request<any>(`/api/v1/notifications/me/${id}/read`, {
        method: 'POST',
      });
    },
  },
};
