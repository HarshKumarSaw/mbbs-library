#!/usr/bin/env python3
"""
MBBS Library Production Minifier
Minifies CSS and JavaScript assets while preserving full readable source files.
"""
import os
import sys

def main():
    repo_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    css_files = [
        ("style.css", "style.min.css"),
        ("timetable.css", "timetable.min.css")
    ]
    js_files = [
        ("app.js", "app.min.js"),
        ("timetable.js", "timetable.min.js")
    ]

    try:
        import rcssmin
        import rjsmin
    except ImportError:
        print("rcssmin or rjsmin not installed; skipping minification.")
        return 0

    for src_name, dist_name in css_files:
        src = os.path.join(repo_dir, "css", src_name)
        dist = os.path.join(repo_dir, "css", dist_name)
        if os.path.exists(src):
            with open(src, "r", encoding="utf-8") as f:
                raw_css = f.read()
            min_css = rcssmin.cssmin(raw_css)
            with open(dist, "w", encoding="utf-8") as f:
                f.write(min_css)
            print(f"Minified CSS ({src_name}): {len(raw_css):,} B -> {len(min_css):,} B ({100 - len(min_css)*100/len(raw_css):.1f}% saved)")

    for src_name, dist_name in js_files:
        src = os.path.join(repo_dir, "js", src_name)
        dist = os.path.join(repo_dir, "js", dist_name)
        if os.path.exists(src):
            with open(src, "r", encoding="utf-8") as f:
                raw_js = f.read()
            min_js = rjsmin.jsmin(raw_js)
            with open(dist, "w", encoding="utf-8") as f:
                f.write(min_js)
            print(f"Minified JS  ({src_name}): {len(raw_js):,} B -> {len(min_js):,} B ({100 - len(min_js)*100/len(raw_js):.1f}% saved)")

    return 0

if __name__ == "__main__":
    sys.exit(main())
