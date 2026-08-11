/* ============================================================
   LUVIIO — Push Notification Manager
   File: /js/push.js
   ============================================================ */

const PUSH = (() => {

    const SW_URL = '/sw.js';
    const VAPID_CACHE_KEY = '__lv_vapid';
    const DISMISS_KEY = '__lv_push_prompt_dismissed';

    let lastError = '';


    // ============================================================
    // ERROR POPUP
    // ============================================================

    const showPushError = (title, error) => {

        const name = error?.name || 'Error';
        const message =
            error?.message ||
            String(error) ||
            'Unknown error';

        lastError = `${name}: ${message}`;

        console.error('[PUSH]', {
            name,
            message,
            stack: error?.stack
        });

        const text =
            `${title}\n\n` +
            `Error: ${name}\n\n` +
            `Message: ${message}`;

        // Existing toast if available
        if (typeof showToast === 'function') {
            try {
                showToast(
                    `Push Error: ${name} — ${message}`,
                    'error'
                );
            } catch (_) {}
        }

        // Always show mobile popup as requested
        setTimeout(() => {
            alert(text);
        }, 50);
    };


    // ============================================================
    // BASE64URL → UINT8ARRAY
    // Required by Chrome for applicationServerKey
    // ============================================================

    const urlBase64ToUint8Array = (base64String) => {

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
                `Invalid VAPID public key: ${error.message}`
            );
        }

        return Uint8Array.from(
            [...raw].map(char =>
                char.charCodeAt(0)
            )
        );
    };


    // ============================================================
    // SUPPORT
    // ============================================================

    const isSupported = () => {

        return (
            'serviceWorker' in navigator &&
            'PushManager' in window &&
            'Notification' in window
        );
    };


    const notifPermission = () => {

        if (
            typeof Notification === 'undefined'
        ) {
            return 'denied';
        }

        return Notification.permission;
    };


    // ============================================================
    // SERVICE WORKER
    // ============================================================

    const registerSW = async () => {

        if (!isSupported()) {

            throw new Error(
                'Service Worker / Push API is not supported.'
            );
        }

        try {

            /*
             * IMPORTANT:
             * No manual HEAD request to /sw.js.
             * Browser performs the actual SW registration.
             */

            const registration =
                await navigator.serviceWorker.register(
                    SW_URL,
                    {
                        scope: '/'
                    }
                );

            const ready =
                await navigator.serviceWorker.ready;

            return ready;

        } catch (error) {

            showPushError(
                'Service Worker Registration Failed',
                error
            );

            throw error;
        }
    };


    // ============================================================
    // VAPID KEY
    // ============================================================

    const getVapidKey = async (
        forceRefresh = false
    ) => {

        try {

            if (!forceRefresh) {

                const cached =
                    sessionStorage.getItem(
                        VAPID_CACHE_KEY
                    );

                if (cached) {
                    return cached;
                }
            }

            if (typeof API === 'undefined') {

                throw new Error(
                    'API module is not loaded.'
                );
            }

            const data =
                await API.getVapidKey();

            if (!data) {

                throw new Error(
                    'VAPID API returned an empty response.'
                );
            }

            const key =
                data.public_key ||
                data.publicKey ||
                data.vapid_public_key ||
                null;

            if (!key) {

                throw new Error(
                    'VAPID public key is missing from API response.'
                );
            }

            sessionStorage.setItem(
                VAPID_CACHE_KEY,
                key
            );

            return key;

        } catch (error) {

            showPushError(
                'VAPID Key Failed',
                error
            );

            throw error;
        }
    };


    // ============================================================
    // SAVE SUBSCRIPTION
    // ============================================================

    const saveSubscription = async (
        subscription
    ) => {

        if (
            typeof API === 'undefined'
        ) {

            throw new Error(
                'API module is not loaded.'
            );
        }

        if (!subscription) {

            throw new Error(
                'Push subscription object is empty.'
            );
        }

        const json =
            subscription.toJSON();

        if (!json?.endpoint) {

            throw new Error(
                'Push subscription has no endpoint.'
            );
        }

        return await API.subscribePush(
            json
        );
    };


    // ============================================================
    // UNSUBSCRIBE BACKEND
    // ============================================================

    const removeSubscription = async (
        subscription
    ) => {

        if (
            !subscription ||
            typeof API === 'undefined'
        ) {
            return;
        }

        try {

            await API.unsubscribePush(
                subscription.toJSON()
            );

        } catch (error) {

            console.warn(
                '[PUSH] Backend unsubscribe failed:',
                error
            );
        }
    };


    // ============================================================
    // PROMPT
    // ============================================================

    const showPrompt = () => {

        if (
            !isSupported() ||
            typeof AUTH === 'undefined' ||
            !AUTH.isLoggedIn() ||
            notifPermission() !== 'default'
        ) {
            return;
        }

        const dismissed =
            localStorage.getItem(
                DISMISS_KEY
            );

        if (
            dismissed &&
            Date.now() -
                Number(dismissed) <
                24 * 60 * 60 * 1000
        ) {
            return;
        }

        const old =
            document.getElementById(
                'luviio-push-banner'
            );

        if (old) {
            old.remove();
        }

        const banner =
            document.createElement('div');

        banner.id =
            'luviio-push-banner';

        banner.innerHTML = `
            <div style="
                position:fixed;
                bottom:24px;
                left:24px;
                right:24px;
                max-width:420px;
                margin:auto;
                background:var(--surface,#1e1e1e);
                border:1px solid var(--border,#333);
                padding:16px;
                border-radius:12px;
                box-shadow:0 10px 25px rgba(0,0,0,.5);
                z-index:99999;
                font-family:sans-serif;
            ">

                <div style="
                    display:flex;
                    align-items:center;
                    gap:12px;
                ">

                    <div style="
                        font-size:28px;
                    ">
                        🔔
                    </div>

                    <div>

                        <div style="
                            color:var(--text,#fff);
                            font-weight:600;
                            font-size:15px;
                        ">
                            Enable Order Alerts
                        </div>

                        <div style="
                            color:var(--text-muted,#aaa);
                            font-size:12px;
                            margin-top:4px;
                        ">
                            Get instant updates about your orders.
                        </div>

                    </div>

                </div>

                <div style="
                    display:flex;
                    justify-content:flex-end;
                    gap:8px;
                    margin-top:14px;
                ">

                    <button
                        id="btn-push-later"
                        style="
                            padding:8px 14px;
                            border-radius:6px;
                            border:1px solid #444;
                            background:transparent;
                            color:#aaa;
                        "
                    >
                        Not Now
                    </button>

                    <button
                        id="btn-push-allow"
                        style="
                            padding:8px 14px;
                            border-radius:6px;
                            border:0;
                            background:#d4af37;
                            color:#000;
                            font-weight:600;
                        "
                    >
                        Allow Notifications
                    </button>

                </div>

            </div>
        `;

        document.body.appendChild(
            banner
        );


        document.getElementById(
            'btn-push-later'
        ).onclick = () => {

            localStorage.setItem(
                DISMISS_KEY,
                Date.now().toString()
            );

            banner.remove();
        };


        document.getElementById(
            'btn-push-allow'
        ).onclick = async () => {

            banner.remove();

            await PUSH.subscribe();
        };
    };


    // ============================================================
    // PUBLIC API
    // ============================================================

    return {

        get lastError() {
            return lastError;
        },


        isSupported,


        // ========================================================
        // SUBSCRIBE
        // ========================================================

        async subscribe() {

            try {

                lastError = '';


                // -----------------------------------------------
                // 1. SUPPORT
                // -----------------------------------------------

                if (!isSupported()) {

                    throw new Error(
                        'Push notifications are not supported in this browser.'
                    );
                }


                // -----------------------------------------------
                // 2. LOGIN
                // -----------------------------------------------

                if (
                    typeof AUTH === 'undefined' ||
                    !AUTH.isLoggedIn()
                ) {

                    throw new Error(
                        'User is not logged in.'
                    );
                }


                // -----------------------------------------------
                // 3. PERMISSION
                // -----------------------------------------------

                let permission =
                    Notification.permission;

                if (
                    permission !== 'granted'
                ) {

                    permission =
                        await Notification.requestPermission();
                }

                if (
                    permission !== 'granted'
                ) {

                    throw new Error(
                        `Notification permission is "${permission}".`
                    );
                }


                // -----------------------------------------------
                // 4. SERVICE WORKER
                // -----------------------------------------------

                const registration =
                    await registerSW();


                if (!registration) {

                    throw new Error(
                        'Service Worker registration returned nothing.'
                    );
                }


                // -----------------------------------------------
                // 5. VAPID
                // -----------------------------------------------

                const vapidKey =
                    await getVapidKey();


                if (!vapidKey) {

                    throw new Error(
                        'VAPID public key is unavailable.'
                    );
                }


                // -----------------------------------------------
                // 6. EXISTING SUBSCRIPTION
                // -----------------------------------------------

                let subscription =
                    await registration
                        .pushManager
                        .getSubscription();


                // -----------------------------------------------
                // 7. CREATE SUBSCRIPTION
                // -----------------------------------------------

                if (!subscription) {

                    const applicationServerKey =
                        urlBase64ToUint8Array(
                            vapidKey
                        );


                    // Chrome requires userVisibleOnly:true
                    // and a valid VAPID applicationServerKey.
                    subscription =
                        await registration
                            .pushManager
                            .subscribe({
                                userVisibleOnly: true,
                                applicationServerKey
                            });
                }


                // -----------------------------------------------
                // 8. VERIFY SUBSCRIPTION
                // -----------------------------------------------

                if (
                    !subscription ||
                    !subscription.endpoint
                ) {

                    throw new Error(
                        'Browser created an invalid push subscription.'
                    );
                }


                // -----------------------------------------------
                // 9. SAVE TO BACKEND
                // -----------------------------------------------

                await saveSubscription(
                    subscription
                );


                // -----------------------------------------------
                // SUCCESS
                // -----------------------------------------------

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

                showPushError(
                    'Push Notification Setup Failed',
                    error
                );

                return false;
            }
        },


        // ========================================================
        // UNSUBSCRIBE
        // ========================================================

        async unsubscribe() {

            try {

                if (!isSupported()) {
                    return false;
                }

                const registration =
                    await navigator
                        .serviceWorker
                        .getRegistration(SW_URL);


                if (!registration) {
                    return false;
                }


                const subscription =
                    await registration
                        .pushManager
                        .getSubscription();


                if (!subscription) {
                    return true;
                }


                await removeSubscription(
                    subscription
                );


                await subscription.unsubscribe();


                return true;


            } catch (error) {

                showPushError(
                    'Push Unsubscribe Failed',
                    error
                );

                return false;
            }
        },


        // ========================================================
        // AUTO SUBSCRIBE
        // ========================================================

        async autoSubscribe() {

            /*
             * IMPORTANT:
             * Do not call subscribe() automatically when
             * permission is "default".
             *
             * Browser push subscription should originate from
             * an explicit user action.
             */

            if (
                !isSupported() ||
                typeof AUTH === 'undefined' ||
                !AUTH.isLoggedIn()
            ) {
                return false;
            }


            if (
                Notification.permission !== 'granted'
            ) {
                return false;
            }


            try {

                const registration =
                    await registerSW();


                const existing =
                    await registration
                        .pushManager
                        .getSubscription();


                if (!existing) {

                    /*
                     * Permission may be granted but there is
                     * no subscription. Let the user explicitly
                     * subscribe through the button/prompt.
                     */
                    return false;
                }


                await saveSubscription(
                    existing
                );


                return true;


            } catch (error) {

                console.warn(
                    '[PUSH] Auto sync failed:',
                    error
                );

                lastError =
                    error?.message ||
                    String(error);

                return false;
            }
        },


        // ========================================================
        // INIT
        // ========================================================

        async init() {

            if (
                typeof AUTH === 'undefined' ||
                !AUTH.isLoggedIn()
            ) {
                return;
            }


            /*
             * Sync an already-existing subscription.
             * Do not silently create a new subscription.
             */
            await PUSH.autoSubscribe();


            /*
             * Show permission prompt only when permission
             * is still "default".
             */
            if (
                Notification.permission === 'default'
            ) {

                setTimeout(
                    showPrompt,
                    2500
                );
            }
        }
    };

})();


// ============================================================
// SERVICE WORKER → PAGE
// ============================================================

if (
    typeof navigator !== 'undefined' &&
    navigator.serviceWorker
) {

    navigator.serviceWorker.addEventListener(
        'message',
        async (event) => {

            if (
                event.data?.type !==
                'PUSH_SUBSCRIPTION_CHANGED'
            ) {
                return;
            }

            try {

                if (
                    typeof API !== 'undefined' &&
                    event.data.subscription
                ) {

                    await API.subscribePush(
                        event.data.subscription
                    );
                }

            } catch (error) {

                console.warn(
                    '[PUSH] Subscription change sync failed:',
                    error
                );
            }
        }
    );
}


// ============================================================
// AUTH EVENTS
// ============================================================

if (
    typeof window !== 'undefined'
) {

    window.addEventListener(
        'auth:login',
        () => {
            PUSH.init();
        }
    );


    window.addEventListener(
        'auth:logout',
        () => {
            PUSH.unsubscribe();
        }
    );


    window.addEventListener(
        'load',
        () => {
            PUSH.init();
        }
    );
}