/* ============================================================
   LUVIIO — Web Push Manager
   Production / Chrome diagnostic version
   ============================================================ */

const PUSH = (() => {

    const SW_URL = '/sw.js';
    const SW_SCOPE = '/';

    let lastError = '';


    /* ============================================================
       MOBILE DEBUG POPUP
       ============================================================ */

    function debug(message) {
        console.log('[PUSH]', message);

        // Mobile-friendly diagnostic popup
        alert(`LUVIIO PUSH\n\n${message}`);
    }


    function fail(title, error) {

        const name =
            error?.name || 'Error';

        const message =
            error?.message ||
            String(error) ||
            'Unknown error';

        lastError =
            `${name}: ${message}`;

        console.error(
            '[PUSH]',
            title,
            error
        );

        alert(
            `LUVIIO PUSH ERROR\n\n` +
            `${title}\n\n` +
            `Error: ${name}\n\n` +
            `Message: ${message}`
        );

        return false;
    }


    /* ============================================================
       BASE64URL → UINT8ARRAY
       ============================================================ */

    function urlBase64ToUint8Array(base64String) {

        if (!base64String) {
            throw new Error(
                'VAPID public key is empty.'
            );
        }

        const padding =
            '='.repeat(
                (4 - (base64String.length % 4)) % 4
            );

        const base64 =
            (base64String + padding)
                .replace(/-/g, '+')
                .replace(/_/g, '/');

        let raw;

        try {

            raw = window.atob(base64);

        } catch (error) {

            throw new Error(
                `Invalid Base64URL VAPID key: ${error.message}`
            );
        }

        return Uint8Array.from(
            [...raw].map(
                char => char.charCodeAt(0)
            )
        );
    }


    /* ============================================================
       SUPPORT CHECK
       ============================================================ */

    function isSupported() {

        return (
            'serviceWorker' in navigator &&
            'PushManager' in window &&
            'Notification' in window
        );
    }


    /* ============================================================
       SERVICE WORKER REGISTRATION
       ============================================================ */

    async function registerServiceWorker() {

        if (!isSupported()) {

            throw new Error(
                'Browser does not support Service Worker + Push API.'
            );
        }

        const registration =
            await navigator.serviceWorker.register(
                SW_URL,
                {
                    scope: SW_SCOPE,
                    updateViaCache: 'none'
                }
            );

        await navigator.serviceWorker.ready;

        return registration;
    }


    /* ============================================================
       VAPID KEY
       ============================================================ */

    async function getVapidKey() {

        const response =
            await fetch(
                '/api/v1/push/vapid-key',
                {
                    method: 'GET',
                    credentials: 'include',
                    cache: 'no-store',
                    headers: {
                        'Accept': 'application/json'
                    }
                }
            );

        if (!response.ok) {

            throw new Error(
                `VAPID endpoint returned HTTP ${response.status}.`
            );
        }

        const data =
            await response.json();

        const key =
            data.public_key ||
            data.publicKey ||
            data.vapid_public_key;

        if (!key) {

            throw new Error(
                'VAPID public key missing from API response.'
            );
        }

        return key;
    }


    /* ============================================================
       SAVE SUBSCRIPTION
       ============================================================ */

    async function saveSubscription(
        subscription
    ) {

        const payload =
            subscription.toJSON();

        if (!payload?.endpoint) {

            throw new Error(
                'Subscription has no endpoint.'
            );
        }

        const response =
            await fetch(
                '/api/v1/push/subscribe',
                {
                    method: 'POST',
                    credentials: 'include',
                    cache: 'no-store',

                    headers: {
                        'Content-Type':
                            'application/json',
                        'Accept':
                            'application/json'
                    },

                    body:
                        JSON.stringify(payload)
                }
            );

        if (!response.ok) {

            const text =
                await response.text();

            throw new Error(
                `Subscribe API HTTP ${response.status}: ${text}`
            );
        }

        return true;
    }


    /* ============================================================
       MAIN SUBSCRIBE FLOW
       ============================================================ */

    async function subscribe() {

        try {

            lastError = '';


            /* ----------------------------------------------------
               1. SUPPORT
               ---------------------------------------------------- */

            if (!isSupported()) {

                throw new Error(
                    'Push notifications are not supported.'
                );
            }

            debug(
                'STEP 1/6\n\n' +
                'Push API supported.'
            );


            /* ----------------------------------------------------
               2. SERVICE WORKER
               ---------------------------------------------------- */

            const registration =
                await registerServiceWorker();

            debug(
                'STEP 2/6\n\n' +
                'Service Worker READY.\n\n' +
                `Scope: ${registration.scope}`
            );


            /* ----------------------------------------------------
               3. PERMISSION
               ---------------------------------------------------- */

            let permission =
                Notification.permission;


            if (permission === 'default') {

                permission =
                    await Notification.requestPermission();
            }


            if (permission !== 'granted') {

                throw new Error(
                    `Notification permission is "${permission}".`
                );
            }


            debug(
                'STEP 3/6\n\n' +
                'Notification permission = GRANTED'
            );


            /* ----------------------------------------------------
               4. VAPID
               ---------------------------------------------------- */

            const vapidKey =
                await getVapidKey();

            const applicationServerKey =
                urlBase64ToUint8Array(
                    vapidKey
                );


            if (
                applicationServerKey.byteLength !== 65
            ) {

                throw new Error(
                    `Invalid VAPID key length: ` +
                    `${applicationServerKey.byteLength} bytes. ` +
                    `Expected 65 bytes.`
                );
            }


            debug(
                'STEP 4/6\n\n' +
                'VAPID public key received.\n\n' +
                `Key length: ${applicationServerKey.byteLength} bytes`
            );


            /* ----------------------------------------------------
               5. EXISTING SUBSCRIPTION
               ---------------------------------------------------- */

            let subscription =
                await registration
                    .pushManager
                    .getSubscription();


            if (subscription) {

                debug(
                    'STEP 5/6\n\n' +
                    'Existing PushSubscription FOUND.\n\n' +
                    'Syncing it with backend...'
                );

            } else {

                debug(
                    'STEP 5/6\n\n' +
                    'No existing subscription.\n\n' +
                    'Calling PushManager.subscribe()...'
                );


                subscription =
                    await registration
                        .pushManager
                        .subscribe({
                            userVisibleOnly: true,
                            applicationServerKey
                        });


                if (!subscription) {

                    throw new Error(
                        'PushManager.subscribe() returned empty subscription.'
                    );
                }


                debug(
                    'PushManager.subscribe() SUCCESS.\n\n' +
                    `Endpoint:\n${subscription.endpoint}`
                );
            }


            /* ----------------------------------------------------
               6. BACKEND
               ---------------------------------------------------- */

            await saveSubscription(
                subscription
            );


            debug(
                'STEP 6/6\n\n' +
                'BACKEND SAVE SUCCESSFUL.\n\n' +
                '🎉 PUSH NOTIFICATIONS ENABLED'
            );


            if (
                typeof showToast === 'function'
            ) {

                try {

                    showToast(
                        'Notifications Enabled Successfully!',
                        'success'
                    );

                } catch (_) {}
            }


            return true;


        } catch (error) {

            return fail(
                'Push registration failed',
                error
            );
        }
    }


    /* ============================================================
       AUTO SYNC
       ============================================================ */

    async function syncExistingSubscription() {

        try {

            if (!isSupported()) {
                return false;
            }


            if (
                Notification.permission !==
                'granted'
            ) {
                return false;
            }


            const registration =
                await registerServiceWorker();


            const subscription =
                await registration
                    .pushManager
                    .getSubscription();


            if (!subscription) {
                return false;
            }


            await saveSubscription(
                subscription
            );


            return true;


        } catch (error) {

            console.warn(
                '[PUSH] Existing subscription sync failed:',
                error
            );

            return false;
        }
    }


    /* ============================================================
       INIT
       ============================================================ */

    async function init() {

        if (!isSupported()) {
            return false;
        }


        /*
         * If permission is already granted,
         * sync an existing subscription.
         */
        if (
            Notification.permission ===
            'granted'
        ) {

            await syncExistingSubscription();
        }


        return true;
    }


    /* ============================================================
       PUBLIC API
       ============================================================ */

    return {

        subscribe,

        init,

        isSupported,

        get lastError() {
            return lastError;
        }
    };

})();


/* ================================================================
   PAGE LOAD
   ================================================================ */

window.addEventListener(
    'load',
    () => {

        PUSH.init();

    }
);