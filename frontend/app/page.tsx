"use client";

import { useState, useEffect } from "react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  LayoutDashboard, 
  FileText, 
  Search, 
  ShieldCheck, 
  UploadCloud, 
  Wallet,
  Menu,
  LogOut,
  Plus,
  Loader2,
  X,
  Sun,
  Moon,
  CheckCircle2,
  Bell,
  User,
  MoreHorizontal,
  Fingerprint,
  Settings,
  ArrowUpRight,
  ShieldAlert,
  Users,
  Zap,
  Lock,
  Globe,
  ChevronRight,
  Play
} from "lucide-react";

// --- TYPE FIXES ---
// This interface extends the global Window object to include our custom properties
declare global {
  interface Window {
    ethereum?: any;
    ethers?: any;
  }
}

// --- CONTRACT CONFIGURATION ---
const CONTRACT_ADDRESS = "0x39F7FAd97c0cDEAfa0b354dFe7305d8f6CDDf71a";

// --- INLINE ABI ---
const EVIDENCE_ABI = [
  {
    "inputs": [],
    "name": "getRecordCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_fileHash", "type": "string"},
      {"internalType": "string", "name": "_fileName", "type": "string"},
      {"internalType": "uint8", "name": "_fileType", "type": "uint8"}
    ],
    "name": "addEvidence",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "evidenceId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "uploader", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "fileHash", "type": "string"}
    ],
    "name": "EvidenceAdded",
    "type": "event"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "evidenceRecords",
    "outputs": [
      {"internalType": "uint256", "name": "id", "type": "uint256"},
      {"internalType": "string", "name": "fileHash", "type": "string"},
      {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"internalType": "address", "name": "uploader", "type": "address"},
      {"internalType": "uint8", "name": "fileType", "type": "uint8"},
      {"internalType": "string", "name": "fileName", "type": "string"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// --- MOCK DATA FOR CHARTS ---
const chartData = [
  { name: 'Jan', total: 12 },
  { name: 'Feb', total: 18 },
  { name: 'Mar', total: 15 },
  { name: 'Apr', total: 25 },
  { name: 'May', total: 32 },
  { name: 'Jun', total: 45 },
];

export default function NebulaDashboard() {
  // --- STATE ---
  const [isMounted, setIsMounted] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [activeView, setActiveView] = useState<"overview" | "notarize" | "verify" | "access" | "settings">("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [status, setStatus] = useState(""); 
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isEthersLoaded, setIsEthersLoaded] = useState(false);
  
  // --- DATA STATE ---
  const [totalRecords, setTotalRecords] = useState("0");
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- UPLOAD STATE ---
  const [fileHash, setFileHash] = useState("");
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [createdId, setCreatedId] = useState(""); 
  const [copied, setCopied] = useState(false);

  // --- VERIFY STATE ---
  const [searchId, setSearchId] = useState("");
  const [evidenceData, setEvidenceData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // --- INITIALIZATION & THEME ---
  useEffect(() => {
    setIsMounted(true);
    
    // 1. Check LocalStorage first, then System Preference
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    }

    // 2. Load Ethers
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.11.1/ethers.umd.min.js";
    script.async = true;
    script.onload = () => {
      setIsEthersLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    }
  }, []);

  // --- THEME TOGGLE FUNCTION ---
  function toggleTheme() {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme); 
    
    // Manually force class on document element
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  // --- HELPER: GET ETHERS ---
  const getEthers = () => {
    // We can now access window.ethers directly because of the interface declaration above
    if (window.ethers) return window.ethers;
    return null;
  };

  // --- FETCH STATS & RECENT ACTIVITY ---
  useEffect(() => {
    async function fetchData() {
      // TypeScript now knows 'ethereum' exists on window
      if (!window.ethereum || !walletAddress || !isEthersLoaded) return;
      
      const ethers = getEthers();
      if (!ethers) return;

      setIsRefreshing(true);
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, EVIDENCE_ABI, provider);

        // 1. Fetch Total Count
        const countBigInt = await contract.getRecordCount(); 
        const count = Number(countBigInt);
        setTotalRecords(count.toString());

        // 2. Fetch Last 5 Records
        const recordsToFetch = [];
        const limit = 5;
        for (let i = count; i > Math.max(0, count - limit); i--) {
            recordsToFetch.push(contract.evidenceRecords(i));
        }

        if (recordsToFetch.length > 0) {
            const results = await Promise.all(recordsToFetch);
            const formattedHistory = results.map((r) => ({
                id: r[0].toString(),
                hash: r[1],
                timestamp: new Date(Number(r[2]) * 1000).toLocaleString(),
                uploader: r[3],
                filename: r[5]
            }));
            setRecentActivity(formattedHistory);
        }

      } catch (error) { 
          console.error("Data fetch error:", error);
      } finally {
          setIsRefreshing(false);
      }
    }

    if (activeView === "overview" && walletAddress && isEthersLoaded) fetchData();
  }, [walletAddress, activeView, status, isEthersLoaded]);

  // --- HELPER ---
  const shortenAddress = (addr: string) => {
      if (!addr) return "";
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // --- WALLET FUNCTIONS ---
  async function connectWallet() {
    if (!window.ethereum) return alert("MetaMask not found");
    if (!isEthersLoaded) return alert("Initializing libraries... please wait a moment.");

    try {
      const ethers = getEthers();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      setWalletAddress(await signer.getAddress());
      setActiveView("overview"); 
    } catch (error) { console.error(error); }
  }

  function disconnectWallet() {
    setWalletAddress("");
    setEvidenceData(null);
    setFileHash("");
    setFileName("");
    setCreatedId("");
    setRecentActivity([]);
  }

  // --- FILE HANDLING ---
  async function handleFileChange(event: any) {
    if (!isEthersLoaded) return;
    const ethers = getEthers();
    
    const file = event.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setIsLoading(true);
    setCreatedId(""); 
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const hash = ethers.keccak256(bytes);
      setFileHash(hash);
    } catch (error) { setStatus("Error hashing file"); } 
    finally { setIsLoading(false); }
  }

  function handleCopyId() {
    if(!createdId) return;
    navigator.clipboard.writeText(createdId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // --- SMART CONTRACT INTERACTIONS ---
  async function submitEvidence() {
    if (!fileHash || !isEthersLoaded) return;
    const ethers = getEthers();

    setIsLoading(true);
    setStatus("Pending Signature...");
    setCreatedId(""); 

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, EVIDENCE_ABI, signer);
      
      const tx = await contract.addEvidence(fileHash, fileName, 0); 
      setStatus("Verifying...");
      
      const receipt = await tx.wait(); 
      const iface = new ethers.Interface(EVIDENCE_ABI);
      let newId = "";
      
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed && parsed.name === "EvidenceAdded") {
            newId = parsed.args[0].toString();
            break;
          }
        } catch (e) { console.log(e); }
      }

      if (newId) {
        setCreatedId(newId);
        setStatus("Success!");
        setTotalRecords((prev) => (parseInt(prev) + 1).toString());
      } else {
        setStatus("Success (No ID)");
      }
      setFileHash(""); setFileName("");
    } catch (error: any) {
      setStatus(error.message.includes("Too Many Requests") ? "Network busy" : "Failed");
    } finally { setIsLoading(false); }
  }

  async function fetchEvidence() {
    if (!searchId || !isEthersLoaded) return;
    const ethers = getEthers();

    setIsLoading(true); setErrorMessage(""); setEvidenceData(null); 
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, EVIDENCE_ABI, provider);
      const data = await contract.evidenceRecords(searchId);
      if (!data[1]) throw new Error("Not Found");
      setEvidenceData({
        id: data[0].toString(),
        hash: data[1],
        metadata: data[5],
        uploader: data[3],
        timestamp: new Date(Number(data[2]) * 1000).toLocaleString()
      });
    } catch (error: any) { setErrorMessage("Record not found."); } 
    finally { setIsLoading(false); }
  }

  // --- NAVIGATION HELPER ---
  // A wrapper to handle the slide animation when switching views
  function handleNavClick(view: any) {
    if (activeView === view) return;
    setActiveView(view);
    if(window.innerWidth < 768) {
      setIsMobileMenuOpen(false); // Close mobile menu on click
    }
  }

  if (!isMounted) return null;

  // --- PREMIUM LANDING PAGE (UNAUTHENTICATED) ---
  if (!walletAddress) {
    return (
      <div className={`min-h-screen flex flex-col font-sans antialiased transition-colors duration-300 ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-slate-900'} fade-in`}>
        
        {/* Navbar */}
        <header className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md transition-colors duration-300 ${theme === 'dark' ? 'border-white/10 bg-black/50' : 'border-black/5 bg-white/50'}`}>
          <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <div className="w-8 h-8 bg-[#ff3333] rounded-md flex items-center justify-center text-white">
                <ShieldCheck size={18} />
              </div>
              <span>Nebula</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-sm font-medium">
              <a href="#features" className="hover:opacity-70 transition-opacity">Features</a>
              <a href="#how-it-works" className="hover:opacity-70 transition-opacity">How it Works</a>
              {/* <a href="#pricing" className="hover:opacity-70 transition-opacity">Pricing</a> */}
            </div>

            <div className="flex items-center gap-4">
              <button onClick={toggleTheme} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
                {theme === 'light' ? <Moon size={20}/> : <Sun size={20}/>}
              </button>
              <button 
                onClick={connectWallet}
                disabled={!isEthersLoaded}
                className={`px-4 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}
              >
                {isEthersLoaded ? "Connect Wallet" : <Loader2 size={16} className="animate-spin" />}
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden px-4">
          {/* Background Gradient Blob */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] md:w-[800px] h-[400px] md:h-[500px] bg-[#ff3333] opacity-20 blur-[100px] md:blur-[120px] rounded-full pointer-events-none" />
          
          <div className="max-w-7xl mx-auto relative z-10 text-center">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium mb-8 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-[#ff3333]' : 'bg-black/5 border-black/5 text-[#ff3333]'}`}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff3333] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff3333]"></span>
              </span>
              v2.0 is now live on Sepolia
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto leading-[1.1]">
              The Standard for <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff3333] to-purple-600">Digital Evidence</span>
            </h1>
            
            <p className={`text-base md:text-xl max-w-2xl mx-auto mb-10 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Securely notarize files on the blockchain. Create immutable, timestamped proofs for legal, creative, and enterprise use cases.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={connectWallet}
                className={`w-full sm:w-auto h-12 px-8 rounded-full font-semibold text-lg flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 ${theme === 'dark' ? 'bg-[#ff3333] text-white hover:bg-[#d62b2b]' : 'bg-[#ff3333] text-white hover:bg-[#d62b2b]'}`}
              >
                Start Notarizing <ChevronRight size={18} />
              </button>
              <button className={`w-full sm:w-auto h-12 px-8 rounded-full font-semibold text-lg flex items-center justify-center gap-2 border transition-all hover:bg-opacity-50 ${theme === 'dark' ? 'border-white/20 hover:bg-white/10' : 'border-black/10 hover:bg-black/5'}`}>
                <Play size={18} fill="currentColor" /> Watch Demo
              </button>
            </div>

            {/* Social Proof */}
            <div className="mt-20">
              <p className={`text-sm font-medium mb-6 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>TRUSTED BY INNOVATIVE TEAMS</p>
              <div className={`flex flex-wrap justify-center items-center gap-x-8 gap-y-6 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500 ${theme === 'dark' ? 'invert' : ''}`}>
                <span className="text-lg md:text-xl font-bold">ACME</span>
                <span className="text-lg md:text-xl font-bold">Vertex</span>
                <span className="text-lg md:text-xl font-bold">Spherule</span>
                <span className="text-lg md:text-xl font-bold">GlobalBank</span>
                <span className="text-lg md:text-xl font-bold">Nietzsche</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className={`py-20 md:py-24 border-t transition-colors duration-300 ${theme === 'dark' ? 'border-white/10 bg-zinc-950' : 'border-black/5 bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Nebula?</h2>
              <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                We leverage Ethereum's security to provide a tamper-proof history of your digital assets.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <FeatureCard 
                icon={<Lock className="text-[#ff3333]" size={32} />}
                title="Immutable Security"
                desc="Your evidence is hashed and stored on the Ethereum blockchain, making it impossible to alter or delete."
                theme={theme}
              />
              <FeatureCard 
                icon={<Globe className="text-blue-500" size={32} />}
                title="Global Availability"
                desc="Access your records from anywhere in the world, 24/7. No centralized servers to go down."
                theme={theme}
              />
              <FeatureCard 
                icon={<Zap className="text-yellow-500" size={32} />}
                title="Instant Verification"
                desc="Verify the authenticity of any file in milliseconds using our decentralized verification engine."
                theme={theme}
              />
            </div>
          </div>
        </section>

        {/* Stats / How it Works */}
        <section id="how-it-works" className={`py-20 md:py-24 border-t ${theme === 'dark' ? 'border-white/10' : 'border-black/5'}`}>
          <div className="max-w-7xl mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Designed for speed and reliability.</h2>
              <div className="space-y-8">
                <StepItem 
                  number="01" 
                  title="Connect Wallet" 
                  desc="Sign in securely using MetaMask or any Web3 wallet. No email required." 
                  theme={theme}
                />
                <StepItem 
                  number="02" 
                  title="Upload & Hash" 
                  desc="Select your file. We generate a unique cryptographic fingerprint locally." 
                  theme={theme}
                />
                <StepItem 
                  number="03" 
                  title="Mint Evidence" 
                  desc="Confirm the transaction to permanently record the proof on-chain." 
                  theme={theme}
                />
              </div>
            </div>
            <div className={`rounded-2xl p-6 md:p-8 border transition-colors duration-300 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-xl'}`}>
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-semibold">Live Network Stats</h3>
                <div className="flex items-center gap-2 text-xs font-mono text-green-500">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Operational
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg transition-colors duration-300 ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'}`}>
                  <p className="text-xs text-gray-500 mb-1">Total Evidence</p>
                  <p className="text-xl md:text-2xl font-bold font-mono">1,248,902</p>
                </div>
                <div className={`p-4 rounded-lg transition-colors duration-300 ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'}`}>
                  <p className="text-xs text-gray-500 mb-1">Block Height</p>
                  <p className="text-xl md:text-2xl font-bold font-mono">18,234,129</p>
                </div>
                <div className={`p-4 rounded-lg col-span-2 transition-colors duration-300 ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'}`}>
                  <p className="text-xs text-gray-500 mb-1">Total Value Secured</p>
                  <p className="text-xl md:text-2xl font-bold font-mono">$4.2B+</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 md:py-24 text-center px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to secure your data?</h2>
            <p className={`text-lg md:text-xl mb-10 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Join thousands of users preserving truth on the blockchain.</p>
            <button 
              onClick={connectWallet}
              className={`h-14 px-10 rounded-full font-bold text-lg transition-transform hover:scale-105 ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}
            >
              Get Started for Free
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className={`py-12 border-t transition-colors duration-300 ${theme === 'dark' ? 'border-white/10 bg-zinc-950 text-gray-400' : 'border-black/5 bg-gray-50 text-gray-600'}`}>
          <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
            <div className="flex items-center gap-2 font-bold text-lg">
              <div className="w-6 h-6 bg-[#ff3333] rounded-sm flex items-center justify-center text-white">
                <ShieldCheck size={14} />
              </div>
              <span className={theme === 'dark' ? 'text-white' : 'text-black'}>Nebula</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-sm">
              <a href="#" className="hover:text-[#ff3333] transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[#ff3333] transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-[#ff3333] transition-colors">Twitter</a>
              <a href="#" className="hover:text-[#ff3333] transition-colors">GitHub</a>
            </div>
            <p className="text-xs">
              © 2024 Nebula Inc. All rights reserved. <span className="opacity-60 block md:inline md:ml-1 mt-1 md:mt-0">Built by Aditya Nishad</span>
            </p>
          </div>
        </footer>

      </div>
    );
  }

  // --- MAIN DASHBOARD (AUTHENTICATED) ---
  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-slate-900'} font-sans antialiased transition-colors duration-300`}>
      
      {/* GLOBAL STYLES FOR SCROLLBAR & ANIMATIONS & SCROLLBAR HIDING */}
      <style jsx global>{`
        /* Scrollbar styles matching the theme */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: ${theme === 'dark' ? '#09090b' : '#f1f1f1'}; 
        }
        ::-webkit-scrollbar-thumb {
          background: ${theme === 'dark' ? '#27272a' : '#d1d5db'}; 
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${theme === 'dark' ? '#3f3f46' : '#9ca3af'}; 
        }

        /* Hide scrollbar for sidebar specifically */
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }

        /* Slide enter animation */
        @keyframes slideEnter {
          from {
            opacity: 0;
            transform: translateX(15px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .slide-enter {
          animation: slideEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* MOBILE MENU BACKDROP */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 ${theme === 'dark' ? 'bg-black border-zinc-800' : 'bg-white border-gray-200'} border-r flex flex-col transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        
        {/* Brand */}
        <div className={`h-16 flex items-center px-6 border-b ${theme === 'dark' ? 'border-zinc-800' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
                <div className="w-6 h-6 bg-[#ff3333] rounded-sm flex items-center justify-center text-white">
                    <ShieldCheck size={14} strokeWidth={3} />
                </div>
                <span className={theme === 'dark' ? 'text-white' : 'text-black'}>Nebula</span>
            </div>
        </div>

        {/* Quick Action */}
        <div className="p-4">
            <button 
                onClick={() => handleNavClick("notarize")}
                className="w-full flex items-center justify-center gap-2 bg-[#ff3333] hover:bg-[#d62b2b] text-white py-2 px-4 rounded-md font-medium text-sm shadow-sm transition-all active:scale-95"
            >
                <Plus size={16} strokeWidth={2.5} />
                Quick Create
            </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto hide-scrollbar">
            <NavItem 
                active={activeView === "overview"} 
                onClick={() => handleNavClick("overview")} 
                icon={<LayoutDashboard size={18} />} 
                label="Dashboard" 
                theme={theme}
            />
            <NavItem 
                active={activeView === "notarize"} 
                onClick={() => handleNavClick("notarize")} 
                icon={<FileText size={18} />} 
                label="Lifecycle" 
                theme={theme}
            />
            <NavItem 
                active={activeView === "verify"} 
                onClick={() => handleNavClick("verify")} 
                icon={<Search size={18} />} 
                label="Analytics" 
                theme={theme}
            />
            
            <div className={`my-2 border-t ${theme === 'dark' ? 'border-zinc-800' : 'border-gray-100'} mx-3`}></div>

            <NavItem 
                active={activeView === "access"} 
                onClick={() => handleNavClick("access")} 
                icon={<Fingerprint size={18} />} 
                label="Access Control" 
                theme={theme}
            />
            <NavItem 
                active={activeView === "settings"} 
                onClick={() => handleNavClick("settings")} 
                icon={<Settings size={18} />} 
                label="Settings" 
                theme={theme}
            />
        </nav>

        {/* User Footer */}
        <div className={`p-4 border-t ${theme === 'dark' ? 'border-zinc-800' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-100 border-gray-200'} flex items-center justify-center text-xs font-bold border`}>
                    <User size={14} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Aditya</p>
                    <p className="text-xs text-gray-500 truncate">{shortenAddress(walletAddress)}</p>
                </div>
                <button onClick={toggleTheme} className="text-gray-400 hover:text-black dark:hover:text-white">
                    {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                </button>
                <button onClick={disconnectWallet} className="text-gray-400 hover:text-red-600"><LogOut size={16} /></button>
            </div>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden md:pl-64 relative">
        
        {/* Header */}
        <header className={`h-16 flex items-center justify-between px-4 md:px-8 border-b ${theme === 'dark' ? 'border-zinc-800 bg-black/80' : 'border-gray-200 bg-white/80'} backdrop-blur-sm z-10 sticky top-0 transition-colors duration-300`}>
            <div className="flex items-center gap-4">
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-gray-500 p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800"><Menu size={20} /></button>
                <div className={`hidden md:flex items-center text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span className={`cursor-pointer transition-colors font-medium ${theme === 'dark' ? 'hover:text-white' : 'hover:text-black'}`}>Nebula</span>
                    <span className={`mx-2 ${theme === 'dark' ? 'text-zinc-700' : 'text-gray-300'}`}>/</span>
                    <span className={`font-medium capitalize ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{activeView === 'overview' ? 'Dashboard' : activeView}</span>
                </div>
                {/* Mobile Title */}
                <span className={`md:hidden font-medium capitalize ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{activeView === 'overview' ? 'Dashboard' : activeView}</span>
            </div>
            <div className="flex items-center gap-4">
                <button className={`hover:text-black dark:hover:text-white ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}><Bell size={18} /></button>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-100 border-gray-200'}`}>
                    <div className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-yellow-400' : 'bg-green-500'} animate-pulse`}></div>
                    <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {isRefreshing ? 'Syncing...' : 'Sepolia'}
                    </span>
                </div>
            </div>
        </header>

        {/* Content */}
        <main className={`flex-1 overflow-y-auto p-4 md:p-8 transition-colors duration-300 ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
            <div className="max-w-6xl mx-auto space-y-8 slide-enter" key={activeView}>
                
                {/* --- OVERVIEW --- */}
                {activeView === "overview" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className={`text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Dashboard</h2>
                            <div className="flex items-center gap-2">
                                <button className={`px-4 py-2 text-sm font-medium border rounded-md transition-colors ${theme === 'dark' ? 'bg-black border-zinc-800 text-white hover:bg-zinc-900' : 'bg-white border-gray-200 text-black hover:bg-gray-50'}`}>
                                    Download Report
                                </button>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <StatCard title="Total Evidence" value={totalRecords} sub="+1 since last visit" icon={<FileText size={16} />} theme={theme} />
                            <StatCard title="Verified Records" value={totalRecords} sub="All records verified" icon={<CheckCircle2 size={16} />} theme={theme} />
                            <StatCard title="Active Nodes" value="3" sub="Healthy status" icon={<ShieldAlert size={16} />} theme={theme} />
                            <StatCard title="Storage Used" value="1.2 GB" sub="+20MB new data" icon={<ArrowUpRight size={16} />} theme={theme} />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                            
                            {/* RECHARTS AREA CHART */}
                            <div className={`col-span-4 rounded-xl border ${theme === 'dark' ? 'border-zinc-800 bg-black' : 'border-gray-200 bg-white'} p-6 shadow-sm transition-colors duration-300`}>
                                <div className="mb-4">
                                    <h3 className={`font-semibold text-base ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Record Volume</h3>
                                    <p className="text-sm text-gray-500">Upload frequency over time (Mock)</p>
                                </div>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ff3333" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#ff3333" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <XAxis 
                                                dataKey="name" 
                                                stroke="#888888" 
                                                fontSize={12} 
                                                tickLine={false} 
                                                axisLine={false} 
                                            />
                                            <YAxis 
                                                stroke="#888888" 
                                                fontSize={12} 
                                                tickLine={false} 
                                                axisLine={false} 
                                                // FIXED: Added ': any' to value to suppress implicit any error
                                                tickFormatter={(value: any) => `${value}`} 
                                            />
                                            <Tooltip 
                                                contentStyle={{ 
                                                    backgroundColor: theme === 'dark' ? "#09090b" : "#ffffff", 
                                                    borderColor: theme === 'dark' ? "#27272a" : "#e5e7eb", 
                                                    color: theme === 'dark' ? "#fff" : "#000", 
                                                    borderRadius: "8px",
                                                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                                                }}
                                                itemStyle={{ color: "#ff3333" }}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="total" 
                                                stroke="#ff3333" 
                                                strokeWidth={2}
                                                fillOpacity={1} 
                                                fill="url(#colorTotal)" 
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Recent Activity - NOW REAL DATA */}
                            <div className={`col-span-3 rounded-xl border ${theme === 'dark' ? 'border-zinc-800 bg-black' : 'border-gray-200 bg-white'} p-6 shadow-sm overflow-hidden flex flex-col transition-colors duration-300`}>
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className={`font-semibold text-base ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Recent Evidence</h3>
                                        <p className="text-xs text-gray-500">Latest 5 on-chain records</p>
                                    </div>
                                    <MoreHorizontal size={16} className="text-gray-500 cursor-pointer" />
                                </div>
                                
                                <div className="space-y-6 overflow-y-auto flex-1 pr-2">
                                    {isRefreshing && recentActivity.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 text-sm">Loading blockchain data...</div>
                                    ) : recentActivity.length > 0 ? (
                                        recentActivity.map((record) => (
                                            <div key={record.id} className="flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-9 h-9 rounded-full ${theme === 'dark' ? 'bg-green-900/20 border-green-900/30' : 'bg-green-50 border-green-100'} flex items-center justify-center border`}>
                                                        <FileText size={16} className="text-green-600 dark:text-green-400" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className={`text-sm font-medium leading-none truncate max-w-[120px] ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                                                            {record.filename}
                                                        </p>
                                                        <p className={`text-xs mt-1 truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            by {shortenAddress(record.uploader)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>ID #{record.id}</div>
                                                    <div className="text-[10px] text-gray-400">{record.timestamp.split(',')[0]}</div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500 text-sm">
                                            No records found on chain yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- NOTARIZE (QUICK CREATE) --- */}
                {activeView === "notarize" && (
                    <div className="max-w-2xl mx-auto">
                        <div className={`rounded-xl border ${theme === 'dark' ? 'border-zinc-800 bg-black' : 'border-gray-200 bg-white'} shadow-sm overflow-hidden`}>
                            <div className={`p-6 border-b ${theme === 'dark' ? 'border-zinc-800' : 'border-gray-200'} flex justify-between items-center`}>
                                <div>
                                    <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Quick Create</h3>
                                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Deploy a new record to the blockchain.</p>
                                </div>
                            </div>
                            
                            <div className="p-8">
                                <div className={`border-2 border-dashed ${theme === 'dark' ? 'border-zinc-800 hover:bg-zinc-900' : 'border-gray-200 hover:bg-gray-50'} rounded-xl p-12 text-center transition-colors cursor-pointer relative group`}>
                                    <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                                    
                                    <div className={`w-12 h-12 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100'} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                                        <UploadCloud className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                                    </div>
                                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{fileName || "Click to upload or drag and drop"}</p>
                                    <p className="text-xs text-gray-500 mt-1">PDF, PNG, JPG (Max 10MB)</p>
                                </div>

                                {fileHash && (
                                    <div className={`mt-6 p-4 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-50 border-gray-200'} rounded-lg border flex items-center justify-between`}>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Fingerprint Generated</p>
                                            <p className={`text-xs font-mono break-all max-w-[200px] md:max-w-[400px] ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{fileHash}</p>
                                        </div>
                                        <div className={`bg-green-100 dark:bg-green-900/30 p-1.5 rounded-full`}>
                                            <CheckCircle2 size={16} className="text-green-600 dark:text-green-400" />
                                        </div>
                                    </div>
                                )}

                                {/* Result ID Card */}
                                {createdId && (
                                    <div className={`mt-6 p-6 ${theme === 'dark' ? 'bg-green-900/10 border-green-900' : 'bg-green-50 border-green-200'} border rounded-lg text-center animate-in zoom-in-95`}>
                                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
                                            <CheckCircle2 size={20} className="text-green-600 dark:text-green-400" />
                                        </div>
                                        <h4 className="text-sm font-bold text-green-800 dark:text-green-300 uppercase tracking-wide">Success</h4>
                                        <p className={`text-2xl font-bold mt-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>ID: {createdId}</p>
                                        <button onClick={handleCopyId} className={`mt-4 text-xs hover:text-black dark:hover:text-white underline decoration-dotted ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {copied ? "Copied!" : "Copy Evidence ID"}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className={`px-8 py-4 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-50 border-gray-200'} border-t flex justify-between items-center`}>
                                <p className="text-xs text-gray-500">{isLoading ? "Processing transaction..." : "Ready to notarize"}</p>
                                <button 
                                    onClick={submitEvidence}
                                    disabled={!fileHash || isLoading}
                                    className={`px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2 hover:opacity-90 ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}
                                >
                                    {isLoading && <Loader2 size={14} className="animate-spin" />}
                                    Create Record
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- VERIFY --- */}
                {activeView === "verify" && (
                    <div className="max-w-2xl mx-auto">
                        <div className={`rounded-xl border ${theme === 'dark' ? 'border-zinc-800 bg-black' : 'border-gray-200 bg-white'} shadow-sm`}>
                            <div className={`p-6 border-b ${theme === 'dark' ? 'border-zinc-800' : 'border-gray-200'} flex justify-between items-center`}>
                                <div>
                                    <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Verify Evidence</h3>
                                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Search the immutable ledger by ID.</p>
                                </div>
                            </div>
                            
                            <div className="p-8 space-y-6">
                                <div className="flex gap-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                        <input 
                                            value={searchId}
                                            onChange={(e) => setSearchId(e.target.value)}
                                            placeholder="Enter Evidence ID (e.g. 12)" 
                                            className={`w-full pl-10 pr-4 py-2 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-black'} border rounded-md text-sm outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all`}
                                        />
                                    </div>
                                    <button 
                                        onClick={fetchEvidence}
                                        disabled={isLoading}
                                        className={`px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}
                                    >
                                        Search
                                    </button>
                                </div>

                                {evidenceData ? (
                                    <div className={`rounded-lg border ${theme === 'dark' ? 'border-zinc-800 bg-zinc-900' : 'border-gray-200 bg-gray-50'} overflow-hidden animate-in slide-in-from-top-2`}>
                                        <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-zinc-800 bg-black' : 'border-gray-200 bg-white'} flex justify-between items-center`}>
                                            <h3 className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Evidence #{evidenceData.id}</h3>
                                            <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-900 px-2 py-0.5 rounded-full">VERIFIED</span>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">File Name</p>
                                                    <p className={`text-sm font-medium mt-1 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{evidenceData.metadata}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Timestamp</p>
                                                    <p className={`text-sm font-medium mt-1 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{evidenceData.timestamp}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Owner</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600"></div>
                                                    <p className={`text-sm font-mono ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{evidenceData.uploader}</p>
                                                </div>
                                            </div>
                                            <div className="pt-2">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Digital Fingerprint</p>
                                                <div className={`p-3 ${theme === 'dark' ? 'bg-black border-zinc-800' : 'bg-white border-gray-200'} rounded border font-mono text-xs text-gray-500 break-all`}>
                                                    {evidenceData.hash}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : errorMessage ? (
                                    <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900 rounded-lg text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                                        <X size={16} />
                                        {errorMessage}
                                    </div>
                                ) : (
                                    <div className={`text-center py-12 border-2 border-dashed ${theme === 'dark' ? 'border-zinc-800' : 'border-gray-200'} rounded-lg`}>
                                        <Fingerprint className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-zinc-700' : 'text-gray-300'}`} />
                                        <p className="text-sm text-gray-500">Enter an ID to check the chain.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- ACCESS CONTROL (PLACEHOLDER) --- */}
                {activeView === "access" && (
                    <div className="max-w-4xl mx-auto">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                            <div>
                                <h2 className={`text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Access Control</h2>
                                <p className="text-gray-500 mt-1">Manage permissions and roles for this organization.</p>
                            </div>
                            <button className={`px-4 py-2 rounded-md text-sm font-medium ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}>Add User</button>
                        </div>
                        <div className={`rounded-xl border ${theme === 'dark' ? 'border-zinc-800 bg-black' : 'border-gray-200 bg-white'} overflow-hidden`}>
                             <div className="p-12 text-center text-gray-500">
                                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Role Management</h3>
                                <p className="mt-2 text-sm max-w-sm mx-auto">This module allows you to whitelist specific wallet addresses that are permitted to upload evidence.</p>
                             </div>
                        </div>
                    </div>
                )}

                {/* --- SETTINGS (PLACEHOLDER) --- */}
                {activeView === "settings" && (
                    <div className="max-w-2xl mx-auto">
                        <h2 className={`text-2xl font-bold tracking-tight mb-6 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Settings</h2>
                        <div className="space-y-6">
                            <div className={`rounded-xl border ${theme === 'dark' ? 'border-zinc-800 bg-black' : 'border-gray-200 bg-white'} p-6`}>
                                <h3 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>General Preferences</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Appearance</p>
                                            <p className="text-xs text-gray-500">Customize the look and feel</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">{theme === 'light' ? 'Light' : 'Dark'}</span>
                                            <button 
                                                onClick={toggleTheme} 
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 dark:focus:ring-white ${theme === 'dark' ? 'bg-white' : 'bg-gray-200'}`}
                                            >
                                                <span
                                                    className={`${
                                                        theme === 'dark' ? 'translate-x-6 bg-black' : 'translate-x-1 bg-white'
                                                    } inline-block h-4 w-4 transform rounded-full transition-transform`}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Network</p>
                                            <p className="text-xs text-gray-500">Current blockchain network</p>
                                        </div>
                                        <span className="text-xs font-mono bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">Sepolia Testnet</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className={`rounded-xl border ${theme === 'dark' ? 'border-zinc-800 bg-black' : 'border-gray-200 bg-white'} p-6`}>
                                <h3 className="font-semibold mb-4 text-red-600">Danger Zone</h3>
                                <button onClick={disconnectWallet} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-md transition-colors">
                                    Disconnect Wallet
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </main>
      </div>

      {/* TOAST NOTIFICATION */}
      {status && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in">
            <div className={`px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 text-sm font-medium border ${theme === 'dark' ? 'bg-white text-black border-gray-200' : 'bg-black text-white border-gray-800'}`}>
                <div className={`w-2 h-2 rounded-full ${status.includes("Failed") ? "bg-red-500" : "bg-green-500"}`} />
                {status}
            </div>
        </div>
      )}
    </div>
  );
}

// --- SUB COMPONENTS ---
function NavItem({ active, onClick, icon, label, theme }: any) {
    return (
        <button 
            onClick={onClick}
            className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                active 
                ? (theme === 'dark' ? "bg-zinc-900 text-white" : "bg-gray-100 text-black") 
                : (theme === 'dark' ? "text-zinc-400 hover:text-white hover:bg-zinc-900" : "text-gray-600 hover:text-black hover:bg-gray-50")
            }`}
        >
            <span className={`mr-3 ${active ? (theme === 'dark' ? "text-white" : "text-black") : (theme === 'dark' ? "text-zinc-500" : "text-gray-400")}`}>{icon}</span>
            {label}
        </button>
    );
}

function StatCard({ title, value, sub, icon, theme }: any) {
    return (
        <div className={`rounded-xl border ${theme === 'dark' ? 'border-zinc-800 bg-black' : 'border-gray-200 bg-white'} p-6 shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{title}</h3>
                    <div className={`text-2xl font-bold mt-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{value}</div>
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{sub}</p>
                </div>
                <div className={`${theme === 'dark' ? 'text-zinc-600' : 'text-gray-400'} font-mono text-sm`}>
                    {icon}
                </div>
            </div>
        </div>
    )
}

function FeatureCard({ icon, title, desc, theme }: any) {
  return (
    <div className={`p-6 rounded-2xl border transition-all hover:shadow-lg hover:-translate-y-1 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}>
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${theme === 'dark' ? 'bg-black' : 'bg-gray-100'}`}>
        {icon}
      </div>
      <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{title}</h3>
      <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{desc}</p>
    </div>
  )
}

function StepItem({ number, title, desc, theme }: any) {
  return (
    <div className="flex gap-4">
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}>
        {number}
      </div>
      <div>
        <h3 className={`text-lg font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{title}</h3>
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{desc}</p>
      </div>
    </div>
  )
}