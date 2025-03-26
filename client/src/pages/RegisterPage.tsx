import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (user && !isLoading) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-md bg-primary-500 flex items-center justify-center text-white">
              <span className="font-headings font-bold text-2xl">TW</span>
            </div>
          </div>
          <RegisterForm />
        </div>
      </div>
      <footer className="py-6 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} TradeWiser. All rights reserved.
      </footer>
    </div>
  );
}
