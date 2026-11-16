// Dépendances hors projet : npm i --no-save @gltf-transform/core @gltf-transform/extensions draco3dgltf
// Corrige les poids de peau des chaussures : sous la cheville, les sommets ne
// doivent suivre que le pied et la pointe de leur côté, pas le tibia ni la
// cuisse (sinon la chaussure s'étire quand le pied se lève).
// Usage : node corriger-chaussures.mjs entree.glb sortie.glb
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import draco3d from 'draco3dgltf'

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
})
const [entree, sortie] = process.argv.slice(2)
const doc = await io.read(entree)
const root = doc.getRoot()
const skin = root.listSkins()[0]
const noms = skin.listJoints().map((j) => j.getName().replace(/mixamorig:?/, ''))
const idx = (n) => noms.indexOf(n)
const ibm = skin.getInverseBindMatrices()
const repos = (n) => {
  const [a, b, c, , d, e, f, , g, h, i, , x, y, z] = ibm.getElement(idx(n), [])
  const det = a * (e * i - f * h) - d * (b * i - c * h) + g * (b * f - c * e)
  const r = [(e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det, (f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det, (d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det]
  return [-(r[0] * x + r[3] * y + r[6] * z), -(r[1] * x + r[4] * y + r[7] * z), -(r[2] * x + r[5] * y + r[8] * z)]
}
const lisse = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t) }
let modifies = 0
for (const mesh of root.listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const pos = prim.getAttribute('POSITION')
    const j0 = prim.getAttribute('JOINTS_0')
    const w0 = prim.getAttribute('WEIGHTS_0')
    if (!j0 || !w0) continue
    let ymin = Infinity
    for (let i = 0; i < pos.getCount(); i++) ymin = Math.min(ymin, pos.getElement(i, [])[1])
    if (ymin > 0.2) continue // pas le corps (cheveux, kippa…)
    for (let i = 0; i < pos.getCount(); i++) {
      const p = pos.getElement(i, [])
      const cote = p[0] > 0 ? 'Left' : 'Right'
      const cheville = repos(cote + 'Foot')
      const pointe = repos(cote + 'ToeBase')
      const genou = repos(cote + 'Leg')
      const h = p[1]
      if (h > genou[1] - 0.04) continue
      const js = j0.getElement(i, [])
      const ws = w0.getElement(i, [])
      const w = new Map()
      for (let k = 0; k < 4; k++) if (ws[k] > 0) w.set(js[k], (w.get(js[k]) ?? 0) + ws[k])
      // 1. Sous le genou, la cuisse n'a plus d'influence : son poids va au tibia
      const cuisse = idx(cote + 'UpLeg')
      const tibia = idx(cote + 'Leg')
      if (!process.argv.includes('--chaussures') && w.has(cuisse)) { w.set(tibia, (w.get(tibia) ?? 0) + w.get(cuisse)); w.delete(cuisse) }
      // 2. Chaussure : pied et pointe seulement, fondu jusqu'au-dessus de la cheville
      const haut = cheville[1] + 0.045
      const bas = cheville[1] - 0.02
      const u = lisse(bas, haut, h) // 0 = chaussure, 1 = poids d'origine
      if (u < 1) {
        const t = lisse(pointe[2] - 0.03, pointe[2] + 0.02, p[2])
        const chaussure = new Map([[idx(cote + 'Foot'), 1 - t], [idx(cote + 'ToeBase'), t]])
        const res = new Map()
        for (const [k, v] of w) res.set(k, v * u)
        for (const [k, v] of chaussure) if (v > 0) res.set(k, (res.get(k) ?? 0) + v * (1 - u))
        w.clear()
        for (const [k, v] of res) w.set(k, v)
      }
      const tri = [...w.entries()].filter(([, v]) => v > 1e-4).sort((a, b) => b[1] - a[1]).slice(0, 4)
      const somme = tri.reduce((s, [, v]) => s + v, 0)
      const nj = [0, 0, 0, 0]
      const nw = [0, 0, 0, 0]
      tri.forEach(([k, v], n) => { nj[n] = k; nw[n] = v / somme })
      if (nj.some((v, n) => v !== js[n]) || nw.some((v, n) => Math.abs(v - ws[n]) > 1e-3)) modifies++
      j0.setElement(i, nj)
      w0.setElement(i, nw)
    }
  }
}
await io.write(sortie, doc)
console.log(`${modifies} sommets modifiés → ${sortie}`)
