import '@/lib/sentry'; // Must be first import — Sentry init
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { StorageModeProvider } from '@/storage/storageContext';
import i18n, { initializeLanguage } from './i18n';
import App from './App';
import './index.css';

initializeLanguage().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <StorageModeProvider>
          <I18nextProvider i18n={i18n}>
            <App />
          </I18nextProvider>
        </StorageModeProvider>
      </BrowserRouter>
    </StrictMode>,
  );
});
