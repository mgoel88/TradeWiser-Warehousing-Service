import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Smartphone, Mail, Building, Shield, Upload } from "lucide-react";

// Profile schema matches the user model with some adaptations for the form
const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  businessDetails: z.object({
    name: z.string().optional(),
    type: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      businessDetails: {
        name: user?.businessDetails?.name || "",
        type: user?.businessDetails?.type || "",
        address: user?.businessDetails?.address || "",
      },
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setIsUpdating(true);
    try {
      // In a real app, this would call an API to update the user profile
      console.log("Profile data updated:", data);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </MainLayout>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase();
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: User Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "")}&background=0D8ABC&color=fff&size=128`} 
                    alt={user?.fullName || "User"} 
                  />
                  <AvatarFallback>{getInitials(user?.fullName || "User")}</AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-xl mb-1">{user?.fullName}</CardTitle>
              <p className="text-sm text-gray-500 capitalize">{user?.role.replace("_", " ")}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mt-4">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Username</p>
                    <p className="font-medium">{user?.username}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                </div>
                {user?.phone && (
                  <div className="flex items-center">
                    <Smartphone className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{user?.phone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">KYC Status</p>
                    <p className={`font-medium ${user?.kycVerified ? "text-green-600" : "text-amber-600"}`}>
                      {user?.kycVerified ? "Verified" : "Not Verified"}
                    </p>
                  </div>
                </div>
              </div>

              {!user?.kycVerified && (
                <Button className="w-full mt-6 bg-primary-500">
                  <Upload className="h-4 w-4 mr-2" />
                  Complete KYC Verification
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Tabs for Settings */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="profile">
                <TabsList className="mb-4">
                  <TabsTrigger value="profile">Profile Information</TabsTrigger>
                  <TabsTrigger value="business">Business Details</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="bg-primary-500"
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                            Updating...
                          </>
                        ) : "Save Changes"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="business">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="businessDetails.name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="businessDetails.type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Type</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="businessDetails.address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Address</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="bg-primary-500"
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                            Updating...
                          </>
                        ) : "Save Changes"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="security">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Change Password</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Update your password to maintain account security
                      </p>
                      <div className="space-y-4">
                        <div>
                          <FormLabel>Current Password</FormLabel>
                          <Input type="password" />
                        </div>
                        <div>
                          <FormLabel>New Password</FormLabel>
                          <Input type="password" />
                        </div>
                        <div>
                          <FormLabel>Confirm New Password</FormLabel>
                          <Input type="password" />
                        </div>
                        <Button className="bg-primary-500">Update Password</Button>
                      </div>
                    </div>

                    <div className="pt-6 border-t">
                      <h3 className="text-lg font-medium mb-2">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Add an extra layer of security to your account
                      </p>
                      <Button variant="outline">Enable 2FA</Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
