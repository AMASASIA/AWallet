import GlobalStyles from '@mui/material/GlobalStyles';
import React from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import './../assets/css/App.css';
import { useMyContext } from './../Contexts';
import LegacyShell from './common/LegacyShell';
import {
  connectWallet
} from './hooks/UseContract';
import Buy from './pages/Buy';
import Create from './pages/Create';
import Home from './pages/Home';
import Tips from './pages/Tips';
import Txs from './pages/Tx/Txs';
import Upload from './pages/Upload';
import MyVC from './pages/Vc/MyVc';
import Verify from './pages/Verify';
import Wallets from './pages/Wallet/Wallets';
import AgentDashboard from './pages/AgentDashboard';

/**
 * Appコンポーネント
 */
function App() {
  // create contract
  const {
    currentAccount,
    setCurrentAccount
  } = useMyContext();

  /**
   * ウォレット接続ボタンを押した時の処理
   */
  const connectWalletAction = async () => {
    try {
      const { signer } = await connectWallet();
      setCurrentAccount(signer);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <GlobalStyles styles={{ body: { margin: 0, padding: 0, backgroundColor: '#000' } }} />
      <Router>
        <div style={{ flexGrow: 1, backgroundColor: '#000', minHeight: '100vh' }}>
          {currentAccount === null ? (
            <div className="if-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ textAlign: 'center', padding: '40px', background: '#1c1c1e', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                <h1 style={{ color: '#fff', fontSize: '48px', fontWeight: 800, margin: '0 0 10px 0', letterSpacing: '-0.04em' }}>A\Wallet</h1>
                <p style={{ color: '#9ca3af', fontSize: '18px', marginBottom: '40px' }}>Identity-Native Wallet for the Agent Economy</p>
                <button
                  onClick={connectWalletAction}
                  style={{
                    padding: '16px 40px', background: '#fff', color: '#000', border: 'none',
                    borderRadius: '16px', fontWeight: 700, fontSize: '18px', cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  Enter App
                </button>
              </div>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={<AgentDashboard />} />
              <Route path="/Agent" element={<AgentDashboard />} />
              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="/Home" element={<LegacyShell><Home /></LegacyShell>} />
              <Route path="/Buy" element={<LegacyShell><Buy /></LegacyShell>} />
              <Route path="/Wallets" element={<LegacyShell><Wallets /></LegacyShell>} />
              <Route path="/Create" element={<LegacyShell><Create /></LegacyShell>} />
              <Route path="/Upload" element={<LegacyShell><Upload /></LegacyShell>} />
              <Route path="/MyVC" element={<LegacyShell><MyVC /></LegacyShell>} />
              <Route path="/Verify" element={<LegacyShell><Verify /></LegacyShell>} />
              <Route path="/Tips" element={<LegacyShell><Tips /></LegacyShell>} />
              <Route path="/txs" element={<LegacyShell><Txs /></LegacyShell>} />
              <Route path="*" element={<AgentDashboard />} />
            </Routes>
          )}
        </div>
      </Router>
    </>
  );
}

export default App;