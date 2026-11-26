# Prépare le nouveau personnage principal Meshy et la bibliothèque de gestes
# des PNJ (26/11/2026). Blender 5.3 (Microsoft Store), en ligne de commande :
#   blender-launcher.exe -b -P tools/blender/preparer-joueur-meshy.py -- <dossier Meshy> <dossier de sortie>
# Le dossier Meshy contient : anims.glb (merged_animations.glb, 10 clips),
# walk.glb et run.glb (marche et course offertes par le rig Meshy).
# Sorties :
#   joueur_meshy_v1.glb : maillage, squelette, clips Idle_11, Walking,
#     Running, Assis ; texture « débordée » (pas de traits blancs aux
#     coutures), 2048 px WebP, maillage Draco ;
#   anims_meshy_v1.glb : squelette seul et clips de gestes, rejoués par nom
#     d'os sur les autres personnages Meshy (enfant, policier, touriste…).
# La mise « sur place » des clips (Hips) se fait dans le jeu (npc/animsMeshy.ts).
import bpy
import os
import sys
import json
import numpy as np

args = sys.argv[sys.argv.index('--') + 1:]
SRC_DIR, DST_DIR = args[0], args[1]
ICI = os.path.dirname(os.path.abspath(__file__))

# Fonctions de texture du script des PNJ Meshy (sans lancer sa préparation)
ns = {'__name__': 'outil'}
exec(open(os.path.join(ICI, 'preparer-pnj-meshy.py'), encoding='utf8').read(), ns)

NOMS = {
    'Idle': 'Idle_11',
    'Chair_Sit_Idle_M': 'Assis',
    'Kick_a_Soccer_Ball': 'Tir',
    'Talk_with_Hands_Open': 'Parle',
    'Cheer_with_Both_Hands': 'Joie',
    'Stand_and_Chat': 'Discute',
    'Wave_One_Hand': 'Salue',
    'Casual_Walk_inplace': 'MarcheTranquille',
    'Phone_Conversation': 'Telephone',
    'Listening_Gesture': 'Ecoute',
}
JOUEUR = ['Idle_11', 'Walking', 'Running', 'Assis']
GESTES = ['Tir', 'Parle', 'Joie', 'Discute', 'Salue', 'MarcheTranquille', 'Telephone', 'Ecoute', 'Running']

bpy.ops.wm.read_factory_settings(use_empty=True)
rapport = {}


def importer(nom):
    avant = set(bpy.data.objects)
    actions_avant = set(bpy.data.actions)
    bpy.ops.import_scene.gltf(filepath=os.path.join(SRC_DIR, nom))
    return [o for o in bpy.data.objects if o not in avant], [a for a in bpy.data.actions if a not in actions_avant]


objs, acts = importer('anims.glb')
arm = next(o for o in objs if o.type == 'ARMATURE')
corps = next(o for o in objs if o.type == 'MESH')
for a in acts:
    base = a.name.split('|')[-2] if '|' in a.name else a.name
    a.name = NOMS.get(base, base)
    a.use_fake_user = True
# Marche et course : on garde l'action, on jette le reste de la scène importée
for fichier, nom in (('walk.glb', 'Walking'), ('run.glb', 'Running')):
    o2, a2 = importer(fichier)
    a2[0].name = nom
    a2[0].use_fake_user = True
    for o in o2:
        bpy.data.objects.remove(o, do_unlink=True)
rapport['actions'] = sorted(a.name for a in bpy.data.actions)

# Texture : débord des îlots (fond blanc Meshy aux coutures), puis 2048 px
img = ns['image_couleur'](corps)
w, h = img.size
px = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)
tris = ns['triangles_uv'](corps)
couvert = ns['raster'](tris, w, h)
ns['deborder'](px, couvert, 16)
img.pixels[:] = px.ravel()
img.update()
for im in bpy.data.images:
    if im.size[0] > 2048:
        im.scale(2048, 2048)
rapport['texture'] = [w, h]
rapport['couverture'] = round(float(couvert.mean()), 3)
rapport['hauteur'] = round(corps.dimensions.z, 3)
rapport['faces'] = len(corps.data.polygons)


def exporter(nom, avec_maillage, garder):
    for a in bpy.data.actions:
        a.use_fake_user = a.name in garder
    # Les actions non gardées sont retirées de l'export (mode ACTIONS :
    # toutes les actions qui s'appliquent au squelette sont exportées)
    retirees = [a for a in bpy.data.actions if a.name not in garder]
    sauve = {a.name: a for a in retirees}
    for a in retirees:
        a.name = '_' + a.name
    arm.animation_data.action = bpy.data.actions[garder[0]]
    for o in bpy.data.objects:
        o.select_set(o == arm or (avec_maillage and o == corps))
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(DST_DIR, nom),
        export_format='GLB',
        use_selection=True,
        export_image_format='WEBP',
        export_draco_mesh_compression_enable=avec_maillage,
        export_animations=True,
        export_animation_mode='ACTIONS',
        export_yup=True,
    )
    for n, a in sauve.items():
        a.name = n


# Les actions « gardées » sont exportées ; les autres sont mises de côté en
# les retirant du squelette (fake user coupé et suppression temporaire)
def exporter_strict(nom, avec_maillage, garder):
    mises_de_cote = {}
    for a in list(bpy.data.actions):
        if a.name not in garder:
            mises_de_cote[a.name] = a.copy()
            bpy.data.actions.remove(a)
    exporter(nom, avec_maillage, garder)
    for n, a in mises_de_cote.items():
        a.name = n
        a.use_fake_user = True


exporter_strict('joueur_meshy_v1.glb', True, JOUEUR)
exporter_strict('anims_meshy_v1.glb', False, GESTES)
rapport['ok'] = True
json.dump(rapport, open(os.path.join(DST_DIR, 'rapport-joueur-meshy.json'), 'w'), indent=1)
