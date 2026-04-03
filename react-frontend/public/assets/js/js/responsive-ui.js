(function () {
    'use strict';

    function createMobileMenuToggle(nav, linksContainer) {
        if (!nav || !linksContainer) return;
        if (nav.querySelector('.mobile-menu-btn')) return;

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mobile-menu-btn';
        btn.setAttribute('aria-label', 'Toggle navigation menu');
        btn.setAttribute('aria-expanded', 'false');
        btn.innerHTML = '&#9776;';

        btn.addEventListener('click', function () {
            var isOpen = linksContainer.classList.toggle('mobile-open');
            btn.setAttribute('aria-expanded', String(isOpen));
            btn.innerHTML = isOpen ? '&#10005;' : '&#9776;';
        });

        nav.appendChild(btn);
    }

    function setupTopNavMenus() {
        var navs = document.querySelectorAll('.top-nav, .detail-nav');
        navs.forEach(function (nav) {
            if (nav.hasAttribute('data-no-auto-menu')) return;
            var links = nav.querySelector('.top-nav-links, .nav-right');
            if (!links) return;
            createMobileMenuToggle(nav, links);
        });

        window.addEventListener('resize', function () {
            if (window.innerWidth > 767) {
                document.querySelectorAll('.top-nav-links.mobile-open, .nav-right.mobile-open').forEach(function (links) {
                    links.classList.remove('mobile-open');
                });
                document.querySelectorAll('.mobile-menu-btn').forEach(function (btn) {
                    btn.setAttribute('aria-expanded', 'false');
                    btn.innerHTML = '&#9776;';
                });
            }
        });
    }

    function setupResponsiveTables() {
        var tables = document.querySelectorAll('table');
        tables.forEach(function (table) {
            var parent = table.parentElement;
            if (!parent) return;
            if (parent.classList.contains('responsive-table-container')) return;

            var wrapper = document.createElement('div');
            wrapper.className = 'responsive-table-container';
            parent.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        });
    }

    function setupClientHomeMenuSync() {
        var toggle = document.getElementById('client-home-nav-toggle');
        var links = document.getElementById('client-home-nav-links');
        if (!toggle || !links) return;

        function closeMenu() {
            if (!links.classList.contains('hidden')) {
                links.classList.add('hidden');
            }
            toggle.setAttribute('aria-expanded', 'false');
            toggle.innerHTML = '&#9776;';
        }

        window.addEventListener('resize', function () {
            if (window.innerWidth >= 768) {
                closeMenu();
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        setupTopNavMenus();
        setupResponsiveTables();
        setupClientHomeMenuSync();
    });
})();
