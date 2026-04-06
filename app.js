import { addRoute, initRouter, navigate } from './router.js';
import { parseMarkdown } from './parser.js';
let posts = []; // список статей из meta.json
// Загружаем мета-данные статей при старте
async function loadMeta() {
    const res = await fetch('posts/meta.json');
    posts = await res.json();
}
function renderHome(app) {
    app.innerHTML = `
<section class="posts-grid">
${posts.map(post => `
<article class="card">
<h2><a href="#/post/${post.id}">${post.title}</a></h2>
<time>${formatDate(post.date)}</time>
<p>${post.description}</p>
<a href="#/post/${post.id}" class="btn">Читать →</a>
</article>
`).join('')}
</section>
`;
}
async function renderPost(app, id) {
    const post = posts.find(p => p.id === Number(id));
    if (!post) { app.innerHTML = '<p>Статья не найдена</p>'; return; }
    app.innerHTML = '<p class="loading">Загрузка...</p>';
    const res = await fetch(post.file);
    const md = await res.text();
    const html = parseMarkdown(md);
    app.innerHTML = `
<article class="post">
<button onclick="navigate('#/')" class="back-btn">← Назад</button>
<time>${formatDate(post.date)}</time>
${html}
</article>
`;
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
}
init();
