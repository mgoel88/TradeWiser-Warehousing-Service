/**
 * API Utility
 * Automatically adds JWT tokens to all API requests
 */

import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './auth';

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Make an authenticated API request
 * Automatically adds Authorization header with JWT token
 */
export async function apiRequest(url: string, options: ApiOptions = {}) {
  const { skipAuth = false, ...fetchOptions } = options;

  // Add Authorization header if not skipping auth
  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'Authorization': `Bearer ${token}`
      };
    }
  }

  // Add Content-Type for JSON requests
  if (fetchOptions.body && typeof fetchOptions.body === 'string') {
    fetchOptions.headers = {
      ...fetchOptions.headers,
      'Content-Type': 'application/json'
    };
  }

  let response = await fetch(url, fetchOptions);

  // If unauthorized and we have a refresh token, try to refresh
  if (response.status === 401 && !skipAuth) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      const refreshed = await tryRefreshToken(refreshToken);
      if (refreshed) {
        // Retry the original request with new token
        const newToken = getAccessToken();
        if (newToken) {
          fetchOptions.headers = {
            ...fetchOptions.headers,
            'Authorization': `Bearer ${newToken}`
          };
          response = await fetch(url, fetchOptions);
        }
      } else {
        // Refresh failed, clear tokens and redirect to login
        clearTokens();
        window.location.href = '/';
      }
    }
  }

  return response;
}

/**
 * Try to refresh the access token
 */
async function tryRefreshToken(refreshToken: string): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });

    if (response.ok) {
      const data = await response.json();
      setTokens(data.data.accessToken, data.data.refreshToken);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
}

/**
 * Convenience methods for common HTTP methods
 */
export const api = {
  get: (url: string, options?: ApiOptions) =>
    apiRequest(url, { ...options, method: 'GET' }),

  post: (url: string, data?: any, options?: ApiOptions) =>
    apiRequest(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    }),

  put: (url: string, data?: any, options?: ApiOptions) =>
    apiRequest(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    }),

  patch: (url: string, data?: any, options?: ApiOptions) =>
    apiRequest(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    }),

  delete: (url: string, options?: ApiOptions) =>
    apiRequest(url, { ...options, method: 'DELETE' })
};
