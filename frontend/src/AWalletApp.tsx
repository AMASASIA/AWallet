import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
// @ts-ignore
import CoinbaseWalletSDK from '@coinbase/wallet-sdk';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, signInWithGoogle, logout, db } from './firebase';
import axios from 'axios';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocFromServer } from 'firebase/firestore';
import { SwipeToConfirm as FinalConsentCard } from './features/agent-control/SwipeToConfirm';
import { OkeCard } from './components/OkeCard';
import { SoulMetrics, AgenticTask, AgentPayload, SpendingPolicy, X402Discovery } from './types';
import { walletSDK } from './walletSdk';
import { adk } from './adk/AWalletADK';
import { X402PaymentFeed } from './components/X402PaymentFeed';
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
  const [fbUser, loading, fbError] = useAuthState(auth);
  const [user, setUser] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sync fbUser with local user state
  useEffect(() => {
    if (fbUser) {
      setUser(fbUser);
      setIsAuthReady(true);
    } else if (!loading) {
      if (user?.uid !== "mock-user-402") {
        setUser(null);
        setIsAuthReady(false);
      } else {
        setIsAuthReady(true);
      }
    }
  }, [fbUser, loading, user?.uid]);

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

  const [balances, setBalances] = useState<{ [key: string]: string }>({
    USDC: "2,450.00",
    AWT: "10,000",
    ETH: "0.45"
  });

  // 2. Task State (Agentic Proposals)
  const [tasks, setTasks] = useState<AgenticTask[]>([]);
  const [activeTask, setActiveTask] = useState<AgenticTask | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [agent, setAgent] = useState<any>(null);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [showADK, setShowADK] = useState(false);
  const [mcpLog, setMcpLog] = useState<string[]>(["[MCP] Server initialized...", "[MCP] Tools registered: ERC-8183, x402, Amane"]);
  // const [availableTools, setAvailableTools] = useState<{name: string, description: string}[]>([]);
  const [x402Services, setX402Services] = useState<X402Discovery[]>([
    { id: '1', serviceName: 'Market Data AI', domain: 'api.market.ai', costPerRequest: '0.05 USDC', status: 'authorized' },
    { id: '2', serviceName: 'Sentiment Analysis', domain: 'nlp.vibe.io', costPerRequest: '0.01 USDC', status: 'discovered' },
    { id: '3', serviceName: 'Image Gen V3', domain: 'img.dream.net', costPerRequest: '0.25 USDC', status: 'blocked' }
  ]);
  // const [isSessionActive, setIsSessionActive] = useState(true);
  // const [showPolicyEditor, setShowPolicyEditor] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'agent' | 'user', text: string}[]>([
    { role: 'agent', text: "Hello Amy! I've been monitoring your transactions. Your security policy is active. How can I help you today?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [activeTab, setActiveTab] = useState<'Overview' | 'Chat' | 'Wallet' | 'DID' | 'Treasury'>('Overview');

  // Fetch/Sync User Data from Firestore
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const syncUser = async () => {
      if (user.uid === "mock-user-402") return; // Skip Firestore for mock user

      const userRef = doc(db, 'users', user.uid);
      const policyRef = doc(db, 'policies', user.uid);

      try {
        await getDocFromServer(doc(db, 'test', 'connection')).catch(() => {});
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          const newUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            did: `did:soul:${user.uid.slice(0, 10)}`,
            soulPoints: 1000,
            pluralityScore: 1.0,
            stamps: 0,
            createdAt: new Date().toISOString()
          };
          await setDoc(userRef, newUser);

          const newPolicy = {
            id: `pol_${user.uid}`,
            maxPerTx: '100 USDC',
            dailyLimit: '500 USDC',
            spentToday: '0 USDC',
            categories: ['api_usage', 'dao_voting', 'micropayments']
          };
          await setDoc(policyRef, newPolicy);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'users');
      }
    };

    syncUser();
  }, [user, isAuthReady]);

  // Fetch Agent Status and Balances from API v2
  useEffect(() => {
    if (!user || user.uid === "mock-user-402") return;

    const fetchAgentData = async () => {
      try {
        const res = await axios.get('/api/v2/agents');
        if (res.data.result === 'success') {
          // Find agent owned by this user
          const myAgent = res.data.agents.find((a: any) => a.ownerAddress === user.uid || a.ownerAddress === connectedAddress);
          if (myAgent) {
            setAgent(myAgent);
            setMetrics(prev => ({ ...prev, did: myAgent.did }));
            
            // Now fetch balance for this agent
            try {
                const balRes = await axios.get(`/api/v2/wallet/${myAgent.did}/balance`);
                if (balRes.data.result === 'success') {
                    const b = balRes.data.balances;
                    setBalances(b);
                    setMcpLog(prev => [...prev, `[System] Agent Linked: ${myAgent.did}`, `[Balance] USDC: ${b.USDC}, ETH: ${b.ETH}`]);
                }
            } catch (e) {
                console.error("Balance fetch failed", e);
            }
          }
        }
      } catch (err) {
          console.error("Failed to fetch agent status", err);
      }
    };
    fetchAgentData();
  }, [user, connectedAddress]);

  // Real-time Listeners
  useEffect(() => {
    if (!isAuthReady || !user || user.uid === "mock-user-402") return;

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

  // Handle Login/Logout
  const handleGoogleLogin = async () => {
    try {
      setAuthError('');
      await signInWithGoogle();
    } catch (err: any) {
      console.warn("Firebase Auth Error: Falling back to Mock User.", err);
      if (err.code === 'auth/unauthorized-domain' || err.code === 'auth/internal-error' || err.code === 'auth/operation-not-allowed') {
        const mockUser = {
          uid: "mock-user-402",
          displayName: "AWallet Tester",
          email: "tester@awallet.io",
          photoURL: "https://api.dicebear.com/7.x/pixel-art/svg?seed=tester"
        };
        setUser(mockUser);
        setIsAuthReady(true);
        setAuthError("Auth bypass: Loaded Local Mock Account \u2705");
        setTimeout(() => setAuthError(''), 3000);
        return;
      }
      setAuthError(err.message || 'Login failed');
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setIsAuthReady(false);
  };

  const handleConnect = async () => {
    try {
        const { CoinbaseWalletSDK } = await import('@coinbase/wallet-sdk');
        const { setGlobalProvider, resolveBasename } = await import('./shared/providers/ethersProvider');
        
        const coinbaseWallet = new CoinbaseWalletSDK({
            appName: 'IDQ AWallet',
            appLogoUrl: 'https://picsum.photos/100',
            darkMode: true
        });

        // Use Base Mainnet (8453) for real-world functionality (Basenames)
        const provider = coinbaseWallet.makeWeb3Provider("https://mainnet.base.org", 8453);
        const ethersProvider = new ethers.BrowserProvider(provider as any);
        
        const signer = await ethersProvider.getSigner();
        const address = await signer.getAddress();
        
        // Update Global Provider for Shared ADK and ethersProvider.ts
        setGlobalProvider(provider);
        setConnectedAddress(address);
        
        // Resolve Basename (e.g., amasasia.base.eth)
        const name = await resolveBasename(address);
        console.log(`[Identity:Soul] Resolved Basename: ${name || 'None'}`);
        
        // Persistence: Link address to the current Soul document (Firestore)
        if (user && user.uid && user.uid !== "mock-user-402") {
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, { 
                linkedAddress: address, 
                basename: name,
                lastLinked: new Date().toISOString() 
            }, { merge: true });
            console.log(`[Persistence] Soul linked to address: ${address}`);
        }
        
        setMcpLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Soul Identity Linked: ${name || address}`]);
        return { address, name };
    } catch (err: any) {
        console.error(err);
        setAuthError("Soul Identity Sync Failed: " + err.message);
        return null;
    }
  };

  const handleCoinbaseLogin = async () => {
    setAuthError('');
    const result = await handleConnect();
    if (result) {
        const { address, name } = result;
        const walletUser = {
            uid: `wallet-${address}`,
            displayName: name || `Web3 Agent`,
            email: `${address.slice(0, 10)}@awallet.io`,
            photoURL: `https://api.dicebear.com/7.x/shapes/svg?seed=${address}`
        };
        setUser(walletUser);
        setIsAuthReady(true);
        setAuthError(`Web3 Identity: ${name || address.slice(0, 8)} \u2705`);
        setTimeout(() => setAuthError(''), 3000);
    }
  };

  const handleRegisterAgent = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      const res = await axios.post('/api/v2/agent/register', {
        agentName: `${user.displayName}'s Agent`,
        ownerAddress: user.uid,
        agentType: "autonomous"
      });
      if (res.data.result === 'success') {
        const newAgent = res.data.agent;
        setAgent(newAgent);
        setMetrics(prev => ({ ...prev, did: newAgent.did }));
        setMcpLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Agent Created & Registered: ${newAgent.did}`]);
        setAuthError("Agent Registered Successfully! \u2705");
        setTimeout(() => setAuthError(''), 3000);
      }
    } catch (err: any) {
        setAuthError("Registration Failed: " + (err.response?.data?.error || err.message));
    } finally {
        setIsProcessing(false);
    }
  };

  const handleConfirm = async () => {
    if (!activeTask) return;
    setIsProcessing(true);
    try {
      // Real API Call for payment if it's an agent task
      if (agent && activeTask.title.toLowerCase().includes("payment")) {
          await axios.post(`/api/v2/wallet/${agent.did}/pay`, {
             to: '0x1234567890123456789012345678901234567890', // Default mock recipient
             amount: 0.05,
             currency: 'USDC',
             purpose: activeTask.summary
          });
          setMcpLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] On-Chain Settlement Complete: ${agent.did}`]);
      } else {
          await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      setTasks(prev => prev.filter(t => t.id !== activeTask?.id));
      setMetrics(prev => ({ ...prev, soulPoints: prev.soulPoints + (activeTask?.soulReward || 0) }));
      setActiveTask(null);
    } catch (err: any) {
        console.error("Task execution failed", err);
        setMcpLog(prev => [...prev, `[Error] Execution failed: ${err.message}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAuthReady || !user) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
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
            The first invisible finance payment Agentic wallet with IDQ | Soul Wallet.
            Secure your identity, manage your agents, and automate A.I. finance.
          </p>

          <div className="w-full flex flex-col items-center space-y-4 mt-4">
            <button 
              onClick={handleGoogleLogin}
              className="w-full max-w-[280px] bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center space-x-3 hover:bg-gray-200 transition-all shadow-xl shadow-white/5"
            >
              <Globe className="w-5 h-5" />
              <span>Continue with Google</span>
            </button>

            <button 
              onClick={handleCoinbaseLogin}
              className="w-full max-w-[280px] bg-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center space-x-3 hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/10"
            >
              <Wallet className="w-5 h-5" />
              <span>Continue with Crypto</span>
            </button>
            
            {authError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-4 rounded-xl max-w-md text-left mt-4"
              >
                <p className="font-bold flex items-center space-x-2 mb-1 text-red-500">
                  <Shield className="w-4 h-4" />
                  <span>Authentication Status</span>
                </p>
                <p className="text-xs">{authError}</p>
              </motion.div>
            )}
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
                <NavItem icon={<Wallet className="text-emerald-400" />} label="Wallet" active={activeTab === 'Wallet'} onClick={() => setActiveTab('Wallet')} />
                <NavItem icon={<User />} label="DID" active={activeTab === 'DID'} onClick={() => setActiveTab('DID')} />
                <NavItem icon={<ArrowLeftRight />} label="Treasury" active={activeTab === 'Treasury'} onClick={() => setActiveTab('Treasury')} />
                <NavItem icon={<Terminal className={showADK ? "text-emerald-400" : ""} />} label="ADK / MCP" onClick={() => setShowADK(!showADK)} />
            </nav>
        </div>
        <div className="pt-6 border-t border-white/5">
          <button onClick={handleLogout} className="flex items-center space-x-4 text-gray-500 hover:text-red-400 transition-colors w-full pl-2">
            <LogOut className="w-5 h-5" />
            <span className="hidden lg:block font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-black">
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
                <img src={user?.photoURL || `https://picsum.photos/seed/user/100/100`} alt="Profile" className="w-10 h-10 rounded-full border border-white/10" referrerPolicy="no-referrer" />
            </div>
        </header>

        <div className="flex-1 px-8 pb-8 flex flex-col lg:flex-row gap-8 overflow-y-auto">
            <div className="flex-1 space-y-6">
                {activeTab === 'Overview' && (
                    <AnimatePresence mode="wait">
                        <motion.div key="overview" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <StatCard title="Plurality Score" value={`Π ${metrics.pluralityScore}`} trend="+0.2" icon={<Activity className="text-emerald-400" />} />
                                <StatCard title="Soul Points" value={metrics.soulPoints.toLocaleString()} trend="+50" icon={<Zap className="text-orange-400" />} />
                            </div>
                            
                            {!agent && (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-8 flex flex-col items-center text-center">
                                    <Cpu className="w-12 h-12 text-emerald-500 mb-4 animate-pulse" />
                                    <h3 className="text-xl font-bold mb-2 text-white">No Active AI Agent Found</h3>
                                    <p className="text-gray-400 max-w-md mb-6">Register your first AI agent to enable autonomous finance and background A2A settlement.</p>
                                    <button 
                                        onClick={handleRegisterAgent}
                                        disabled={isProcessing}
                                        className="bg-white text-black font-bold py-3 px-8 rounded-xl hover:bg-emerald-400 hover:scale-105 transition-all disabled:opacity-50"
                                    >
                                        {isProcessing ? 'Registering...' : 'Register Neural Agent'}
                                    </button>
                                </div>
                            )}

                            <OkeCard metrics={metrics} />
                            <div className="bg-white/5 rounded-3xl p-8 border border-white/5">
                                <h3 className="text-lg font-medium mb-6">Pending Decisions</h3>
                                <div className="space-y-4">
                                    {tasks.map(task => (
                                        <div key={task.id} onClick={() => setActiveTask(task)} className="bg-white/5 p-4 rounded-2xl flex items-center justify-between border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer group">
                                            <div className="flex items-center space-x-4">
                                                <div className="text-2xl">{task.icon}</div>
                                                <div>
                                                    <div className="font-medium text-white group-hover:text-emerald-400 transition-colors">{task.title}</div>
                                                    <div className="text-xs text-gray-500">{task.subtitle}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-emerald-500">+{task.soulReward} SP</div>
                                                <div className="text-[10px] text-gray-600 uppercase tracking-tighter">Deadline: {task.deadline}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-3xl p-8 border border-white/5">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-medium">Auto-Settlement Services (x402)</h3>
                                    <div className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-full border border-blue-500/20">AGENTIC DISCOVERY</div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {x402Services.map(service => (
                                        <div key={service.id} className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all group">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${service.status === 'blocked' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                    <Globe size={16} />
                                                </div>
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${service.status === 'authorized' ? 'bg-emerald-500 text-black' : 'bg-white/5 text-gray-500'}`}>{service.status}</span>
                                            </div>
                                            <div className="font-bold text-sm mb-1">{service.serviceName}</div>
                                            <div className="text-[10px] text-gray-500 font-mono mb-3">{service.domain}</div>
                                            <div className="flex justify-between items-center pt-3 border-t border-white/5">
                                                <span className="text-xs font-bold text-white">{service.costPerRequest}</span>
                                                <button className="text-[10px] text-emerald-500 hover:underline">Manage</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                )}
                {activeTab === 'Chat' && (
                    <div className="h-full flex flex-col bg-white/5 rounded-3xl p-6 border border-white/5 relative">
                        <div className="flex-1 space-y-6 overflow-y-auto pb-20 pr-2 custom-scrollbar">
                            {chatMessages.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                    <MessageSquare size={48} className="mb-4" />
                                    <p className="text-sm font-medium">Your Agent is online.</p>
                                    <p className="text-xs">Ask me to analyze proposals or manage policies.</p>
                                </div>
                            )}
                            {chatMessages.map((msg, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-emerald-500 text-black font-semibold' : 'bg-white/10 text-gray-200 border border-white/5 shadow-xl'}`}>
                                        <div className="text-[10px] uppercase font-bold opacity-50 mb-1">{msg.role}</div>
                                        {msg.text}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        <div className="absolute bottom-6 left-6 right-6">
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                if(!chatInput.trim()) return;
                                const userMsg = chatInput;
                                setChatInput("");
                                setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
                                
                                // Simulate Agent Analysis
                                setTimeout(() => {
                                    let response = "I've analyzed your request. As your Soul-linked agent, I recommend reviewing the latest Pol-01 policy adjustment before proceeding.";
                                    if(userMsg.toLowerCase().includes("proposal")) {
                                        response = "There is one pending Community Grant proposal (#42). I've pre-summarized the technical risks. Should I generate the consent card now?";
                                    } else if(userMsg.toLowerCase().includes("balance") || userMsg.toLowerCase().includes("wallet")) {
                                        response = `Current treasury status: 15,000 USDC. Your spending limit is ${policy.maxPerTx}. Safe to execute further jobs.`;
                                    }
                                    setChatMessages(prev => [...prev, { role: 'agent', text: response }]);
                                    setMcpLog(prev => [...prev, `[MCP] Agent reasoning complete: ${response.slice(0, 30)}...`]);
                                }, 1200);
                            }} className="relative">
                                <input 
                                    type="text" 
                                    value={chatInput} 
                                    onChange={(e) => setChatInput(e.target.value)} 
                                    placeholder="Message AWallet Agent..." 
                                    className="w-full bg-white/10 border border-white/5 rounded-2xl py-4 px-6 text-white placeholder-gray-500 outline-none focus:border-emerald-500/50 transition-all font-light shadow-2xl backdrop-blur-md" 
                                />
                                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white text-black rounded-xl hover:bg-emerald-400 hover:scale-105 transition-all active:scale-95 shadow-lg">
                                    <Zap size={18} />
                                </button>
                            </form>
                        </div>
                    </div>
                )}
                {activeTab === 'Wallet' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <BalanceCard symbol="USDC" balance="2,450.00" trend="+12.5%" />
                            <BalanceCard symbol="AWT" balance="10,000" trend="Governance" color="emerald" />
                            <BalanceCard symbol="ETH" balance="0.45" trend="-2.4%" />
                        </div>
                        <div className="bg-white/5 rounded-3xl p-8 border border-white/5">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-medium">Recent Activity</h3>
                                <button className="text-xs text-gray-500 hover:text-white transition-colors">View All</button>
                            </div>
                            <div className="space-y-4">
                                <ActivityItem title="x402 Micropayment" desc="Payment to AI Oracle Feed" amount="-0.05 USDC" status="Verified" icon={<Zap size={14} className="text-emerald-400" />} />
                                <ActivityItem title="ERC-8183 Escrow" desc="Job: Sentiment Analysis V3" amount="-10.00 USDC" status="Pending" icon={<Blocks size={14} className="text-blue-400" />} />
                                <ActivityItem title="Soul Point Mint" desc="Reward for DAO Vote" amount="+25 SP" status="Success" icon={<Zap size={14} className="text-orange-400" />} />
                            </div>
                        </div>
                        {!connectedAddress && (
                            <div className="flex flex-col items-center justify-center p-12 bg-emerald-500/5 rounded-3xl border border-emerald-500/10 text-center">
                                <Wallet className="w-12 h-12 text-emerald-500 mb-4 opacity-50" />
                                <h4 className="text-xl font-bold mb-2">Connect Smart Wallet</h4>
                                <p className="text-gray-400 max-w-sm mb-6">Enable advanced agentic features by connecting your Coinbase Smart Wallet.</p>
                                <button onClick={handleConnect} className="bg-white text-black font-bold py-3 px-8 rounded-xl hover:bg-emerald-400 transition-all active:scale-95 flex items-center space-x-2">
                                    <Fingerprint size={18} />
                                    <span>Sync Identity</span>
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'DID' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="bg-gradient-to-br from-white/10 to-transparent p-8 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center gap-8">
                            <div className="relative">
                                <img 
                                    src={user?.photoURL || `https://api.dicebear.com/7.x/shapes/svg?seed=${user?.uid || 'amy'}`} 
                                    className="w-32 h-32 rounded-3xl border-2 border-emerald-500/30 p-1" 
                                    alt="Soul Portrait"
                                />
                                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-black p-2 rounded-xl shadow-lg ring-4 ring-black">
                                    <ShieldCheck size={20} />
                                </div>
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-3xl font-bold mb-2 tracking-tight">{user?.displayName || 'Amy .Agent'}</h3>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                    <span className="text-xs font-mono text-gray-400 bg-white/5 py-1 px-3 rounded-full border border-white/5">{metrics.did}</span>
                                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 py-1 px-3 rounded-full ring-1 ring-emerald-500/20">Identity Linked</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white/5 p-8 rounded-3xl border border-white/5">
                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Soul Attestations</h4>
                                <div className="space-y-4">
                                    <SBTItem title="Verified Human" issuer="did:worldcoin" date="Dec 2023" icon={<User className="text-blue-400" />} />
                                    <SBTItem title="A-Wallet Early Adopter" issuer="did:awallet" date="Jan 2024" icon={<Zap className="text-orange-400" />} />
                                    <SBTItem title="DAO Voting Power (Q4)" issuer="did:soul" date="Feb 2024" icon={<Activity className="text-emerald-400" />} />
                                </div>
                            </div>
                            <div className="bg-white/5 p-8 rounded-3xl border border-white/5">
                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Trust Metrics</h4>
                                <div className="space-y-6">
                                    <MetricBar label="Plurality Score Π" value={metrics.pluralityScore * 10} max={100} color="emerald" />
                                    <MetricBar label="Soul Points" value={65} max={100} color="blue" />
                                    <MetricBar label="Governance Participation" value={92} max={100} color="orange" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'Treasury' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        <div className="flex justify-between items-end">
                            <div>
                                <h3 className="text-4xl font-bold mb-2 tracking-tight">Active Treasuries</h3>
                                <p className="text-gray-400">Manage decentralized funds and agentic allocations.</p>
                            </div>
                            <button 
                                onClick={async () => {
                                    setIsProcessing(true);
                                    try {
                                        const res = await adk.createJob({
                                            providerAgent: 'did:awallet:agent:design-pro',
                                            evaluator: 'did:soul:human_01',
                                            budget: 150,
                                            currency: 'USDC',
                                            deadline: '2026-05-01',
                                            taskDescription: 'Logo Design for Project X'
                                        });
                                        if (res.success) {
                                            setMcpLog(prev => [...prev, `[ERC-8183] New Escrow Funded: ${res.jobId}`]);
                                            setAuthError("Escrow Created! Check Activity feed.");
                                            setTimeout(() => setAuthError(''), 3000);
                                        }
                                    } finally {
                                        setIsProcessing(false);
                                    }
                                }}
                                className="bg-emerald-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-emerald-400 transition-all flex items-center space-x-2"
                            >
                                <Plus size={18} />
                                <span>Create Job</span>
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white/5 border border-white/5 p-8 rounded-3xl text-left hover:border-blue-500/30 transition-all cursor-pointer group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Globe size={24} className="text-blue-400" />
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Status</span>
                                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">LOCKED</span>
                                    </div>
                                </div>
                                <h4 className="text-xl font-bold mb-1">Global Research DAO</h4>
                                <p className="text-sm text-gray-500 mb-6 font-light">Allocated budget for AI-driven sentiment analysis and market reasoning.</p>
                                <div className="flex justify-between items-center pt-6 border-t border-white/5">
                                    <div className="text-3xl font-bold text-white font-mono">15,000 <span className="text-lg opacity-40">USDC</span></div>
                                    <ArrowLeftRight className="text-gray-600" size={20} />
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/5 p-8 rounded-3xl text-left hover:border-orange-500/30 transition-all cursor-pointer group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Zap size={24} className="text-orange-400" />
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Type</span>
                                        <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">MICROPAY</span>
                                    </div>
                                </div>
                                <h4 className="text-xl font-bold mb-1">Inference Credits</h4>
                                <p className="text-sm text-gray-500 mb-6 font-light">Auto-recharging pool for gasless x402 payments to LLM providers.</p>
                                <div className="flex justify-between items-center pt-6 border-t border-white/5">
                                    <div className="text-3xl font-bold text-white font-mono">250 <span className="text-lg opacity-40">USDC</span></div>
                                    <Activity className="text-gray-600" size={20} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-emerald-500/5 border border-dashed border-emerald-500/20 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                            <Blocks className="text-emerald-500/30 mb-4" size={48} />
                            <h4 className="text-lg font-bold text-emerald-500/60 mb-2">Deploy New Layer-2 Treasury</h4>
                            <p className="text-sm text-gray-500 max-w-sm">Instantiate a secure, policy-governed vault for your agentic fleet on Base.</p>
                        </div>
                    </motion.div>
                )}
            </div>

            <div className="w-full lg:w-96 space-y-6">
                <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Agent Status</h3>
                        <div className="flex items-center space-x-2">
                           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                           <span className="text-[10px] text-emerald-500 font-bold">LIVE</span>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="flex justify-between items-center pb-4 border-b border-white/5">
                            <span className="text-gray-500 text-sm">Policy Guard</span>
                            <span className="text-emerald-400 text-xs font-mono">ACTIVE</span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b border-white/5">
                            <span className="text-gray-500 text-sm">Escrow Capacity</span>
                            <span className="text-white text-xs font-mono italic">0.05 / 2.0 ETH</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm">Amane Identity</span>
                            <span className="text-blue-400 text-xs font-mono">VERIFIED</span>
                        </div>
                    </div>
                </div>
                <X402PaymentFeed logs={mcpLog} />
                {showADK && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white/5 rounded-3xl p-6 border border-emerald-500/20">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-400 mb-6 flex items-center space-x-2">
                            <Terminal size={14} />
                            <span>ADK Console</span>
                        </h3>
                        <div className="space-y-4">
                            <ADKBlock icon={<Zap size={14} />} title="x402 Micropayment" desc="Execute zero-gas A2A payment." code="adk.pay({ amount: 0.05, currency: 'USDC' })" onClick={() => adk.pay({ targetAddress: '0x...', amount: 0.01, currency: 'USDC', reason: 'API call' })} />
                            <ADKBlock icon={<Blocks size={14} />} title="ERC-8183 Job" desc="Create task settlement escrow." code="adk.createJob({ budget: 10 })" />
                            <ADKBlock icon={<Fingerprint size={14} />} title="Soul Record" desc="Write consent proof to SBT." code="adk.recordConsent({ soulId: '...' })" />
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
      </div>
      {activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <FinalConsentCard agentId={activeTask.id} summary={activeTask.summary} onFinalConfirm={handleConfirm} onCancel={() => setActiveTask(null)} isProcessing={isProcessing} />
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, trend, icon }: { title: string, value: string, trend: string, icon: React.ReactNode }) {
    return (
        <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
            <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">{icon}</div>
                <div className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">{trend}</div>
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">{title}</div>
            <div className="text-2xl font-bold text-white">{value}</div>
        </div>
    )
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
    return (
        <div onClick={onClick} className={`flex items-center space-x-4 cursor-pointer group ${active ? 'text-white' : 'text-gray-500 hover:text-white'}`}>
            <div className={`w-6 h-6 ${active ? 'text-white' : 'group-hover:text-white'}`}>{icon}</div>
            <span className="hidden lg:block font-medium">{label}</span>
        </div>
    )
}

function BalanceCard({ symbol, balance, trend, color = 'blue' }: { symbol: string, balance: string, trend: string, color?: string }) {
    const colorClasses = {
        blue: 'text-blue-400 bg-blue-500/10',
        emerald: 'text-emerald-400 bg-emerald-500/10',
        orange: 'text-orange-400 bg-orange-500/10'
    };
    return (
        <div className="bg-white/5 p-8 rounded-3xl border border-white/5">
            <div className="flex justify-between items-center mb-6">
                <span className="text-sm font-bold uppercase tracking-widest text-gray-500">{symbol}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>{trend}</span>
            </div>
            <div className="text-3xl font-bold font-mono tracking-tight">${balance}</div>
        </div>
    );
}

function ActivityItem({ title, desc, amount, status, icon }: { title: string, desc: string, amount: string, status: string, icon: React.ReactNode }) {
    return (
        <div className="bg-white/5 p-4 rounded-2xl flex items-center justify-between border border-white/5 group hover:border-white/20 transition-all">
            <div className="flex items-center space-x-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">{icon}</div>
                <div>
                    <div className="text-sm font-medium text-white">{title}</div>
                    <div className="text-[10px] text-gray-500">{desc}</div>
                </div>
            </div>
            <div className="text-right">
                <div className={`text-sm font-bold ${amount.startsWith('-') ? 'text-white' : 'text-emerald-500'}`}>{amount}</div>
                <div className="text-[9px] text-gray-600 uppercase font-mono">{status}</div>
            </div>
        </div>
    );
}

function SBTItem({ title, issuer, date, icon }: { title: string, issuer: string, date: string, icon: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/5 rounded-xl">{icon}</div>
                <div className="text-sm font-medium">{title}</div>
            </div>
            <div className="text-right">
                <div className="text-[10px] text-gray-500">{issuer}</div>
                <div className="text-[9px] text-gray-600 uppercase">{date}</div>
            </div>
        </div>
    );
}

function MetricBar({ label, value, max, color }: { label: string, value: number, max: number, color: 'emerald' | 'blue' | 'orange' }) {
    const bgColors = {
        emerald: 'bg-emerald-500',
        blue: 'bg-blue-500',
        orange: 'bg-orange-500'
    };
    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-gray-400">{label}</span>
                <span className="text-xs font-bold text-white">{value}/{max}</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(value / max) * 100}%` }} className={`h-full ${bgColors[color]}`} />
            </div>
        </div>
    );
}

function ADKBlock({ icon, title, desc, code, onClick }: { icon: React.ReactNode, title: string, desc: string, code: string, onClick?: () => void }) {
    return (
        <div onClick={onClick} className="bg-black/40 p-4 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all group cursor-pointer active:scale-[0.98]">
            <div className="flex items-center space-x-3 mb-2">
                <div className="text-emerald-400">{icon}</div>
                <div className="text-sm font-medium text-white">{title}</div>
            </div>
            <p className="text-[11px] text-gray-500 mb-3">{desc}</p>
            <div className="bg-black p-2 rounded-lg border border-white/5 font-mono text-[9px] text-emerald-500/80 overflow-x-auto">{code}</div>
        </div>
    )
}
