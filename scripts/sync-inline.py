"""Sync maintained CSS/JS into the standalone HTML, preserving embedded images."""
from pathlib import Path
import re
root = Path(__file__).resolve().parents[1] / 'dist'
page = root / 'index.html'
html = page.read_text()
sources = {
    'style': (root / 'style.css').read_text(),
    'script': (root / 'script.js').read_text() + '\n' + (root / 'construction.js').read_text(),
}
for tag, source in sources.items():
    html, count = re.subn(
        rf'<{tag}>.*?</{tag}>',
        lambda _: f'<{tag}>\n{source}\n</{tag}>',
        html, flags=re.S,
    )
    assert count == 1, f'Expected one inline {tag}'
page.write_text(html)
