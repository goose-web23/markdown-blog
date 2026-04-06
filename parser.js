export function parseMarkdown(md) {
    let html = md;
    const tocItems = [];

    html = html.replace(/```(\w*)?\n([\s\S]*?)```/gm, function (_, lang, code) {
        const cls = lang ? ` class="language-${lang}"` : '';
        return `<pre><code${cls}>${escapeHtml(code.trim())}</code></pre>`;
    });

    html = html.replace(/^---$/gm, '<hr>');

    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    let h2Counter = 0;
    html = html.replace(/^## (.+)$/gm, function (_, title) {
        const id = `section-${h2Counter++}`;
        const cleanTitle = title.replace(/<[^>]*>/g, '');
        tocItems.push({ id, title: cleanTitle });
        return `<h2 id="${id}">${title}</h2>`;
    });

    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');

    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    html = html.replace(/`(.+?)`/g, '<code>$1</code>');

    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>');

    html = html.replace(/((?:^- .+\n?)+)/gm, function (block) {
        const items = block.trim().split('\n').map(function (line) {
            return '<li>' + line.replace(/^- /, '') + '</li>';
        }).join('');
        return '<ul>' + items + '</ul>';
    });

    html = html.replace(/^(?!<[hup]).+$/gm, function (line) {
        if (line.trim() === '') return '';
        return '<p>' + line + '</p>';
    });

    return { html, tocItems };
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}