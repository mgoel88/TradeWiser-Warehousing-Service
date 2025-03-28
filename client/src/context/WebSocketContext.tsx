/**
 * WebSocketContext.tsx
 * 
 * Provides a centralized WebSocket connection management for real-time updates
 * throughout the application. This enables components to subscribe to real-time
 * updates for various entities like receipts, processes, loans, etc.
 */
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { AuthContext } from './AuthContext';

interface WebSocketContextType {
  subscribe: (userId: number, entityType: string, entityId: number) => void;
  unsubscribe: (userId: number, entityType: string, entityId: number) => void;
  isConnected: boolean;
  reconnect: () => void;
  subscriptionCount: number;
}

interface WebSocketProviderProps {
  children: React.ReactNode;
}

interface Subscription {
  userId: number;
  entityType: string;
  entityId: number;
}

// Create the WebSocket context
const WebSocketContext = createContext<WebSocketContextType>({
  subscribe: () => {},
  unsubscribe: () => {},
  isConnected: false,
  reconnect: () => {},
  subscriptionCount: 0
});

// Custom hook to use the WebSocket context
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// WebSocket Provider component
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [isConnected, setIsConnected] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    if (!isAuthenticated) {
      return;
    }
    
    try {
      // Close existing socket if open
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
      
      // Create WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      socket.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket connection established');
        
        // Re-register existing subscriptions
        subscriptions.forEach(sub => {
          sendSubscription(socket, sub.userId, sub.entityType, sub.entityId);
        });
      };
      
      socket.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          // The message is handled by the components that have subscribed
          // through the use-real-time-entity hook
          
          // Forward events to window for debugging and specific component handling
          const customEvent = new CustomEvent('tradewiser:ws:message', { detail: data });
          window.dispatchEvent(customEvent);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      };
      
      socket.onerror = (error: Event) => {
        console.error('WebSocket error:', error);
        // Socket will auto-close after error, onclose will handle reconnection
      };
      
      socket.onclose = (event: CloseEvent) => {
        setIsConnected(false);
        console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
        
        // Schedule reconnect after delay
        if (!event.wasClean) {
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect WebSocket...');
            connectWebSocket();
          }, 3000); // Try to reconnect after 3 seconds
        }
      };
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      setIsConnected(false);
    }
  }, [isAuthenticated, subscriptions]);
  
  // Initialize WebSocket connection on mount and when auth changes
  useEffect(() => {
    if (isAuthenticated) {
      connectWebSocket();
    } else {
      // Close socket if user logs out
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
    }
    
    return () => {
      // Cleanup on unmount
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [isAuthenticated, connectWebSocket]);
  
  // Send subscription message to the server
  const sendSubscription = (socket: WebSocket, userId: number, entityType: string, entityId: number) => {
    if (socket.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({
        type: 'subscribe',
        userId,
        entityType,
        entityId
      });
      socket.send(message);
    }
  };
  
  // Subscribe to entity updates
  const subscribe = useCallback((userId: number, entityType: string, entityId: number) => {
    // Check if already subscribed
    const existingSubscription = subscriptions.find(
      sub => sub.userId === userId && sub.entityType === entityType && sub.entityId === entityId
    );
    
    if (!existingSubscription) {
      const newSubscription = { userId, entityType, entityId };
      setSubscriptions(prev => [...prev, newSubscription]);
      
      // Send subscription to server if connected
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        sendSubscription(socketRef.current, userId, entityType, entityId);
      }
    }
  }, [subscriptions]);
  
  // Unsubscribe from entity updates
  const unsubscribe = useCallback((userId: number, entityType: string, entityId: number) => {
    setSubscriptions(prev => 
      prev.filter(
        sub => !(sub.userId === userId && sub.entityType === entityType && sub.entityId === entityId)
      )
    );
    
    // Send unsubscribe message to server if connected
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({
        type: 'unsubscribe',
        userId,
        entityType,
        entityId
      });
      socketRef.current.send(message);
    }
  }, []);
  
  // Manual reconnect function
  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    connectWebSocket();
  }, [connectWebSocket]);
  
  const contextValue: WebSocketContextType = {
    subscribe,
    unsubscribe,
    isConnected,
    reconnect,
    subscriptionCount: subscriptions.length
  };
  
  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};