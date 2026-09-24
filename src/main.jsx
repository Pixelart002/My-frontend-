import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import registerServiceWorker from './registerServiceWorker';
import { installLocationAutocomplete } from './services/locationAutocomplete';

// Keep only the minimal global foundation here.
// Storefront visual styling is owned by the scoped LuviioInlineTheme.
// Legacy global page/component CSS was causing cascade conflicts with the
// inline storefront system, so it is intentionally no longer loaded globally.
import './styles/tokens.css';
import './styles/location-autocomplete.css';

// Admin has its own legacy surface and is loaded separately by the admin UI.
// Do not add storefront CSS imports here.

registerServiceWorker();

createRoot(document.getElementById('root')).render(<App />);
installLocationAutocomplete();
