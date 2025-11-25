import React from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';
import { App } from './App';
import { ConfirmDialogProvider } from './components/ConfirmDialogProvider';
import { ToastProvider } from './components/toast/ToastProvider';

console.log('FreeCvBuilder version 1.0.32');

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <ConfirmDialogProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ConfirmDialogProvider>
  </React.StrictMode>,
);
