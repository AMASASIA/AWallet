import React, { useState, useEffect } from 'react';
import { Zap, ArrowRight, ShieldCheck, Database, LucideIcon } from 'lucide-react';

interface X402Transaction {
  id: string;
  timestamp: string;
  serviceName: string;
  icon: LucideIcon;
  action: string;
  amount: string;
  asset: string;
  chain: string;
  status: 'Verified' | 'Pending' | 'Failed';
  facilitator: string;
}

const mockX402Transactions: X402Transaction[] = [
  {
    id: 'tx1',
    timestamp: '1 min ago',
    serviceName: 'CoinGecko API',
    icon: Database,
    action: 'Token Price Data Fetched',
    amount: '0.005',
    asset: 'USDC',
    chain: 'Base',
    status: 'Verified',
    facilitator: 'PayAI'
  },
  {
    id: 'tx2',
    timestamp: '5 mins ago',
    serviceName: 'OpenClaw Reasoning Node',
    icon: Zap,
    action: 'Inference Task Executed',
    amount: '0.12',
    asset: 'SOL',
    chain: 'Solana',
    status: 'Verified',
    facilitator: 'Dexter'
  },
  {
    id: 'tx3',
    timestamp: '12 mins ago',
    serviceName: 'DID Resolver (On-chain)',
    icon: ShieldCheck,
    action: 'Identity Verification Service',
    amount: '0.001',
    asset: 'ETH',
    chain: 'Base',
    status: 'Verified',
    facilitator: 'Coinbase'
  },
];

export const X402PaymentFeed: React.FC = () => {
  const [transactions, setTransactions] = useState<X402Transaction[]>(mockX402Transactions);

  // Simulation of real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Occasionally add a new mock transaction
      if (Math.random() > 0.8) {
        const newTx: X402Transaction = {
          id: `tx-${Date.now()}`,
          timestamp: 'Just now',
          serviceName: 'AI Oracle Feed',
          icon: Zap,
          action: 'Market Sentiment Analysis',
          amount: (Math.random() * 0.01).toFixed(4),
          asset: 'USDC',
          chain: 'Base',
          status: 'Verified',
          facilitator: 'AWallet Relay'
        };
        setTransactions(prev => [newTx, ...prev.slice(0, 4)]);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Verified': return 'var(--color-emerald)';
      case 'Pending': return 'var(--color-indigo)';
      case 'Failed': return '#ef4444';
      default: return 'var(--color-text-muted)';
    }
  };

  return (
    <div className="a-wallet-card x402-feed-container animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Card Header */}
      <div className="card-header flex justify-between items-center mb-6">
        <div className="header-title-wrapper flex items-center gap-3">
          <Zap className="header-icon text-emerald-500" size={20} />
          <h3 className="text-lg font-semibold text-white">x402 Autonomous Payments</h3>
        </div>
        <span className="text-[10px] text-gray-500 uppercase tracking-widest">Agent-Native Feed</span>
      </div>

      {/* Payment Feed List */}
      <div className="feed-list flex flex-col gap-3">
        {transactions.map((tx) => {
          const ServiceIcon = tx.icon;
          const statusColor = getStatusColor(tx.status);

          return (
            <div key={tx.id} className="feed-item glassmorphism flex justify-between items-center p-4 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md hover:border-emerald-500/30 transition-all group">
              {/* Left: Service Icon & Info */}
              <div className="item-primary flex items-center gap-4">
                <div className="service-icon-wrapper bg-white/5 p-2.5 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                  <ServiceIcon className="service-icon text-gray-400 group-hover:text-emerald-400" size={18} />
                </div>
                <div className="service-info flex flex-col">
                  <span className="service-name text-sm font-semibold text-white">{tx.serviceName}</span>
                  <span className="service-action text-[10px] text-gray-500">{tx.action}</span>
                  <span className="timestamp text-[9px] text-gray-600 mt-0.5">{tx.timestamp}</span>
                </div>
              </div>

              {/* Center: Route */}
              <div className="item-route hidden md:flex items-center gap-2 text-gray-600">
                <span className="chain-badge text-[9px] bg-white/5 px-2 py-0.5 rounded font-mono">{tx.chain}</span>
                <ArrowRight className="route-arrow" size={12} />
                <span className="facilitator-badge text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-mono">{tx.facilitator}</span>
              </div>

              {/* Right: Amount & Status */}
              <div className="item-secondary flex flex-col items-end gap-1">
                <div className="amount-wrapper holographic-glow flex items-baseline gap-1">
                  <span className="amount font-mono font-bold text-sm text-white">
                    {tx.amount}
                  </span>
                  <span className="asset text-[10px] font-semibold text-gray-400">{tx.asset}</span>
                </div>
                {/* Status Dot */}
                <div className="status-wrapper flex items-center gap-1.5">
                  <div 
                    className="status-dot w-1.5 h-1.5 rounded-full shadow-[0_0_5px_var(--status-color)]" 
                    style={{ backgroundColor: statusColor, '--status-color': statusColor } as any}
                  ></div>
                  <span className="status-text text-[10px]" style={{ color: statusColor }}>
                    {tx.status}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Card Footer */}
      <div className="card-footer mt-6 pt-4 border-t border-white/5">
        <button className="w-full py-2 rounded-xl bg-white/5 text-[10px] text-gray-400 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all">
          View All M2M Logs
        </button>
      </div>
    </div>
  );
};
