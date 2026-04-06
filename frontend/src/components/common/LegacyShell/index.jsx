import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import React from 'react';
import { NavLink } from 'react-router-dom';
import Web3Menu from '../Web3Menu';

/**
 * レガシー画面用の上部バー（Web3Menu + ダッシュボードへ戻る）
 */
const LegacyShell = ({ children }) => {
  return (
    <>
      <AppBar position="fixed" sx={{ backgroundColor: '#1c1c1e', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            <NavLink to="/" style={{ color: '#fff', textDecoration: 'none' }}>
              A\Wallet
            </NavLink>
          </Typography>
          <NavLink
            to="/"
            style={{ color: '#9ca3af', textDecoration: 'none', marginRight: 16, fontSize: 14 }}
          >
            Agent Dashboard
          </NavLink>
          <Web3Menu />
        </Toolbar>
      </AppBar>
      <Toolbar />
      {children}
    </>
  );
};

export default LegacyShell;
