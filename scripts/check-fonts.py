from pathlib import Path
import struct
import re
import json
import sys

root = Path(__file__).resolve().parent.parent
def u16(data, offset): return struct.unpack_from('>H', data, offset)[0]
def u32(data, offset): return struct.unpack_from('>I', data, offset)[0]

def glyph_checker(path):
    data = path.read_bytes()
    tables = {data[12+i*16:16+i*16]: u32(data, 20+i*16) for i in range(u16(data, 4))}
    cmap = tables[b'cmap']
    subtables = []
    for i in range(u16(data, cmap+2)):
        record = cmap+4+i*8
        platform, encoding = u16(data, record), u16(data, record+2)
        offset = cmap + u32(data, record+4)
        if platform in (0, 3) and u16(data, offset) in (4, 12):
            subtables.append(offset)
    def has(cp):
        for offset in subtables:
            fmt = u16(data, offset)
            if fmt == 12:
                for i in range(u32(data, offset+12)):
                    start, end, glyph = struct.unpack_from('>III', data, offset+16+i*12)
                    if start <= cp <= end and glyph+cp-start:
                        return True
            elif cp <= 0xffff:
                count = u16(data, offset+6)//2
                ends = offset+14
                starts = ends+2*count+2
                deltas = starts+2*count
                ranges = deltas+2*count
                for i in range(count):
                    start, end = u16(data, starts+2*i), u16(data, ends+2*i)
                    if start <= cp <= end:
                        delta = u16(data, deltas+2*i)
                        span = u16(data, ranges+2*i)
                        glyph = (cp+delta)&0xffff if not span else u16(data, ranges+2*i+span+2*(cp-start))
                        if span and glyph: glyph = (glyph+delta)&0xffff
                        if glyph: return True
                        break
        return False
    return has

chars = set('ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯư') | set(map(chr, range(0x1ea0, 0x1efa)))

if __name__ == '__main__':
    failed = []
    for font in sorted((root/'docs/assets/fonts').glob('*.ttf')):
        has = glyph_checker(font)
        missing = ''.join(sorted(char for char in chars if not has(ord(char))))
        print(json.dumps({'font': font.name, 'characters_tested': len(chars), 'missing_count': len(missing)}))
        if missing: failed.append(font.name)
    if failed:
        raise SystemExit('Vietnamese glyphs missing in: '+', '.join(failed))
