import fs from 'node:fs'
import path from 'node:path'
import * as THREE from 'three'

const fichier = process.argv[2]
if (!fichier) throw new Error('Usage : node tools/inspecter-animation-glb.mjs fichier.glb')

const octets = fs.readFileSync(fichier)
if (octets.toString('ascii', 0, 4) !== 'glTF') throw new Error('Le fichier n\'est pas un GLB')
const longueurJson = octets.readUInt32LE(12)
const json = JSON.parse(octets.toString('utf8', 20, 20 + longueurJson))
const debutBin = 20 + longueurJson + 8

const tailleComposant = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 }
const nombreComposants = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }

function lireAccesseur(index) {
  const accesseur = json.accessors[index]
  const vue = json.bufferViews[accesseur.bufferView]
  const composantes = nombreComposants[accesseur.type]
  const taille = tailleComposant[accesseur.componentType]
  const pas = vue.byteStride ?? composantes * taille
  const debut = debutBin + (vue.byteOffset ?? 0) + (accesseur.byteOffset ?? 0)
  const lire = accesseur.componentType === 5126
    ? (offset) => octets.readFloatLE(offset)
    : accesseur.componentType === 5125
      ? (offset) => octets.readUInt32LE(offset)
      : (offset) => octets.readUInt16LE(offset)
  return Array.from({ length: accesseur.count }, (_, i) =>
    Array.from({ length: composantes }, (__, c) => lire(debut + i * pas + c * taille)),
  )
}

const parents = new Map()
json.nodes.forEach((noeud, parent) => noeud.children?.forEach((enfant) => parents.set(enfant, parent)))
const nom = (index) => json.nodes[index]?.name ?? `node-${index}`
const normaliser = (valeur) => valeur.replace(/mixamorig:?/, '')

console.log(`Fichier : ${path.basename(fichier)}`)
console.log(`Nœuds : ${json.nodes.length}, animations : ${json.animations.map((a) => a.name).join(', ')}`)
console.log('\nHiérarchie du haut du corps :')
json.nodes.forEach((noeud, index) => {
  const n = normaliser(noeud.name ?? '')
  if (/Spine|Arm|ForeArm|Hand|Shoulder/.test(n)) console.log(`- ${n} <- ${normaliser(nom(parents.get(index)))}`)
})

for (const animation of json.animations) {
  console.log(`\n${animation.name} :`)
  for (const canal of animation.channels) {
    const n = normaliser(nom(canal.target.node))
    if (!/Spine2|ForeArm|Hand|UpLeg|Leg$/.test(n)) continue
    const echantillons = lireAccesseur(animation.samplers[canal.sampler].output)
    const composantes = echantillons[0].map((_, c) => echantillons.map((v) => v[c]))
    const plages = composantes.map((v) => `${Math.min(...v).toFixed(4)}…${Math.max(...v).toFixed(4)}`).join(' | ')
    console.log(`- ${n}.${canal.target.path} : ${echantillons.length} clés ; ${plages}`)
  }
}

function piste(animation, finNom, chemin) {
  const canal = animation.channels.find((c) => normaliser(nom(c.target.node)).endsWith(finNom) && c.target.path === chemin)
  return canal ? lireAccesseur(animation.samplers[canal.sampler].output) : null
}

function quaternionMoyen(valeurs) {
  const premier = new THREE.Quaternion(...valeurs[0])
  const somme = new THREE.Vector4()
  for (const valeur of valeurs) {
    const q = new THREE.Quaternion(...valeur)
    const signe = premier.dot(q) < 0 ? -1 : 1
    somme.x += q.x * signe
    somme.y += q.y * signe
    somme.z += q.z * signe
    somme.w += q.w * signe
  }
  return new THREE.Quaternion(somme.x, somme.y, somme.z, somme.w).normalize()
}

const idle = json.animations.find((a) => a.name === 'Idle_11')
const run = json.animations.find((a) => a.name === 'Running')
console.log('\nRunning, rotation relative au repos moyen (Euler XYZ, degrés) :')
for (const cote of ['Left', 'Right']) {
  for (const os of ['ForeArm', 'Hand']) {
    const reference = quaternionMoyen(piste(idle, `${cote}${os}`, 'rotation'))
    const inverse = reference.clone().invert()
    const angles = piste(run, `${cote}${os}`, 'rotation').map((valeur) => {
      const q = new THREE.Quaternion(...valeur)
      if (reference.dot(q) < 0) q.set(-q.x, -q.y, -q.z, -q.w)
      const e = new THREE.Euler().setFromQuaternion(inverse.clone().multiply(q), 'XYZ')
      return [e.x, e.y, e.z].map(THREE.MathUtils.radToDeg)
    })
    const plages = [0, 1, 2].map((axe) => {
      const valeurs = angles.map((a) => a[axe])
      return `${Math.min(...valeurs).toFixed(1)}…${Math.max(...valeurs).toFixed(1)}°`
    })
    console.log(`- ${cote}${os} : X ${plages[0]} | Y ${plages[1]} | Z ${plages[2]}`)
  }
}
