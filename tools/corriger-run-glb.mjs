import crypto from 'node:crypto'
import fs from 'node:fs'
import * as THREE from 'three'

const [entree, sortie] = process.argv.slice(2)
if (!entree || !sortie) {
  throw new Error('Usage : node tools/corriger-run-glb.mjs entree.glb sortie.glb')
}

const source = fs.readFileSync(entree)
if (source.toString('ascii', 0, 4) !== 'glTF') throw new Error('Le fichier source n\'est pas un GLB')
const resultat = Buffer.from(source)
const longueurJson = source.readUInt32LE(12)
const json = JSON.parse(source.toString('utf8', 20, 20 + longueurJson))
const debutBin = 20 + longueurJson + 8

const composants = { VEC3: 3, VEC4: 4 }

function acces(index) {
  const accesseur = json.accessors[index]
  const vue = json.bufferViews[accesseur.bufferView]
  if (accesseur.componentType !== 5126 || !composants[accesseur.type]) {
    throw new Error(`Accesseur ${index} non pris en charge`)
  }
  const largeur = composants[accesseur.type]
  const pas = vue.byteStride ?? largeur * 4
  const debut = debutBin + (vue.byteOffset ?? 0) + (accesseur.byteOffset ?? 0)
  return {
    count: accesseur.count,
    largeur,
    lire(i) {
      return Array.from({ length: largeur }, (_, c) => resultat.readFloatLE(debut + i * pas + c * 4))
    },
    ecrire(i, valeurs) {
      valeurs.forEach((valeur, c) => resultat.writeFloatLE(valeur, debut + i * pas + c * 4))
    },
  }
}

const normaliser = (nom = '') => nom.replace(/mixamorig:?/, '')
const animation = (nom) => json.animations.find((a) => a.name === nom)
const parents = new Map()
json.nodes.forEach((noeud, parent) => noeud.children?.forEach((enfant) => parents.set(enfant, parent)))

function quaternionLocal(noeud) {
  if (noeud.matrix) {
    const q = new THREE.Quaternion()
    new THREE.Matrix4().fromArray(noeud.matrix).decompose(new THREE.Vector3(), q, new THREE.Vector3())
    return q
  }
  return new THREE.Quaternion(...(noeud.rotation ?? [0, 0, 0, 1]))
}

function quaternionMonde(index) {
  const chaine = []
  for (let courant = index; courant !== undefined; courant = parents.get(courant)) chaine.unshift(courant)
  return chaine.reduce((q, i) => q.multiply(quaternionLocal(json.nodes[i])), new THREE.Quaternion())
}

function trouverCanal(anim, nomOs, chemin) {
  const trouve = anim.channels.find((c) => normaliser(json.nodes[c.target.node]?.name) === nomOs && c.target.path === chemin)
  if (!trouve) throw new Error(`Canal absent : ${anim.name}/${nomOs}.${chemin}`)
  return { piste: acces(anim.samplers[trouve.sampler].output), noeud: trouve.target.node }
}

function quaternionMoyen(piste) {
  const premier = new THREE.Quaternion(...piste.lire(0))
  const somme = new THREE.Vector4()
  for (let i = 0; i < piste.count; i++) {
    const q = new THREE.Quaternion(...piste.lire(i))
    const signe = premier.dot(q) < 0 ? -1 : 1
    somme.x += q.x * signe
    somme.y += q.y * signe
    somme.z += q.z * signe
    somme.w += q.w * signe
  }
  return new THREE.Quaternion(somme.x, somme.y, somme.z, somme.w).normalize()
}

function ecrireContinu(piste, index, quaternion, precedent) {
  if (precedent && precedent.dot(quaternion) < 0) quaternion.set(-quaternion.x, -quaternion.y, -quaternion.z, -quaternion.w)
  piste.ecrire(index, quaternion.toArray())
  return quaternion
}

function vecteurRotation(quaternion) {
  const q = quaternion.clone().normalize()
  if (q.w < 0) q.set(-q.x, -q.y, -q.z, -q.w)
  const angle = 2 * Math.acos(THREE.MathUtils.clamp(q.w, -1, 1))
  const sinus = Math.sqrt(Math.max(0, 1 - q.w * q.w))
  return sinus < 1e-7 ? new THREE.Vector3() : new THREE.Vector3(q.x, q.y, q.z).multiplyScalar(angle / sinus)
}

function quaternionDepuisVecteur(vecteur) {
  const angle = vecteur.length()
  return angle < 1e-7 ? new THREE.Quaternion() : new THREE.Quaternion().setFromAxisAngle(vecteur.clone().multiplyScalar(1 / angle), angle)
}

function corrigerBras(piste, reference, parent, facteurs) {
  const inverseReference = reference.clone().invert()
  const inverseParentMonde = quaternionMonde(parent).invert()
  const axes = [
    new THREE.Vector3(1, 0, 0).applyQuaternion(inverseParentMonde).normalize(),
    new THREE.Vector3(0, 1, 0).applyQuaternion(inverseParentMonde).normalize(),
    new THREE.Vector3(0, 0, 1).applyQuaternion(inverseParentMonde).normalize(),
  ]
  let precedent = null
  for (let i = 0; i < piste.count; i++) {
    const original = new THREE.Quaternion(...piste.lire(i)).normalize()
    if (reference.dot(original) < 0) original.set(-original.x, -original.y, -original.z, -original.w)
    // Delta prémultiplié : son axe est exprimé dans l'espace du parent. On le
    // projette sur les axes du modèle exprimés dans ce même espace.
    const rotation = vecteurRotation(original.clone().multiply(inverseReference))
    const corrigee = new THREE.Vector3()
      .addScaledVector(axes[0], rotation.dot(axes[0]) * facteurs.x)
      .addScaledVector(axes[1], rotation.dot(axes[1]) * facteurs.y)
      .addScaledVector(axes[2], rotation.dot(axes[2]) * facteurs.z)
    const corrige = quaternionDepuisVecteur(corrigee).multiply(reference).normalize()
    precedent = ecrireContinu(piste, i, corrige, precedent)
  }
}

function corrigerPoignet(piste, reference, facteur) {
  let precedent = null
  for (let i = 0; i < piste.count; i++) {
    const original = new THREE.Quaternion(...piste.lire(i)).normalize()
    const corrige = reference.clone().slerp(original, facteur).normalize()
    precedent = ecrireContinu(piste, i, corrige, precedent)
  }
}

const repos = animation('Idle_11')
const course = animation('Running')
if (!repos || !course) throw new Error('Les clips Idle_11 et Running sont requis')

for (const cote of ['Left', 'Right']) {
  const avantBras = `${cote}ForeArm`
  const main = `${cote}Hand`
  const brasRun = trouverCanal(course, avantBras, 'rotation')
  const brasRepos = trouverCanal(repos, avantBras, 'rotation')
  // Axe X du modèle : mouvement sagittal conservé avec sa phase d'origine.
  // Axes Y/Z : torsion et écart latéral fortement réduits.
  corrigerBras(brasRun.piste, quaternionMoyen(brasRepos.piste), parents.get(brasRun.noeud), {
    x: 0.4,
    y: 0.08,
    z: 0.08,
  })
  // Le poignet accompagne le bras sans cassure ni grand fouettement latéral.
  const mainRun = trouverCanal(course, main, 'rotation').piste
  const mainRepos = trouverCanal(repos, main, 'rotation').piste
  corrigerPoignet(mainRun, quaternionMoyen(mainRepos), 0.25)
}

fs.writeFileSync(sortie, resultat)

let octetsDifferents = 0
for (let i = 0; i < source.length; i++) if (source[i] !== resultat[i]) octetsDifferents++
const sha = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 16)
console.log(`Source : ${source.length} octets, sha256 ${sha(source)}`)
console.log(`Sortie : ${resultat.length} octets, sha256 ${sha(resultat)}`)
console.log(`Octets modifiés : ${octetsDifferents} (rotations Running des deux ForeArm et des deux Hand uniquement)`)
