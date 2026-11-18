# Remplace une image d'un GLB par un autre fichier (même format), sans
# toucher au reste (maillage Draco, squelette, animations, matériaux).
# Usage : python tools/remplacer-image-glb.py <glb> <nom de l'image> <fichier> [sortie]
import json
import struct
import sys


def lire(chemin):
    d = open(chemin, 'rb').read()
    assert d[:4] == b'glTF'
    lj = struct.unpack('<I', d[12:16])[0]
    j = json.loads(d[20:20 + lj])
    lb = struct.unpack('<I', d[20 + lj:24 + lj])[0]
    b = d[28 + lj:28 + lj + lb]
    return j, b


def ecrire(chemin, j, b):
    tj = json.dumps(j, separators=(',', ':')).encode()
    tj += b' ' * ((4 - len(tj) % 4) % 4)
    b += b'\0' * ((4 - len(b) % 4) % 4)
    total = 12 + 8 + len(tj) + 8 + len(b)
    with open(chemin, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, total))
        f.write(struct.pack('<II', len(tj), 0x4E4F534A) + tj)
        f.write(struct.pack('<II', len(b), 0x004E4942) + b)


def remplacer(glb, nom, fichier, sortie):
    j, b = lire(glb)
    neuf = open(fichier, 'rb').read()
    im = next(i for i in j['images'] if i.get('name') == nom)
    vise = im['bufferView']
    # Reconstruit le tampon : chaque vue recopiée dans l'ordre, alignée sur 4
    nb = bytearray()
    for k, v in enumerate(j['bufferViews']):
        o = v.get('byteOffset', 0)
        donnees = neuf if k == vise else b[o:o + v['byteLength']]
        nb += b'\0' * ((4 - len(nb) % 4) % 4)
        v['byteOffset'] = len(nb)
        v['byteLength'] = len(donnees)
        nb += donnees
    j['buffers'][0]['byteLength'] = len(nb)
    ecrire(sortie, j, bytes(nb))


if __name__ == '__main__':
    a = sys.argv[1:]
    remplacer(a[0], a[1], a[2], a[3] if len(a) > 3 else a[0])
