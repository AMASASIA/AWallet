import React, { useState, useEffect } from 'react';
import { Zap, ShieldCheck, Database, LucideIcon } from 'lucide-react';

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

interface X402PaymentFeedProps {
  logs?: string[];
}

export const X402PaymentFeed: React.FC<X402PaymentFeedProps> = ({ logs = [] }) => {
  const [transactions, setTransactions] = useState<X402Transaction[]>(mockX402Transactions);

  useEffect(() => {
    const interval = setInterval(() => {
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
      case 'Verified': return '#10b981';
      case 'Pending': return '#6366f1';
      case 'Failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="bg-white/5 rounded-3xl p-6 border border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Zap className="text-emerald-500" size={20} />
          <h3 className="text-sm font-bold uppercase tracking-widest text-white">x402 Autonomous Payments</h3>
        </div>
        <span className="text-[10px] text-gray-500 uppercase tracking-widest">Agent-Native</span>
      </div>

      {logs.length > 0 && (
        <div className="mb-6 space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar overflow-x-hidden">
          {logs.slice(-5).map((log, i) => (
            <div key={i} className="text-[9px] font-mono text-emerald-500/70 border-l border-emerald-500/20 pl-3 py-1 whitespace-pre-wrap break-all">
              {log}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {transactions.map((tx) => {
          const ServiceIcon = tx.icon;
          const statusColor = getStatusColor(tx.status);

          return (
            <div key={tx.id} className="flex justify-between items-center p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-emerald-500/30 transition-all group">
              <div className="flex items-center gap-4">
                <div className="bg-white/5 p-2 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                  <ServiceIcon className="text-gray-400 group-hover:text-emerald-400" size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white">{tx.serviceName}</span>
                  <span className="text-[9px] text-gray-500">{tx.action}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <div className="flex items-baseline gap-1">
                  <span className="font-mono font-bold text-xs text-white">{tx.amount}</span>
                  <span className="text-[9px] font-semibold text-gray-500">{tx.asset}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }}></div>
                  <span className="text-[9px]" style={{ color: statusColor }}>{tx.status}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-white/5">
        <button className="w-full py-2 rounded-xl bg-white/5 text-[9px] text-gray-500 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all">
          View All M2M Logs
        </button>
      </div>
    </div>
  );
};
