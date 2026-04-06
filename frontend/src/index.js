import React from 'react';
import ReactDOM from 'react-dom/client';
import './assets/css/index.css';
import App from './AWalletApp';
import './assets/css/index.css';
import { ContextProvider } from './Contexts';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <ContextProvider>
      <App />
    </ContextProvider>
  </React.StrictMode>
);


