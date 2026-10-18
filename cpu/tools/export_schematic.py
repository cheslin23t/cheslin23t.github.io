"""Decode Sponge v3 NBT with the standard library; export exact block positions."""
import base64, gzip, hashlib, json, struct
from collections import Counter
from pathlib import Path
import sys

class NBT:
    def __init__(self, data): self.data, self.pos = data, 0
    def read(self, n):
        result = self.data[self.pos:self.pos+n]
        if len(result) != n: raise ValueError('Truncated NBT')
        self.pos += n
        return result
    def unpack(self, fmt): return struct.unpack('>'+fmt, self.read(struct.calcsize('>'+fmt)))[0]
    def string(self): return self.read(self.unpack('H')).decode('utf-8')
    def payload(self, tag):
        if tag in (1,2,3,4,5,6): return self.unpack({1:'b',2:'h',3:'i',4:'q',5:'f',6:'d'}[tag])
        if tag == 7: return self.read(self.unpack('i'))
        if tag == 8: return self.string()
        if tag == 9:
            kind, size = self.unpack('B'), self.unpack('i')
            return [self.payload(kind) for _ in range(size)]
        if tag == 10:
            result = {}
            while (kind := self.unpack('B')) != 0:
                name = self.string(); result[name] = self.payload(kind)
            return result
        if tag in (11,12): return [self.unpack('i' if tag == 11 else 'q') for _ in range(self.unpack('i'))]
        raise ValueError(f'Unknown NBT tag {tag}')

def export(source, destination):
    raw = source.read_bytes()
    checksum = hashlib.sha256(raw).hexdigest()
    assert checksum == '7485daa252e126b7ca49d26235e1d47318c78b09fdf3d986da77560b7daac5c9'
    reader = NBT(gzip.decompress(raw)); kind = reader.unpack('B'); name = reader.string(); root = reader.payload(kind)
    schematic = root.get('Schematic', root)
    width,height,length = [schematic[key] for key in ('Width','Height','Length')]
    palette = schematic['Blocks']['Palette']
    names = [None]*(max(palette.values())+1)
    for name, index in palette.items(): names[index] = name
    blocks, counts = [], Counter()
    value = shift = index = 0
    for byte in schematic['Blocks']['Data']:
        value |= (byte & 127) << shift
        if byte & 128: shift += 7; continue
        assert value < len(names)
        name = names[value]; counts[name.split('[')[0]] += 1
        if name not in ('minecraft:air', 'minecraft:cave_air', 'minecraft:void_air'):
            x = index % width; y = index // (width*length); z = (index // width) % length
            blocks.append([x,y,z,value])
        index += 1; value = shift = 0
    assert index == width*height*length and shift == 0
    assert len(blocks) == 32543
    entities = schematic['Blocks'].get('BlockEntities',[])
    signs = [entity for entity in entities if 'sign' in entity.get('Id','')]
    result = dict(source='8bCPU-repaired-v1.schem', commit='1851180869f97ff15ae081e659b1f57ea1209675',sha256=checksum,dimensions=[width,height,length],worldMinimum=[256,72,-4],palette=names,blocks=blocks,signs=signs)
    destination.write_text(json.dumps(result,separators=(',',':')))
    print(json.dumps({'dimensions':result['dimensions'],'blocks':len(blocks),'block_entities':len(entities),'signs':signs},indent=2))
if __name__ == '__main__': export(Path(sys.argv[1]),Path(sys.argv[2]))
