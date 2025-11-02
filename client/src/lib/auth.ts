/**
 * JWT Authentication Utility for Frontend
 * Manages access tokens, refresh tokens, and user authentication state
 */

const ACCESS_TOKEN_KEY = 'tradewiser_access_token';
const REFRESH_TOKEN_KEY = 'tradewiser_refresh_token';
const USER_KEY = 'tradewiser_user';

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  authMethod?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

/**
 * Store authentication tokens and user info
 */
export function setAuth(tokens: AuthTokens, user: User): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Get the current access token
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Get the current refresh token
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Get the current user info
 */
export function getUser(): User | null {
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;
  
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

/**
 * Clear all authentication data (logout)
 */
export function clearAuth(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Refresh the access token using the refresh token
 */
export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearAuth();
      return false;
    }

    const data = await response.json();
    if (data.success && data.data) {
      localStorage.setItem(ACCESS_TOKEN_KEY, data.data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.data.refreshToken);
      return true;
    }

    clearAuth();
    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    clearAuth();
    return false;
  }
}

/**
 * Make an authenticated API request with automatic token refresh
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  // Add Authorization header
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // If unauthorized, try to refresh token and retry
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    
    if (refreshed) {
      // Retry with new token
      const newAccessToken = getAccessToken();
      headers.set('Authorization', `Bearer ${newAccessToken}`);
      
      return fetch(url, {
        ...options,
        headers,
      });
    } else {
      // Refresh failed, redirect to login
      window.location.href = '/';
      throw new Error('Session expired');
    }
  }

  return response;
}

/**
 * Login with username and password
 */
export async function login(username: string, password: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (data.success && data.data) {
      setAuth(
        {
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
          expiresIn: data.data.expiresIn,
        },
        data.data.user
      );
      return { success: true };
    }

    return { success: false, message: data.message || 'Login failed' };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Network error' };
  }
}

/**
 * Register a new user
 */
export async function register(userData: {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone: string;
  role?: string;
}): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (data.success && data.data) {
      setAuth(
        {
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
          expiresIn: data.data.expiresIn,
        },
        data.data.user
      );
      return { success: true };
    }

    return { success: false, message: data.message || 'Registration failed' };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, message: 'Network error' };
  }
}

/**
 * Logout the current user
 */
export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`,
      },
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    clearAuth();
    window.location.href = '/';
  }
}
