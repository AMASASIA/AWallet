import React, { useState, useEffect, useMemo } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, signInWithGoogle, logout, db } from './src/firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocFromServer } from 'firebase/firestore';
import { FinalConsentCard } from './components/FinalConsentCard';
import { OkeCard } from './components/OkeCard';
import { SoulMetrics, AgenticTask, AgentPayload, SpendingPolicy, X402Discovery } from './types';
import { walletSDK } from './walletSdk';
import { adk } from './src/adk/AWalletADK';
import { X402PaymentFeed } from './src/components/X402PaymentFeed';
import { 
  LayoutGrid, 
  MessageSquare, 
  Wallet, 
  User, 
  ArrowLeftRight, 
  Search, 
  Plus,
  Bell,
  Loader2,
  Terminal,
  Cpu,
  Code2,
  Blocks,
  Zap,
  ShieldCheck,
  Eye,
  Settings2,
  Activity,
  LogOut,
  Shield,
  Globe,
  Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Error Handling Spec for Firestore ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

export default function App() {
  const [user, loading, error] = useAuthState(auth);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // 1. Identity State (Context)
  const [metrics, setMetrics] = useState<SoulMetrics>({
    soulPoints: 1250,
    pluralityScore: 4.25,
    stamps: 8,
    isPinnedToMap: true,
    did: 'did:awallet:agent:amy_01',
    policyStatus: 'active'
  });

  const [policy, setPolicy] = useState<SpendingPolicy>({
    id: 'pol_amy_01',
    maxPerTx: '100 USDC',
    dailyLimit: '500 USDC',
    spentToday: '42.50 USDC',
    categories: ['api_usage', 'dao_voting', 'micropayments']
  });

  // 2. Task State (Agentic Proposals)
  const [tasks, setTasks] = useState<AgenticTask[]>([]);

  const [activeTask, setActiveTask] = useState<AgenticTask | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [showADK, setShowADK] = useState(false);
  const [mcpLog, setMcpLog] = useState<string[]>(["[MCP] Server initialized...", "[MCP] Tools registered: ERC-8183, x402, Amane"]);
  const [availableTools, setAvailableTools] = useState<{name: string, description: string}[]>([]);
  const [x402Services, setX402Services] = useState<X402Discovery[]>([
    { id: '1', serviceName: 'Market Data AI', domain: 'api.market.ai', costPerRequest: '0.05 USDC', status: 'authorized' },
    { id: '2', serviceName: 'Sentiment Analysis', domain: 'nlp.vibe.io', costPerRequest: '0.01 USDC', status: 'discovered' },
    { id: '3', serviceName: 'Image Gen V3', domain: 'img.dream.net', costPerRequest: '0.25 USDC', status: 'blocked' }
  ]);
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [showPolicyEditor, setShowPolicyEditor] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'agent' | 'user', text: string}[]>([
    { role: 'agent', text: "Hello Amy! I've been monitoring your DAO proposals. There's a new Community Grant proposal that matches your 'Engineering' interest. Would you like me to prepare a summary?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [activeTab, setActiveTab] = useState<'Overview' | 'Chat' | 'Wallet' | 'DID' | 'Treasury'>('Overview');

  // Fetch/Sync User Data from Firestore
  useEffect(() => {
    if (loading) return;
    if (!user) {
      setIsAuthReady(false);
      return;
    }

    const syncUser = async () => {
      const userRef = doc(db, 'users', user.uid);
      const policyRef = doc(db, 'policies', user.uid);

      try {
        // Test connection
        await getDocFromServer(doc(db, 'test', 'connection')).catch(() => {});

        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          // Initialize new user
          const newUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            did: `did:soul:${user.uid.slice(0, 10)}`,
            soulPoints: 1000,
            pluralityScore: 3.5,
            stamps: 0,
            createdAt: new Date().toISOString()
          };
          await setDoc(userRef, newUser);
          
          const newPolicy = {
            uid: user.uid,
            maxPerTx: '100 USDC',
            dailyLimit: '500 USDC',
            spentToday: '0 USDC',
            categories: ['api_usage', 'dao_voting', 'micropayments']
          };
          await setDoc(policyRef, newPolicy);

          // Add initial tasks
          const initialTasks = [
            { uid: user.uid, title: 'Task master', subtitle: 'Sunday 5 standby', deadline: 'Today', icon: '🏛️', summary: 'DAO Proposal #42: Allocate 500 USDC to Community Grants.', soulReward: 50, status: 'pending', createdAt: new Date().toISOString() },
            { uid: user.uid, title: 'Company', subtitle: '1 day standby', deadline: '1 day', icon: '💼', summary: 'Sign quarterly contribution proof for "Engineering Guild".', soulReward: 100, status: 'pending', createdAt: new Date().toISOString() }
          ];
          for (const t of initialTasks) {
            await setDoc(doc(collection(db, 'tasks')), t);
          }
        }

        setIsAuthReady(true);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'users');
      }
    };

    syncUser();
  }, [user, loading]);

  // Real-time Listeners
  useEffect(() => {
    if (!isAuthReady || !user) return;

    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setMetrics({
          soulPoints: data.soulPoints,
          pluralityScore: data.pluralityScore,
          stamps: data.stamps,
          isPinnedToMap: true,
          did: data.did,
          policyStatus: 'active'
        });
        setConnectedAddress(data.did.split(':')[2]);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`));

    const unsubPolicy = onSnapshot(doc(db, 'policies', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as SpendingPolicy;
        setPolicy(data);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `policies/${user.uid}`));

    const q = query(collection(db, 'tasks'), where('uid', '==', user.uid), where('status', '==', 'pending'));
    const unsubTasks = onSnapshot(q, (snap) => {
      const tList = snap.docs.map(d => ({ id: d.id, ...d.data() } as AgenticTask));
      setTasks(tList);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'tasks'));

    return () => {
      unsubUser();
      unsubPolicy();
      unsubTasks();
    };
  }, [isAuthReady, user]);

  // Fetch MCP tools
  useEffect(() => {
    if (!isAuthReady) return;
    const fetchTools = async () => {
      try {
        const response = await fetch('/api/mcp/tools');
        const data = await response.json();
        if (data.tools) {
          setAvailableTools(data.tools);
          setMcpLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] [MCP] Discovered ${data.tools.length} live tools from server.`]);
        }
      } catch (error) {
        console.error("Failed to fetch MCP tools:", error);
      }
    };
    fetchTools();
  }, []);

  // Simulate incoming MCP requests
  useEffect(() => {
    if (!showADK) return;
    
    const interval = setInterval(() => {
      const logs = [
        "[MCP] Incoming request: list_tools",
        "[MCP] Tool call: execute_micro_payment { amount: 0.05 }",
        "[MCP] Tool execution successful: 0x" + Math.random().toString(16).slice(2, 10),
        "[MCP] Financial health check requested",
        "[MCP] x402 Micropayment relaying..."
      ];
      const randomLog = logs[Math.floor(Math.random() * logs.length)];
      setMcpLog(prev => [...prev.slice(-15), `[${new Date().toLocaleTimeString()}] ${randomLog}`]);
    }, 4000);

    return () => clearInterval(interval);
  }, [showADK]);

  // Simulate 402 Interceptor
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newLog = `[x402] 402 Payment Required detected from ${x402Services[1].domain}`;
        setMcpLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${newLog}`]);
        
        if (isSessionActive && x402Services[1].status === 'authorized') {
          setMcpLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] [x402] Auto-paying 0.01 USDC via Session Policy`]);
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [isSessionActive, x402Services]);

  // Handlers
  const handleGoogleLogin = async () => {
    setAuthError(null);
    try {
      const result = await signInWithGoogle();
      if (!result) throw new Error("No response from Google Auth");
    } catch (err: any) {
      console.error("Google Login Error:", err);
      let errorMessage = "Google Login Failed: " + err.message;
      if (err.code === 'auth/unauthorized-domain') {
        errorMessage = "This domain is not authorized for Google Login. Please add localhost (or your current domain) to the Authorized Domains in your Firebase Console (Authentication > Settings).";
      } else if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = "Login popup was closed before completion. Please try again.";
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection.";
      }
      setAuthError(errorMessage);
    }
  };

  const handleConnect = async () => {
    try {
        // Try Coinbase Wallet SDK First
        try {
            const CoinbaseWalletSDK = (await import('@coinbase/wallet-sdk')).default;
            const coinbaseWallet = new CoinbaseWalletSDK({
                appName: 'IDQ AWallet',
                appLogoUrl: 'https://picsum.photos/100',
                darkMode: true
            });
            const ethereum = coinbaseWallet.makeWeb3Provider('https://sepolia.base.org', 84532);
            const tempProvider = new ethers.BrowserProvider(ethereum as any);
            await tempProvider.send("eth_requestAccounts", []);
            const signer = await tempProvider.getSigner();
            const address = await signer.getAddress();
            setConnectedAddress(address);
            setMetrics(prev => ({ ...prev, did: 'did:soul:' + address, stamps: prev.stamps + 1 }));
            return;
        } catch (cbError) {
            console.warn("Coinbase Wallet SDK not available or failed:", cbError);
        }

        // Fallback to standard provider if Coinbase fails
        if (typeof window.ethereum !== 'undefined') {
            const tempProvider = new ethers.BrowserProvider(window.ethereum);
            await tempProvider.send("eth_requestAccounts", []); // Safely request accounts first
            const signer = await tempProvider.getSigner();
            const address = await signer.getAddress();
            setConnectedAddress(address);
            setMetrics(prev => ({
                ...prev,
                did: 'did:soul:' + address,
                stamps: prev.stamps + 1
            }));
        } else {
            alert("No standard web3 provider found. Integrating IDQ Wallet Web3/Blocto logic...");
            import('@blocto/sdk').then(async (BloctoSDK) => {
                const blocto = new BloctoSDK.default({
                    ethereum: { chainId: 84532, rpc: "https://sepolia.base.org" } // Base Sepolia
                });
                const signers = await blocto.ethereum.request({ method: 'eth_requestAccounts' });
                const address = signers[0];
                setConnectedAddress(address);
                setMetrics(prev => ({
                    ...prev,
                    did: 'did:soul:' + address,
                    stamps: prev.stamps + 1
                }));
            }).catch(e => {
                console.error("Blocto failure:", e);
                alert("Blocto connection failed.");
            });
        }
    } catch (error: any) {
        console.error("Wallet connection failed:", error);
        alert("Wallet Extension Error: " + (error?.message || "Please unlock your wallet or try reconnecting."));
    }
  };

  const handleTaskClick = (task: AgenticTask) => {
    setActiveTask(task);
  };

  const handleAuthorizeService = async (id: string) => {
    setX402Services(prev => prev.map(s => s.id === id ? { ...s, status: 'authorized' } : s));
    setMcpLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] [x402] Authorized service: ${x402Services.find(s => s.id === id)?.serviceName}`]);
  };

  const handleUpdatePolicy = async (newLimit: string) => {
    if (!user) return;
    try {
      const policyRef = doc(db, 'policies', user.uid);
      await setDoc(policyRef, { dailyLimit: newLimit }, { merge: true });
      setShowPolicyEditor(false);
      setMcpLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] [Policy] Updated daily limit to ${newLimit}`]);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `policies/${user.uid}`);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newUserMsg = { role: 'user' as const, text: chatInput };
    setChatMessages(prev => [...prev, newUserMsg]);
    setChatInput("");

    // Simulate Agent Response
    setTimeout(() => {
        let response = "I'm processing that request via the AWallet ADK.";
        if (chatInput.toLowerCase().includes("balance") || chatInput.toLowerCase().includes("health")) {
            response = `Your current balance is ${policy.spentToday.split(' ')[0]} / ${policy.dailyLimit}. You have plenty of headroom for today's tasks.`;
        } else if (chatInput.toLowerCase().includes("task") || chatInput.toLowerCase().includes("proposal")) {
            response = "I've found 3 pending tasks. The 'Task master' DAO proposal is the most urgent. I've added it to your queue.";
        } else if (chatInput.toLowerCase().includes("pay") || chatInput.toLowerCase().includes("buy")) {
            response = "I can help with that. Should I use the x402 gasless payment route for this micro-transaction?";
        }
        
        setChatMessages(prev => [...prev, { role: 'agent', text: response }]);
        setMcpLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] [Agent] Chat response generated.`]);
    }, 1000);
  };

  const handleExecuteTool = async (toolName: string) => {
    setMcpLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] [UI] Manually triggering tool: ${toolName}`]);
    setIsProcessing(true);
    
    // Simulate tool execution delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (toolName.includes("payment")) {
        setMcpLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] [ADK] Payment successful: 0.05 USDC`]);
    } else if (toolName.includes("escrow")) {
        setMcpLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] [ADK] Escrow created: Job #882`]);
    }
    
    setIsProcessing(false);
  };

  const handleConfirm = async () => {
    if (!activeTask || !user) return;

    setIsProcessing(true);
    try {
        // Soul Wallet Signature Simulation
        console.log("Signing with Soul Wallet:", connectedAddress);

        // ERC-8183 style payload
        const payload: AgentPayload = {
            fromAgent: "AMY_WALLET_AGENT",
            toAgent: "DAO_TREASURY_AGENT",
            intent: "dao_proposal_vote",
            nonce: Date.now(),
            timestamp: Math.floor(Date.now() / 1000)
        };

        // Perform the transfer (simulated if keys are missing)
        await walletSDK.sendStablecoin(
            "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", // Mock recipient
            "0.01",
            payload
        );

        // Update Firestore: User Metrics
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
            soulPoints: metrics.soulPoints + activeTask.soulReward,
            pluralityScore: metrics.pluralityScore + 0.1,
            stamps: metrics.stamps + 1
        }, { merge: true });

        // Update Firestore: Task Status
        const taskRef = doc(db, 'tasks', activeTask.id);
        await setDoc(taskRef, { status: 'completed' }, { merge: true });

        setActiveTask(null);
    } catch (error) {
        console.error("Transaction failed:", error);
        handleFirestoreError(error, OperationType.UPDATE, `tasks/${activeTask.id}`);
        alert("Transaction failed. Please check console for details.");
    } finally {
        setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!user && !connectedAddress) {
    return (
      <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="z-10 text-center max-w-2xl flex flex-col items-center"
        >
          <h1 className="text-7xl font-bold tracking-tighter mb-6 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
            AWallet
          </h1>
          <p className="text-xl text-gray-400 mb-12 leading-relaxed">
            The first invisible finance /payment Agentic wallet with IDQ | Soul Wallet.
            Secure your identity, manage your agents, and automate your finance.
          </p>

          <div className="w-full flex flex-col items-center mt-4">
            <button 
              onClick={handleGoogleLogin}
              className="w-full max-w-[280px] bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center space-x-3 hover:bg-gray-200 transition-all shadow-xl shadow-white/5"
            >
              <Globe className="w-5 h-5" />
              <span>Continue with Google</span>
            </button>

            {authError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-4 rounded-xl max-w-md text-left mt-4"
              >
                <p className="font-bold flex items-center space-x-2 mb-1 text-red-500">
                  <Shield className="w-4 h-4" />
                  <span>Authentication Error</span>
                </p>
                <p className="text-xs">{authError}</p>
              </motion.div>
            )}
          </div>
          <div className="w-full flex justify-center mt-4">
            <button 
              onClick={handleConnect}
              className="w-full max-w-sm bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-bold py-4 rounded-2xl flex items-center justify-center space-x-3 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)]"
            >
              <Wallet className="w-5 h-5" />
              <span>Connect IDQ Web3 Wallet</span>
            </button>
          </div>
            <div className="flex items-center justify-center space-x-6 text-gray-500 text-xs uppercase tracking-widest mt-8">
              <div className="flex items-center space-x-2">
                <Fingerprint className="w-4 h-4" />
                <span>SOUL DID LINKED</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Policy Guarded</span>
              </div>
            </div>
        </motion.div>

        <div className="absolute bottom-8 text-gray-600 text-[10px] uppercase tracking-[0.2em]">
          Powered by IDQ SoulWallet & AWallet ADK
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans flex overflow-hidden">
      
      {/* SIDEBAR */}
      <div className="w-20 lg:w-64 p-6 flex flex-col justify-between border-r border-white/5 bg-black z-20">
        <div>
            <div className="mb-12 pl-2">
                <h1 className="text-xl font-bold tracking-tight hidden lg:block">AWallet</h1>
            </div>
            
            <nav className="space-y-6">
                <NavItem icon={<MessageSquare />} label="Chat" active={activeTab === 'Chat'} onClick={() => setActiveTab('Chat')} />
                <NavItem icon={<LayoutGrid />} label="Overview" active={activeTab === 'Overview'} onClick={() => setActiveTab('Overview')} />
                <NavItem icon={<Wallet className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.8)] filter brightness-110" />} label="Wallet" active={activeTab === 'Wallet'} onClick={() => setActiveTab('Wallet')} />
                <NavItem icon={<User />} label="DID" active={activeTab === 'DID'} onClick={() => setActiveTab('DID')} />
                <NavItem icon={<ArrowLeftRight />} label="Treasury" active={activeTab === 'Treasury'} onClick={() => setActiveTab('Treasury')} />
                <NavItem 
                    icon={<Terminal className={showADK ? "text-emerald-400" : ""} />} 
                    label="ADK / MCP" 
                    onClick={() => setShowADK(!showADK)}
                />
            </nav>
        </div>

        <div className="pt-6 border-t border-white/5">ください・
          <button 
            onClick={logout}
            className="flex items-center space-x-4 text-gray-500 hover:text-red-400 transition-colors w-full pl-2"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden lg:block font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-black">
        
        {/* Header */}
        <header className="p-8 flex justify-between items-start">
            <div>
                <h2 className="text-4xl font-light mb-2">Hello, {user?.displayName?.split(' ')[0] || 'Agent'}</h2>
                <div className="flex items-center space-x-2">
                    <p className="text-xl text-gray-400">You have {tasks.length} tasks today</p>
                    {connectedAddress && (
                        <span className="bg-emerald-500/10 text-emerald-500 text-[10px] px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                            {connectedAddress.slice(0, 10)}...
                        </span>
                    )}
                </div>
            </div>
            <div className="flex items-center space-x-4">
                <div className="flex flex-col items-end mr-2">
                  <span className="text-xs font-bold text-white">{user?.displayName || 'Web3 Agent'}</span>
                  <span className="text-[10px] text-gray-500 font-mono">{metrics.did}</span>
                </div>
                <img 
                  src={user?.photoURL || `https://picsum.photos/seed/${user?.uid || connectedAddress}/100/100`} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full border border-white/10"
                  referrerPolicy="no-referrer"
                />
            </div>
        </header>

        {/* Dashboard Grid */}
        <div className="flex-1 px-8 pb-8 flex flex-col lg:flex-row gap-8 overflow-y-auto">
            
            {/* LEFT COLUMN: Dynamic Content based on Tab */}
            <div className="flex-1 space-y-6">
                {activeTab === 'Overview' && (
                    <>
                        {showADK ? (
                            /* ADK / MCP DEVELOPER PANEL */
                            <div className="space-y-6 animate-in slide-in-from-left duration-300">
                                <div className="bg-[#1c1c1e] rounded-3xl p-6 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                                <Blocks className="w-5 h-5 text-emerald-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-white font-semibold">Agent Development Kit</h3>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Lego Blocks for AI Finance</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <span className="text-[10px] text-emerald-500 font-mono">MCP SERVER ONLINE</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 mb-6">
                                        <ADKBlock 
                                            icon={<Code2 className="w-4 h-4" />}
                                            title="ERC-8183 Escrow"
                                            desc="Agent-to-Agent settlement with metadata"
                                            code="await adk.createEscrow({ to: 'agent_b', amount: '10' })"
                                            onClick={() => handleExecuteTool("awallet_create_erc8183_job")}
                                        />
                                        <ADKBlock 
                                            icon={<Cpu className="w-4 h-4" />}
                                            title="x402 Micropayments"
                                            desc="Gasless meta-transactions for AI agents"
                                            code="await adk.sendGaslessMicropayment({ to: 'api_v1', amount: '0.01' })"
                                            onClick={() => handleExecuteTool("awallet_execute_micro_payment")}
                                        />
                                    </div>

                                    <div className="border-t border-white/5 pt-6">
                                        <div className="flex items-center space-x-2 mb-4">
                                            <Activity className="w-4 h-4 text-emerald-500" />
                                            <h4 className="text-[10px] text-gray-500 uppercase tracking-widest">Live Tools (from MCP)</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {availableTools.map(tool => (
                                                <div key={tool.name} className="bg-black/40 p-3 rounded-xl border border-white/5">
                                                    <div className="text-xs font-bold text-emerald-400 mb-1 font-mono">{tool.name}</div>
                                                    <div className="text-[10px] text-gray-500 line-clamp-1">{tool.description}</div>
                                                </div>
                                            ))}
                                            {availableTools.length === 0 && (
                                                <div className="text-[10px] text-gray-600 italic">Fetching tools from server...</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* MCP TERMINAL */}
                                <div className="bg-black rounded-3xl p-6 border border-white/10 font-mono text-[11px]">
                                    <div className="flex items-center space-x-2 mb-4 text-gray-500">
                                        <Terminal className="w-4 h-4" />
                                        <span>MCP INTERACTION LOG</span>
                                    </div>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {mcpLog.map((log, i) => (
                                            <div key={i} className={log.startsWith("[MCP]") ? "text-emerald-500/70" : "text-gray-400"}>
                                                {log}
                                            </div>
                                        ))}
                                        <div className="text-white animate-pulse">_</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in duration-500">
                                {/* OKE CARD (Context) */}
                                <div className="mb-8">
                                    <h3 className="text-emerald-500 mb-4 font-medium text-sm uppercase tracking-wider">Agent Identity & Context</h3>
                                    <OkeCard metrics={metrics} />
                                </div>

                                {/* x402 AUTO-DISCOVERY MODULE */}
                                <div className="bg-[#1c1c1e] rounded-3xl p-6 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.05)]">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center space-x-2">
                                            <Zap className="w-4 h-4 text-indigo-400" />
                                            <h3 className="text-indigo-400 font-medium text-sm uppercase tracking-wider">x402 Auto-Discovery</h3>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-[10px] text-gray-500 uppercase">Session Mode</span>
                                            <button 
                                                onClick={() => setIsSessionActive(!isSessionActive)}
                                                className={`w-8 h-4 rounded-full transition-colors relative ${isSessionActive ? 'bg-indigo-500' : 'bg-gray-700'}`}
                                            >
                                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isSessionActive ? 'left-4.5' : 'left-0.5'}`} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        {x402Services.map(service => (
                                            <div key={service.id} className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5 group hover:border-indigo-500/30 transition-all">
                                                <div className="flex items-center space-x-3">
                                                    <div className={`w-2 h-2 rounded-full ${
                                                        service.status === 'authorized' ? 'bg-emerald-500' : 
                                                        service.status === 'discovered' ? 'bg-indigo-500 animate-pulse' : 'bg-red-500'
                                                    }`} />
                                                    <div>
                                                        <div className="text-xs font-medium text-white">{service.serviceName}</div>
                                                        <div className="text-[10px] text-gray-500">{service.domain}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <div className="text-right">
                                                        <div className="text-[10px] font-mono text-indigo-300">{service.costPerRequest}</div>
                                                        <div className="text-[9px] text-gray-600 uppercase tracking-tighter">{service.status}</div>
                                                    </div>
                                                    {service.status === 'discovered' && (
                                                        <button 
                                                            onClick={() => handleAuthorizeService(service.id)}
                                                            className="bg-indigo-500/20 text-indigo-400 p-1.5 rounded-lg hover:bg-indigo-500 hover:text-white transition-all"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'Chat' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        {/* Functional AI Chat */}
                        <div className="bg-[#1c1c1e] rounded-3xl p-6 flex flex-col h-[600px] border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                        <MessageSquare className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">AI Advocacy Agent</div>
                                        <div className="text-[10px] text-emerald-500/60 font-mono uppercase">Active Session • E2E Encrypted</div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-[10px] text-gray-500 font-mono">AGENT ONLINE</span>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar">
                                {chatMessages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                                            msg.role === 'user' 
                                            ? 'bg-emerald-500 text-black rounded-tr-none font-medium' 
                                            : 'bg-white/5 text-gray-300 rounded-tl-none border border-white/5'
                                        }`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={handleSendMessage} className="relative">
                                <input 
                                    type="text" 
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Ask about your financial health, tasks, or policies..."
                                    className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
                                />
                                <button 
                                    type="submit"
                                    className="absolute right-3 top-3 w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-black hover:scale-105 transition-transform shadow-lg shadow-emerald-500/20"
                                >
                                    <ArrowLeftRight className="w-5 h-5 rotate-90" />
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'Wallet' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        {/* POLICY ENGINE CARD */}
                        <div className="bg-[#1c1c1e] rounded-3xl p-6 border border-white/5 relative overflow-hidden">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center space-x-2">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                    <h3 className="text-emerald-500 font-medium text-sm uppercase tracking-wider">Policy Engine</h3>
                                </div>
                                <button 
                                    onClick={() => setShowPolicyEditor(!showPolicyEditor)}
                                    className="text-[10px] text-gray-500 font-mono hover:text-emerald-400 transition-colors"
                                >
                                    {showPolicyEditor ? 'CANCEL' : 'EDIT POLICY'}
                                </button>
                            </div>

                            {showPolicyEditor ? (
                                <div className="space-y-4 animate-in fade-in duration-200">
                                    <div className="bg-black/40 p-4 rounded-xl border border-emerald-500/20">
                                        <label className="text-[10px] text-gray-500 uppercase block mb-2">Daily Spending Limit (USDC)</label>
                                        <div className="flex space-x-2">
                                            <input 
                                                type="text" 
                                                defaultValue={policy.dailyLimit.split(' ')[0]} 
                                                id="policy-input"
                                                className="bg-black border border-white/10 rounded-lg px-3 py-2 text-white w-full focus:outline-none focus:border-emerald-500"
                                            />
                                            <button 
                                                onClick={() => {
                                                    const val = (document.getElementById('policy-input') as HTMLInputElement).value;
                                                    handleUpdatePolicy(`${val} USDC`);
                                                }}
                                                className="bg-emerald-500 text-black px-4 py-2 rounded-lg text-xs font-bold"
                                            >
                                                SAVE
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                        <div className="text-[10px] text-gray-500 uppercase mb-1">Daily Limit</div>
                                        <div className="text-lg font-semibold text-white">{policy.dailyLimit}</div>
                                    </div>
                                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                        <div className="text-[10px] text-gray-500 uppercase mb-1">Spent Today</div>
                                        <div className="text-lg font-semibold text-emerald-400">{policy.spentToday}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* x402 AUTONOMOUS PAYMENT FEED */}
                        <X402PaymentFeed />
                    </div>
                )}

                {(activeTab === 'DID' || activeTab === 'Treasury') && (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-600 animate-pulse">
                        <Settings2 className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-sm uppercase tracking-widest">Module Loading...</p>
                    </div>
                )}
            </div>

            {/* RIGHT COLUMN: Task List */}
            <div className="flex-1 lg:max-w-md">
                <div className="flex justify-between items-end mb-4">
                    <h3 className="text-emerald-500 font-medium text-sm uppercase tracking-wider">Upcoming Tasks</h3>
                    <button className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Bell className="w-4 h-4 text-emerald-500" />
                    </button>
                </div>

                <div className="space-y-3">
                    {tasks.map(task => (
                        <div 
                            key={task.id}
                            onClick={() => handleTaskClick(task)}
                            className="bg-[#1c1c1e] p-4 rounded-2xl flex items-center space-x-4 cursor-pointer hover:bg-[#2c2c2e] transition-colors border border-transparent hover:border-white/10 group"
                        >
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                {task.icon}
                            </div>
                            <div className="flex-1">
                                <div className="font-medium text-white">{task.title}</div>
                                <div className="text-sm text-gray-500">{task.subtitle}</div>
                            </div>
                            <div className="text-xs text-gray-600 font-medium bg-black/30 px-2 py-1 rounded">
                                {task.deadline}
                            </div>
                        </div>
                    ))}
                    
                    {tasks.length === 0 && (
                        <div className="text-center py-12 text-gray-600">
                            No pending tasks.
                            <br/>You are all caught up!
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* FAB */}
        <div className="absolute bottom-8 right-8">
            <button className="w-14 h-14 bg-emerald-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform text-black">
                <Plus className="w-8 h-8" />
            </button>
        </div>
      </div>

      {/* OVERLAY: Agentic Consent Interface */}
      {activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <FinalConsentCard 
                summary={activeTask.summary}
                onFinalConfirm={handleConfirm}
                onCancel={() => setActiveTask(null)}
                isProcessing={isProcessing}
            />
        </div>
      )}

    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
    return (
        <div 
            onClick={onClick}
            className={`flex items-center space-x-4 cursor-pointer group ${active ? 'text-white' : 'text-gray-500 hover:text-white'}`}
        >
            <div className={`w-6 h-6 ${active ? 'text-white' : 'group-hover:text-white'}`}>
                {icon}
            </div>
            <span className="hidden lg:block font-medium">{label}</span>
        </div>
    )
}

function ADKBlock({ icon, title, desc, code, onClick }: { icon: React.ReactNode, title: string, desc: string, code: string, onClick?: () => void }) {
    return (
        <div 
            onClick={onClick}
            className="bg-black/40 p-4 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all group cursor-pointer active:scale-[0.98]"
        >
            <div className="flex items-center space-x-3 mb-2">
                <div className="text-emerald-400">{icon}</div>
                <div className="text-sm font-medium text-white">{title}</div>
            </div>
            <p className="text-[11px] text-gray-500 mb-3">{desc}</p>
            <div className="bg-black p-2 rounded-lg border border-white/5 font-mono text-[9px] text-emerald-500/80 overflow-x-auto">
                {code}
            </div>
        </div>
    )
}
