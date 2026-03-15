(function () {
    function normalizePageName(rawPath) {
        const path = String(rawPath || '').toLowerCase();
        const parts = path.split('/');
        const fileName = parts[parts.length - 1] || '';
        return fileName || 'index.html';
    }

    function getCurrentPage() {
        const pathname = window.location.pathname || '';
        if (pathname.endsWith('/')) {
            return 'index.html';
        }
        return normalizePageName(pathname);
    }

    function applyActiveClass(link) {
        link.classList.add('font-semibold');
        link.classList.add('accent-text');
        link.classList.add('border-b-2');
        link.classList.add('accent-border');
        link.classList.remove('text-gray-600');
        link.classList.remove('text-black');
    }

    function highlightActiveDashboardNav() {
        const currentPage = getCurrentPage();
        const links = document.querySelectorAll('nav a[href]');

        links.forEach(function (link) {
            const href = (link.getAttribute('href') || '').split('?')[0].split('#')[0].toLowerCase();
            const linkPage = normalizePageName(href);
            if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
                return;
            }
            if (linkPage === currentPage) {
                applyActiveClass(link);
            }
        });
    }

    window.highlightActiveDashboardNav = highlightActiveDashboardNav;
})();
