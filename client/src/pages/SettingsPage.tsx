import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Bell, Shield, User, Palette, Globe, Eye, EyeOff } from 'lucide-react';

interface UserSettings {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    depositUpdates: boolean;
    receiptGeneration: boolean;
    loanAlerts: boolean;
    priceAlerts: boolean;
  };
  preferences: {
    language: string;
    currency: string;
    timezone: string;
    theme: string;
    dashboardLayout: string;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    loginNotifications: boolean;
  };
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Fetch user settings
  const { data: settings, isLoading } = useQuery<UserSettings>({
    queryKey: ['/api/user/settings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user/settings');
      if (!response.ok) {
        // Return default settings if none exist
        return {
          notifications: {
            email: true,
            sms: true,
            push: true,
            depositUpdates: true,
            receiptGeneration: true,
            loanAlerts: true,
            priceAlerts: false
          },
          preferences: {
            language: 'en-in',
            currency: 'INR',
            timezone: 'Asia/Kolkata',
            theme: 'light',
            dashboardLayout: 'default'
          },
          security: {
            twoFactorEnabled: false,
            sessionTimeout: 60,
            loginNotifications: true
          }
        };
      }
      return response.json();
    },
    enabled: !!user
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<UserSettings>) => {
      const response = await apiRequest('PATCH', '/api/user/settings', updatedSettings);
      if (!response.ok) {
        throw new Error('Failed to update settings');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Settings Updated',
        description: 'Your settings have been saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/settings'] });
    },
    onError: () => {
      toast({
        title: 'Update Failed',
        description: 'Failed to update settings. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (passwords: typeof passwordData) => {
      const response = await apiRequest('POST', '/api/user/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Password Changed',
        description: 'Your password has been updated successfully.',
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsChangingPassword(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Password Change Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleNotificationChange = (key: keyof UserSettings['notifications'], value: boolean) => {
    if (!settings) return;
    const updatedSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: value
      }
    };
    updateSettingsMutation.mutate(updatedSettings);
  };

  const handlePreferenceChange = (key: keyof UserSettings['preferences'], value: string) => {
    if (!settings) return;
    const updatedSettings = {
      ...settings,
      preferences: {
        ...settings.preferences,
        [key]: value
      }
    };
    updateSettingsMutation.mutate(updatedSettings);
  };

  const handleSecurityChange = (key: keyof UserSettings['security'], value: boolean | number) => {
    if (!settings) return;
    const updatedSettings = {
      ...settings,
      security: {
        ...settings.security,
        [key]: value
      }
    };
    updateSettingsMutation.mutate(updatedSettings);
  };

  const handlePasswordSubmit = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'New password and confirmation do not match.',
        variant: 'destructive',
      });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast({
        title: 'Password Too Short',
        description: 'New password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }
    changePasswordMutation.mutate(passwordData);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">Manage your account preferences and security settings</p>
        </div>

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center space-x-2">
              <Palette className="h-4 w-4" />
              <span>Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Account</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to receive notifications about your account activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Communication Channels</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <p className="text-sm text-gray-500">Receive notifications via email</p>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={settings?.notifications.email || false}
                        onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="sms-notifications">SMS Notifications</Label>
                        <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                      </div>
                      <Switch
                        id="sms-notifications"
                        checked={settings?.notifications.sms || false}
                        onCheckedChange={(checked) => handleNotificationChange('sms', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="push-notifications">Push Notifications</Label>
                        <p className="text-sm text-gray-500">Receive browser push notifications</p>
                      </div>
                      <Switch
                        id="push-notifications"
                        checked={settings?.notifications.push || false}
                        onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Activity Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="deposit-updates">Deposit Updates</Label>
                        <p className="text-sm text-gray-500">Updates on your commodity deposits</p>
                      </div>
                      <Switch
                        id="deposit-updates"
                        checked={settings?.notifications.depositUpdates || false}
                        onCheckedChange={(checked) => handleNotificationChange('depositUpdates', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="receipt-generation">Receipt Generation</Label>
                        <p className="text-sm text-gray-500">When warehouse receipts are generated</p>
                      </div>
                      <Switch
                        id="receipt-generation"
                        checked={settings?.notifications.receiptGeneration || false}
                        onCheckedChange={(checked) => handleNotificationChange('receiptGeneration', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="loan-alerts">Loan Alerts</Label>
                        <p className="text-sm text-gray-500">Loan payments and updates</p>
                      </div>
                      <Switch
                        id="loan-alerts"
                        checked={settings?.notifications.loanAlerts || false}
                        onCheckedChange={(checked) => handleNotificationChange('loanAlerts', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="price-alerts">Price Alerts</Label>
                        <p className="text-sm text-gray-500">Commodity price change alerts</p>
                      </div>
                      <Switch
                        id="price-alerts"
                        checked={settings?.notifications.priceAlerts || false}
                        onCheckedChange={(checked) => handleNotificationChange('priceAlerts', checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Application Preferences</CardTitle>
                <CardDescription>
                  Customize your TradeWiser experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={settings?.preferences.language || 'en-in'}
                      onValueChange={(value) => handlePreferenceChange('language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en-in">English (India)</SelectItem>
                        <SelectItem value="hi">हिंदी (Hindi)</SelectItem>
                        <SelectItem value="en-us">English (US)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={settings?.preferences.currency || 'INR'}
                      onValueChange={(value) => handlePreferenceChange('currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">₹ Indian Rupee</SelectItem>
                        <SelectItem value="USD">$ US Dollar</SelectItem>
                        <SelectItem value="EUR">€ Euro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={settings?.preferences.timezone || 'Asia/Kolkata'}
                      onValueChange={(value) => handlePreferenceChange('timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={settings?.preferences.theme || 'light'}
                      onValueChange={(value) => handlePreferenceChange('theme', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dashboard-layout">Dashboard Layout</Label>
                  <Select
                    value={settings?.preferences.dashboardLayout || 'default'}
                    onValueChange={(value) => handlePreferenceChange('dashboardLayout', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your account security and privacy settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                      {settings?.security.twoFactorEnabled && (
                        <Badge variant="secondary" className="mt-1">Enabled</Badge>
                      )}
                    </div>
                    <Switch
                      id="two-factor"
                      checked={settings?.security.twoFactorEnabled || false}
                      onCheckedChange={(checked) => handleSecurityChange('twoFactorEnabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="login-notifications">Login Notifications</Label>
                      <p className="text-sm text-gray-500">Get notified when someone logs into your account</p>
                    </div>
                    <Switch
                      id="login-notifications"
                      checked={settings?.security.loginNotifications || false}
                      onCheckedChange={(checked) => handleSecurityChange('loginNotifications', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                    <Select
                      value={settings?.security.sessionTimeout?.toString() || '60'}
                      onValueChange={(value) => handleSecurityChange('sessionTimeout', parseInt(value))}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="480">8 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!isChangingPassword ? (
                    <Button
                      onClick={() => setIsChangingPassword(true)}
                      variant="outline"
                    >
                      Change Password
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input
                          id="current-password"
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({
                            ...prev,
                            currentPassword: e.target.value
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({
                            ...prev,
                            newPassword: e.target.value
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({
                            ...prev,
                            confirmPassword: e.target.value
                          }))}
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={handlePasswordSubmit}
                          disabled={changePasswordMutation.isPending}
                        >
                          {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsChangingPassword(false);
                            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  View your account details and status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Username</Label>
                    <p className="font-medium">{user?.username}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                  <div>
                    <Label>Full Name</Label>
                    <p className="font-medium">{user?.fullName}</p>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <p className="font-medium">{user?.phone}</p>
                  </div>
                  <div>
                    <Label>KYC Status</Label>
                    <div className="flex items-center space-x-2">
                      {user?.kycVerified ? (
                        <Badge variant="default">Verified</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Account Type</Label>
                    <p className="font-medium capitalize">{user?.role}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-start space-x-2 text-amber-600">
                    <AlertTriangle className="h-5 w-5 mt-0.5" />
                    <div>
                      <p className="font-medium">Account Deletion</p>
                      <p className="text-sm text-gray-600">
                        If you wish to delete your account, please contact our support team.
                        This action cannot be undone and will permanently remove all your data.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}