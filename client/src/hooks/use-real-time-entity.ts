/**
 * use-real-time-entity.ts
 * 
 * A custom hook that provides real-time updates for a specific entity (receipt, process, loan, etc.)
 * This hook uses the WebSocketContext to subscribe to updates and provides loading and error states.
 */
import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';
import { useQueryClient } from '@tanstack/react-query';
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

type EntityType = 'receipt' | 'process' | 'loan' | 'commodity' | 'warehouse';

interface RealTimeEntityOptions {
  /**
   * Whether to automatically refresh data from the API when updates are received
   */
  autoRefresh?: boolean;
  /**
   * Optional callback to be called when an update is received
   */
  onUpdate?: (data: any) => void;
}

/**
 * Hook for subscribing to real-time updates for a specific entity
 * 
 * @param entityType - The type of entity to subscribe to
 * @param entityId - The ID of the entity
 * @param options - Additional options
 * @returns Object with subscription status and update information
 */
export function useRealTimeEntity(
  entityType: EntityType,
  entityId: number,
  options: RealTimeEntityOptions = {}
) {
  const { autoRefresh = true, onUpdate } = options;
  const { isAuthenticated, user } = useContext(AuthContext);
  const { subscribe, unsubscribe, isConnected } = useWebSocket();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isActive, setIsActive] = useState<boolean>(false);
  const queryClient = useQueryClient();
  
  // Generate the appropriate query key based on entity type
  const getQueryKey = useCallback(() => {
    switch (entityType) {
      case 'receipt':
        return ['/api/receipts', entityId];
      case 'process':
        return ['deposit-progress', entityId];
      case 'loan':
        return ['/api/loans', entityId];
      case 'commodity':
        return ['/api/commodities', entityId];
      case 'warehouse':
        return ['/api/warehouses', entityId];
      default:
        return [`/api/${entityType}s`, entityId];
    }
  }, [entityType, entityId]);
  
  // Subscribe to entity updates when component mounts
  useEffect(() => {
    if (isAuthenticated && user && isConnected && entityId) {
      subscribe(user.id, entityType, entityId);
      setIsActive(true);
      
      return () => {
        // Unsubscribe when component unmounts
        unsubscribe(user.id, entityType, entityId);
        setIsActive(false);
      };
    }
    
    setIsActive(false);
    return undefined;
  }, [isAuthenticated, user, isConnected, entityId, entityType, subscribe, unsubscribe]);
  
  // Setup listener for entity updates
  useEffect(() => {
    const handleWebSocketMessage = (event: CustomEvent) => {
      try {
        const data = event.detail;
        
        // Debug log for WebSocket messages
        console.log('🔄 WebSocket message received:', data);
        
        // Only process messages for this specific entity
        if (
          data.type === `${entityType}_update` && 
          data.entityId === entityId && 
          data.entityType === entityType
        ) {
          console.log(`✅ Processing ${entityType} update for entity ${entityId}`);
          
          // Update the last update timestamp
          setLastUpdate(new Date(data.timestamp));
          
          // If autoRefresh is enabled, refresh data from the API
          if (autoRefresh) {
            const queryKey = getQueryKey();
            console.log('🔄 Invalidating query cache:', queryKey);
            queryClient.invalidateQueries({ queryKey });
          }
          
          // Call onUpdate callback if provided
          if (onUpdate) {
            onUpdate(data);
          }
        }
      } catch (err) {
        console.error('Error processing real-time update:', err);
      }
    };
    
    // Listen to WebSocket messages dispatched by WebSocketContext
    window.addEventListener('tradewiser:ws:message', handleWebSocketMessage as EventListener);
    
    return () => {
      window.removeEventListener('tradewiser:ws:message', handleWebSocketMessage as EventListener);
    };
  }, [entityType, entityId, autoRefresh, onUpdate, queryClient, getQueryKey]);
  
  // Manual refresh function
  const refreshData = useCallback(() => {
    const queryKey = getQueryKey();
    return queryClient.invalidateQueries({ queryKey });
  }, [queryClient, getQueryKey]);
  
  return {
    isActive,
    isConnected,
    lastUpdate,
    refreshData
  };
}