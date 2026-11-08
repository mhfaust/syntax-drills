import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { ServicesProvider } from '@/app/services';
import '@/app/styles/global.css';
import { createServices } from '@/composition-root';

const root = createRoot(document.getElementById('root')!);

createServices().then(
  (services) =>
    root.render(
      <StrictMode>
        <ServicesProvider services={services}>
          <App />
        </ServicesProvider>
      </StrictMode>,
    ),
  (error: unknown) => root.render(<pre className="fatal">Could not start: {String(error)}</pre>),
);
