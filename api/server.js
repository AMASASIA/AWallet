/**
 * AWallet APIサーバー設定ファイル
 * 
 * v1: 従来のToken/Wallet/DID API
 * v2: Agent Economy API (エージェント管理・決済・投資・監査)
 */

// import app modules
const {
  app,
  logger
} = require('./modules/app');
const agentApi = require('./modules/agentApi');
const express = require('express');
const path = require('path');
const fs = require('fs');
const ip = require('ip');

// Agent API v2 ルートをマウント
app.use('/api/v2', agentApi);

// Diagnostic Endpoint (for debugging missing files in Cloud Run)
app.get('/api/v2/debug/files', (req, res) => {
    try {
        const publicPath = path.join(__dirname, 'public');
        const files = fs.readdirSync(publicPath);
        res.json({ 
            cwd: process.cwd(), 
            __dirname, 
            publicPath,
            files: files.length > 0 ? files : "Empty directory"
        });
    } catch (e) {
        res.json({ error: e.message, path: path.join(__dirname, 'public') });
    }
});

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AWallet API is running safely \u{1F680}' });
});

// Serve frontend - Catch all other routes and return index.html (React SPA)
// Consolidate static assets serving
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

app.get('*', (req, res) => {
  // If request contains /api/, it means the endpoint was not found
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API Endpoint not found' });
  }
  
  const indexPath = path.join(publicPath, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    // res.sendFile requires absolute path or 'root' option
    res.sendFile(indexPath, (err) => {
      if (err) {
        logger.error("res.sendFile Error: ", err);
        // If sendFile failed even though the file exists (permission, etc)
        if (!res.headersSent) {
          res.status(500).send(`AWallet UI Render Error: ${err.message}. Path: ${indexPath}`);
        }
      }
    });
  } else {
    logger.error("Serve Error: index.html not found at " + indexPath);
    const fallbackPath = path.join(process.cwd(), 'public', 'index.html');
    
    if (fs.existsSync(fallbackPath)) {
        res.sendFile(fallbackPath);
    } else {
        // Detailed error for Cloud Run debugging
        const appFiles = fs.existsSync('/app') ? fs.readdirSync('/app') : ['/app not found'];
        const publicFiles = fs.existsSync(publicPath) ? fs.readdirSync(publicPath).slice(0, 10) : ['public DIR not found'];
        
        res.status(500).send(`AWallet Build Error: index.html missing. 
          Searched: ${indexPath}
          Current Dir: ${process.cwd()} (__dirname: ${__dirname})
          Files in /app: ${appFiles.join(', ')}
          Files in public: ${publicFiles.join(', ')}
        `);
    }
  }
});

// ポート番号
const portNo = process.env.PORT || 3001;

// APIサーバー起動
const server = app.listen(portNo, '0.0.0.0', () => {
  logger.debug('AWallet API起動', `http://localhost:${portNo}`);
  console.log('=== AWallet API Server ===');
  console.log(`v1 API: http://localhost:${portNo}/api/`);
  console.log(`v2 Agent API: http://localhost:${portNo}/api/v2/`);
  console.log(`Health: http://localhost:${portNo}/api/v2/health`);
  console.log('========================');
});

module.exports = {
  server
}
