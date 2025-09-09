import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Smartphone, User, Mail, Eye, EyeOff, Check, RefreshCw } from 'lucide-react';
import { SiGoogle, SiFacebook } from 'react-icons/si';

interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: number;
      fullName: string;
      email?: string;
      phone?: string;
      role: string;
      authMethod: string;
    };
  };
}

export default function MobileAuthScreen({ onAuthSuccess }: { onAuthSuccess: (user: any) => void }) {
  const [activeTab, setActiveTab] = useState('phone');
  const [showPassword, setShowPassword] = useState(false);
  const [isOTPSent, setIsOTPSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();

  // Phone/OTP state
  const [phoneData, setPhoneData] = useState({
    phone: '',
    otp: '',
    fullName: '',
    purpose: 'login' as 'login' | 'registration'
  });

  // Username/Password state
  const [credentialsData, setCredentialsData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    role: 'farmer' as 'farmer' | 'trader' | 'warehouse_owner' | 'logistics_provider',
    isRegistering: false
  });

  // Send OTP mutation
  const sendOTPMutation = useMutation({
    mutationFn: async (data: { phone: string; purpose: string }): Promise<AuthResponse> => {
      const response = await apiRequest('POST', '/api/auth/send-otp', data);
      return response.json();
    },
    onSuccess: () => {
      setIsOTPSent(true);
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      toast({
        title: "OTP Sent",
        description: "Please check your phone for the verification code"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send OTP",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  });

  // Verify OTP mutation
  const verifyOTPMutation = useMutation({
    mutationFn: async (data: any): Promise<AuthResponse> => {
      const response = await apiRequest('POST', '/api/auth/verify-otp', data);
      return response.json();
    },
    onSuccess: (response: AuthResponse) => {
      if (response.data?.user) {
        onAuthSuccess(response.data.user);
        toast({
          title: "Welcome!",
          description: phoneData.purpose === 'registration' ? "Account created successfully" : "Login successful"
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "OTP Verification Failed",
        description: error.message || "Please check your code and try again",
        variant: "destructive"
      });
    }
  });

  // Username/Password auth mutation
  const credentialsAuthMutation = useMutation({
    mutationFn: async (data: any): Promise<AuthResponse> => {
      const endpoint = credentialsData.isRegistering ? '/api/auth/register' : '/api/auth/login';
      const response = await apiRequest('POST', endpoint, data);
      return response.json();
    },
    onSuccess: (response: AuthResponse) => {
      if (response.data?.user) {
        onAuthSuccess(response.data.user);
        toast({
          title: "Welcome!",
          description: credentialsData.isRegistering ? "Account created successfully" : "Login successful"
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: credentialsData.isRegistering ? "Registration Failed" : "Login Failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive"
      });
    }
  });

  // Social login mutation
  const socialLoginMutation = useMutation({
    mutationFn: async (data: { provider: 'google' | 'facebook'; token: string }): Promise<AuthResponse> => {
      const response = await apiRequest('POST', '/api/auth/social-login', data);
      return response.json();
    },
    onSuccess: (response: AuthResponse) => {
      if (response.data?.user) {
        onAuthSuccess(response.data.user);
        toast({
          title: "Welcome!",
          description: "Social login successful"
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Social Login Failed",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  });

  const handleSendOTP = () => {
    if (!phoneData.phone || phoneData.phone.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive"
      });
      return;
    }

    sendOTPMutation.mutate({
      phone: phoneData.phone,
      purpose: phoneData.purpose
    });
  };

  const handleVerifyOTP = () => {
    if (!phoneData.otp || phoneData.otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit code sent to your phone",
        variant: "destructive"
      });
      return;
    }

    const requestData: any = {
      phone: phoneData.phone,
      otp: phoneData.otp,
      purpose: phoneData.purpose
    };

    if (phoneData.purpose === 'registration' && phoneData.fullName) {
      requestData.userData = {
        fullName: phoneData.fullName
      };
    }

    verifyOTPMutation.mutate(requestData);
  };

  const handleCredentialsAuth = () => {
    if (credentialsData.isRegistering) {
      // Registration validation
      if (!credentialsData.fullName || !credentialsData.email || !credentialsData.username || !credentialsData.password) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      credentialsAuthMutation.mutate({
        username: credentialsData.username,
        password: credentialsData.password,
        fullName: credentialsData.fullName,
        email: credentialsData.email,
        phone: credentialsData.phone,
        role: credentialsData.role
      });
    } else {
      // Login validation
      if (!credentialsData.username || !credentialsData.password) {
        toast({
          title: "Missing Credentials",
          description: "Please enter both username and password",
          variant: "destructive"
        });
        return;
      }

      credentialsAuthMutation.mutate({
        username: credentialsData.username,
        password: credentialsData.password
      });
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    // This would typically integrate with actual OAuth libraries
    toast({
      title: "Social Login",
      description: `${provider} integration will be implemented with proper OAuth libraries`,
      variant: "default"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">TradeWiser</h1>
          <p className="text-gray-600">Your Agricultural Finance Partner</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center">
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Login or create your account to access agricultural commodity services
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="phone" className="flex items-center gap-1">
                  <Smartphone className="w-4 h-4" />
                  <span className="hidden sm:inline">Phone</span>
                </TabsTrigger>
                <TabsTrigger value="credentials" className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Account</span>
                </TabsTrigger>
                <TabsTrigger value="social" className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  <span className="hidden sm:inline">Social</span>
                </TabsTrigger>
              </TabsList>

              {/* Phone/OTP Authentication */}
              <TabsContent value="phone" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Mobile Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your mobile number"
                    value={phoneData.phone}
                    onChange={(e) => setPhoneData({ ...phoneData, phone: e.target.value })}
                    className="text-lg py-3"
                  />
                </div>

                {!isOTPSent ? (
                  <>
                    <div className="space-y-2">
                      <Label>I want to</Label>
                      <Select 
                        value={phoneData.purpose} 
                        onValueChange={(value: 'login' | 'registration') => 
                          setPhoneData({ ...phoneData, purpose: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="login">Login to existing account</SelectItem>
                          <SelectItem value="registration">Create new account</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {phoneData.purpose === 'registration' && (
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          placeholder="Enter your full name"
                          value={phoneData.fullName}
                          onChange={(e) => setPhoneData({ ...phoneData, fullName: e.target.value })}
                          className="text-lg py-3"
                        />
                      </div>
                    )}

                    <Button 
                      onClick={handleSendOTP} 
                      className="w-full py-3 text-lg"
                      disabled={sendOTPMutation.isPending}
                    >
                      {sendOTPMutation.isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Sending OTP...
                        </>
                      ) : (
                        'Send OTP'
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="otp">Verification Code</Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={phoneData.otp}
                        onChange={(e) => setPhoneData({ ...phoneData, otp: e.target.value })}
                        maxLength={6}
                        className="text-lg py-3 text-center tracking-widest"
                      />
                      <p className="text-sm text-gray-500 text-center">
                        Code sent to {phoneData.phone}
                      </p>
                    </div>

                    <Button 
                      onClick={handleVerifyOTP} 
                      className="w-full py-3 text-lg"
                      disabled={verifyOTPMutation.isPending}
                    >
                      {verifyOTPMutation.isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Verify & Continue
                        </>
                      )}
                    </Button>

                    {countdown > 0 ? (
                      <p className="text-center text-sm text-gray-500">
                        Resend OTP in {countdown}s
                      </p>
                    ) : (
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          setIsOTPSent(false);
                          setPhoneData({ ...phoneData, otp: '' });
                        }}
                        className="w-full"
                      >
                        Send New OTP
                      </Button>
                    )}
                  </>
                )}
              </TabsContent>

              {/* Username/Password Authentication */}
              <TabsContent value="credentials" className="space-y-4">
                <div className="flex justify-center">
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <Button
                      variant={!credentialsData.isRegistering ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCredentialsData({ ...credentialsData, isRegistering: false })}
                      className="px-6"
                    >
                      Login
                    </Button>
                    <Button
                      variant={credentialsData.isRegistering ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCredentialsData({ ...credentialsData, isRegistering: true })}
                      className="px-6"
                    >
                      Register
                    </Button>
                  </div>
                </div>

                {credentialsData.isRegistering && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fullNameCred">Full Name *</Label>
                      <Input
                        id="fullNameCred"
                        placeholder="Enter your full name"
                        value={credentialsData.fullName}
                        onChange={(e) => setCredentialsData({ ...credentialsData, fullName: e.target.value })}
                        className="py-3"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emailCred">Email Address *</Label>
                      <Input
                        id="emailCred"
                        type="email"
                        placeholder="Enter your email"
                        value={credentialsData.email}
                        onChange={(e) => setCredentialsData({ ...credentialsData, email: e.target.value })}
                        className="py-3"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phoneCred">Mobile Number</Label>
                      <Input
                        id="phoneCred"
                        type="tel"
                        placeholder="Optional mobile number"
                        value={credentialsData.phone}
                        onChange={(e) => setCredentialsData({ ...credentialsData, phone: e.target.value })}
                        className="py-3"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select 
                        value={credentialsData.role} 
                        onValueChange={(value: any) => setCredentialsData({ ...credentialsData, role: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="farmer">Farmer</SelectItem>
                          <SelectItem value="trader">Trader</SelectItem>
                          <SelectItem value="warehouse_owner">Warehouse Owner</SelectItem>
                          <SelectItem value="logistics_provider">Logistics Provider</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    value={credentialsData.username}
                    onChange={(e) => setCredentialsData({ ...credentialsData, username: e.target.value })}
                    className="py-3"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={credentialsData.password}
                      onChange={(e) => setCredentialsData({ ...credentialsData, password: e.target.value })}
                      className="py-3 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={handleCredentialsAuth} 
                  className="w-full py-3 text-lg"
                  disabled={credentialsAuthMutation.isPending}
                >
                  {credentialsAuthMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      {credentialsData.isRegistering ? 'Creating Account...' : 'Logging in...'}
                    </>
                  ) : (
                    credentialsData.isRegistering ? 'Create Account' : 'Login'
                  )}
                </Button>
              </TabsContent>

              {/* Social Authentication */}
              <TabsContent value="social" className="space-y-4">
                <div className="text-center text-sm text-gray-600 mb-4">
                  Quick access with your social accounts
                </div>

                <Button 
                  onClick={() => handleSocialLogin('google')}
                  variant="outline"
                  className="w-full py-3 text-lg border-red-200 hover:bg-red-50"
                  disabled={socialLoginMutation.isPending}
                >
                  <SiGoogle className="w-5 h-5 mr-3 text-red-500" />
                  Continue with Google
                </Button>

                <Button 
                  onClick={() => handleSocialLogin('facebook')}
                  variant="outline"
                  className="w-full py-3 text-lg border-blue-200 hover:bg-blue-50"
                  disabled={socialLoginMutation.isPending}
                >
                  <SiFacebook className="w-5 h-5 mr-3 text-blue-600" />
                  Continue with Facebook
                </Button>

                <div className="text-center">
                  <Separator className="my-4" />
                  <p className="text-xs text-gray-500">
                    By continuing, you agree to our Terms of Service and Privacy Policy
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-500">
          <p>Secure • Fast • Farmer-Friendly</p>
        </div>
      </div>
    </div>
  );
}