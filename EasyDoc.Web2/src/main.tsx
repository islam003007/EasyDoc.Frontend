import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/archivo';
import '@fontsource-variable/noto-sans-arabic';

import App from './App';
import './styles/tokens.css';
import './styles/base.css';
import './styles/shell.css';
import './styles/ui.css';
import './styles/screens-auth.css';
import './styles/screens-patient.css';
import './styles/screens-doctor.css';
import './styles/screens-admin.css';
import './styles/screens-account.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
