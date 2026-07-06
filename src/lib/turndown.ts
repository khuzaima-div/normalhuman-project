import TurndownService from 'turndown';

export const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**',
    bulletListMarker: '-',
    linkStyle: 'inlined',
});

// Remove link tags smoothly but keep textual inner content
turndown.addRule('linkRemover', {
    filter: 'a',
    replacement: (content) => content,
});

// Strip out active style layers
turndown.addRule('styleRemover', {
    filter: 'style',
    replacement: () => '',
});

// Guard against executable client scripts inside parsing process
turndown.addRule('scriptRemover', {
    filter: 'script',
    replacement: () => '',
});

// Clear layout images to protect context pipeline sizes
turndown.addRule('imageRemover', {
    filter: 'img',
    replacement: () => '',
});