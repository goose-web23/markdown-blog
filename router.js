// router.js
const routes = {};
export function addRoute(pattern, handler) {
    routes[pattern] = handler;
}
export function navigate(hash) {
    window.location.hash = hash;
}
export function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
}
function handleRoute() {
    const hash = window.location.hash || '#/';
    const app = document.getElementById('app');

    if (routes[hash]) {
        routes[hash](app);
        updateActiveNav(hash);
        return;
    }

    for (const pattern in routes) {
        const regex = new RegExp(
            '^' + pattern.replace(/:([\w]+)/g, '([^/]+)') + '$'
        );
        const match = hash.match(regex);
        if (match) {
            routes[pattern](app, match[1]);
            return;
        }
    }

    app.innerHTML = '<h2>404 — Страница не найдена</h2>';
}
function updateActiveNav(hash) {
    document.querySelectorAll('[data-nav]').forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('href') === hash);
    });
}