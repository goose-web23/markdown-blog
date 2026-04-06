import { addRoute, initRouter, navigate } from './router.js';
window.navigate = navigate;
import { parseMarkdown } from './parser.js';
let posts = []; // список статей из meta.json
// Загружаем мета-данные статей при старте
async function loadMeta() {
    const res = await fetch('posts/meta.json');
    posts = await res.json();
}
function getReadingTime(mdText) {
    const textWithoutCode = mdText.replace(/```[\s\S]*?```/g, '');
    const words = textWithoutCode.match(/[\p{L}\p{N}]+/gu) || [];
    const wordCount = words.length;
    const minutes = Math.max(1, Math.ceil(wordCount / 200));
    return minutes;
}
function renderHome(app) {
    app.innerHTML = `
        <section class="posts-grid">
            ${posts.map(post => `
                <article class="card">
                    <div class="card-header">
                        <h2><a href="#/post/${post.id}">${post.title}</a></h2>
                        ${renderFavoriteButton(post.id, false)}
                    </div>
                    <time>${formatDate(post.date)}</time>
                    <p>${post.description}</p>
                    <a href="#/post/${post.id}" class="btn">Читать →</a>
                </article>
            `).join('')}
        </section>
    `;

    posts.forEach(post => {
        bindFavoriteButton(post.id, false);
    });
}

async function renderPost(app, id) {
    const post = posts.find(p => p.id === Number(id));
    if (!post) { app.innerHTML = '<p>Статья не найдена</p>'; return; }
    app.innerHTML = '<p class="loading">Загрузка...</p>';

    const res = await fetch(post.file);
    const md = await res.text();

    const { html, tocItems } = parseMarkdown(md);
    const readingTime = getReadingTime(md);

    let tocHtml = '';
    if (tocItems.length >= 2) {
        tocHtml = `
            <div class="table-of-contents">
                <h3> Содержание</h3>
                <ul>
                    ${tocItems.map(item => `
                        <li><a href="#${item.id}" class="toc-link">${item.title}</a></li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    app.innerHTML = `
        <article class="post">
            <button onclick="navigate('#/')" class="back-btn">← Назад</button>
            <div class="post-meta">
                <time>${formatDate(post.date)}</time>
                <span class="reading-time">${readingTime} мин чтения</span>
                ${renderFavoriteButton(post.id, true)}
            </div>
            ${tocHtml}
            <div class="post-content">
                ${html}
            </div>
        </article>
    `;
    bindFavoriteButton(post.id, true);
    document.querySelectorAll('.toc-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
}
async function init() {
    await loadMeta();
    addRoute('#/', (app) => renderHome(app));
    addRoute('#/about', (app) => { app.innerHTML = '<h1>О блоге</h1>'; });
    addRoute('#/post/:id', (app, id) => renderPost(app, id));
    initRouter();
    updateFavoritesCounter();
}

const FAVORITES_KEY = 'blog_favorites';

function getFavorites() {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (!stored) return [];
    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

function saveFavorites(favorites) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

function isFavorite(postId) {
    const favorites = getFavorites();
    return favorites.includes(postId);
}

function addFavorite(postId) {
    const favorites = getFavorites();
    if (!favorites.includes(postId)) {
        favorites.push(postId);
        saveFavorites(favorites);
    }
    updateFavoritesCounter();
}

function removeFavorite(postId) {
    let favorites = getFavorites();
    favorites = favorites.filter(id => id !== postId);
    saveFavorites(favorites);
    updateFavoritesCounter();
}

function toggleFavorite(postId) {
    if (isFavorite(postId)) {
        removeFavorite(postId);
    } else {
        addFavorite(postId);
    }
}

function updateFavoritesCounter() {
    const counterSpan = document.getElementById('favCount');
    if (counterSpan) {
        counterSpan.textContent = getFavorites().length;
    }
}


function renderFavoriteButton(postId, isOnPostPage = false) {
    const fav = isFavorite(postId);
    const icon = fav ? '⭐' : '☆';
    const text = fav ? 'В избранном' : 'В избранное';
    const buttonId = `fav-btn-${postId}`;

    return `
        <button id="${buttonId}" class="fav-btn ${fav ? 'active' : ''}" data-id="${postId}">
            ${icon} ${isOnPostPage ? text : ''}
        </button>
    `;
}


function bindFavoriteButton(postId, onPostPage = false) {
    const btn = document.getElementById(`fav-btn-${postId}`);
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(postId);


            const isNowFav = isFavorite(postId);
            btn.classList.toggle('active', isNowFav);

            if (onPostPage) {
                btn.innerHTML = isNowFav ? '⭐ В избранном' : '☆ В избранное';
            } else {
                btn.innerHTML = isNowFav ? '⭐' : '☆';
            }

            if (!onPostPage && window.location.hash === '#/') {
                renderHome(document.getElementById('app'));
            }
        });
    }
}

init();
