import re
from pathlib import Path
import htmlmin
import rjsmin

html_path = Path("index.html")
js_path = Path("main.js")

html = html_path.read_text(encoding="utf-8")
js = js_path.read_text(encoding="utf-8")

html = re.sub(
    r'<script\s+src=["\']main\.js["\']\s*>\s*</script>',
    f"<script>{js}</script>",
    html,
    flags=re.IGNORECASE,
)

def minify_script_tag(match):
    content = match.group(1)
    minified = rjsmin.jsmin(content)
    return f"<script>{minified}</script>"

html = re.sub(
    r"<script>(.*?)</script>",
    minify_script_tag,
    html,
    flags=re.DOTALL | re.IGNORECASE,
)

minified_html = htmlmin.minify(
    html,
    remove_comments=True,
    remove_empty_space=True,
    reduce_boolean_attributes=True,
    remove_all_empty_space=True,
)

Path("ordle.html").write_text(minified_html, encoding="utf-8")
print("Saved as ordle.html")
