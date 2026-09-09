const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });

    if (import.meta.env.DEV) {
      console.info('[Luviio] Push service worker registered:', registration.scope);
    }

    return registration;
  } catch (error) {
    console.error('[Luviio] Push service worker registration failed:', error);
    return null;
  }
};

export default registerServiceWorker;
