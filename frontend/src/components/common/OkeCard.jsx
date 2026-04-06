import React from 'react';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

/**
 * OkeCard — Soul Identity Context
 * エージェントのアイデンティティとSOULメトリクスを表示する
 */
const OkeCard = ({ metrics }) => {
    return (
        <div className="if-oke-card">
            <div className="if-oke-glow" />

            {/* Header: Identity + Verified Badge */}
            <div className="if-oke-header">
                <div className="if-oke-identity">
                    <div className="if-oke-avatar">
                        <FingerprintIcon style={{ color: '#10b981', fontSize: 20 }} />
                    </div>
                    <div>
                        <div className="if-oke-label">Identity Context</div>
                        <div className="if-oke-name">{metrics.agentName || 'Agent.soul'}</div>
                    </div>
                </div>
                <div className="if-verified-badge">Verified</div>
            </div>

            {/* Soul Points */}
            <div className="if-oke-points">
                {(metrics.soulPoints || 0).toLocaleString()}
                <span className="if-unit">SOUL</span>
            </div>
            <div className="if-oke-trend">
                <TrendingUpIcon style={{ fontSize: 14 }} />
                <span>+{metrics.weeklyGain || 12} this week</span>
            </div>

            {/* Footer: Plurality + Stamps */}
            <div className="if-oke-footer">
                <div>
                    <div className="if-oke-stat-label">Plurality Score</div>
                    <div className="if-oke-plurality">
                        Π(Q) {(metrics.pluralityScore || 4.25).toFixed(2)}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div className="if-oke-stat-label">Contribution</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                        <VerifiedUserIcon style={{ color: '#f59e0b', fontSize: 18 }} />
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{metrics.stamps || 0} Stamps</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OkeCard;
