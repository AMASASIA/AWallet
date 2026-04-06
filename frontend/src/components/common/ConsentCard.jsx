import React, { useState } from 'react';
import SwipeToConfirm from './SwipeToConfirm';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CloseIcon from '@mui/icons-material/Close';
import VerifiedIcon from '@mui/icons-material/Verified';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

/**
 * ConsentCard — Agentic 同意フロー
 * NO / NOT NOW / YES → (YESの場合) スワイプで物理確認 → 処理中 → 結果表示
 * Invisible Finance: 金融UIを露出せず、意図ベースの意思決定のみを表示する
 */
const ConsentCard = ({ summary, soulReward, onConfirm, onCancel }) => {
    const [phase, setPhase] = useState('decision'); // decision | confirm | processing | result
    const [resultMsg, setResultMsg] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const handleDecision = (choice) => {
        if (choice === 'yes') {
            setPhase('confirm');
        } else {
            onCancel();
        }
    };

    const handleSwipeConfirm = async (metrics) => {
        setPhase('processing');

        // Simulate backend verification (500ms)
        await new Promise(r => setTimeout(r, 800));

        // Validate: progress >= 80% and duration >= 500ms
        if (metrics.progress >= 0.8 && metrics.duration_ms >= 500) {
            setIsSuccess(true);
            setResultMsg('Action scheduled successfully.');
            setPhase('result');
            // Auto close after 2s
            setTimeout(() => {
                onConfirm(metrics);
            }, 2000);
        } else {
            setIsSuccess(false);
            setResultMsg('Verification failed: Interaction too fast or incomplete.');
            setPhase('result');
        }
    };

    return (
        <div className="if-overlay">
            <div className="if-consent-card">
                {/* Close */}
                <button className="if-consent-close" onClick={onCancel}>
                    <CloseIcon style={{ fontSize: 18 }} />
                </button>

                {/* Agent Label */}
                <div className="if-consent-agent">AI Autonomous Agent</div>

                {/* Summary / Task Description */}
                <div className="if-consent-summary">
                    {summary}
                </div>

                {/* Soul Reward Indicator */}
                {soulReward && (
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        padding: '4px 10px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#10b981',
                        marginBottom: 20
                    }}>
                        +{soulReward} SOUL
                    </div>
                )}

                {/* === Phase: Decision === */}
                {phase === 'decision' && (
                    <div className="if-decision-buttons">
                        <button className="if-decision-btn" onClick={() => handleDecision('no')}>
                            NO
                        </button>
                        <button className="if-decision-btn" onClick={() => handleDecision('not_now')}>
                            NOT NOW
                        </button>
                        <button className="if-decision-btn primary" onClick={() => handleDecision('yes')}>
                            YES
                        </button>
                    </div>
                )}

                {/* === Phase: Swipe Confirmation === */}
                {phase === 'confirm' && (
                    <div>
                        <SwipeToConfirm
                            onConfirm={handleSwipeConfirm}
                            label="Slide to confirm →"
                        />
                        <button
                            onClick={() => setPhase('decision')}
                            style={{
                                width: '100%',
                                textAlign: 'center',
                                marginTop: 12,
                                fontSize: 12,
                                color: '#9ca3af',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                )}

                {/* === Phase: Processing === */}
                {phase === 'processing' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: 12 }}>
                        <div className="if-spinner" />
                        <span style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                            Verifying Proof
                        </span>
                    </div>
                )}

                {/* === Phase: Result === */}
                {phase === 'result' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', gap: 8 }}>
                        {isSuccess ? (
                            <VerifiedIcon style={{ fontSize: 40, color: '#10b981' }} />
                        ) : (
                            <ErrorOutlineIcon style={{ fontSize: 40, color: '#f59e0b' }} />
                        )}
                        <p style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: isSuccess ? '#065f46' : '#92400e'
                        }}>
                            {resultMsg}
                        </p>
                        {!isSuccess && (
                            <button
                                onClick={onCancel}
                                style={{
                                    marginTop: 12,
                                    fontSize: 12,
                                    color: '#9ca3af',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConsentCard;
