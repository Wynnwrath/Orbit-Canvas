export function highlightCode(code: string): string {
  if (!code) return '';

  // 1. Escape HTML special characters
  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 2. Tokenize line by line to handle comments safely
  const lines = escaped.split('\n');
  const highlightedLines = lines.map(line => {
    let codePart = line;
    let commentPart = '';
    const commentIdx = line.indexOf('//');
    if (commentIdx !== -1) {
      codePart = line.substring(0, commentIdx);
      commentPart = line.substring(commentIdx);
    }

    // Highlight strings ("...", '...', `...`)
    codePart = codePart.replace(/(["'`])(.*?)\1/g, '<span class="s">$1$2$1</span>');

    // Highlight TS/JS keywords
    codePart = codePart.replace(/\b(const|let|var|function|return|class|import|export|from|if|else|for|while|async|await|default|new|this|typeof|void|in|of)\b/g, '<span class="k">$1</span>');

    // Highlight types & common React terms
    codePart = codePart.replace(/\b(string|number|boolean|any|void|Promise|Record|Array|React|FC|useState|useEffect|useRef|useCallback)\b/g, '<span class="t">$1</span>');

    // Highlight numeric literals
    codePart = codePart.replace(/\b(\d+)\b/g, '<span class="n">$1</span>');

    if (commentPart) {
      return codePart + `<span class="c">${commentPart}</span>`;
    }
    return codePart;
  });

  return highlightedLines.join('\n');
}
