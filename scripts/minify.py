#!/usr/bin/env python3
"""
MBBS Library Production Minifier
Minifies CSS and JavaScript assets while preserving full readable source files.
"""
import os
import sys

def main():
    repo_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    css_src = os.path.join(repo_dir, "css", "style.css")
    css_dist = os.path.join(repo_dir, "css", "style.min.css")
    js_src = os.path.join(repo_dir, "js", "app.js")
    js_dist = os.path.join(repo_dir, "js", "app.min.js")

    try:
        import rcssmin
        import rjsmin
    except ImportError:
        print("rcssmin or rjsmin not installed; skipping minification.")
        return 0

    if os.path.exists(css_src):
        with open(css_src, "r", encoding="utf-8") as f:
            raw_css = f.read()
        min_css = rcssmin.cssmin(raw_css)
        with open(css_dist, "w", encoding="utf-8") as f:
            f.write(min_css)
        print(f"Minified CSS: {len(raw_css):,} B -> {len(min_css):,} B ({100 - len(min_css)*100/len(raw_css):.1f}% saved)")

    if os.path.exists(js_src):
        with open(js_src, "r", encoding="utf-8") as f:
            raw_js = f.read()
        min_js = rjsmin.jsmin(raw_js)
        with open(js_dist, "w", encoding="utf-8") as f:
            f.write(min_js)
        print(f"Minified JS:  {len(raw_js):,} B -> {len(min_js):,} B ({100 - len(min_js)*100/len(raw_js):.1f}% saved)")

    return 0

if __name__ == "__main__":
    sys.exit(main())
