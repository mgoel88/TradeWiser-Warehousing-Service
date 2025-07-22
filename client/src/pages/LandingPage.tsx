import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
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
  Eye, 
  Cpu,
  Upload,
  Search,
  FileCheck,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If user is already logged in, redirect to dashboard
  if (user) {
    setLocation('/dashboard');
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
        credentials: 'include'
      });

      if (response.ok) {
        setLocation('/dashboard');
      } else {
        const errorData = await response.json();
        setLoginError(errorData.message || 'Login failed');
      }
    } catch (error) {
      setLoginError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-orange-600 rounded-lg flex items-center justify-center">
              <Warehouse className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-orange-600 bg-clip-text text-transparent">
              TradeWiser
            </span>
          </div>
          
          <nav className="hidden md:flex space-x-6">
            <button onClick={() => scrollToSection('services')} className="text-gray-600 hover:text-green-600 transition-colors">
              Services
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="text-gray-600 hover:text-green-600 transition-colors">
              How It Works
            </button>
            <button onClick={() => scrollToSection('why-tradewiser')} className="text-gray-600 hover:text-green-600 transition-colors">
              Why Us
            </button>
            <button onClick={() => scrollToSection('login')} className="text-gray-600 hover:text-green-600 transition-colors">
              Login
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Revolutionizing
                <span className="bg-gradient-to-r from-green-600 to-orange-600 bg-clip-text text-transparent block">
                  Agricultural Trade
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Blockchain-powered warehousing platform providing secure, transparent digital infrastructure for commodity tracking, electronic warehouse receipts, and collateral-based lending.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  onClick={() => scrollToSection('login')}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => scrollToSection('how-it-works')}
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  Learn More
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-1 hover:rotate-0 transition-transform duration-300">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Warehouse className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Smart Warehousing</h3>
                      <p className="text-sm text-gray-500">Digital commodity management</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <FileText className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Electronic Receipts</h3>
                      <p className="text-sm text-gray-500">Blockchain-verified eWRs</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Real-time Pricing</h3>
                      <p className="text-sm text-gray-500">AI-powered valuations</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section id="services" className="py-20 bg-white">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What We Do</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive digital infrastructure for modern agricultural commodity management and trade financing
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-green-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Warehouse className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-green-700">Warehousing-as-a-Service</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Professional commodity storage with real-time tracking, quality management, and inventory control.
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-blue-700">Electronic Receipts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Blockchain-verified electronic warehouse receipts (eWRs) for secure ownership and transfer documentation.
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-purple-700">Smart Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  AI-powered commodity pricing with real-time market data and quality-based valuations.
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <Upload className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-orange-700">Orange Channel</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Seamless integration with external warehouse providers for interoperable commodity management.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-green-50 to-orange-50">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">
              Simple 3-step process to digitize your agricultural commodity operations
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Upload className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">1. Deposit</h3>
              <p className="text-gray-600 leading-relaxed">
                Deposit your agricultural commodities at our partner warehouses or import receipts from external providers through the Orange Channel.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Search className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">2. Quality Check</h3>
              <p className="text-gray-600 leading-relaxed">
                Our AI-powered quality assessment system analyzes your commodities and provides accurate grading and market valuations.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                <FileCheck className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">3. Digital Receipt</h3>
              <p className="text-gray-600 leading-relaxed">
                Receive blockchain-verified electronic warehouse receipts that can be used for trading, financing, or as collateral for loans.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why TradeWiser Section */}
      <section id="why-tradewiser" className="py-20 bg-white">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why TradeWiser</h2>
            <p className="text-xl text-gray-600">
              Built for the future of agricultural commerce
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Trust</h3>
              <p className="text-gray-600 leading-relaxed">
                Blockchain-secured transactions and smart contracts ensure complete trust and security in every operation.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Eye className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Transparency</h3>
              <p className="text-gray-600 leading-relaxed">
                Complete visibility into your commodity storage, quality assessments, and transaction history at all times.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Cpu className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Tech-First</h3>
              <p className="text-gray-600 leading-relaxed">
                Cutting-edge AI, IoT sensors, and blockchain technology deliver the most advanced agricultural platform available.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Login Section */}
      <section id="login" className="py-20 bg-gradient-to-br from-green-50 to-orange-50">
        <div className="container mx-auto max-w-md px-4">
          <Card className="shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-900">Access Your Account</CardTitle>
              <CardDescription>
                Login to manage your commodities and warehouse receipts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {loginError && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700">
                      {loginError}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div>
                  <Input
                    type="text"
                    placeholder="Username"
                    value={loginData.username}
                    onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                    required
                    className="w-full"
                  />
                </div>
                
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    required
                    className="w-full"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-700">
                  <strong>Demo Access:</strong> testuser / password123
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-orange-600 rounded-lg flex items-center justify-center">
                  <Warehouse className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">TradeWiser</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Revolutionizing agricultural commodity management through blockchain technology and smart warehousing solutions.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Warehousing-as-a-Service</li>
                <li>Electronic Receipts</li>
                <li>Commodity Pricing</li>
                <li>Orange Channel Integration</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>About Us</li>
                <li>Terms of Service</li>
                <li>Privacy Policy</li>
                <li>Support</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>+91 98765 43210</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>hello@tradewiser.com</span>
                </li>
                <li className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Mumbai, India</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 TradeWiser. All rights reserved. Built for the future of agricultural commerce.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}