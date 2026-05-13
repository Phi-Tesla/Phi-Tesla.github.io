#!/usr/bin/env python3
"""
MD → JSON converter for the blog.
Reads posts/*.md, converts markdown to HTML (preserving math/mermaid placeholders),
and writes data/posts_content.json relative to the project root.
"""

import json
import re
import os
import tkinter as tk
from tkinter import ttk, filedialog, messagebox


def parse_frontmatter(text):
    match = re.match(r'^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$', text)
    if not match:
        return {}, text
    meta = {}
    for line in match.group(1).split('\n'):
        idx = line.find(':')
        if idx == -1:
            continue
        key = line[:idx].strip()
        value = line[idx+1:].strip().strip('"\'')
        meta[key] = value
    return meta, match.group(2)


def md_to_html(content):
    """Minimal markdown→HTML: headings, bold, italic, code, paragraphs, links."""
    lines = content.split('\n')
    html_lines = []
    in_code = False
    code_buf = []
    code_lang = ''
    in_list = False

    for line in lines:
        # Fenced code block
        if line.startswith('```'):
            if not in_code:
                in_code = True
                code_lang = line[3:].strip()
                code_buf = []
            else:
                in_code = False
                code_text = '\n'.join(code_buf)
                lang_class = f' class="language-{code_lang}"' if code_lang else ''
                html_lines.append(f'<pre><code{lang_class}>{code_text}</code></pre>')
                code_lang = ''
            continue
        if in_code:
            code_buf.append(line)
            continue

        # Close list if needed
        if in_list and not line.startswith('- ') and not line.startswith('* '):
            html_lines.append('</ul>')
            in_list = False

        # Headings
        m = re.match(r'^(#{1,6})\s+(.*)', line)
        if m:
            level = len(m.group(1))
            html_lines.append(f'<h{level}>{inline(m.group(2))}</h{level}>')
            continue

        # Unordered list
        m = re.match(r'^[-*]\s+(.*)', line)
        if m:
            if not in_list:
                html_lines.append('<ul>')
                in_list = True
            html_lines.append(f'<li>{inline(m.group(1))}</li>')
            continue

        # Blank line → paragraph break
        if line.strip() == '':
            html_lines.append('')
            continue

        html_lines.append(f'<p>{inline(line)}</p>')

    if in_list:
        html_lines.append('</ul>')

    return '\n'.join(html_lines)


def inline(text):
    # Bold
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    # Italic
    text = re.sub(r'\*(.+?)\*', r'<em>\1</em>', text)
    # Inline code
    text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
    # Links
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', text)
    return text


def convert_md(md_text):
    """Return {en: html, cn: html} preserving math/mermaid as-is."""
    _, body = parse_frontmatter(md_text)

    parts = body.split('<!-- cn -->')
    en_body = parts[0]
    cn_body = parts[1] if len(parts) > 1 else parts[0]

    return {
        'en': md_to_html(en_body.strip()),
        'cn': md_to_html(cn_body.strip()),
    }


def run_conversion(project_root, log):
    posts_dir = os.path.join(project_root, 'posts')
    out_file = os.path.join(project_root, 'data', 'posts_content.json')

    if not os.path.isdir(posts_dir):
        log(f'ERROR: posts/ directory not found at {posts_dir}')
        return

    result = {}
    md_files = [f for f in os.listdir(posts_dir) if f.endswith('.md')]
    if not md_files:
        log('No .md files found in posts/')
        return

    for fname in md_files:
        slug = fname[:-3]
        path = os.path.join(posts_dir, fname)
        with open(path, encoding='utf-8') as f:
            text = f.read()
        result[slug] = convert_md(text)
        log(f'Converted: {fname}')

    os.makedirs(os.path.dirname(out_file), exist_ok=True)
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    log(f'\nWrote {len(result)} post(s) to data/posts_content.json')


# ── GUI ──────────────────────────────────────────────────────────────────────

class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title('MD → JSON Converter')
        self.resizable(False, False)
        self._build()

    def _build(self):
        pad = {'padx': 10, 'pady': 5}

        # Project root row
        row = ttk.Frame(self)
        row.pack(fill='x', **pad)
        ttk.Label(row, text='Project root:').pack(side='left')
        self.root_var = tk.StringVar(value=os.path.abspath(
            os.path.join(os.path.dirname(__file__), '..', '..')
        ))
        ttk.Entry(row, textvariable=self.root_var, width=50).pack(side='left', padx=5)
        ttk.Button(row, text='Browse', command=self._browse).pack(side='left')

        # Convert button
        ttk.Button(self, text='Convert', command=self._convert).pack(**pad)

        # Log area
        self.log_text = tk.Text(self, width=70, height=12, state='disabled')
        self.log_text.pack(**pad)

    def _browse(self):
        d = filedialog.askdirectory(initialdir=self.root_var.get())
        if d:
            self.root_var.set(d)

    def _log(self, msg):
        self.log_text.config(state='normal')
        self.log_text.insert('end', msg + '\n')
        self.log_text.see('end')
        self.log_text.config(state='disabled')

    def _convert(self):
        self.log_text.config(state='normal')
        self.log_text.delete('1.0', 'end')
        self.log_text.config(state='disabled')
        try:
            run_conversion(self.root_var.get(), self._log)
            messagebox.showinfo('Done', 'Conversion complete.')
        except Exception as e:
            self._log(f'ERROR: {e}')
            messagebox.showerror('Error', str(e))


if __name__ == '__main__':
    App().mainloop()
