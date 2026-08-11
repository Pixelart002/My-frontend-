/* ============================================================
   LUVIIO — Premium Light/Dark Theme Switcher
   Path: /js/theme.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Create Theme Toggle Button
    const themeBtn = document.createElement('button');
    themeBtn.id = 'theme-toggle-btn';
    
    // 2. Check LocalStorage for Saved Theme (Refresh Proof)
    const savedTheme = localStorage.getItem('luviio-theme');
    if (savedTheme === 'light') {
        document.documentElement.classList.add('light-mode');
        themeBtn.innerHTML = '🌙 Dark';
    } else {
        themeBtn.innerHTML = '☀️ Light';
    }
    
    // 3. Premium Button Styling (Fixed in Header/Nav Area)
    Object.assign(themeBtn.style, {
        position: 'fixed',
        top: '80px',
        right: '20px',
        zIndex: '9999999',
        padding: '8px 16px',
        backgroundColor: '#d4af37', // Luviio Gold
        color: '#080808',
        border: 'none',
        borderRadius: '50px',
        fontFamily: 'inherit',
        fontSize: '13px',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
        transition: 'transform 0.2s ease, background 0.2s'
    });
    
    // Hover Animation
    themeBtn.onmouseenter = () => themeBtn.style.transform = 'scale(1.05)';
    themeBtn.onmouseleave = () => themeBtn.style.transform = 'scale(1)';
    
    // 4. Click Event handler
    themeBtn.addEventListener('click', () => {
        const isLight = document.documentElement.classList.toggle('light-mode');
        if (isLight) {
            themeBtn.innerHTML = '🌙 Dark';
            localStorage.setItem('luviio-theme', 'light');
        } else {
            themeBtn.innerHTML = '☀️ Light';
            localStorage.setItem('luviio-theme', 'dark');
        }
    });
    
    // 5. 👑 ULTRA-DEEP CSS INJECTION (Overrides your exact Tailwind classes)
    const style = document.createElement('style');
    style.innerHTML = `
        /* Main Body & Hardcoded Dark Colors */
        html.light-mode body,
        html.light-mode .bg-\\[\\#080808\\] {
            background-color: #f9fafb !important; /* Soft Light Gray */
            color: #111827 !important; /* Dark Text */
        }
        
        /* Main Text Override */
        html.light-mode .text-\\[\\#f0ece4\\],
        html.light-mode .text-text {
            color: #111827 !important;
        }

        /* Container Surfaces & Feature Cards */
        html.light-mode .bg-surface,
        html.light-mode footer.bg-surface {
            background-color: #ffffff !important;
            box-shadow: 0 1px 10px rgba(0,0,0,0.03) !important;
        }
        
        /* Product Image Backgrounds */
        html.light-mode .bg-surface-2 {
            background-color: #f3f4f6 !important; 
        }

        /* All Borders & Lines */
        html.light-mode .border-border,
        html.light-mode .border-y,
        html.light-mode .border-b,
        html.light-mode .border-t,
        html.light-mode .border-x {
            border-color: #e5e7eb !important; 
        }

        /* Typography Subtitles & Descriptions */
        html.light-mode h1, html.light-mode h2, html.light-mode h3 {
            color: #111827 !important;
        }
        html.light-mode .text-text-muted {
            color: #4b5563 !important;
        }
        html.light-mode .text-text-dim {
            color: #6b7280 !important;
        }

        /* Transparent / Ghost Buttons */
        html.light-mode a.border-border,
        html.light-mode button.border-border {
            background-color: #ffffff !important;
            color: #374151 !important;
            border-color: #d1d5db !important;
        }
        /* Button Hover */
        html.light-mode a.border-border:hover,
        html.light-mode button.border-border:hover {
            border-color: #d4af37 !important;
            color: #d4af37 !important;
            background-color: #fff9eb !important; 
        }

        /* Navigation Bar (Make it light and blurred) */
        html.light-mode nav,
        html.light-mode #main-nav {
            background-color: rgba(255, 255, 255, 0.95) !important;
            border-bottom: 1px solid #e5e7eb !important;
        }

        /* Turn off the SVG Noise Pattern for cleaner Light Mode */
        html.light-mode .opacity-\\[0\\.028\\] {
            display: none !important;
        }
    `;
    
    // 6. Inject the CSS and Button into the page
    document.head.appendChild(style);
    document.body.appendChild(themeBtn);
});