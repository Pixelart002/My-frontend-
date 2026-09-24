import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import registerServiceWorker from './registerServiceWorker';
import { installLocationAutocomplete } from './services/locationAutocomplete';

// Storefront CSS is intentionally owned by LuviioInlineTheme.
// Do not load legacy/global storefront styles here; they override inline
// component styles and create cascade conflicts on mobile.
registerServiceWorker();

createRoot(document.getElementById('root')).render(<App />);
installLocationAutocomplete();
