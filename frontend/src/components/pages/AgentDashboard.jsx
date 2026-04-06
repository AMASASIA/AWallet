import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import '../../assets/css/InvisibleFinance.css';
import OkeCard from '../common/OkeCard';
import ConsentCard from '../common/ConsentCard';
import { useMyContext } from '../../Contexts';
import { getTokenBalanceOf, getDid, getRegisterStatus } from '../hooks/UseContract';
import superAgent from 'superagent';
import { baseURL } from '../common/Constant';
import { SwipeToConfirm } from '../../features/agent-control/ui/SwipeToConfirm';

// MUI Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import GroupsIcon from '@mui/icons-material/Groups';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import SendIcon from '@mui/icons-material/Send';
import DownloadIcon from '@mui/icons-material/Download';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShieldIcon from '@mui/icons-material/Shield';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import GavelIcon from '@mui/icons-material/Gavel';
import CloseIcon from '@mui/icons-material/Close';

const INITIAL_SBTS = [
    { id: '1', name: 'Verified Human', type: 'Identity', issuer: 'did:awallet:WorldID', date: '2023-11' },
    { id: '2', name: 'DAO Guardian', type: 'Role', issuer: 'did:awallet:SoulDAO', date: '2024-01' },
];

const INITIAL_PROPOSALS = [
    { id: 'prop-101', title: 'Grant for UX Research', desc: 'Send 500 USDC to Research Guild', to: 'did:ion:Research...Guild', amount: 500, symbol: 'USDC', approvals: 2, threshold: 3, status: 'Pending' },
];

const INITIAL_TASKS = [
    { id: '1', title: 'DAO Proposal Vote', subtitle: 'Governance action required', deadline: 'Today', icon: '🏛️', summary: 'DAO Proposal #42: Allocate 500 USDC to Community Research Grants. Requires your specialized vote as a DAO Guardian.', soulReward: 50, status: 'pending' },
    { id: '3', title: 'Agent Payment Approval', subtitle: 'Policy escalation', deadline: '2 hours', icon: '🤖', summary: 'AI Agent requests $1,200 USDC payment to data-provider-001 for SEC 10-K annual report dataset. This exceeds the $500 human approval threshold. Approve?', soulReward: 25, status: 'pending' },
];

const AgentDashboard = () => {
    const { currentAccount, fullDid, setFullDid, setCurrentAccount } = useMyContext();
    const [activeTab, setActiveTab] = useState('overview');
    const [tokens, setTokens] = useState([
        { symbol: 'AWT', name: 'AWallet Token', balance: 0, icon: '🛡️', price: 1.0 },
        { symbol: 'USDC', name: 'USD Coin', balance: 2450.00, icon: '💲', price: 1.0 },
        { symbol: 'ETH', name: 'Ethereum', balance: 0.45, icon: '🔷', price: 3000 },
    ]);
    const [proposals, setProposals] = useState(INITIAL_PROPOSALS);
    const [tasks, setTasks] = useState(INITIAL_TASKS);
    const [activities, setActivities] = useState([]);
    const [activeTask, setActiveTask] = useState(null);
    const [metrics, setMetrics] = useState({
        agentName: 'Agent.soul',
        soulPoints: 1250,
        pluralityScore: 4.25,
        stamps: 8,
        weeklyGain: 12,
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!currentAccount) return;
            try {
                const balance = await getTokenBalanceOf(currentAccount);
                setTokens(prev => prev.map(t => t.symbol === 'AWT' ? { ...t, balance } : t));
                const status = await getRegisterStatus(currentAccount);
                setIsRegistered(status);
                if (status) {
                    const did = await getDid(currentAccount);
                    setFullDid(did);
                }
            } catch (err) {
                console.error("Dashboard init error:", err);
            }
        };
        fetchData();
    }, [currentAccount, setFullDid]);

    // Modal states
    const [stripeModal, setStripeModal] = useState(false);
    const [sendForm, setSendForm] = useState({ to: '', amount: '', symbol: 'USDC' });
    const [proposalModal, setProposalModal] = useState(false);

    const addActivity = (type, detail) => {
        setActivities(prev => [{
            id: Date.now().toString(),
            type,
            detail,
            timestamp: new Date().toISOString()
        }, ...prev]);
    };

    const registerAction = async () => {
        setIsLoading(true);
        superAgent.post(baseURL + '/api/create').query({ addr: currentAccount }).end(async (err) => {
            if (err) return setIsLoading(false);
            const did = await getDid(currentAccount);
            setFullDid(did);
            setIsRegistered(true);
            superAgent.post(baseURL + '/api/mintToken').query({ to: currentAccount, amount: 10000 }).end(() => {
                getTokenBalanceOf(currentAccount).then(b => {
                    setTokens(prev => prev.map(t => t.symbol === 'AWT' ? { ...t, balance: b } : t));
                });
            });
            addActivity('Identity', 'Identity Registered');
            setIsLoading(false);
        });
    };

    const handleAddFunds = (amount) => {
        setIsLoading(true);
        superAgent.post(baseURL + '/api/mintToken').query({ to: currentAccount, amount }).end(async (err) => {
            if (err) return setIsLoading(false);
            const b = await getTokenBalanceOf(currentAccount);
            setTokens(prev => prev.map(t => t.symbol === 'AWT' ? { ...t, balance: b } : t));
            addActivity('Mint', `Purchased ${amount} AWT`);
            setStripeModal(false);
            setIsLoading(false);
        });
    };

    const handleTaskConfirm = async () => {
        if (!activeTask) return;
        setIsLoading(true);
        try {
            // If it's a payment task, call the backend
            if (activeTask.title.includes('Payment')) {
                await superAgent.post(baseURL + '/api/v2/wallet/' + fullDid + '/pay').send({
                    to: 'did:awallet:data-provider-001',
                    amount: 1200,
                    currency: 'USDC',
                    purpose: 'Data Purchase'
                });
            }
            setMetrics(prev => ({ ...prev, soulPoints: prev.soulPoints + activeTask.soulReward }));
            setTasks(prev => prev.filter(t => t.id !== activeTask.id));
            addActivity('Approval', `Task: ${activeTask.title} (Verified on Ledger)`);
        } catch (err) {
            console.error("Task confirmation error:", err);
        } finally {
            setActiveTask(null);
            setIsLoading(false);
        }
    };

    const handleApprove = (id) => {
        setProposals(prev => prev.map(p => p.id === id ? { ...p, approvals: p.approvals + 1 } : p));
        addActivity('Approval', `Signed proposal ${id}`);
    };

    const totalValue = tokens.reduce((sum, t) => sum + t.balance * (t.price || 1), 0);

    const navItems = [
        { id: 'overview', label: 'Overview', icon: <DashboardIcon /> },
        { id: 'wallet', label: 'Wallet', icon: <AccountBalanceWalletIcon /> },
        { id: 'identity', label: 'Identity', icon: <FingerprintIcon /> },
        { id: 'governance', label: 'Governance', icon: <GroupsIcon /> },
        { id: 'agent', label: 'Agent Ops', icon: <SmartToyIcon /> },
    ];

    const legacyLinks = [
        { to: '/Home', label: 'Soul Home' },
        { to: '/Wallets', label: 'Multisig Wallets' },
        { to: '/MyVC', label: 'Credentials (VC)' },
        { to: '/Buy', label: 'Buy' },
        { to: '/Create', label: 'Create Wallet' },
        { to: '/Upload', label: 'Upload VC' },
        { to: '/Verify', label: 'Verify' },
        { to: '/Tips', label: 'Tips' },
    ];

    return (
        <div className="if-container">
            {/* Sidebar */}
            <div className="if-sidebar">
                <div className="if-sidebar-logo">
                    <h1>A\Wallet</h1>
                </div>
                <nav className="if-nav">
                    {navItems.map(item => (
                        <button key={item.id} className={`if-nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}>
                            {item.icon}<span>{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div style={{ marginTop: 'auto', padding: '20px' }}>
                    <button className="if-nav-item" style={{ color: '#ef4444' }} onClick={() => setCurrentAccount(null)}>
                        <LogoutIcon /><span>Disconnect</span>
                    </button>
                </div>
            </div>

            {/* Main */}
            <div className="if-main">
                <div className="if-header">
                    <div>
                        <h2>Hello, {currentAccount?.slice(0, 8)}</h2>
                        <p>{isRegistered ? fullDid?.slice(0, 30) + '...' : 'Identity Required'}</p>
                    </div>
                </div>

                {activeTab === 'overview' && (
                    <div className="if-dashboard">
                        <div className="if-col-left">
                            <OkeCard metrics={metrics} />
                            <div className="if-balance-card">
                                <div className="if-section-label">Portfolio Value</div>
                                <div className="if-balance-amount">${totalValue.toLocaleString()}</div>
                                <div className="if-balance-row">
                                    {tokens.map(t => <div key={t.symbol} className="if-balance-sub"><div>{t.symbol}</div><div>{t.balance}</div></div>)}
                                </div>
                            </div>
                        </div>
                        <div className="if-col-right">
                            <div className="if-section-label">Pending Tasks</div>
                            {tasks.map(t => (
                                <div key={t.id} className="if-task-card" onClick={() => setActiveTask(t)}>
                                    <div className="if-task-info"><strong>{t.title}</strong><p>{t.subtitle}</p></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'wallet' && (
                    <div className="if-dashboard" style={{ flexDirection: 'column' }}>
                        <h3>Assets</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                            {tokens.map(t => (
                                <div key={t.symbol} className="if-oke-card" style={{ padding: 20 }}>
                                    <div>{t.name}</div>
                                    <div style={{ fontSize: 24, fontWeight: 800 }}>{t.balance} {t.symbol}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 20 }}>
                            <button className="if-action-btn accent" onClick={() => setStripeModal(true)}>Buy with Card</button>
                        </div>
                    </div>
                )}

                {activeTab === 'identity' && (
                    <div className="if-dashboard" style={{ flexDirection: 'column' }}>
                        <h3>Identity Management</h3>
                        <div className="if-oke-card" style={{ padding: 32 }}>
                            <p>Status: {isRegistered ? 'Verified Agent' : 'Unregistered'}</p>
                            <p>DID: {fullDid || 'None'}</p>
                            {!isRegistered && <button className="if-action-btn accent" onClick={registerAction}>Register DID</button>}
                        </div>
                    </div>
                )}

                {activeTab === 'governance' && (
                    <div className="if-dashboard" style={{ flexDirection: 'column' }}>
                        <h3>Active Proposals</h3>
                        {proposals.map(p => (
                            <div key={p.id} className="if-oke-card" style={{ padding: 20, marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                                <div><strong>{p.title}</strong><p>{p.desc}</p></div>
                                <button className="if-action-btn" onClick={() => handleApprove(p.id)}>{p.approvals}/{p.threshold} Signs</button>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'agent' && (
                    <div className="if-dashboard" style={{ flexDirection: 'column' }}>
                        <h3>Agent Operations</h3>
                        <div className="if-policy-grid">
                            <div className="if-policy-item"><p>Per-Tx Limit</p><strong>$500</strong></div>
                            <div className="if-policy-item"><p>Daily Limit</p><strong>$5,000</strong></div>
                        </div>
                        <div style={{ marginTop: 24 }}>
                            <button className="if-action-btn accent">Register New AI Agent</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {stripeModal && (
                <div className="if-overlay">
                    <div className="if-consent-card" style={{ maxWidth: 400 }}>
                        <h3>Buy AWT Tokens</h3>
                        <input id="amt" type="number" placeholder="Enter USD amount" style={{ width: '100%', padding: 12, borderRadius: 8, margin: '20px 0' }} />
                        <div className="if-decision-buttons">
                            <button className="if-decision-btn" onClick={() => setStripeModal(false)}>Cancel</button>
                            <button className="if-decision-btn primary" onClick={() => handleAddFunds(document.getElementById('amt').value)}>Purchase</button>
                        </div>
                    </div>
                </div>
            )}

            
            {activeTask && (
                <div className="if-overlay">
                    {activeTask.title.includes('Agent Payment') ? (
                        <SwipeToConfirm 
                            agentName="TradingBot_01"
                            amount={1200}
                            currency="USDC"
                            isSecured={false} // Demo: purposely unverified to show hybrid autonomy
                            onConfirm={handleTaskConfirm}
                            onReject={() => setActiveTask(null)}
                        />
                    ) : (
                        <ConsentCard 
                            activeTask={activeTask} 
                            onClose={() => setActiveTask(null)} 
                            onConfirm={handleTaskConfirm} 
                        />
                    )}
                </div>
            )}

        </div>
    );
};

export default AgentDashboard;
