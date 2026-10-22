#!/usr/bin/env python3
"""Cuts the site's web fonts from the Martian Grotesk variable font.

Martian Grotesk by Roman Shamin / Evil Martians, SIL Open Font License 1.1:
https://github.com/evilmartians/grotesk (release v1.0.0: variable/MartianGrotesk-VFVF.woff2)

    python3 -m pip install fonttools brotli
    python3 scripts/build-fonts.py <MartianGrotesk-VFVF.woff2> [display width]

writes fonts/martian-grotesk-{lat,cyr}.woff2, the text cut at the normal width, and
fonts/martian-display-{lat,cyr}.woff2, the name and headings a little wider (112.5 unless
given). Each keeps weight variable from 300 to 700 (the weights the site uses) and holds
only the characters of its script, the same ranges as the stylesheet's unicode-range.
"""
import sys
from io import BytesIO
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
WEIGHTS = (300, 700)
RANGES = {
    'lat': 'U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2190-2193,U+2212',
    'cyr': 'U+0400-045F,U+0490-0491,U+2116',
}


def codepoints(spec):
    out = []
    for part in spec.split(','):
        lo, _, hi = part.removeprefix('U+').partition('-')
        out.extend(range(int(lo, 16), int(hi or lo, 16) + 1))
    return out


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = Path(sys.argv[1])
    cuts = {'grotesk': 100.0, 'display': float(sys.argv[2]) if len(sys.argv) > 2 else 112.5}
    for cut, width in cuts.items():
        font = instancer.instantiateVariableFont(TTFont(src), {'wdth': width, 'wght': WEIGHTS})
        buf = BytesIO()
        font.flavor = None
        font.save(buf)
        for script, spec in RANGES.items():
            part = TTFont(BytesIO(buf.getvalue()))
            options = subset.Options()
            options.layout_features = ['*']
            options.name_IDs = ['*']
            options.notdef_outline = True
            sub = subset.Subsetter(options)
            sub.populate(unicodes=codepoints(spec))
            sub.subset(part)
            part.flavor = 'woff2'
            out = ROOT / 'fonts' / f'martian-{cut}-{script}.woff2'
            part.save(out)
            print(f'{out.relative_to(ROOT)}  wdth {width:g}  {len(part.getBestCmap())} chars  {out.stat().st_size / 1024:.1f} KB')


if __name__ == '__main__':
    main()
