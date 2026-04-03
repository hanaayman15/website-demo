(function () {
    const API_BASE_URL = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL) ? CONFIG.API_BASE_URL : 'http://127.0.0.1:8011';
    const DASHBOARD_KEY = 'doctor';
    const NEXT_PAGE = 'doctor_dashboard.html';

    function getFallbackConfig() {
        return {
            quick_actions_title: 'Quick Actions.',
            quick_actions_description: 'Manage teams and doctor-access pages.',
            navigation: [
                { label: 'Home', href: 'doctor_dashboard.html' },
                { label: 'Teams', href: 'clients.html' },
                { label: 'Add Team', href: 'add_team.html' },
                { label: 'Add Client', href: 'add-client.html' },
                { label: 'Team View', href: 'clients.html' },
            ],
            modules: [
                {
                    label: 'Home',
                    href: 'doctor_dashboard.html',
                    image: 'images/Gemini_Generated_Image_5sg9au5sg9au5sg9.png',
                    description: 'Doctor dashboard overview and quick access.',
                },
                {
                    label: 'Teams',
                    href: 'clients.html',
                    image: 'images/pexels-yaroslav-shuraev-8844379.jpg',
                    description: 'Open teams and team-safe roster actions from the shared management page.',
                },
                {
                    label: 'Add Team',
                    href: 'add_team.html',
                    image: 'images/football-team.jpg',
                    description: 'Create and manage team rosters.',
                },
                {
                    label: 'Add Client',
                    href: 'add-client.html',
                    image: 'images/pexels-beyzahzah-89810429-15319038.jpg',
                    description: 'Start with basic information, then continue to Client Services and Open Nutrition.',
                },
                {
                    label: 'Team View',
                    href: 'clients.html',
                    image: 'images/pexels-pavel-danilyuk-7653093.jpg',
                    description: 'Open any saved team from the Teams page to view full roster details.',
                },
            ],
        };
    }

    function normalizeDoctorDashboardConfig(config) {
        const normalized = config && typeof config === 'object' ? { ...config } : getFallbackConfig();

        normalized.navigation = Array.isArray(normalized.navigation)
            ? normalized.navigation.map((item) => {
                if (!item || typeof item !== 'object') return item;
                if (String(item.label || '').trim().toLowerCase() === 'clients') {
                    return { ...item, label: 'Teams', href: 'clients.html' };
                }
                return item;
            })
            : getFallbackConfig().navigation;

        normalized.modules = Array.isArray(normalized.modules)
            ? normalized.modules.map((module) => {
                if (!module || typeof module !== 'object') return module;
                if (String(module.label || '').trim().toLowerCase() === 'clients') {
                    return {
                        ...module,
                        label: 'Teams',
                        href: 'clients.html',
                        description: 'Open teams and team-safe roster actions from the shared management page.',
                    };
                }
                return module;
            })
            : getFallbackConfig().modules;

        const hasAddClientNav = normalized.navigation.some((item) => String(item && item.label || '').trim().toLowerCase() === 'add client');
        if (!hasAddClientNav) {
            normalized.navigation = [...normalized.navigation, { label: 'Add Client', href: 'add-client.html' }];
        }

        const hasAddClientModule = normalized.modules.some((item) => String(item && item.label || '').trim().toLowerCase() === 'add client');
        if (!hasAddClientModule) {
            normalized.modules = [
                ...normalized.modules,
                {
                    label: 'Add Client',
                    href: 'add-client.html',
                    image: 'images/pexels-beyzahzah-89810429-15319038.jpg',
                    description: 'Start with basic information, then continue to Client Services and Open Nutrition.',
                },
            ];
        }

        return normalized;
    }

    function ensureDoctorDashboardAccess() {
        sessionStorage.removeItem('portalType');

        if (typeof window.isAuthenticated !== 'function' || typeof window.getCurrentAuthRole !== 'function') {
            return;
        }

        const role = String(window.getCurrentAuthRole() || '').toLowerCase();
        const canAccess = (role === 'doctor' || role === 'admin') &&
            typeof window.isDoctorAdminSessionActive === 'function' &&
            window.isDoctorAdminSessionActive() &&
            window.isAuthenticated();

        if (!canAccess) {
            window.location.replace(`doctor-auth.html?next=${encodeURIComponent(NEXT_PAGE)}`);
        }
    }

    function renderNavigation(items) {
        const navList = document.getElementById('doctorDashboardNavList');
        if (!navList) return;

        const itemsHtml = items.map((item) => `<li><a href="${item.href}">${item.label}</a></li>`).join('');
        navList.innerHTML = `<li><a href="javascript:history.back()" style="color: white;">← Back</a></li>${itemsHtml}`;
    }

    function renderModules(modules) {
        const reel = document.getElementById('doctorDashboardReel');
        if (!reel) return;

        reel.innerHTML = modules.map((module) => `
            <article>
                <a href="${module.href}" class="image featured"><img src="${module.image}" alt="${module.label}" /></a>
                <header>
                    <h3><a href="${module.href}">${module.label}</a></h3>
                </header>
                <p>${module.description}</p>
            </article>
        `).join('');
    }

    function applyDashboardCopy(config) {
        const titleEl = document.getElementById('dashboardQuickActionsTitle');
        const descriptionEl = document.getElementById('dashboardQuickActionsDescription');
        if (titleEl) titleEl.textContent = config.quick_actions_title || 'Quick Actions.';
        if (descriptionEl) descriptionEl.textContent = config.quick_actions_description || '';
    }

    async function loadDashboardConfig() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/public/dashboards/${DASHBOARD_KEY}`);
            const data = await response.json().catch(() => null);
            if (!response.ok || !data || data.status === 'error') {
                throw new Error((data && data.detail) || 'Failed to load dashboard configuration.');
            }
            return data;
        } catch (_) {
            return getFallbackConfig();
        }
    }

    async function initDoctorDashboard() {
        ensureDoctorDashboardAccess();
        const config = normalizeDoctorDashboardConfig(await loadDashboardConfig());
        applyDashboardCopy(config);
        renderNavigation(config.navigation || []);
        renderModules(config.modules || []);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDoctorDashboard);
    } else {
        initDoctorDashboard();
    }
})();