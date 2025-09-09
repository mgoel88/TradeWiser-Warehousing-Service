import { createContext, useEffect, useState, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  setAuthenticatedUser: (user: User) => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => false,
  register: async () => false,
  setAuthenticatedUser: () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuthStatus = async () => {
      try {
        const response = await apiRequest('GET', '/api/auth/session');
        const result = await response.json();

        if (result.success && result.data?.user) {
          setUser(result.data.user);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        // User not authenticated, which is fine
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiRequest('POST', '/api/auth/login', { username, password });
      const result = await response.json();

      if (result.success && result.data?.user) {
        setUser(result.data.user);
        toast({
          title: "Login successful",
          description: `Welcome back, ${result.data.user.fullName}!`,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiRequest('POST', '/api/auth/register', userData);
      const result = await response.json();

      if (result.success && result.data?.user) {
        setUser(result.data.user);
        toast({
          title: "Registration successful",
          description: `Welcome to TradeWiser, ${result.data.user.fullName}!`,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Could not create account",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to set authenticated user directly (for OTP and social login)
  const setAuthenticatedUser = (user: User): void => {
    setUser(user);
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Call logout API
      await apiRequest('POST', '/api/auth/logout');
      
      // Always clear user state regardless of API response
      setUser(null);
      
      // Clear localStorage
      const username = user?.username;
      localStorage.clear();
      if (username) {
        localStorage.setItem('lastUsername', username);
      }
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails on server, clear frontend state
      setUser(null);
      localStorage.clear();
    } finally {
      setIsLoading(false);
      // Force page reload to landing page - this ensures clean state
      window.location.replace('/');
    }
  };

  // Determine if a user is authenticated
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, login, register, setAuthenticatedUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
