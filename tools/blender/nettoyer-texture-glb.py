# Nettoie la texture de couleur d'un PNJ déjà dans le jeu (18/11/2026), sans
# réexporter le modèle : Blender sert seulement à lire les UV (maillage
# Draco). Taches blanches sur les vêtements sombres repeintes, puis débord
# des îlots (fin des traits blancs aux coutures). L'image corrigée est
# enregistrée en WebP ; tools/remplacer-image-glb.py la remet dans le GLB.
# Variables : SRC (GLB), IMAGE (nom de l'image dans le GLB), SORTIE (.webp).
# Fonctions reprises de preparer-pnj-meshy.py (même dossier).
import bpy
import os
import numpy as np

SRC = globals()['SRC']
IMAGE = globals()['IMAGE']
SORTIE = globals()['SORTIE']
ICI = globals().get('ICI', os.path.dirname(SORTIE))
# ZONE_SOMBRE = (bas, haut) en fraction de la hauteur : triangles du pantalon
ZONE = globals().get('ZONE_SOMBRE')

outils = {}
exec(open(os.path.join(ICI, 'preparer-pnj-meshy.py'), encoding='utf-8').read(), outils)

s = outils['scene_de_travail']()
avant = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=SRC)
maillages = [o for o in bpy.data.objects if o not in avant and o.type == 'MESH']
img = bpy.data.images[IMAGE]
w, h = img.size
px = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)
tris = []
hauteurs = []
for o in maillages:
    if any(m and m.node_tree and any(n.type == 'TEX_IMAGE' and n.image == img for n in m.node_tree.nodes) for m in o.data.materials):
        tris.append(outils['triangles_uv'](o))
        mw = o.matrix_world
        hauteurs.append(np.array([(mw @ t.center).z for t in o.data.loop_triangles]))
tris = np.concatenate(tris)
hz = np.concatenate(hauteurs)
force = None
if ZONE:
    bas, haut = hz.min(), hz.max()
    f = (hz - bas) / (haut - bas)
    force = (f >= ZONE[0]) & (f <= ZONE[1])
taches = outils['nettoyer_taches'](px, tris, w, h, force=force)
couvert = outils['raster'](tris, w, h)
outils['deborder'](px, couvert, 8)
sortie = bpy.data.images.new('nettoyee', w, h, alpha=True)
sortie.pixels[:] = px.ravel()
sortie.filepath_raw = SORTIE
sortie.file_format = 'WEBP'
s.render.image_settings.quality = 90
sortie.save(filepath=SORTIE, quality=90)
RESULTAT = {'taches': taches, 'triangles': len(tris), 'couverture': round(float(couvert.mean()), 3), 'taille': (w, h)}
