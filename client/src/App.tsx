import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";
import { WebSocketProvider } from "@/context/WebSocketContext";

// Pages
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import NewDashboardPage from "@/pages/NewDashboardPage";
import WarehousePage from "@/pages/WarehousePage";
import ReceiptsPage from "@/pages/ReceiptsPage";
import LoansPage from "@/pages/LoansPage";
import LoanRepaymentPage from "@/pages/LoanRepaymentPage";
import ProfilePage from "@/pages/ProfilePage";
import DepositPage from "@/pages/DepositPage";
import CommodityDetailPage from "@/pages/CommodityDetailPage";
import ReceiptVerificationPage from "@/pages/ReceiptVerificationPage";
import PaymentsPage from "@/pages/PaymentsPage";
import GreenChannelPage from "@/pages/GreenChannelPage";
import OrangeChannelPage from "@/pages/OrangeChannelPage";
import RedChannelPage from "@/pages/RedChannelPage";
import ReceiptSacksPage from "@/pages/ReceiptSacksPage";
import SackDetailPage from "@/pages/SackDetailPage";
import ImportReceiptsPage from "@/pages/ImportReceiptsPage";
import PrivateStoragePage from "@/pages/PrivateStoragePage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/" component={NewDashboardPage} />
      <Route path="/dashboard" component={NewDashboardPage} />
      <Route path="/warehouses" component={WarehousePage} />
      <Route path="/receipts" component={ReceiptsPage} />
      <Route path="/loans" component={LoansPage} />
      <Route path="/loans/:id/repay" component={LoanRepaymentPage} />
      <Route path="/loan-repayment" component={LoanRepaymentPage} />
      <Route path="/payments" component={PaymentsPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/deposit" component={DepositPage} />
      <Route path="/commodities/:id" component={CommodityDetailPage} />
      <Route path="/verify-receipt/:verificationCode" component={ReceiptVerificationPage} />
      <Route path="/receipts/verify/:code" component={ReceiptVerificationPage} />
      <Route path="/green-channel" component={GreenChannelPage} />
      <Route path="/orange-channel" component={OrangeChannelPage} />
      <Route path="/red-channel" component={RedChannelPage} />
      {/* New sack management routes */}
      <Route path="/receipt/:id/sacks" component={ReceiptSacksPage} />
      <Route path="/commodity-sacks/:id/details" component={SackDetailPage} />
      {/* Import and private storage routes */}
      <Route path="/import-receipts" component={ImportReceiptsPage} />
      <Route path="/private-storage" component={PrivateStoragePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WebSocketProvider>
          <Router />
          <Toaster />
        </WebSocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
