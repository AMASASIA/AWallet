import React, { useState } from 'react';
import { Bot, X, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import SwipeToConfirm from './SwipeToConfirm';
import { AgenticContext, DecisionType, ConsentPayload, ConfirmationMetrics, WalletType } from '../types';
import { UI_CONSTANTS } from '../constants';
import { verifyConsent } from '../services/backendApiMock';

interface Props {
  context: AgenticContext;
  onClose: () => void;
  walletType: WalletType;
}

type UIState = 'DECISION' | 'CONFIRMATION' | 'PROCESSING' | 'RESULT';

const AgenticDecisionPopup: React.FC<Props> = ({ context, onClose, walletType }) => {
  const [uiState, setUiState] = useState<UIState>('DECISION');
  const [resultMessage, setResultMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Intent Phase (Button Tap)
  const handleDecision = async (decision: DecisionType) => {
    if (decision === DecisionType.YES) {
      setUiState('CONFIRMATION');
    } else {
      // For No/Not Now, we send the payload immediately
      await submitConsent(decision, null);
    }
  };

  // Consent Phase (Physical Action)
  const handleConfirmation = async (metrics: ConfirmationMetrics) => {
    await submitConsent(DecisionType.YES, metrics);
  };

  const submitConsent = async (decision: DecisionType, metrics: ConfirmationMetrics | null) => {
    setUiState('PROCESSING');

    const payload: ConsentPayload = {
      decision,
      confirmation: metrics,
      context: context.id,
      timestamp: new Date().toISOString(),
      wallet_env: {
        type: walletType,
        financial_ui_exposed: false // CRITICAL: Always false
      }
    };

    try {
      const response = await verifyConsent(payload);
      setIsSuccess(response.success);
      setResultMessage(response.message);
      setUiState('RESULT');
      
      // Auto close after success
      if (response.success && decision === DecisionType.YES) {
        setTimeout(onClose, 2500);
      }
    } catch (error) {
      setIsSuccess(false);
      setResultMessage("System Error: Unable to verify consent.");
      setUiState('RESULT');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/20 backdrop-blur-sm transition-all animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
        
        {/* Header - No Financial Data */}
        <div className="p-5 pb-2 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">{UI_CONSTANTS.AGENT_NAME}</h3>
              <p className="text-xs text-slate-500">Action Required</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 py-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            {context.summary}
          </p>
        </div>

        {/* State Machine UI */}
        <div className="bg-slate-50 p-6 border-t border-slate-100">
          
          {uiState === 'DECISION' && (
            <div className="flex justify-between items-center space-x-3">
              <button 
                onClick={() => handleDecision(DecisionType.NO)}
                className="flex-1 py-3 text-sm font-medium text-slate-500 hover:bg-slate-200 rounded-xl transition-colors"
              >
                No
              </button>
              <button 
                onClick={() => handleDecision(DecisionType.NOT_NOW)}
                className="flex-1 py-3 text-sm font-medium text-slate-500 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap"
              >
                Not Now
              </button>
              <button 
                onClick={() => handleDecision(DecisionType.YES)}
                className="flex-[1.5] py-3 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-lg shadow-slate-300/50 transition-all active:scale-95"
              >
                Yes
              </button>
            </div>
          )}

          {uiState === 'CONFIRMATION' && (
            <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
              <SwipeToConfirm onConfirm={handleConfirmation} label={UI_CONSTANTS.SWIPE_TEXT} />
              <button 
                onClick={() => setUiState('DECISION')}
                className="w-full text-center mt-4 text-xs text-slate-400 hover:text-slate-600 underline"
              >
                Cancel
              </button>
            </div>
          )}

          {uiState === 'PROCESSING' && (
            <div className="flex flex-col items-center justify-center py-4 space-y-3 animate-pulse">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
              <span className="text-xs text-slate-400 uppercase tracking-widest">Verifying Proof</span>
            </div>
          )}

          {uiState === 'RESULT' && (
            <div className="flex flex-col items-center justify-center py-2 animate-in zoom-in-95">
              {isSuccess ? (
                <ShieldCheck className="w-10 h-10 text-emerald-500 mb-2" />
              ) : (
                <AlertCircle className="w-10 h-10 text-amber-500 mb-2" />
              )}
              <p className={`text-sm font-medium ${isSuccess ? 'text-emerald-700' : 'text-amber-700'}`}>
                {resultMessage}
              </p>
              {!isSuccess && (
                <button onClick={onClose} className="mt-4 text-xs text-slate-400">Close</button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AgenticDecisionPopup;