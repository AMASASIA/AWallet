import React, { useState, useRef } from 'react';

interface SwipeToConfirmProps {
  agentName: string;
  amount: number;
  currency: string;
  isSecured: boolean; // EAS (ERC-8126) の検証結果
  onConfirm: () => void;
  onReject: () => void;
}

export const SwipeToConfirm: React.FC<SwipeToConfirmProps> = ({
  agentName,
  amount,
  currency,
  isSecured,
  onConfirm,
  onReject,
}) => {
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // ドラッグ操作のハンドリング
  const handleDrag = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (isUnlocked || !sliderRef.current) return;
    
    const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
    const { left, width } = sliderRef.current.getBoundingClientRect();
    const newProgress = Math.max(0, Math.min(100, ((clientX - left) / width) * 100));
    
    setSwipeProgress(newProgress);

    if (newProgress > 95) {
      setIsUnlocked(true);
      setSwipeProgress(100);
      onConfirm();
    }
  };

  const handleRelease = () => {
    if (!isUnlocked) {
      setSwipeProgress(0); // 離すと元に戻る（誤操作防止）
    }
  };

  return (
    <div className={`p-6 rounded-2xl shadow-xl w-full max-w-md mx-auto transition-all duration-500 border-2 ${
      isSecured 
        ? 'bg-slate-900 border-blue-500/30' 
        : 'bg-red-950/40 border-red-500/80 animate-pulse-slow'
    }`}>
      
      {/* ヘッダー情報 */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Payment Request</h3>
          <p className="text-2xl font-bold text-white mt-1">
            {amount.toLocaleString()} {currency}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-400 block mb-1">Agent</span>
          <span className="px-3 py-1 rounded-full bg-slate-800 text-white text-sm font-mono border border-slate-700">
            {agentName}
          </span>
        </div>
      </div>

      {/* セキュリティ・アテステーション・バッジ */}
      <div className={`p-4 rounded-lg mb-8 border ${
        isSecured 
          ? 'bg-blue-900/20 border-blue-500/50 text-blue-200' 
          : 'bg-red-900/40 border-red-500 text-red-200'
      }`}>
        <div className="flex items-center gap-3">
          {isSecured ? (
            <>
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <p className="text-sm font-bold">EAS Verified (ERC-8126)</p>
                <p className="text-xs opacity-80">Safe to execute automatically.</p>
              </div>
            </>
          ) : (
            <>
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-bold tracking-wider">⚠️ UNVERIFIED AGENT</p>
                <p className="text-xs opacity-90">High Security Risk. Manual authorization required.</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* スワイプ・エリア */}
      <div 
        ref={sliderRef}
        className="relative h-14 bg-gray-800 rounded-full overflow-hidden mb-4 select-none touch-none border border-gray-700"
        onMouseMove={(e) => e.buttons === 1 && handleDrag(e)}
        onTouchMove={handleDrag as any}
        onMouseUp={handleRelease}
        onMouseLeave={handleRelease}
        onTouchEnd={handleRelease}
      >
        {/* 背景のプログレスバー */}
        <div 
          className={`absolute top-0 left-0 h-full transition-all ${isSecured ? 'bg-blue-600' : 'bg-red-600'}`}
          style={{ width: `${swipeProgress}%` }}
        />
        
        {/* テキスト */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className={`font-bold tracking-widest text-sm z-10 ${swipeProgress > 50 ? 'text-white' : 'text-gray-400'}`}>
            {isUnlocked ? 'AUTHORIZED' : 'SWIPE TO CONFIRM'}
          </span>
        </div>

        {/* スライダーのノブ */}
        <div 
          className={`absolute top-1 bottom-1 w-12 rounded-full cursor-grab active:cursor-grabbing flex items-center justify-center shadow-lg transition-transform ${isSecured ? 'bg-white' : 'bg-red-100'}`}
          style={{ left: `calc(${swipeProgress}% - ${swipeProgress > 0 ? '48px' : '4px'})`, marginLeft: '4px' }}
        >
          <svg className={`w-5 h-5 ${isSecured ? 'text-blue-900' : 'text-red-900'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* キャンセルボタン */}
      <button 
        onClick={onReject}
        className="w-full py-3 text-sm font-medium text-gray-400 hover:text-white transition-colors"
      >
        Reject Request
      </button>
    </div>
  );
};
