import axios from 'axios';
import { WarehouseReceipt, insertWarehouseReceiptSchema } from '@shared/schema';
import { storage } from '../storage';

/**
 * Interface for external warehouse API credentials
 */
interface WarehouseApiCredentials {
  apiKey?: string;
  apiSecret?: string;
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  baseUrl: string;
  provider: string;
}

/**
 * Interface for provider-specific mapping logic
 */
interface ProviderConfig {
  name: string;
  authType: 'basic' | 'oauth' | 'apiKey' | 'custom';
  endpoints: {
    receipts: string;
    receipt?: string;
    warehouses?: string;
    commodities?: string;
  };
  transformReceipt: (data: any) => Partial<WarehouseReceipt>;
}

/**
 * ExternalWarehouseService
 * 
 * Handles integration with external warehouse provider APIs
 * for fetching warehouse receipts and related data.
 */
class ExternalWarehouseService {
  private providerConfigs: Record<string, ProviderConfig> = {
    'agriapp': {
      name: 'AgriApp Warehouse Management',
      authType: 'apiKey',
      endpoints: {
        receipts: '/api/warehouse-receipts',
        receipt: '/api/warehouse-receipts/{id}',
        warehouses: '/api/warehouses'
      },
      transformReceipt: (data) => ({
        receiptNumber: data.receipt_id,
        issuedDate: new Date(data.issuedAt),
        quantity: data.quantity.toString(),
        measurementUnit: data.unit,
        status: 'active',
        commodityName: data.commodity,
        qualityGrade: data.grade,
        warehouseName: data.warehouse.name,
        warehouseAddress: data.warehouse.address,
        externalId: data.receipt_id,
        externalSource: 'agriapp',
        metadata: {
          originalData: data
        }
      })
    },
    'agrichain': {
      name: 'AgriChain Storage Solutions',
      authType: 'oauth',
      endpoints: {
        receipts: '/v1/storage/receipts',
        warehouses: '/v1/storage/facilities'
      },
      transformReceipt: (data) => ({
        receiptNumber: data.receiptNumber,
        issuedDate: new Date(data.issueDate),
        quantity: data.storedQuantity.toString(),
        measurementUnit: data.unit,
        status: 'active',
        commodityName: data.commodityType,
        qualityGrade: data.quality.grade,
        warehouseName: data.facility.name,
        warehouseAddress: data.facility.location,
        externalId: data.id,
        externalSource: 'agrichain',
        metadata: {
          originalData: data
        }
      })
    },
    'ewarehouse': {
      name: 'eWarehouse Digital Solutions',
      authType: 'basic',
      endpoints: {
        receipts: '/receipts',
        warehouses: '/facilities'
      },
      transformReceipt: (data) => ({
        receiptNumber: data.id,
        issuedDate: new Date(data.created_at),
        quantity: data.quantity.toString(),
        measurementUnit: data.unit,
        status: 'active',
        commodityName: data.product_name,
        qualityGrade: data.product_grade,
        warehouseName: data.facility_name,
        warehouseAddress: data.facility_address,
        externalId: data.id,
        externalSource: 'ewarehouse',
        metadata: {
          originalData: data
        }
      })
    },
    'ncdex': {
      name: 'NCDEX Commodity Exchange',
      authType: 'apiKey',
      endpoints: {
        receipts: '/api/warehouse_receipts',
      },
      transformReceipt: (data) => ({
        receiptNumber: data.receipt_no,
        issuedDate: new Date(data.issue_date),
        quantity: data.quantity.toString(),
        measurementUnit: data.unit,
        status: 'active',
        commodityName: data.commodity,
        qualityGrade: data.quality,
        warehouseName: data.warehouse,
        warehouseAddress: data.warehouse_location,
        externalId: data.receipt_no,
        externalSource: 'ncdex',
        metadata: {
          originalData: data
        }
      })
    }
  };

  /**
   * Authenticate with the external warehouse API
   */
  private async authenticate(provider: string, credentials: WarehouseApiCredentials): Promise<string> {
    try {
      const config = this.providerConfigs[provider];
      
      if (!config) {
        throw new Error(`Provider '${provider}' is not supported`);
      }
      
      // Different authentication strategies
      switch (config.authType) {
        case 'basic':
          if (!credentials.username || !credentials.password) {
            throw new Error('Username and password are required for basic authentication');
          }
          // For basic auth, we just return a basic auth string
          return `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64')}`;
          
        case 'oauth':
          if (!credentials.clientId || !credentials.clientSecret) {
            throw new Error('Client ID and Client Secret are required for OAuth authentication');
          }
          
          // Actual OAuth implementation would depend on the provider
          // This is a simplified example
          const oauthResponse = await axios.post(
            `${credentials.baseUrl}/oauth/token`,
            {
              grant_type: 'client_credentials',
              client_id: credentials.clientId,
              client_secret: credentials.clientSecret
            }
          );
          
          return `Bearer ${oauthResponse.data.access_token}`;
          
        case 'apiKey':
          if (!credentials.apiKey) {
            throw new Error('API Key is required for API Key authentication');
          }
          
          return `ApiKey ${credentials.apiKey}`;
          
        case 'custom':
          // Custom auth would depend on specific provider implementation
          if (credentials.accessToken) {
            return `Token ${credentials.accessToken}`;
          } else {
            throw new Error('Access Token is required for this provider');
          }
          
        default:
          throw new Error(`Unsupported authentication type: ${config.authType}`);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      throw new Error(`Failed to authenticate with ${provider}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Fetch receipts from an external warehouse provider
   */
  async fetchReceipts(provider: string, credentials: WarehouseApiCredentials, userId: number): Promise<{
    receipts: Partial<WarehouseReceipt>[];
    message: string;
  }> {
    try {
      const config = this.providerConfigs[provider];
      
      if (!config) {
        throw new Error(`Provider '${provider}' is not supported`);
      }
      
      // Authenticate with the provider
      const authToken = await this.authenticate(provider, credentials);
      
      // Fetch receipts
      const response = await axios.get(
        `${credentials.baseUrl}${config.endpoints.receipts}`,
        {
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Transform API response to our receipt format
      // The actual response structure will vary by provider
      const rawReceipts = Array.isArray(response.data) 
        ? response.data 
        : (response.data.receipts || response.data.data || []);
      
      if (!rawReceipts.length) {
        return {
          receipts: [],
          message: 'No receipts found from the external provider'
        };
      }
      
      // Transform each receipt and add the user ID
      const transformedReceipts = rawReceipts.map((raw: any) => ({
        ...config.transformReceipt(raw),
        ownerId: userId,
      }));
      
      // Save receipts to database
      const savedReceipts = [];
      for (const receipt of transformedReceipts) {
        try {
          // Skip receipts without a number
          if (!receipt.receiptNumber) continue;
          
          // Check if receipt already exists by external ID
          const existingReceipt = await storage.getWarehouseReceiptByExternalId(
            receipt.externalId || '',
            receipt.externalSource || ''
          );
          
          if (existingReceipt) {
            // Update existing receipt
            receipt.id = existingReceipt.id;
            const updated = await storage.updateWarehouseReceipt(existingReceipt.id, receipt);
            savedReceipts.push(updated);
          } else {
            // Create new receipt
            const created = await storage.createWarehouseReceipt(receipt as any);
            savedReceipts.push(created);
          }
        } catch (error) {
          console.error('Error saving receipt:', error);
          // Continue with other receipts even if one fails
        }
      }
      
      return {
        receipts: savedReceipts,
        message: savedReceipts.length === 0 
          ? 'No valid receipts could be imported from the provider' 
          : `Successfully imported ${savedReceipts.length} receipts from ${config.name}`
      };
    } catch (error) {
      console.error('API fetch error:', error);
      throw new Error(`Failed to fetch receipts from ${provider}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get list of supported warehouse providers
   */
  getSupportedProviders(): Array<{ id: string, name: string, authType: string }> {
    return Object.entries(this.providerConfigs).map(([id, config]) => ({
      id,
      name: config.name,
      authType: config.authType
    }));
  }

  /**
   * Get required credentials for a specific provider
   */
  getProviderCredentialRequirements(provider: string): Record<string, string> {
    const config = this.providerConfigs[provider];
    
    if (!config) {
      throw new Error(`Provider '${provider}' is not supported`);
    }
    
    switch (config.authType) {
      case 'basic':
        return {
          username: 'Username for the service',
          password: 'Password for the service',
          baseUrl: 'Base URL of the API (e.g., https://api.example.com)'
        };
        
      case 'oauth':
        return {
          clientId: 'OAuth Client ID',
          clientSecret: 'OAuth Client Secret',
          baseUrl: 'Base URL of the API (e.g., https://api.example.com)'
        };
        
      case 'apiKey':
        return {
          apiKey: 'API Key for authentication',
          baseUrl: 'Base URL of the API (e.g., https://api.example.com)'
        };
        
      case 'custom':
        return {
          accessToken: 'Access token for authentication',
          baseUrl: 'Base URL of the API (e.g., https://api.example.com)'
        };
        
      default:
        return {
          baseUrl: 'Base URL of the API (e.g., https://api.example.com)'
        };
    }
  }
}

export default new ExternalWarehouseService();