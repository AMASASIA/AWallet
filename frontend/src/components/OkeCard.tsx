import React from 'react';
import { SoulMetrics } from '../types';
import { Fingerprint, TrendingUp, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

interface OkeCardProps {
  metrics: SoulMetrics;
}

export function OkeCard({ metrics }: OkeCardProps) {
  const getPolicyIcon = () => {
    switch (metrics.policyStatus) {
      case 'warning': return <ShieldAlert className="w-4 h-4 text-amber-500" />;
      case 'restricted': return <ShieldAlert className="w-4 h-4 text-red-500" />;
      default: return <Shield className="w-4 h-4 text-emerald-500" />;
    }
  };

  const getPolicyText = () => {
    switch (metrics.policyStatus) {
      case 'warning': return 'Policy Warning';
      case 'restricted': return 'Restricted';
      default: return 'Policy Active';
    }
  };

  return (
    <div className="bg-[#1c1c1e] text-white p-6 rounded-[24px] shadow-xl w-full relative overflow-hidden group border border-white/5">
        
        {/* Subtle Gradient Background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

        <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    <Fingerprint className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                    <div className="text-xs text-gray-400 font-medium tracking-wider uppercase">Agent Identity</div>
                    <div className="text-sm font-semibold text-white font-mono">{metrics.did || 'did:awallet:agent:felix'}</div>
                </div>
            </div>
            <div className="flex flex-col items-end space-y-1">
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded text-[10px] font-mono text-emerald-400 uppercase tracking-tighter">
                    Verified Agent
                </div>
                <div className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[9px] font-medium uppercase tracking-tighter ${
                    metrics.policyStatus === 'warning' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                    metrics.policyStatus === 'restricted' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                    'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                }`}>
                    {getPolicyIcon()}
                    <span>{getPolicyText()}</span>
                </div>
            </div>
        </div>

        <div className="space-y-4 relative z-10">
            <div>
                <div className="text-3xl font-bold tracking-tight">{metrics.soulPoints.toLocaleString()} <span className="text-sm font-normal text-gray-500">SOUL</span></div>
                <div className="flex items-center space-x-2 mt-1">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span className="text-xs text-emerald-500 font-medium">+12 this week</span>
                </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-between items-end">
                <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Plurality Score</div>
                    <div className="text-xl font-mono text-indigo-300">Π(Q) {metrics.pluralityScore.toFixed(2)}</div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Contribution</div>
                    <div className="flex items-center justify-end space-x-1">
                         <ShieldCheck className="w-4 h-4 text-amber-400" />
                         <span className="text-sm font-medium">{metrics.stamps} Stamps</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}