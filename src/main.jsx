import { createRoot } from 'react-dom/client';
import App from './App.jsx';

import registerServiceWorker from './registerServiceWorker';
import { installLocationAutocomplete } from './services/locationAutocomplete';

import './styles/tokens.css';
import './styles/viewport.css';
import './styles/pages.css';
import './styles/products.css';
import './styles/product-media.css';
import './styles/forms.css';
import './styles/app.css';
import './styles/admin.css';
import './styles/admin-layout.css';
import './styles/header.css';
import './styles/cart.css';
import './styles/payment.css';
import './styles/checkout.css';
import './styles/loading.css';
import './styles/mobile-nav.css';
import './styles/settings.css';
import './styles/profile.css';
import './styles/password.css';
import './styles/footer.css';
import './styles/admin-business.css';
import './styles/location-autocomplete.css';
import './styles/site-ui.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
 throw new Error('[Luviio] Root element #root was not found.');
}

createRoot(rootElement).render(<App />);

/*
 * Optional browser enhancements.
 * Neither should block the React application from rendering.
 */
void registerServiceWorker();

try {
 installLocationAutocomplete();
} catch (error) {
 console.error(
  '[Luviio] Location autocomplete initialization failed:',
  error
 );
}
import './styles/tailwind-input.css';
