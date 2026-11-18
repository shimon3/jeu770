# Prépare un personnage Meshy riggé (Animation_Walking_withSkin.glb) pour le
# jeu (18/11/2026). À lancer dans Blender (testé avec Blender 5.3, via MCP for
# Blender ou l'onglet Scripting) : définir SRC, DST et RETOUCHES puis
# exécuter ce fichier. Le travail se fait dans une scène à part (PNJ_JEU) ;
# les autres scènes ne sont pas touchées.
#   - clip de marche renommé « Walking » ;
#   - clip de repos « Idle_11 » créé : pose de référence (T-pose) avec les
#     bras baissés le long du corps et une légère respiration ;
#   - RETOUCHES : zones (hauteur, largeur, faces de devant) où les pixels
#     blancs sont repeints de la couleur dominante voulue (logo d'une
#     casquette, bande blanche peinte par erreur sur un pantalon) ;
#   - « débord » des îlots de texture : les pixels vides autour de chaque
#     îlot reçoivent la couleur du bord de l'îlot, sinon le fond blanc de la
#     texture Meshy déborde sur les vêtements (traits blancs aux coutures,
#     surtout une fois la texture réduite) ;
#   - textures ramenées à 1024 px, export GLB (textures WebP, maillage Draco).
import bpy
import math
import numpy as np
from mathutils import Vector, Quaternion

SRC = globals().get('SRC')
DST = globals().get('DST')
RETOUCHES = globals().get('RETOUCHES', [])
NETTOYER = globals().get('NETTOYER', True)
TAILLE_TEX = 1024
DEBORD = 16  # pixels de débord (sur la texture d'origine en 2048)


def scene_de_travail():
    s = bpy.data.scenes.get('PNJ_JEU') or bpy.data.scenes.new('PNJ_JEU')
    bpy.context.window.scene = s
    for o in list(s.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for coll in (bpy.data.meshes, bpy.data.armatures, bpy.data.materials, bpy.data.images, bpy.data.actions):
        for x in list(coll):
            if x.users == 0 or (hasattr(x, 'use_fake_user') and x.use_fake_user and x.users <= 1):
                coll.remove(x)
    return s


def os_nom(arm, nom):
    return arm.pose.bones.get(nom)


def baisser_bras(arm):
    # Rotation (repère armature) qui amène chaque bras de l'horizontale vers
    # le bas, un peu écarté du corps ; exprimée dans le repère local de l'os
    for cote in ('LeftArm', 'RightArm'):
        pb = os_nom(arm, cote)
        if not pb:
            continue
        b = pb.bone
        # Direction réelle du bras : de l'épaule au coude (la queue de l'os
        # Meshy ne suit pas toujours le bras)
        coude = arm.data.bones[cote.replace('Arm', 'ForeArm')].head_local
        dir_repos = (coude - b.head_local).normalized()
        # Repère armature : on vise le bas du personnage (axe « haut » du
        # squelette = direction Hips → Head)
        haut = (arm.data.bones['Head'].head_local - arm.data.bones['Hips'].head_local).normalized()
        lateral = dir_repos - haut * dir_repos.dot(haut)
        cible = (-haut + lateral.normalized() * 0.1).normalized()
        q_arm = dir_repos.rotation_difference(cible)
        q_os = b.matrix_local.to_quaternion()
        pb.rotation_mode = 'QUATERNION'
        pb.rotation_quaternion = q_os.inverted() @ q_arm @ q_os


def creer_repos(arm):
    arm.animation_data.action = None
    for pb in arm.pose.bones:
        pb.rotation_mode = 'QUATERNION'
        pb.rotation_quaternion = Quaternion()
    baisser_bras(arm)
    epine = os_nom(arm, 'Spine01')
    bras = [os_nom(arm, n) for n in ('LeftArm', 'RightArm')]
    for f in (1, 41, 81):
        for pb in bras:
            pb.keyframe_insert('rotation_quaternion', frame=f)
        if epine:
            epine.rotation_quaternion = Quaternion((1, 0, 0), 0.02 if f == 41 else 0.0)
            epine.keyframe_insert('rotation_quaternion', frame=f)
    act = arm.animation_data.action
    act.name = 'Idle_11'
    act.use_fake_user = True
    return act


def image_couleur(mesh_obj):
    mat = mesh_obj.data.materials[0]
    bsdf = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    lien = bsdf.inputs['Base Color'].links[0]
    return lien.from_node.image


def triangles_uv(mesh_obj):
    me = mesh_obj.data
    me.calc_loop_triangles()
    uv = me.uv_layers.active.data
    n = len(me.loop_triangles)
    t = np.zeros((n, 3, 2), dtype=np.float32)
    for k, tri in enumerate(me.loop_triangles):
        for j in range(3):
            t[k, j] = uv[tri.loops[j]].uv
    return t


def raster(tris, w, h):
    # Pixels couverts par au moins un triangle UV (test barycentrique)
    masque = np.zeros((h, w), dtype=bool)
    for t in tris:
        p = t * [w, h]
        x0, y0 = np.floor(p.min(0)).astype(int)
        x1, y1 = np.ceil(p.max(0)).astype(int)
        x0, y0 = max(x0, 0), max(y0, 0)
        x1, y1 = min(x1, w - 1), min(y1, h - 1)
        if x1 < x0 or y1 < y0:
            continue
        xs, ys = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
        (ax, ay), (bx, by), (cx, cy) = p
        d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
        if abs(d) < 1e-9:
            continue
        l1 = ((by - cy) * (xs - cx) + (cx - bx) * (ys - cy)) / d
        l2 = ((cy - ay) * (xs - cx) + (ax - cx) * (ys - cy)) / d
        l3 = 1 - l1 - l2
        e = -0.02
        masque[y0:y1 + 1, x0:x1 + 1] |= (l1 >= e) & (l2 >= e) & (l3 >= e)
    return masque


def deborder(px, couvert, n):
    # Chaque passe : un pixel vide voisin d'un pixel couvert prend la
    # moyenne de ses voisins couverts
    rgb = px[:, :, :3]
    c = couvert.copy()
    for _ in range(n):
        somme = np.zeros_like(rgb)
        nb = np.zeros(c.shape, dtype=np.float32)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            cs = np.roll(c, (dy, dx), (0, 1))
            somme += np.roll(rgb, (dy, dx), (0, 1)) * cs[:, :, None]
            nb += cs
        nouveaux = (~c) & (nb > 0)
        rgb[nouveaux] = somme[nouveaux] / nb[nouveaux][:, None]
        c |= nouveaux
    px[:, :, :3] = rgb


def retoucher(px, mesh_obj, tris, w, h, r):
    # r = {zmin, zmax, xmax, devant, cible: 'sombre' | 'rouge'}
    me = mesh_obj.data
    mw = mesh_obj.matrix_world
    choisis = []
    for k, tri in enumerate(me.loop_triangles):
        c = mw @ tri.center
        nrm = (mw.to_3x3() @ tri.normal).normalized()
        if r['zmin'] <= c.z <= r['zmax'] and abs(c.x) <= r['xmax'] and (not r.get('devant') or nrm.y < -0.2):
            choisis.append(tris[k])
    if not choisis:
        return 0
    zone_m = raster(np.array(choisis), w, h)
    zone = px[zone_m]
    mn = zone[:, :3].min(1)
    mx = zone[:, :3].max(1)
    blanc = (mn > 0.5) & (mx - mn < 0.22)
    if r['cible'] == 'rouge':
        ref = (zone[:, 0] > 0.3) & (zone[:, 0] > zone[:, 1] * 1.6)
    else:
        ref = mx < 0.25
    if ref.sum() == 0:
        return 0
    zone[blanc, :3] = np.median(zone[ref][:, :3], axis=0)
    px[zone_m] = zone
    return int(blanc.sum())


def _pixels_triangle(p, w, h):
    x0, y0 = np.floor(p.min(0)).astype(int)
    x1, y1 = np.ceil(p.max(0)).astype(int)
    x0, y0 = max(x0, 0), max(y0, 0)
    x1, y1 = min(x1, w - 1), min(y1, h - 1)
    if x1 < x0 or y1 < y0:
        return None
    xs, ys = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
    (ax, ay), (bx, by), (cx, cy) = p
    d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
    if abs(d) < 1e-9:
        return None
    l1 = ((by - cy) * (xs - cx) + (cx - bx) * (ys - cy)) / d
    l2 = ((cy - ay) * (xs - cx) + (ax - cx) * (ys - cy)) / d
    dedans = (l1 >= 0) & (l2 >= 0) & (1 - l1 - l2 >= 0)
    return (y0, y1, x0, x1, dedans)


def nettoyer_taches(px, tris, w, h, seuil=0.75, force=None):
    # Vêtements sombres tachés de blanc (défaut fréquent des textures Meshy :
    # triangles très fins du pantalon qui débordent sur une zone blanche).
    # 1re passe : on repère les pixels utilisés par des triangles clairs
    # (chemise, tsitsit) : ils sont protégés.
    # 2e passe : dans un triangle sombre à au moins 75 %, les pixels clairs
    # non protégés prennent la couleur sombre médiane du triangle.
    lum = px[:, :, :3].max(2)
    protege = np.zeros((h, w), dtype=bool)
    sombres = []
    # force[k] : triangle de la zone d'un vêtement sombre (pantalon) : traité
    # comme sombre même s'il est minuscule ou à moitié blanc
    for k, t in enumerate(tris):
        r = _pixels_triangle(t * [w, h], w, h)
        if r is None:
            continue
        y0, y1, x0, x1, dedans = r
        n = int(dedans.sum())
        if n == 0:
            continue
        l = lum[y0:y1 + 1, x0:x1 + 1][dedans]
        part = (l < 0.28).mean()
        if force is not None and force[k] and part >= 0.3:
            sombres.append(r)
        elif n < 4:
            continue
        elif part >= seuil:
            sombres.append(r)
        elif part < 0.5:
            protege[y0:y1 + 1, x0:x1 + 1] |= dedans
    total = 0
    for y0, y1, x0, x1, dedans in sombres:
        bloc = px[y0:y1 + 1, x0:x1 + 1]
        libre = dedans & ~protege[y0:y1 + 1, x0:x1 + 1]
        zone = bloc[libre]
        if not len(zone):
            continue
        l = zone[:, :3].max(1)
        clair = l > 0.45
        if not clair.any():
            continue
        ref = bloc[dedans]
        ref = ref[ref[:, :3].max(1) < 0.28]
        if not len(ref):
            continue
        zone[clair, :3] = np.median(ref[:, :3], axis=0)
        bloc[libre] = zone
        total += int(clair.sum())
    return total


def preparer():
    scene_de_travail()
    avant = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=SRC)
    nouveaux = [o for o in bpy.data.objects if o not in avant]
    arm = next(o for o in nouveaux if o.type == 'ARMATURE')
    corps = next(o for o in nouveaux if o.type == 'MESH' and o.parent == arm)
    marche = arm.animation_data.action
    marche.name = 'Walking'
    marche.use_fake_user = True
    repos = creer_repos(arm)
    # Texture : retouches, débord des îlots, réduction
    img = image_couleur(corps)
    w, h = img.size
    px = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)
    tris = triangles_uv(corps)
    repeints = [retoucher(px, corps, tris, w, h, r) for r in RETOUCHES]
    nettoyes = nettoyer_taches(px, tris, w, h) if NETTOYER else 0
    couvert = raster(tris, w, h)
    deborder(px, couvert, DEBORD)
    img.pixels[:] = px.ravel()
    img.update()
    for im in bpy.data.images:
        if im.size[0] > TAILLE_TEX:
            im.scale(TAILLE_TEX, TAILLE_TEX)
    arm.animation_data.action = repos
    # Export depuis la scène de travail uniquement (le contexte peut encore
    # pointer vers la scène de l'utilisateur dans le même script)
    s = bpy.data.scenes['PNJ_JEU']
    vl = s.view_layers[0]
    for o in s.objects:
        o.select_set(o in (arm, corps), view_layer=vl)
    with bpy.context.temp_override(scene=s, view_layer=vl):
      bpy.ops.export_scene.gltf(
        filepath=DST,
        export_format='GLB',
        use_selection=True,
        export_image_format='WEBP',
        export_draco_mesh_compression_enable=True,
        export_animations=True,
        export_animation_mode='ACTIONS',
        export_yup=True,
    )
    return {
        'actions': [a.name for a in bpy.data.actions if a.use_fake_user],
        'repeints': repeints,
        'taches': nettoyes,
        'couverture': round(float(couvert.mean()), 3),
        'hauteur': round(corps.dimensions.z, 3),
    }


RESULTAT = preparer() if SRC and DST else None
