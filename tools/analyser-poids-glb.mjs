// Dépendances hors projet : npm i --no-save @gltf-transform/core @gltf-transform/extensions draco3dgltf
// Analyse des poids de peau sous le genou : quels os tiennent les sommets
// des chaussures et des tibias ? Usage : node analyse.mjs fichier.glb
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import draco3d from 'draco3dgltf'

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
})
const doc = await io.read(process.argv[2])
const root = doc.getRoot()
const skin = root.listSkins()[0]
const joints = skin.listJoints()
const noms = joints.map((j) => j.getName().replace(/mixamorig:?/, ''))
// Position de repos des os (inverse des matrices de liaison)
const ibm = skin.getInverseBindMatrices()
const repos = {}
const inv = (m) => {
  // inverse d'une matrice affine 4x4 (colonne majeure)
  const [a, b, c, , d, e, f, , g, h, i, , x, y, z] = m
  const det = a * (e * i - f * h) - d * (b * i - c * h) + g * (b * f - c * e)
  const r = [(e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det, (f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det, (d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det]
  return [-(r[0] * x + r[3] * y + r[6] * z), -(r[1] * x + r[4] * y + r[7] * z), -(r[2] * x + r[5] * y + r[8] * z)]
}
noms.forEach((n, k) => (repos[n] = inv(ibm.getElement(k, []))))
for (const n of ['Hips', 'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase', 'RightUpLeg', 'RightLeg', 'RightFoot', 'RightToeBase']) console.log(n.padEnd(13), (repos[n] ?? []).map((v) => v.toFixed(3)).join(' '))
for (const mesh of root.listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const pos = prim.getAttribute('POSITION')
    const j0 = prim.getAttribute('JOINTS_0')
    const w0 = prim.getAttribute('WEIGHTS_0')
    if (!j0) continue
    let ymin = Infinity, ymax = -Infinity
    for (let i = 0; i < pos.getCount(); i++) { const y = pos.getElement(i, [])[1]; ymin = Math.min(ymin, y); ymax = Math.max(ymax, y) }
    console.log(`\nmaillage ${mesh.getName()} : ${pos.getCount()} sommets, y ${ymin.toFixed(3)} → ${ymax.toFixed(3)}`)
    const tranches = [[-1, 0.04], [0.04, 0.09], [0.09, 0.16], [0.16, 0.3]]
    for (const [a, b] of tranches) {
      for (const cote of ['G (x>0)', 'D (x<0)']) {
        const somme = {}
        let n = 0
        for (let i = 0; i < pos.getCount(); i++) {
          const p = pos.getElement(i, [])
          const h = p[1] - ymin
          if (h < a || h >= b || (cote[0] === 'G') !== p[0] > 0) continue
          n++
          const js = j0.getElement(i, [])
          const ws = w0.getElement(i, [])
          for (let k = 0; k < 4; k++) if (ws[k] > 0) somme[noms[js[k]]] = (somme[noms[js[k]]] ?? 0) + ws[k]
        }
        const tri = Object.entries(somme).sort((x, y) => y[1] - x[1]).slice(0, 6).map(([k, v]) => `${k} ${((100 * v) / n).toFixed(0)}%`)
        console.log(`  h ${a < 0 ? 0 : a}–${b} ${cote} : ${n} sommets → ${tri.join(', ')}`)
      }
    }
  }
}
