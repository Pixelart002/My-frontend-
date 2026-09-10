import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import registerServiceWorker from './registerServiceWorker.js';

import './styles/tokens.css';
import './styles/pages.css';
import './styles/products.css';
import './styles/forms.css';
import './styles/app.css';
import './styles/admin.css';
import './styles/admin-desktop-drawer.css';
import './styles/admin-layout-fix.css';
import './styles/header.css';
import './styles/polish.css';
import './styles/cart-page.css';
import './styles/payment-modal.css';
import './styles/settings.css';
import './styles/profile.css';
import './styles/change-password.css';
import './styles/footer-layout.css';

createRoot(document.getElementById('root')).render(<App />);

registerServiceWorker();
