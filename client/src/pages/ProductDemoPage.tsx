
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Play, Pause, SkipForward, SkipBack, 
  Warehouse, Receipt, Coins, Shield,
  MapPin, TrendingUp, Users, CheckCircle,
  ArrowRight, Timer, FileText, CreditCard,
  Smartphone, Globe, Lock, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const slides = [
  {
    id: 1,
    title: "TradeWiser Digital Warehouse & Lending Platform",
    subtitle: "Revolutionizing Agricultural Commodity Storage & Finance",
    content: (
      <div className="text-center space-y-6">
        <div className="flex justify-center items-center space-x-4">
          <Warehouse className="h-16 w-16 text-blue-600" />
          <ArrowRight className="h-8 w-8 text-gray-400" />
          <Receipt className="h-16 w-16 text-green-600" />
          <ArrowRight className="h-8 w-8 text-gray-400" />
          <Coins className="h-16 w-16 text-yellow-600" />
        </div>
        <p className="text-xl text-gray-600">
          Empowering farmers and FPOs with digital warehouse receipts and instant collateral-based lending
        </p>
        <div className="flex justify-center space-x-4">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Globe className="h-4 w-4 mr-2" />
            26 Warehouse Locations
          </Badge>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <FileText className="h-4 w-4 mr-2" />
            77 Commodities Supported
          </Badge>
        </div>
      </div>
    ),
    background: "bg-gradient-to-br from-blue-50 to-green-50"
  },
  {
    id: 2,
    title: "The Problem We Solve",
    subtitle: "Traditional Agricultural Challenges",
    content: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center">
              <Timer className="h-5 w-5 mr-2" />
              Storage Inefficiencies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-gray-600">
              <li>• Poor storage facilities</li>
              <li>• High post-harvest losses</li>
              <li>• Lack of quality certification</li>
              <li>• Manual record keeping</li>
            </ul>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center">
              <Coins className="h-5 w-5 mr-2" />
              Financial Constraints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-gray-600">
              <li>• Limited access to credit</li>
              <li>• High interest rates</li>
              <li>• Complex loan processes</li>
              <li>• Lack of collateral recognition</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    ),
    background: "bg-gradient-to-br from-red-50 to-orange-50"
  },
  {
    id: 3,
    title: "TradeWiser Solution Overview",
    subtitle: "Integrated Digital Platform",
    content: (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            className="text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="bg-blue-100 rounded-full p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4">
              <Warehouse className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">Smart Warehousing</h3>
            <p className="text-sm text-gray-600">AI-powered commodity storage with real-time monitoring</p>
          </motion.div>
          <motion.div 
            className="text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="bg-green-100 rounded-full p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4">
              <Receipt className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Digital Receipts</h3>
            <p className="text-sm text-gray-600">Blockchain-backed electronic warehouse receipts</p>
          </motion.div>
          <motion.div 
            className="text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="bg-yellow-100 rounded-full p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4">
              <Coins className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="font-semibold mb-2">Instant Lending</h3>
            <p className="text-sm text-gray-600">Collateral-based loans with competitive rates</p>
          </motion.div>
        </div>
        <div className="text-center">
          <Badge className="text-lg px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600">
            <Zap className="h-4 w-4 mr-2" />
            End-to-End Digital Solution
          </Badge>
        </div>
      </div>
    ),
    background: "bg-gradient-to-br from-blue-50 to-purple-50"
  },
  {
    id: 4,
    title: "Warehouse Network",
    subtitle: "Pan-India Coverage with Smart Selection",
    content: (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">26</div>
            <div className="text-sm text-gray-600">Warehouse Locations</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">450K</div>
            <div className="text-sm text-gray-600">MT Total Capacity</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">11</div>
            <div className="text-sm text-gray-600">Cold Storage Units</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">26</div>
            <div className="text-sm text-gray-600">Railway Connected</div>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-4 flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Smart Warehouse Selection
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Rice Storage (9 locations)</span>
                <Progress value={75} className="w-24" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Wheat Storage (10 locations)</span>
                <Progress value={85} className="w-24" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Cotton Storage (7 locations)</span>
                <Progress value={60} className="w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
    background: "bg-gradient-to-br from-green-50 to-blue-50"
  },
  {
    id: 5,
    title: "Digital Warehouse Receipt (eWR) Process",
    subtitle: "From Commodity Deposit to Digital Receipt",
    content: (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          {[1, 2, 3, 4].map((step, index) => (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  {step}
                </div>
                <div className="text-xs mt-2 text-center">
                  {step === 1 && "Deposit"}
                  {step === 2 && "Quality Check"}
                  {step === 3 && "Storage"}
                  {step === 4 && "eWR Generated"}
                </div>
              </div>
              {index < 3 && <ArrowRight className="h-4 w-4 text-gray-400 mx-4" />}
            </div>
          ))}
        </div>
        
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center text-green-700">
              <CheckCircle className="h-5 w-5 mr-2" />
              Live Demo Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Receipt ID: <span className="font-mono">WR577619-1</span></p>
                <p className="text-sm text-gray-600">Commodity: Horse Gram (कुल्थी)</p>
                <p className="text-sm text-gray-600">Quantity: 500 kg</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Warehouse: Mumbai Port Storage</p>
                <p className="text-sm text-gray-600">Grade: A (Score: 87)</p>
                <p className="text-sm text-gray-600">Value: ₹25,000</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
    background: "bg-gradient-to-br from-green-50 to-yellow-50"
  },
  {
    id: 6,
    title: "Instant Collateral-Based Lending",
    subtitle: "Unlock Liquidity from Stored Commodities",
    content: (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-700">
                <CreditCard className="h-5 w-5 mr-2" />
                Loan Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Up to 80% commodity value
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Competitive interest rates
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Instant approval process
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Flexible repayment terms
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center text-green-700">
                <TrendingUp className="h-5 w-5 mr-2" />
                Smart Valuation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Market Rate:</span>
                  <span className="font-semibold">₹50/kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Quality Adjustment:</span>
                  <span className="font-semibold text-green-600">+₹5/kg</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold">Final Valuation:</span>
                  <span className="font-bold text-lg">₹55/kg</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="text-center">
          <Badge className="text-lg px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600">
            <Coins className="h-4 w-4 mr-2" />
            Average Processing Time: 2 minutes
          </Badge>
        </div>
      </div>
    ),
    background: "bg-gradient-to-br from-yellow-50 to-green-50"
  },
  {
    id: 7,
    title: "Technology Stack",
    subtitle: "Built for Scale and Security",
    content: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Security & Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Lock className="h-4 w-4 text-green-500 mr-2" />
                Blockchain-backed receipts
              </li>
              <li className="flex items-center">
                <Lock className="h-4 w-4 text-green-500 mr-2" />
                End-to-end encryption
              </li>
              <li className="flex items-center">
                <Lock className="h-4 w-4 text-green-500 mr-2" />
                Multi-factor authentication
              </li>
              <li className="flex items-center">
                <Lock className="h-4 w-4 text-green-500 mr-2" />
                Regulatory compliance
              </li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Smartphone className="h-5 w-5 mr-2" />
              User Experience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                Mobile-first design
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                Bilingual support (Hindi/English)
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                Real-time notifications
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                Offline capability
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    ),
    background: "bg-gradient-to-br from-purple-50 to-blue-50"
  },
  {
    id: 8,
    title: "Impact & Benefits",
    subtitle: "Transforming Agricultural Finance",
    content: (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">40%</div>
            <div className="text-sm text-gray-600">Reduced Storage Losses</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">80%</div>
            <div className="text-sm text-gray-600">Faster Loan Processing</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">25%</div>
            <div className="text-sm text-gray-600">Better Commodity Prices</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">90%</div>
            <div className="text-sm text-gray-600">User Satisfaction</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center text-green-700">
                <Users className="h-5 w-5 mr-2" />
                For Farmers & FPOs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                <li>• Secure commodity storage</li>
                <li>• Instant access to credit</li>
                <li>• Better price realization</li>
                <li>• Reduced post-harvest losses</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-700">
                <TrendingUp className="h-5 w-5 mr-2" />
                For Financial Institutions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                <li>• Reduced lending risks</li>
                <li>• Digital collateral management</li>
                <li>• Automated processes</li>
                <li>• Expanded rural reach</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
    background: "bg-gradient-to-br from-green-50 to-blue-50"
  },
  {
    id: 9,
    title: "Ready to Transform Agricultural Finance?",
    subtitle: "Join the TradeWiser Revolution",
    content: (
      <div className="text-center space-y-8">
        <div className="flex justify-center items-center space-x-8">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full p-6 mx-auto w-20 h-20 flex items-center justify-center mb-4">
              <Warehouse className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="font-semibold">Store Securely</h3>
          </div>
          <ArrowRight className="h-6 w-6 text-gray-400" />
          <div className="text-center">
            <div className="bg-green-100 rounded-full p-6 mx-auto w-20 h-20 flex items-center justify-center mb-4">
              <Receipt className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="font-semibold">Get Digital Receipt</h3>
          </div>
          <ArrowRight className="h-6 w-6 text-gray-400" />
          <div className="text-center">
            <div className="bg-yellow-100 rounded-full p-6 mx-auto w-20 h-20 flex items-center justify-center mb-4">
              <Coins className="h-10 w-10 text-yellow-600" />
            </div>
            <h3 className="font-semibold">Access Credit</h3>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-2xl font-bold">Experience the Demo Now</h3>
          <p className="text-gray-600">
            See how TradeWiser is revolutionizing agricultural commodity storage and lending
          </p>
          <div className="flex justify-center space-x-4">
            <Badge className="text-lg px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600">
              <Play className="h-4 w-4 mr-2" />
              Live Demo Available
            </Badge>
          </div>
        </div>
      </div>
    ),
    background: "bg-gradient-to-br from-blue-50 via-purple-50 to-green-50"
  }
];

export default function ProductDemoPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setCurrentSlide((current) => 
              current === slides.length - 1 ? 0 : current + 1
            );
            return 0;
          }
          return prev + 1;
        });
      }, 100); // Update every 100ms, complete slide in 10 seconds
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const nextSlide = () => {
    setCurrentSlide((current) => 
      current === slides.length - 1 ? 0 : current + 1
    );
    setProgress(0);
  };

  const prevSlide = () => {
    setCurrentSlide((current) => 
      current === 0 ? slides.length - 1 : current - 1
    );
    setProgress(0);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Controls */}
        <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={prevSlide}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={togglePlayPause}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextSlide}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {currentSlide + 1} / {slides.length}
              </span>
              <div className="w-32">
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          </div>
          
          {/* Slide Navigation */}
          <div className="flex justify-center mt-4 space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide 
                    ? 'bg-blue-600' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Main Slide Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className={`min-h-[600px] rounded-lg p-8 ${slides[currentSlide].background}`}
          >
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {slides[currentSlide].title}
              </h1>
              <p className="text-xl text-gray-600">
                {slides[currentSlide].subtitle}
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              {slides[currentSlide].content}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="bg-white rounded-lg p-4 mt-4 shadow-sm text-center">
          <p className="text-sm text-gray-600">
            TradeWiser - Empowering Agricultural Finance Through Digital Innovation
          </p>
        </div>
      </div>
    </div>
  );
}
