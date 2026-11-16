"""Sync maintained CSS/JS into the standalone HTML, preserving embedded images."""
from pathlib import Path
import re
root = Path(__file__).resolve().parents[1] / 'dist'
page = root / 'index.html'
html = page.read_text()
html, count = re.subn(
    r'<script data-loader>.*?</script>',
    lambda _: f'<script data-loader>\n{(root / "loader.js").read_text()}\n</script>',
    html, flags=re.S,
)
assert count == 1, 'Expected one inline loader script'
sources = {
    'style': (root / 'style.css').read_text(),
    'script': (root / 'script.js').read_text() + '\n' + (root / 'construction.js').read_text() + '\n' + (root / 'text-build.js').read_text() + '\n' + (root / 'services-blueprint.js').read_text(),
}
for tag, source in sources.items():
    html, count = re.subn(
        rf'<{tag}>.*?</{tag}>',
        lambda _: f'<{tag}>\n{source}\n</{tag}>',
        html, flags=re.S,
    )
    assert count == 1, f'Expected one inline {tag}'
page.write_text(html)
