/**
 * PWA & Service Worker Manager
 * Handles Service Worker registration and PWA installation prompts.
 */

let deferredPrompt = null;

export function initPWA() {
    // 1. Register Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then((registration) => {
                    console.log('[PWA] ServiceWorker registered with scope:', registration.scope);
                })
                .catch((error) => {
                    console.error('[PWA] ServiceWorker registration failed:', error);
                });
        });
    }

    // 2. Setup Install Prompt UI
    const installBtn = document.getElementById('btn-pwa-install');
    if (!installBtn) return;

    // Check if already in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
        installBtn.classList.add('hidden');
        return;
    }

    // Capture beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing prompt
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        // Show install button in UI
        installBtn.classList.remove('hidden');
        installBtn.classList.add('flex');
    });

    // Handle install button click
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;

        // Show prompt
        deferredPrompt.prompt();
        
        // Wait for user response
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`[PWA] User response to the install prompt: ${outcome}`);
        
        // Reset deferredPrompt
        deferredPrompt = null;
        installBtn.classList.add('hidden');
        installBtn.classList.remove('flex');
    });

    // Handle post-installation
    window.addEventListener('appinstalled', () => {
        console.log('[PWA] DotCanvas was successfully installed!');
        deferredPrompt = null;
        installBtn.classList.add('hidden');
        installBtn.classList.remove('flex');
    });
}
