// PWA Utilities for MENE Portal
class PWAUtils {
    constructor() {
        this.deferredPrompt = null;
        this.isStandalone = false;
        this.initPWAFeatures();
    }

    initPWAFeatures() {
        this.checkStandaloneMode();
        this.setupInstallPrompt();
        this.setupUpdateHandling();
    }

    checkStandaloneMode() {
        this.isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           window.navigator.standalone === true;

        if (this.isStandalone) {
            document.body.classList.add('standalone-mode');
        }
    }

    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        window.addEventListener('appinstalled', () => {
            this.hideInstallButton();
            console.log('PWA was installed');
        });
    }

    setupUpdateHandling() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload();
            });
        }
    }

    async installPWA() {
        if (!this.deferredPrompt) {
            return false;
        }

        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;

        this.deferredPrompt = null;
        return outcome === 'accepted';
    }

    showInstallButton() {
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.classList.remove('hidden');
        }
    }

    hideInstallButton() {
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.classList.add('hidden');
        }
    }

    // Check if PWA is installable
    canInstall() {
        return this.deferredPrompt !== null;
    }

    // Get PWA install status
    getInstallStatus() {
        return {
            isStandalone: this.isStandalone,
            canInstall: this.canInstall(),
            hasServiceWorker: 'serviceWorker' in navigator
        };
    }
}

// Initialize PWA utilities
const pwaUtils = new PWAUtils();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWAUtils;
}