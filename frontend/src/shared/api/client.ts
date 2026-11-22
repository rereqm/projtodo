const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_STORAGE_KEY = 'flsk-auth-tokens';

export type UserProfile = {
  id: number;
  email: string;
  full_name: string;
  created_at: string;
  is_active: boolean;
  role: number;
};

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
};

export type ApiTrip = {
  id: number;
  title: string;
  description: string | null;
  budget: string | number;
  user_id: number;
};

export type ApiExpense = {
  id: number;
  title: string;
  amount: string | number;
  status: number;
  created_at: string;
  trip_id: number;
  review_comment: string | null;
  reviewed_at: string | null;
  reviewed_by_id: number | null;
};

export type TripPayload = {
  title: string;
  description: string | null;
  budget: number;
};

export type ExpensePayload = {
  title: string;
  amount: number;
  trip_id: number;
};

export function mapTrip(trip: ApiTrip): import('../../entities/trip/model/types').Trip {
  const tripColors = ['blue', 'green', 'grape', 'cyan'] as const;
  return {
    id: String(trip.id),
    title: trip.title,
    description: trip.description ?? '',
    budget: Number(trip.budget),
    color: tripColors[(trip.id - 1) % tripColors.length],
  };
}

export function mapExpense(expense: ApiExpense): import('../../entities/expense/model/types').Expense {
  return {
    id: String(expense.id),
    title: expense.title,
    amount: Number(expense.amount),
    status: expense.status as 0 | 1 | 2,
    tripId: String(expense.trip_id),
    createdAt: expense.created_at,
    reviewComment: expense.review_comment,
  };
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

let refreshInProgress: Promise<boolean> | null = null;

export function readTokens(): AuthTokens | null {
  const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthTokens;
  } catch {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    return null;
  }
}

export function saveTokens(tokens: AuthTokens): void {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
}

export function clearTokens(): void {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

function parseError(body: unknown): string {
  if (typeof body === 'object' && body !== null && 'detail' in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map((item) => typeof item === 'object' && item !== null && 'msg' in item
        ? String((item as { msg: unknown }).msg)
        : String(item)).join('. ');
    }
  }
  return 'Не удалось выполнить запрос. Попробуйте ещё раз.';
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();
  return response.text();
}

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInProgress) return refreshInProgress;

  refreshInProgress = (async () => {
    const tokens = readTokens();
    if (!tokens?.refresh_token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: tokens.refresh_token }),
      });
      if (!response.ok) return false;
      saveTokens(await response.json() as AuthTokens);
      return true;
    } catch {
      return false;
    } finally {
      refreshInProgress = null;
    }
  })();

  const refreshed = await refreshInProgress;
  if (!refreshed) {
    clearTokens();
    window.dispatchEvent(new Event('auth-expired'));
  }
  return refreshed;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true,
  retried = false,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const tokens = authenticated ? readTokens() : null;
  if (tokens?.access_token) headers.set('Authorization', `Bearer ${tokens.access_token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, `Не удалось связаться с API${API_BASE_URL ? ` (${API_BASE_URL})` : ''}. Проверьте, что backend запущен.`);
  }

  if (response.status === 401 && authenticated && !retried) {
    if (await refreshAccessToken()) return apiRequest<T>(path, options, authenticated, true);
  }

  const body = await readResponseBody(response);
  if (!response.ok) throw new ApiError(response.status, parseError(body));
  return body as T;
}

export const api = {
  login: async (email: string, password: string) => {
    const tokens = await apiRequest<AuthTokens>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false);
    saveTokens(tokens);
    return tokens;
  },
  register: (fullName: string, email: string, password: string) => apiRequest<UserProfile>('/auth/register/', {
    method: 'POST',
    body: JSON.stringify({ full_name: fullName, email, password }),
  }, false),
  me: () => apiRequest<UserProfile>('/auth/me/'),
  logout: async () => {
    const tokens = readTokens();
    try {
      if (tokens?.refresh_token) {
        await apiRequest<null>('/auth/logout/', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: tokens.refresh_token }),
        }, false);
      }
    } finally {
      clearTokens();
    }
  },
  getTrips: () => apiRequest<ApiTrip[]>('/trips/'),
  createTrip: (payload: TripPayload) => apiRequest<ApiTrip>('/trips/', {
    method: 'POST', body: JSON.stringify(payload),
  }),
  deleteTrip: (id: number) => apiRequest<null>(`/trips/${id}`, { method: 'DELETE' }),
  getTripExpenses: (tripId: number) => apiRequest<ApiExpense[]>(`/trips/${tripId}/expenses`),
  getEmployees: (isActive?: boolean) => {
    const query = isActive === undefined ? '' : `?is_active=${isActive}`;
    return apiRequest<UserProfile[]>(`/users/${query}`);
  },
  updateUserActivation: (id: number, isActive: boolean) => apiRequest<UserProfile>(
    `/users/${id}/activation/`,
    { method: 'PATCH', body: JSON.stringify({ is_active: isActive }) },
  ),
  createExpense: (payload: ExpensePayload) => apiRequest<ApiExpense>('/expenses/', {
    method: 'POST', body: JSON.stringify(payload),
  }),
  deleteExpense: (id: number) => apiRequest<null>(`/expenses/${id}`, { method: 'DELETE' }),
  updateExpense: (id: number, payload: Partial<Pick<ExpensePayload, 'title' | 'amount'>>) => apiRequest<ApiExpense>(
    `/expenses/${id}`,
    { method: 'PATCH', body: JSON.stringify(payload) },
  ),
  reviewExpense: (id: number, status: 1 | 2, reviewComment?: string) => apiRequest<ApiExpense>(
    `/expenses/${id}/review`,
    { method: 'PATCH', body: JSON.stringify({ status, review_comment: reviewComment }) },
  ),
};
