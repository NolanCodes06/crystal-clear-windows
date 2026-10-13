"""Builds index.html from the files in src/ and build/.

Run from anywhere:  python3 build.py
Only needed if you edit files in src/. For prices and links, editing the
SITE SETTINGS block in index.html directly also works.
"""
import os
import urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'src')
DATA = os.path.join(HERE, 'build')


def read(folder, name):
    with open(os.path.join(folder, name), encoding='utf-8') as f:
        return f.read()


def data_uri(svg):
    return 'data:image/svg+xml,' + urllib.parse.quote(svg, safe=" =:/,'")


zips = read(DATA, 'zips.txt')                 # San Antonio area ZIP centers for travel pricing
cwt_path = read(DATA, 'cwt_path.txt').strip()  # CWT logo, traced from the flyer
cwt_vb = read(DATA, 'cwt_vb.txt').strip()
cwt_w = cwt_vb.split()[2]
brush_d = read(DATA, 'brush_d.txt').strip()    # blue paint-stroke shape

brush_svg = ("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 100' preserveAspectRatio='none'>"
             "<path fill='#000' fill-rule='evenodd' d='%s'/></svg>" % brush_d)
fav_svg = ("<svg xmlns='http://www.w3.org/2000/svg' viewBox='-14 -38 176 176'>"
           "<rect x='-14' y='-38' width='176' height='176' rx='32' fill='#004A8E'/>"
           "<path fill='#fff' d='%s'/></svg>" % cwt_path)

html = (read(SRC, 'head.html') + '<style>\n' + read(SRC, 'style.css') + '</style>\n' +
        read(SRC, 'body.html') + read(SRC, 'config.js') +
        read(SRC, 'app.js').replace('__ZIPS__', zips) + read(SRC, 'admin.js'))
html = (html.replace('__BRUSH_URI__', data_uri(brush_svg))
            .replace('__FAVICON__', data_uri(fav_svg))
            .replace('__CWT_PATH__', cwt_path)
            .replace('__CWT_VB__', cwt_vb)
            .replace('__CWT_W__', cwt_w)
            .replace('__BRUSH_D__', brush_d))

left = [t for t in ['__ZIPS__', '__BRUSH', '__CWT', '__FAVICON__'] if t in html]
assert not left, 'Unfilled placeholders: %s' % left

with open(os.path.join(HERE, 'index.html'), 'w', encoding='utf-8') as f:
    f.write(html)
print('Built index.html (%d bytes)' % len(html))
