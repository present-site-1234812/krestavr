"""Check standalone assets and references before publishing the static site."""
from html.parser import HTMLParser
from pathlib import Path
import base64
import re


class References(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.targets = []
        self.images = []
        self.resources = []

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        for key in ("aria-labelledby", "aria-describedby", "aria-controls", "for"):
            self.targets.extend(attrs.get(key, "").split())
        href = attrs.get("href", "")
        if href.startswith("#") and href != "#":
            self.targets.append(href[1:])
        if tag == "img" and attrs.get("src"):
            self.images.append(attrs["src"])
        if tag in ("script", "img", "link"):
            resource = attrs.get("src", attrs.get("href", ""))
            if resource:
                self.resources.append(resource)


root = Path(__file__).resolve().parents[1] / "dist"
html = (root / "index.html").read_text()
expected = {
    "style": (root / "style.css").read_text(),
    "script": (root / "script.js").read_text() + "\n" + (root / "construction.js").read_text(),
}
for tag, source in expected.items():
    blocks = re.findall(rf"<{tag}>\n(.*?)\n</{tag}>", html, re.S)
    assert blocks == [source], f"Inline {tag} is out of sync"

refs = References()
refs.feed(html)
assert len(refs.ids) == len(set(refs.ids)), "Duplicate HTML IDs"
assert not set(refs.targets) - set(refs.ids), "Broken fragment or accessibility reference"
assert len(refs.images) >= 3, "Missing architectural images"
for src in refs.images:
    assert src.startswith("data:image/png;base64,"), "Image must stay embedded"
    assert base64.b64decode(src.split(",", 1)[1], validate=True).startswith(b"\x89PNG\r\n\x1a\n")
assert all(value.startswith("data:") for value in refs.resources), "Unexpected external resource"
assert "form-action 'none'" in html and "connect-src 'none'" in html
assert "SIL OPEN FONT LICENSE" in html, "Missing embedded font license"
assert not any(path.is_symlink() for path in root.rglob("*")), "Pages artifact contains a symlink"
print("Site validation passed: inline sources, assets, links, accessibility references and CSP.")
