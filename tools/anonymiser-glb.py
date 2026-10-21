# Anonymise un modèle glTF binaire (GLB) de personnage scanné ou généré :
# visage en aplat de peau sans traits, barbe/cheveux/chapeau en aplat sombre,
# relief du visage lissé, fragments de photo inutilisés effacés, texture 1K.
# Usage : python3 -I tools/anonymiser-glb.py entree.glb sortie.glb
# Les seuils de hauteur (tête au-dessus de y = 0,29 ; visage entre 0,345 et
# 0,415, face vers +z) sont ceux du modèle Sculptly d'octobre 2026 : à
# ajuster pour un autre modèle, puis CONTRÔLER LE RENDU avant publication.
import os, sys, io, json, struct
import numpy as np, cv2
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from charger_glb import charger

src, dst = sys.argv[1], sys.argv[2]
j, binb, P, UV, N, I = charger(src)
im_info = j['images'][0]; bv = j['bufferViews'][im_info['bufferView']]
tex = np.array(Image.open(io.BytesIO(binb[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']])).convert('RGB'))
H, W = tex.shape[:2]

def masque(tris, dil=0):
    m = np.zeros((H, W), np.uint8)
    pts = np.round(UV[tris] * [W, H]).astype(np.int32)
    for p_ in pts: cv2.fillConvexPoly(m, p_, 255)  # un par un : fillPoly groupé laisse des trous aux recouvrements
    if dil: m = cv2.dilate(m, np.ones((dil, dil), np.uint8))
    return m > 0

cy = P[I][:, :, 1].mean(1)
tete = masque(I[cy > 0.305], dil=7)          # tête entière : visage, oreilles, barbe, chapeau
couvert = masque(I, dil=5)                     # texels réellement utilisés par le modèle

# Classement GÉOMÉTRIQUE par triangle (indépendant de la photo d'origine) :
# - visage : avant de la tête, entre la barbe et le bord du chapeau → peau unie ;
# - tout le reste de la tête (barbe, cheveux, nuque, chapeau) → aplat sombre.
# Les traits (yeux, sourcils, bouche) disparaissent : ils ne sont pas repeints.
T = I[cy > 0.29]
Ct = P[T].mean(1)
nt = N[T].mean(1)  # normales fournies (l'ordre des sommets n'est pas fiable)
peau_tri = (Ct[:, 1] > 0.345) & (Ct[:, 1] < 0.415) & (Ct[:, 2] > 0.02) & (nt[:, 2] > -0.1)
print('triangles tête', len(T), 'peau', int(peau_tri.sum()))
ton_peau = np.array([205, 158, 136])
sortie = tex.copy()
def peindre(tris, couleur, dil):
    m = np.zeros((H, W), np.uint8)
    pts = np.round(UV[tris] * [W, H]).astype(np.int32)
    for p_ in pts: cv2.fillConvexPoly(m, p_, 255)
    cv2.polylines(m, list(pts), True, 255, 2)
    m = cv2.dilate(m, np.ones((dil, dil), np.uint8)) > 0
    sortie[m] = couleur
    return m
peindre(T[~peau_tri], (26, 22, 20), 7)
peindre(T[peau_tri], ton_peau.astype(np.uint8), 5)
sortie[~couvert] = (12, 12, 14)                # texels inutilisés (fragments de photos) effacés
flou = cv2.GaussianBlur(sortie, (0, 0), 2)
sortie[tete] = flou[tete]
petite = Image.fromarray(sortie).resize((1024, 1024), Image.LANCZOS)
petite.save(dst.replace('.glb', '-texture.png'))
buf = io.BytesIO(); petite.save(buf, 'JPEG', quality=85); jpg = buf.getvalue()
print('peau', ton_peau, 'texels tête', tete.sum(), 'jpg', len(jpg))

# Lissage du relief du visage : atténue nez, lèvres et arcades
# Les sommets sont dédoublés le long des coutures UV : on lisse par POSITION
# unique (sommets soudés), sinon le maillage se fend.
cle, inv = np.unique(np.round(P, 6), axis=0, return_inverse=True)
inv = inv.ravel()
U = cle.astype(np.float64)
IU = inv[I]
voisins = [set() for _ in range(len(U))]
for t in IU:
    for a_ in t:
        voisins[a_].update(t)
zoneU = (U[:, 1] > 0.31) & (U[:, 1] < 0.44) & (U[:, 2] > 0.0)
idxU = np.where(zoneU)[0]
vl = [list(voisins[k_]) for k_ in idxU]
for _ in range(12):
    moy = np.array([U[v].mean(0) for v in vl])
    U[idxU] = U[idxU] * 0.4 + moy * 0.6
Pm = U[inv]
idx = np.where(zoneU[inv])[0]
remplacements = {}
# Normales recalculées dans la zone lissée
fn = np.cross(U[IU[:, 1]] - U[IU[:, 0]], U[IU[:, 2]] - U[IU[:, 0]])
vnU = np.zeros_like(U)
for k in range(3): np.add.at(vnU, IU[:, k], fn)
vnU /= np.linalg.norm(vnU, axis=1, keepdims=True) + 1e-12
vn = vnU[inv]
Nn = N.copy(); Nn[idx] = vn[idx]
remplacements[j['accessors'][j['meshes'][0]['primitives'][0]['attributes']['NORMAL']]['bufferView']] = Nn.astype(np.float32).tobytes()
print('sommets lissés', len(idx))
# Reconstruire le GLB. La tête n'utilise plus du tout la texture : la peau du
# visage et le sombre (barbe, cheveux, chapeau) sont des matériaux unis, sans
# coordonnées de texture à respecter, donc sans aucun trait possible.
tri_tete = np.where(cy > 0.29)[0]
peau_idx = tri_tete[peau_tri]
sombre_idx = tri_tete[~peau_tri]
corps_idx = np.setdiff1d(np.arange(len(I)), tri_tete)
blocs = [('POS', Pm.astype(np.float32), 34962), ('NOR', Nn.astype(np.float32), 34962), ('UV', UV.astype(np.float32), 34962),
         ('I_CORPS', I[corps_idx].astype(np.uint32).ravel(), 34963), ('I_PEAU', I[peau_idx].astype(np.uint32).ravel(), 34963),
         ('I_SOMBRE', I[sombre_idx].astype(np.uint32).ravel(), 34963)]
nouv = bytearray(); vues = []; acc = []
for nom, arr, cible in blocs:
    while len(nouv) % 4: nouv.append(0)
    vues.append({'buffer': 0, 'byteOffset': len(nouv), 'byteLength': arr.nbytes, 'target': cible}); nouv += arr.tobytes()
    if arr.ndim == 2:
        acc.append({'bufferView': len(vues) - 1, 'componentType': 5126, 'count': len(arr), 'type': 'VEC3' if arr.shape[1] == 3 else 'VEC2',
                    **({'min': arr.min(0).tolist(), 'max': arr.max(0).tolist()} if nom == 'POS' else {})})
    else:
        acc.append({'bufferView': len(vues) - 1, 'componentType': 5125, 'count': len(arr), 'type': 'SCALAR'})
while len(nouv) % 4: nouv.append(0)
vues.append({'buffer': 0, 'byteOffset': len(nouv), 'byteLength': len(jpg)}); nouv += jpg
while len(nouv) % 4: nouv.append(0)
attrs = {'POSITION': 0, 'NORMAL': 1, 'TEXCOORD_0': 2}
mat_corps = dict(j['materials'][0]); mat_corps['name'] = 'corps'
gj = {
    'asset': {'version': '2.0', 'generator': 'jeu770 anonymiser.py', 'extras': {'note': 'Modèle Sculptly fourni par Samuel ; visage anonymisé (aucun trait), texture 1024 px.'}},
    'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'name': 'hassid', 'mesh': 0}],
    'meshes': [{'name': 'hassid', 'primitives': [
        {'attributes': attrs, 'indices': 3, 'material': 0},
        {'attributes': attrs, 'indices': 4, 'material': 1},
        {'attributes': attrs, 'indices': 5, 'material': 2}]}],
    'materials': [mat_corps,
                  {'name': 'peau', 'pbrMetallicRoughness': {'baseColorFactor': [0.62, 0.36, 0.26, 1], 'metallicFactor': 0, 'roughnessFactor': 0.85}},
                  {'name': 'sombre', 'pbrMetallicRoughness': {'baseColorFactor': [0.006, 0.005, 0.005, 1], 'metallicFactor': 0, 'roughnessFactor': 0.8}}],
    'textures': [{'source': 0}], 'images': [{'bufferView': len(vues) - 1, 'mimeType': 'image/jpeg'}],
    'accessors': acc, 'bufferViews': vues, 'buffers': [{'byteLength': len(nouv)}]}
js = json.dumps(gj, separators=(',', ':')).encode()
while len(js) % 4: js += b' '
out = struct.pack('<4sII', b'glTF', 2, 12 + 8 + len(js) + 8 + len(nouv)) + struct.pack('<I4s', len(js), b'JSON') + js + struct.pack('<I4s', len(nouv), b'BIN\0') + bytes(nouv)
open(dst, 'wb').write(out); print('glb', len(out), 'tri corps/peau/sombre', len(corps_idx), len(peau_idx), len(sombre_idx))
