# Matière « tissu mat » pour le corps d'un PNJ Meshy (18/11/2026) : retire la
# carte de relief (ses arêtes aux bords des îlots de texture dessinent des
# traits blancs brillants sur les vêtements sombres) et la carte de
# rugosité/métal (taches trop brillantes), et fixe une rugosité uniforme.
# Seul le JSON du GLB change ; maillage, squelette et animations intacts.
# Usage : python tools/matiere-mate-glb.py <glb> <nom du matériau> [rugosité]
import sys
import importlib.util
import os

ici = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('remplacer', os.path.join(ici, 'remplacer-image-glb.py'))
r = importlib.util.module_from_spec(spec)
spec.loader.exec_module(r)

glb, nom = sys.argv[1], sys.argv[2]
rug = float(sys.argv[3]) if len(sys.argv) > 3 else 0.85
j, b = r.lire(glb)
m = next(x for x in j['materials'] if x['name'] == nom)
m.pop('normalTexture', None)
pbr = m.setdefault('pbrMetallicRoughness', {})
pbr.pop('metallicRoughnessTexture', None)
pbr['metallicFactor'] = 0.0
pbr['roughnessFactor'] = rug
r.ecrire(glb, j, b)
print('ok', nom, m)
