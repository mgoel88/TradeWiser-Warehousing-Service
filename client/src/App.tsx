import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";

// Pages
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import WarehousePage from "@/pages/WarehousePage";
import ReceiptsPage from "@/pages/ReceiptsPage";
import LoansPage from "@/pages/LoansPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/warehouses" component={WarehousePage} />
      <Route path="/receipts" component={ReceiptsPage} />
      <Route path="/loans" component={LoansPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/green-channel" component={WarehousePage} />
      <Route path="/orange-channel" component={WarehousePage} />
      <Route path="/red-channel" component={WarehousePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
