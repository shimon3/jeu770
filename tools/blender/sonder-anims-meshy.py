# Affiche, pour chaque GLB Meshy passé en argument, les actions et l'étendue
# des courbes de position de l'os Hips (pour savoir si un clip avance tout
# seul ou reste sur place).
# blender -b -P tools/blender/sonder-anims-meshy.py -- a.glb b.glb
import bpy
import sys

fichiers = sys.argv[sys.argv.index('--') + 1:]
for f in fichiers:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=f)
    arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    print('==', f, 'échelle armature', tuple(round(x, 4) for x in arm.scale), 'rot', tuple(round(x, 3) for x in arm.rotation_euler))
    for m in [o for o in bpy.data.objects if o.type == 'MESH']:
        print('  maillage', m.name, 'faces', len(m.data.polygons), 'dims', tuple(round(x, 3) for x in m.dimensions))
    for a in bpy.data.actions:
        info = []
        for fc in a.fcurves:
            if fc.data_path == 'pose.bones["Hips"].location':
                v = [k.co[1] for k in fc.keyframe_points]
                info.append(f'loc[{fc.array_index}] {min(v):.2f}..{max(v):.2f}')
        print('  action', a.name, 'images', tuple(round(x) for x in a.frame_range), ' | '.join(info))
