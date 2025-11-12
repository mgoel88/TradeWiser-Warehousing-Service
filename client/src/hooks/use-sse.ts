import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

interface SSEHook {
  isConnected: boolean;
  subscribe: (userId: string, entityType: string, entityId: number) => void;
  unsubscribe: (userId: string, entityType: string, entityId: number) => void;
}

// Global EventSource instance
let eventSource: EventSource | null = null;

/**
 * Custom hook for managing a single Server-Sent Events (SSE) connection.
 * It automatically includes the JWT token for authentication.
 */
export function useSSE(): SSEHook {
  const { isAuthenticated, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  const getSseUrl = useCallback((userId: string) => {
    // The server-side SSE endpoint is /api/sse/:userId
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('JWT token not found for SSE connection.');
      return null;
    }
    // Note: EventSource does not support custom headers, so we must pass the token as a query parameter.
    // The server-side SSE route needs to be updated to check for the token in the query.
    return `/api/sse/${userId}?token=${token}`;
  }, []);

  const connect = useCallback((userId: string) => {
    if (!isAuthenticated || !userId) return;

    const url = getSseUrl(userId);
    if (!url) return;

    if (eventSource && eventSource.readyState !== EventSource.CLOSED) {
      console.log('SSE connection already open.');
      setIsConnected(true);
      return;
    }

    console.log('Attempting to connect to SSE:', url);
    eventSource = new EventSource(url);

    eventSource.onopen = () => {
      console.log('✅ SSE connection established.');
      setIsConnected(true);
    };

    eventSource.onerror = (error) => {
      console.error('❌ SSE connection error:', error);
      setIsConnected(false);
      // Attempt to reconnect after a delay
      setTimeout(() => connect(userId), 5000);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Dispatch a custom event to be picked up by useRealTimeEntity
        const customEvent = new CustomEvent('tradewiser:sse:message', { detail: data });
        window.dispatchEvent(customEvent);
      } catch (e) {
        console.error('Error parsing SSE message:', e);
      }
    };
  }, [isAuthenticated, getSseUrl]);

  const disconnect = useCallback(() => {
    if (eventSource) {
      console.log('Closing SSE connection.');
      eventSource.close();
      eventSource = null;
      setIsConnected(false);
    }
  }, []);

  // Effect to manage connection lifecycle
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      connect(user.id);
    } else {
      disconnect();
    }

    // Cleanup on unmount
    return () => {
      // Note: We don't disconnect here to keep the single connection alive for other components
    };
  }, [isAuthenticated, user?.id, connect, disconnect]);

  // Public subscription/unsubscription methods (stubs for now, as SSE is a broadcast)
  const subscribe = useCallback(() => {
    // No-op for broadcast SSE
  }, []);

  const unsubscribe = useCallback(() => {
    // No-op for broadcast SSE
  }, []);

  return {
    isConnected,
    subscribe,
    unsubscribe,
  };
}
