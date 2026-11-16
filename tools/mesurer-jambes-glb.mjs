// Mesure l'écartement des jambes d'un personnage pendant un clip : positions
// latérales (x) des hanches, genoux, chevilles et pointes, dans le repère du
// personnage. Jambes arquées = genoux nettement plus écartés que hanches et
// chevilles ; pieds tordus = pointe qui part vers l'extérieur ou l'intérieur.
// Usage : node tools/mesurer-jambes-glb.mjs fichier.glb [clip]
import fs from 'node:fs'
import * as THREE from 'three'

const fichier = process.argv[2]
const nomClip = process.argv[3] || 'Walking'
const octets = fs.readFileSync(fichier)
const lj = octets.readUInt32LE(12)
const json = JSON.parse(octets.toString('utf8', 20, 20 + lj))
const bin = 20 + lj + 8
const NB = { SCALAR: 1, VEC3: 3, VEC4: 4 }
function acc(i) {
  const a = json.accessors[i]
  const v = json.bufferViews[a.bufferView]
  const n = NB[a.type]
  const d = bin + (v.byteOffset ?? 0) + (a.byteOffset ?? 0)
  const pas = v.byteStride ?? n * 4
  if (a.componentType !== 5126) throw new Error('accesseur non flottant')
  return Array.from({ length: a.count }, (_, k) => Array.from({ length: n }, (__, c) => octets.readFloatLE(d + k * pas + c * 4)))
}
const noeuds = json.nodes.map((n) => {
  const o = new THREE.Object3D()
  o.name = n.name ?? ''
  if (n.translation) o.position.fromArray(n.translation)
  if (n.rotation) o.quaternion.fromArray(n.rotation)
  if (n.scale) o.scale.fromArray(n.scale)
  return o
})
json.nodes.forEach((n, i) => n.children?.forEach((c) => noeuds[i].add(noeuds[c])))
const racine = new THREE.Object3D()
for (const i of json.scenes[json.scene ?? 0].nodes) racine.add(noeuds[i])
const os = (nom) => noeuds.find((o) => o.name.replace(/mixamorig:?/, '') === nom)
const clip = json.animations.find((a) => a.name === nomClip)
if (!clip) throw new Error(`clip ${nomClip} absent : ${json.animations.map((a) => a.name).join(', ')}`)
const pistes = clip.channels.map((c) => {
  const s = clip.samplers[c.sampler]
  return { o: noeuds[c.target.node], prop: c.target.path, t: acc(s.input).map((x) => x[0]), v: acc(s.output) }
})
const duree = Math.max(...pistes.map((p) => p.t[p.t.length - 1]))
function poser(temps) {
  for (const p of pistes) {
    let k = 0
    while (k < p.t.length - 2 && p.t[k + 1] < temps) k++
    const a = p.t[k]
    const b = p.t[Math.min(k + 1, p.t.length - 1)]
    const u = b > a ? THREE.MathUtils.clamp((temps - a) / (b - a), 0, 1) : 0
    const va = p.v[k]
    const vb = p.v[Math.min(k + 1, p.v.length - 1)]
    if (p.prop === 'rotation') p.o.quaternion.fromArray(va).slerp(new THREE.Quaternion().fromArray(vb), u)
    else if (p.prop === 'translation') p.o.position.fromArray(va).lerp(new THREE.Vector3().fromArray(vb), u)
    else if (p.prop === 'scale') p.o.scale.fromArray(va).lerp(new THREE.Vector3().fromArray(vb), u)
  }
  racine.updateMatrixWorld(true)
}
const P = (nom) => {
  const o = os(nom)
  return o ? o.getWorldPosition(new THREE.Vector3()) : null
}
const noms = ['UpLeg', 'Leg', 'Foot', 'ToeBase']
const stats = {}
const N = 40
for (let i = 0; i < N; i++) {
  poser((duree * i) / N)
  const hanches = P('Hips')
  for (const cote of ['Left', 'Right']) {
    for (const n of noms) {
      const p = P(cote + n)
      if (!p) continue
      const cle = cote + n
      const s = (stats[cle] ??= { x: [], z: [] })
      s.x.push(p.x - hanches.x)
      s.z.push(p.z - hanches.z)
    }
    // Lacet du pied : angle de la direction cheville → pointe par rapport à l'avant (+z)
    const f = P(cote + 'Foot')
    const t = P(cote + 'ToeBase')
    if (f && t) (stats[cote + 'Lacet'] ??= { x: [], z: [] }).x.push((Math.atan2(t.x - f.x, t.z - f.z) * 180) / Math.PI)
  }
}
poser(0)
const taille = (P('Head')?.y ?? 0) - Math.min(P('LeftFoot')?.y ?? 0, P('RightFoot')?.y ?? 0)
const moy = (a) => a.reduce((s, v) => s + v, 0) / a.length
const f = (v) => v.toFixed(3).padStart(7)
console.log(`${fichier} — clip ${nomClip}, durée ${duree.toFixed(2)} s, tête-cheville ${taille.toFixed(2)}`)
for (const [cle, s] of Object.entries(stats)) console.log(cle.padEnd(14), 'x moy', f(moy(s.x)), 'min', f(Math.min(...s.x)), 'max', f(Math.max(...s.x)))

// Genou : écart du genou par rapport à la droite hanche → cheville. S'il part
// vers l'extérieur (x) plutôt que vers l'avant (z), la jambe est arquée.
// Pied : direction cheville → pointe au sol.
{
  const acc2 = {}
  for (let i = 0; i < N; i++) {
    poser((duree * i) / N)
    for (const [cote, signe] of [['Left', 1], ['Right', -1]]) {
      const h = P(cote + 'UpLeg'), g = P(cote + 'Leg'), c = P(cote + 'Foot'), t = P(cote + 'ToeBase')
      if (!h || !g || !c) continue
      const axe = c.clone().sub(h)
      const u = g.clone().sub(h).dot(axe) / axe.lengthSq()
      const ecart = g.clone().sub(h.clone().addScaledVector(axe, u))
      const a = (acc2[cote] ??= { dehors: [], avant: [], flex: [], pied: [] })
      a.dehors.push(ecart.x * signe)
      a.avant.push(ecart.z)
      a.flex.push(ecart.length())
      if (t) a.pied.push([(t.x - c.x) * signe, t.z - c.z, t.y - c.y])
    }
  }
  for (const [cote, a] of Object.entries(acc2)) {
    const pm = [0, 1, 2].map((k) => moy(a.pied.map((p) => p[k])))
    console.log(`${cote.padEnd(6)} genou : dehors moy ${f(moy(a.dehors))} max ${f(Math.max(...a.dehors))} | avant moy ${f(moy(a.avant))} max ${f(Math.max(...a.avant))} | pied (dehors, avant, haut) ${pm.map(f).join(' ')}`)
  }
}
