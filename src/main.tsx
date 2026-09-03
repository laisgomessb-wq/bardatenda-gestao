import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Limpeza de Service Workers e Caches antigos para evitar travamento em tela branca por versões em cache
if (typeof window !== 'undefined') {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().catch(() => {});
      }
    }).catch(() => {});
  }

  if ('caches' in window) {
    caches.keys().then((keys) => {
      for (const key of keys) {
        caches.delete(key).catch(() => {});
      }
    }).catch(() => {});
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
  } catch (error) {
    console.error('Erro crítico ao inicializar o React:', error);
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #0d0f14; color: #f4f4f5; font-family: system-ui, -apple-system, sans-serif; padding: 24px; text-align: center;">
        <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 20px; padding: 32px; max-width: 420px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          <div style="font-size: 36px; margin-bottom: 12px;">⚠️</div>
          <h1 style="font-size: 18px; font-weight: 700; margin: 0 0 8px 0; color: #f4f4f5;">Falha na Inicialização</h1>
          <p style="font-size: 13px; color: #a1a1aa; margin: 0 0 20px 0; line-height: 1.5;">Ocorreu uma falha ao iniciar os componentes. Clique abaixo para reiniciar com cache limpo.</p>
          <button onclick="window.location.reload(true)" style="width: 100%; padding: 12px 16px; background-color: #f59e0b; color: #09090b; font-weight: 700; font-size: 13px; border: none; border-radius: 12px; cursor: pointer;">Recarregar Aplicação</button>
        </div>
      </div>
    `;
  }
}

