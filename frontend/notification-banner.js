/**
 * Universal Notification Banner System
 * Provides attractive, dismissible notifications with CTA buttons
 */

class NotificationBanner {
    constructor(config) {
        this.id = config.id || `notif-${Date.now()}`;
        this.message = config.message || '';
        this.ctaText = config.ctaText || 'Learn More';
        this.ctaLink = config.ctaLink || '#';
        this.theme = config.theme || 'blue'; // blue, purple, green, red, yellow
        this.icon = config.icon || '🔔';
        this.dismissible = config.dismissible !== false;
        this.persistent = config.persistent || false;
        this.ctaButtons = Array.isArray(config.ctaButtons) ? config.ctaButtons : null;
        
        this.themes = {
            blue: 'from-blue-500 to-blue-600',
            purple: 'from-purple-500 to-purple-600',
            green: 'from-green-500 to-green-600',
            red: 'from-red-500 to-red-600',
            yellow: 'from-yellow-500 to-yellow-600',
            gradient: 'from-blue-400 via-purple-500 to-pink-500'
        };
    }

    isDismissed() {
        if (!this.dismissible) return false;
        const dismissed = localStorage.getItem(`notif_dismissed_${this.id}`);
        return dismissed === 'true';
    }

    dismiss() {
        if (this.dismissible) {
            localStorage.setItem(`notif_dismissed_${this.id}`, 'true');
            const banner = document.getElementById(`banner-${this.id}`);
            if (banner) {
                banner.style.animation = 'slideUp 0.3s ease-out';
                setTimeout(() => banner.remove(), 300);
            }
        }
    }

    render(container) {
        if (this.isDismissed() && !this.persistent) return;

        const gradient = this.themes[this.theme] || this.themes.blue;
        
        const renderButton = (btn) => {
            const text = btn?.text || btn?.ctaText || 'Action';
            if (btn?.action) {
                return `<button onclick="handleNotificationAction('${btn.action}')" class="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg font-semibold text-sm whitespace-nowrap transition backdrop-blur">${text}</button>`;
            }
            const link = btn?.link || btn?.ctaLink || '#';
            return `<a href="${link}" class="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg font-semibold text-sm whitespace-nowrap transition backdrop-blur">${text}</a>`;
        };

        const ctaHTML = this.ctaButtons && this.ctaButtons.length
            ? this.ctaButtons.map(renderButton).join('')
            : renderButton({ text: this.ctaText, link: this.ctaLink });

        const bannerHTML = `
            <div id="banner-${this.id}" class="notification-banner bg-gradient-to-r ${gradient} text-white shadow-lg animate-slideDown" style="animation: slideDown 0.5s ease-out;">
                <div class="container mx-auto px-6 py-4 flex items-center justify-between gap-4">
                    <div class="flex items-center gap-3 flex-1">
                        <span class="text-3xl">${this.icon}</span>
                        <p class="text-sm md:text-base font-medium">${this.message}</p>
                    </div>
                    <div class="flex items-center gap-3 flex-wrap justify-end">
                        ${ctaHTML}
                        ${this.dismissible ? `
                        <button onclick="notificationBanners['${this.id}'].dismiss()" class="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        const targetContainer = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;
        
        if (targetContainer) {
            targetContainer.insertAdjacentHTML('afterbegin', bannerHTML);
        }
    }
}

// Global banner registry
window.notificationBanners = window.notificationBanners || {};

// Banner Presets for Different Pages
const NOTIFICATION_PRESETS = {
    home: {
        id: 'home-welcome',
        message: '🏠 Welcome back! Your personalized plan is ready. Check your dashboard for today\'s nutrition targets and progress.',
        ctaButtons: [
            { text: '📊 Open Dashboard', link: 'client-dashboard.html' },
            { text: '📈 View Progress', link: 'progress-tracking.html' }
        ],
        theme: 'blue',
        icon: '🏠'
    },
    nutrition: {
        id: 'nutrition-tips',
        message: '💡 Quick actions: adjust schedule, update measurements, or edit your profile in one tap.',
        ctaButtons: [
            { text: '⚙️ Adjust Schedule', action: 'adjust-schedule' },
            { text: '📊 Update Now', action: 'update-now' },
            { text: '✏️ Edit Full Profile', action: 'edit-profile' }
        ],
        theme: 'blue',
        icon: '🥗'
    },
    mental: {
        id: 'mental-upgrade',
        message: '🧠 Unlock your full potential! Upgrade to the Mental Performance Program for advanced mindset training.',
        ctaText: '🚀 Upgrade Now',
        ctaLink: 'subscription-plan.html?upgrade=mental-performance',
        theme: 'purple',
        icon: '🧠'
    },
    supplements: {
        id: 'supplement-program',
        message: '💊 Maximize your gains! Access personalized supplement recommendations with our premium program.',
        ctaText: '🚀 Unlock Full Program',
        ctaLink: 'subscription-plan.html?upgrade=supplement-program',
        theme: 'green',
        icon: '💊'
    },
    progress: {
        id: 'progress-tracking',
        message: '📈 Track your transformation! Log your measurements regularly to see your progress over time.',
        ctaText: '📊 Update Now',
        ctaLink: '#updateModal',
        theme: 'gradient',
        icon: '💪'
    },
    settings: {
        id: 'profile-complete',
        message: '✨ Keep your profile up to date! Update your information to get the most accurate nutrition plan.',
        ctaText: '✏️ Edit Profile',
        ctaLink: '#editProfileSection',
        theme: 'blue',
        icon: '⚙️'
    },
    antiDoping: {
        id: 'anti-doping-safety',
        message: '🛡️ Stay competition-ready: verify every supplement and avoid unapproved products before event week.',
        ctaButtons: [
            { text: '💊 Review Supplements', link: 'supplements.html' },
            { text: '📈 Update Progress', action: 'update-now' }
        ],
        theme: 'green',
        icon: '🧪'
    },
    sleepReminder: {
        id: 'sleep-reminder',
        message: '💤 Don\'t forget: Quality sleep is crucial for recovery! Aim for 7-9 hours tonight.',
        ctaText: '📝 Log Sleep',
        ctaLink: 'progress-tracking.html',
        theme: 'purple',
        icon: '😴'
    },
    moodCheck: {
        id: 'mood-check',
        message: '😊 How are you feeling today? Track your mood to understand how it affects your performance.',
        ctaText: '📝 Log Mood',
        ctaLink: 'progress-tracking.html',
        theme: 'yellow',
        icon: '😊'
    }
};

// Function to show page-specific notification
function showPageNotification(pageName) {
    const preset = NOTIFICATION_PRESETS[pageName];
    if (!preset) return;
    
    const banner = new NotificationBanner(preset);
    window.notificationBanners[preset.id] = banner;
    banner.render('body');
}

// Function to show daily reminder (sleep or mood based on time)
function showDailyReminder() {
    const hour = new Date().getHours();
    let preset;
    
    // Evening time (after 8 PM) - sleep reminder
    if (hour >= 20 || hour < 6) {
        preset = NOTIFICATION_PRESETS.sleepReminder;
    }
    // Morning/afternoon - mood check
    else if (hour >= 6 && hour < 12) {
        preset = NOTIFICATION_PRESETS.moodCheck;
    }
    
    if (preset) {
        const banner = new NotificationBanner(preset);
        window.notificationBanners[preset.id] = banner;
        banner.render('body');
    }
}

function handleNotificationAction(action) {
    if (!action) return;

    const isDashboard = window.location.pathname.toLowerCase().includes('client-dashboard.html');

    if (action === 'adjust-schedule') {
        if (isDashboard) {
            const scheduleCard = document.getElementById('daily-schedule-card');
            if (scheduleCard) {
                scheduleCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                scheduleCard.classList.add('ring-2', 'ring-blue-400');
                setTimeout(() => scheduleCard.classList.remove('ring-2', 'ring-blue-400'), 1500);
            }
            return;
        }
        window.location.href = 'client-dashboard.html#daily-schedule-card';
        return;
    }

    if (action === 'update-now') {
        window.location.href = 'progress-tracking.html?openUpdate=1';
        return;
    }

    if (action === 'edit-profile') {
        const currentUrl = window.location.href;
        sessionStorage.setItem('profileEditReturnTo', currentUrl);
        window.location.href = `profile-setup.html?edit=1&returnTo=${encodeURIComponent(currentUrl)}`;
    }
}

window.handleNotificationAction = handleNotificationAction;

// Add CSS for animations
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from {
                transform: translateY(-100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        @keyframes slideUp {
            from {
                transform: translateY(0);
                opacity: 1;
            }
            to {
                transform: translateY(-100%);
                opacity: 0;
            }
        }
        
        .notification-banner {
            position: relative;
            z-index: 45;
        }
        
        .animate-slideDown {
            animation: slideDown 0.5s ease-out;
        }
    `;
    document.head.appendChild(style);
}
