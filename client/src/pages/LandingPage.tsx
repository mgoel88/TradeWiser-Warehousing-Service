import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import MobileAuthScreen from '@/components/auth/MobileAuthScreen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Warehouse, 
  FileText, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle, 
  Shield, 
  Zap, 
  Globe,
  Upload,
  Search,
  FileCheck,
  Phone,
  Mail,
  MapPin,
  BarChart3,
  Lock,
  Users,
  Play
} from 'lucide-react';
import tradewiserLogo from '@assets/TradeWiser Logo_1753185456298.png';

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { user, setAuthenticatedUser, isLoading } = useContext(AuthContext);
  const [showAuth, setShowAuth] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      setLocation('/dashboard');
    }
  }, [user, setLocation]);

  // Handle successful authentication from any method
  const handleAuthSuccess = (userData: any) => {
    setAuthenticatedUser(userData);
    setLocation('/dashboard');
  };

  // Show authentication screen if user clicks login
  if (showAuth) {
    return <MobileAuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowAuth(true);
  };

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleGetStarted = () => {
    // Placeholder for get started functionality
    console.log("Get Started clicked");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="bg-slate-950/95 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center">
            <img 
              src={tradewiserLogo} 
              alt="TradeWiser" 
              className="h-16 w-auto object-contain"
            />
          </div>

          <nav className="hidden md:flex space-x-8">
            <button onClick={() => scrollToSection('platform')} className="text-slate-300 hover:text-emerald-400 transition-all duration-300 font-medium">
              Platform
            </button>
            <button onClick={() => scrollToSection('solutions')} className="text-slate-300 hover:text-emerald-400 transition-all duration-300 font-medium">
              Solutions
            </button>
            <button onClick={() => scrollToSection('technology')} className="text-slate-300 hover:text-emerald-400 transition-all duration-300 font-medium">
              Technology
            </button>
            <button onClick={() => setShowAuth(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg transition-all duration-300 font-medium shadow-lg">
              Access Platform
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent"></div>
        </div>

        <div className="container mx-auto max-w-7xl relative">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center px-4 py-2 bg-emerald-900/30 border border-emerald-700/30 rounded-full mb-8">
                <Zap className="h-4 w-4 text-emerald-400 mr-2" />
                <span className="text-sm font-medium text-emerald-300">Next-Generation AgriTech Platform</span>
              </div>

              <h1 className="text-6xl lg:text-7xl font-black text-white mb-8 leading-[0.9] tracking-tight">
                Digital Infrastructure for 
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent block mt-2">
                  Agricultural Finance
                </span>
              </h1>

              <p className="text-xl text-slate-300 mb-12 leading-relaxed font-light max-w-2xl">
                Institutional-grade blockchain platform enabling secure commodity warehousing, 
                electronic warehouse receipts, and collateral-based lending infrastructure.
              </p>

              <div className="flex flex-col sm:flex-row gap-6">
                <Button 
                  size="lg" 
                  onClick={() => setShowAuth(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300"
                >
                  Access Platform
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => window.open('/demo', '_blank')}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300"
                >
                  <Play className="mr-3 h-5 w-5" />
                  Watch Demo
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => scrollToSection('solutions')}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300"
                >
                  Explore Solutions
                </Button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-3xl"></div>
                <div className="relative bg-slate-800/50 backdrop-blur border border-slate-700 rounded-3xl p-8 shadow-2xl">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                          <BarChart3 className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Total Assets Under Management</p>
                          <p className="text-xs text-slate-400">Live market data</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-emerald-400">₹2.4B+</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-teal-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Electronic Warehouse Receipts</p>
                          <p className="text-xs text-slate-400">Blockchain verified</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-teal-400">15,000+</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Active Farmers & FPOs</p>
                          <p className="text-xs text-slate-400">Registered users</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-blue-400">50,000+</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Section */}
      <section id="platform" className="py-24 bg-slate-900 border-y border-slate-800">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black text-white mb-6 tracking-tight">Enterprise Platform</h2>
            <p className="text-xl text-slate-400 max-w-4xl mx-auto font-light">
              Institutional-grade infrastructure powering the future of agricultural commodity finance
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/80 transition-all duration-300 hover:border-emerald-500/30">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Warehouse className="h-8 w-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Digital Warehousing</h3>
              <p className="text-slate-400 leading-relaxed">
                Blockchain-secured commodity storage with real-time IoT monitoring, automated quality assessment, and institutional-grade security protocols.
              </p>
            </div>

            <div className="group bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/80 transition-all duration-300 hover:border-teal-500/30">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500/20 to-teal-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-8 w-8 text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Electronic Warehouse Receipts</h3>
              <p className="text-slate-400 leading-relaxed">
                Smart contract-powered eWRs with cryptographic proof of ownership, enabling secure collateralization and seamless trade finance.
              </p>
            </div>

            <div className="group bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/80 transition-all duration-300 hover:border-blue-500/30">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Market Intelligence</h3>
              <p className="text-slate-400 leading-relaxed">
                AI-driven price discovery with real-time market data integration, risk analytics, and predictive commodity valuation models.
              </p>
            </div>

            <div className="group bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/80 transition-all duration-300 hover:border-orange-500/30">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Globe className="h-8 w-8 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Institutional Integration</h3>
              <p className="text-slate-400 leading-relaxed">
                API-first architecture enabling seamless integration with banking systems, commodity exchanges, and institutional lending platforms.
              </p>
            </div>
          </div>
        </div>
      </section>



      {/* Solutions Section */}
      <section id="solutions" className="py-24 bg-slate-950 border-y border-slate-800">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black text-white mb-6 tracking-tight">Enterprise Solutions</h2>
            <p className="text-xl text-slate-400 max-w-4xl mx-auto font-light">
              Advanced workflow orchestration for institutional agricultural finance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-3xl p-10 text-center group-hover:border-emerald-500/30 transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-2xl flex items-center justify-center mb-8 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Upload className="h-10 w-10 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-6">Digital Deposit</h3>
                <p className="text-slate-400 leading-relaxed mb-6">
                  Secure commodity deposit with automated IoT quality assessment, blockchain verification, and real-time tracking integration.
                </p>
                <div className="text-sm text-slate-500">
                  Green Channel • Orange Channel Integration
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-blue-500/10 blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-3xl p-10 text-center group-hover:border-teal-500/30 transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-br from-teal-500/20 to-teal-600/20 rounded-2xl flex items-center justify-center mb-8 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Search className="h-10 w-10 text-teal-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-6">AI Quality Assessment</h3>
                <p className="text-slate-400 leading-relaxed mb-6">
                  Machine learning-powered commodity grading with predictive analytics, market intelligence, and automated pricing models.
                </p>
                <div className="text-sm text-slate-500">
                  Computer Vision • Predictive Analytics
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-3xl p-10 text-center group-hover:border-blue-500/30 transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl flex items-center justify-center mb-8 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <FileCheck className="h-10 w-10 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-6">Smart Contracts</h3>
                <p className="text-slate-400 leading-relaxed mb-6">
                  Automated electronic warehouse receipt generation with cryptographic verification, collateral management, and lending integration.
                </p>
                <div className="text-sm text-slate-500">
                  Blockchain Technology • DeFi Integration
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="technology" className="py-24 bg-slate-900 border-y border-slate-800">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black text-white mb-6 tracking-tight">Why Industry Leaders Choose TradeWiser</h2>
            <p className="text-xl text-slate-400 max-w-4xl mx-auto font-light">
              Enterprise-grade security, transparency, and technological innovation
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-3xl flex items-center justify-center mx-auto">
                  <Shield className="h-12 w-12 text-emerald-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-6">Enterprise Security</h3>
              <p className="text-slate-400 leading-relaxed">
                Military-grade encryption, multi-signature wallets, and institutional custody solutions ensuring maximum security for high-value commodity transactions.
              </p>
            </div>

            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-teal-500/20 to-teal-600/20 rounded-3xl flex items-center justify-center mx-auto">
                  <Globe className="h-12 w-12 text-teal-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-6">Global Transparency</h3>
              <p className="text-slate-400 leading-relaxed">
                Complete transaction visibility with immutable blockchain records, real-time audit trails, and comprehensive compliance reporting for institutional oversight.
              </p>
            </div>

            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-3xl flex items-center justify-center mx-auto">
                  <Zap className="h-12 w-12 text-blue-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-6">Cutting-Edge Technology</h3>
              <p className="text-slate-400 leading-relaxed">
                Advanced AI algorithms, IoT sensor networks, and quantum-resistant cryptography delivering unmatched performance and future-proof infrastructure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Login Section */}
      <section id="login" className="py-24 bg-slate-950 border-t border-slate-800">
        <div className="container mx-auto max-w-lg px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Access Platform</h2>
            <p className="text-xl text-slate-400">
              Secure institutional login to TradeWiser
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 blur-2xl"></div>
            <Card className="relative bg-slate-800/80 backdrop-blur border border-slate-700 shadow-2xl">
              <CardContent className="p-8">
                <div className="space-y-6">

                  <div className="text-center">
                    <p className="text-slate-300 mb-6">
                      Click the button below to access the modern multi-method authentication system
                    </p>
                  </div>

                  <Button 
                    onClick={() => setShowAuth(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-12 text-lg font-semibold rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-300"
                  >
                    Access Platform
                  </Button>
                </div>

                <div className="mt-6 p-4 bg-slate-900/30 border border-slate-700/50 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Lock className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-400">Demo Environment</span>
                  </div>
                  <p className="text-sm text-slate-400">
                    <span className="font-mono">testuser</span> / <span className="font-mono">password123</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800">
        <div className="container mx-auto max-w-7xl px-6 py-20">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="mb-8">
                <img 
                  src={tradewiserLogo} 
                  alt="TradeWiser" 
                  className="h-14 w-auto object-contain"
                />
              </div>
              <p className="text-slate-400 leading-relaxed mb-6">
                Enterprise-grade blockchain infrastructure powering the future of institutional agricultural finance and commodity management.
              </p>
              <div className="text-sm text-slate-500">
                © 2025 TradeWiser Technologies Pvt Ltd
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6">Platform</h4>
              <ul className="space-y-3 text-slate-400">
                <li className="hover:text-emerald-400 transition-colors cursor-pointer">Digital Warehousing</li>
                <li className="hover:text-emerald-400 transition-colors cursor-pointer">Electronic Warehouse Receipts</li>
                <li className="hover:text-emerald-400 transition-colors cursor-pointer">Market Intelligence</li>
                <li className="hover:text-emerald-400 transition-colors cursor-pointer">Institutional Integration</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6">Enterprise</h4>
              <ul className="space-y-3 text-slate-400">
                <li className="hover:text-emerald-400 transition-colors cursor-pointer">API Documentation</li>
                <li className="hover:text-emerald-400 transition-colors cursor-pointer">Compliance & Security</li>
                <li className="hover:text-emerald-400 transition-colors cursor-pointer">Enterprise Support</li>
                <li className="hover:text-emerald-400 transition-colors cursor-pointer">White Paper</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6">Contact</h4>
              <ul className="space-y-4 text-slate-400">
                <li className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                    <Phone className="h-4 w-4" />
                  </div>
                  <span>+91 22 6789 0123</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                    <Mail className="h-4 w-4" />
                  </div>
                  <span>enterprise@tradewiser.com</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <span>BKC, Mumbai 400051</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-16 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm">
              <p>Regulated by SEBI • ISO 27001 Certified • Member CCRL</p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <span className="hover:text-emerald-400 transition-colors cursor-pointer">Privacy Policy</span>
                <span className="hover:text-emerald-400 transition-colors cursor-pointer">Terms of Service</span>
                <span className="hover:text-emerald-400 transition-colors cursor-pointer">Risk Disclosure</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}