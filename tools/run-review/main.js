import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { adoucirAnimationsBras } from '../../src/player/animationsV6.ts'

const LARGEUR = 1280
const HAUTEUR = 720
const DUREE = 12
const EPAULE_VIRTUELLE = { x: 0.215, y: 1.3, z: -0.09 }

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
renderer.setSize(LARGEUR, HAUTEUR, false)
renderer.setPixelRatio(1)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.setScissorTest(true)
document.body.appendChild(renderer.domElement)

function etiquette(texte, couleur) {
  const canvas = document.createElement('canvas')
  canvas.width = 768
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = 'rgba(8, 14, 20, 0.88)'
  ctx.roundRect(8, 8, 752, 112, 24)
  ctx.fill()
  ctx.strokeStyle = couleur
  ctx.lineWidth = 6
  ctx.stroke()
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 50px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(texte, 384, 66)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false }))
  sprite.scale.set(1.75, 0.29, 1)
  sprite.position.set(0, 2.02, 0.35)
  sprite.renderOrder = 10
  return { sprite, canvas, ctx, texture }
}

function changerEtiquette(etiquette, texte) {
  const { ctx, canvas, texture } = etiquette
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = 'rgba(8, 14, 20, 0.88)'
  ctx.roundRect(8, 8, 752, 112, 24)
  ctx.fill()
  ctx.strokeStyle = etiquette.couleur
  ctx.lineWidth = 6
  ctx.stroke()
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 50px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(texte, 384, 66)
  texture.needsUpdate = true
}

function preparerFermeture(scene) {
  let skinned
  scene.traverse((objet) => {
    if (!skinned && objet.isSkinnedMesh) skinned = objet
  })
  if (!skinned) return []
  const { bones, boneInverses } = skinned.skeleton
  const nom = (os) => os.name.replace(/mixamorig:?/, '')
  const iSpine2 = bones.findIndex((os) => nom(os) === 'Spine2')
  const versSpine2 = boneInverses[iSpine2]
  const q = new THREE.Quaternion()
  versSpine2.decompose(new THREE.Vector3(), q, new THREE.Vector3())
  const axe = new THREE.Vector3(0, 0, 1).applyQuaternion(q).normalize()
  return [['Left', -1], ['Right', 1]].map(([cote, signe]) => {
    const os = bones.find((b) => nom(b) === `${cote}ForeArm`)
    const pivot = new THREE.Vector3(signe * -EPAULE_VIRTUELLE.x, EPAULE_VIRTUELLE.y, EPAULE_VIRTUELLE.z).applyMatrix4(versSpine2)
    return {
      os,
      pivot,
      rotation: new THREE.Quaternion().setFromAxisAngle(axe, THREE.MathUtils.degToRad(signe * 12)),
      position0: new THREE.Vector3(),
      quaternion0: new THREE.Quaternion(),
      ferme: false,
    }
  })
}

function fermer(bras) {
  for (const b of bras) {
    b.position0.copy(b.os.position)
    b.quaternion0.copy(b.os.quaternion)
    b.os.position.sub(b.pivot).applyQuaternion(b.rotation).add(b.pivot)
    b.os.quaternion.premultiply(b.rotation)
    b.ferme = true
  }
}

function rouvrir(bras) {
  for (const b of bras) {
    if (!b.ferme) continue
    b.os.position.copy(b.position0)
    b.os.quaternion.copy(b.quaternion0)
    b.ferme = false
  }
}

function environnement(texte, couleur) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x182532)
  scene.add(new THREE.HemisphereLight(0xeaf4ff, 0x384451, 2.1))
  const principale = new THREE.DirectionalLight(0xffffff, 3.2)
  principale.position.set(2.5, 4.5, 3.5)
  scene.add(principale)
  const contre = new THREE.DirectionalLight(0x9ecbff, 1.4)
  contre.position.set(-3, 2, -2)
  scene.add(contre)
  const sol = new THREE.Mesh(
    new THREE.CircleGeometry(3, 64),
    new THREE.MeshStandardMaterial({ color: 0x55616b, roughness: 0.92 }),
  )
  sol.rotation.x = -Math.PI / 2
  scene.add(sol)
  const repere = new THREE.GridHelper(5, 20, 0x95a3ad, 0x66737d)
  repere.position.y = 0.002
  scene.add(repere)
  const label = etiquette(texte, couleur)
  label.couleur = couleur
  scene.add(label.sprite)
  const camera = new THREE.PerspectiveCamera(34, (LARGEUR / 2) / HAUTEUR, 0.01, 20)
  camera.position.set(0, 1.15, 3.65)
  camera.lookAt(0, 1.02, 0)
  return { scene, camera, label }
}

async function charger(url, avant) {
  const gltf = await new GLTFLoader().loadAsync(url)
  const clips = avant ? adoucirAnimationsBras(gltf.animations).clips : gltf.animations
  const clip = clips.find((c) => c.name === 'Running')
  const mixer = new THREE.AnimationMixer(gltf.scene)
  const action = mixer.clipAction(clip).play()
  action.paused = true
  const boite = new THREE.Box3().setFromObject(gltf.scene)
  const centre = boite.getCenter(new THREE.Vector3())
  gltf.scene.position.set(-centre.x, -boite.min.y, -centre.z)
  gltf.scene.traverse((objet) => {
    if (objet.isMesh) {
      objet.frustumCulled = false
      objet.material.side = THREE.FrontSide
    }
  })
  return { objet: gltf.scene, mixer, action, clip, bras: preparerFermeture(gltf.scene) }
}

const gauche = environnement('AVANT • FACE', '#f0a24a')
const droite = environnement('APRÈS • FACE', '#56d38b')
const [avant, apres] = await Promise.all([
  charger('/models/hasidic_man_v6_brasSym.glb', true),
  charger('/models/hasidic_man_v6_player.glb', false),
])
gauche.scene.add(avant.objet)
droite.scene.add(apres.objet)

function interpolation(t, a, b) {
  const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1)
  return x * x * (3 - 2 * x)
}

function angleEtVue(t) {
  if (t < 3.4) return { angle: 0, vue: 'FACE' }
  if (t < 4) return { angle: -Math.PI / 2 * interpolation(t, 3.4, 4), vue: 'FACE → PROFIL' }
  if (t < 7.4) return { angle: -Math.PI / 2, vue: 'PROFIL' }
  if (t < 8) return { angle: THREE.MathUtils.lerp(-Math.PI / 2, -Math.PI, interpolation(t, 7.4, 8)), vue: 'PROFIL → DOS' }
  return { angle: -Math.PI, vue: 'DOS' }
}

let vuePrecedente = ''
function poser(personnage, temps, angle) {
  rouvrir(personnage.bras)
  personnage.action.time = temps % personnage.clip.duration
  personnage.mixer.update(0)
  fermer(personnage.bras)
  personnage.objet.rotation.y = angle
}

function renderAt(temps) {
  const { angle, vue } = angleEtVue(temps % DUREE)
  poser(avant, temps, angle)
  poser(apres, temps, angle)
  if (vue !== vuePrecedente) {
    changerEtiquette(gauche.label, `AVANT • ${vue}`)
    changerEtiquette(droite.label, `APRÈS • ${vue}`)
    vuePrecedente = vue
  }
  renderer.setViewport(0, 0, LARGEUR / 2, HAUTEUR)
  renderer.setScissor(0, 0, LARGEUR / 2, HAUTEUR)
  renderer.render(gauche.scene, gauche.camera)
  renderer.setViewport(LARGEUR / 2, 0, LARGEUR / 2, HAUTEUR)
  renderer.setScissor(LARGEUR / 2, 0, LARGEUR / 2, HAUTEUR)
  renderer.render(droite.scene, droite.camera)
}

async function enregistrer() {
  const types = [
    'video/mp4;codecs=avc1.42E01E',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ]
  const mimeType = types.find((type) => MediaRecorder.isTypeSupported(type))
  if (!mimeType) throw new Error('Aucun encodeur MediaRecorder vidéo disponible')
  const flux = renderer.domElement.captureStream(30)
  const morceaux = []
  const recorder = new MediaRecorder(flux, { mimeType, videoBitsPerSecond: 8_000_000 })
  recorder.ondataavailable = (event) => event.data.size && morceaux.push(event.data)
  const fini = new Promise((resolve) => { recorder.onstop = resolve })
  recorder.start(500)
  const depart = performance.now()
  await new Promise((resolve) => {
    function image(maintenant) {
      const temps = (maintenant - depart) / 1000
      renderAt(Math.min(temps, DUREE - 1 / 30))
      if (temps < DUREE) requestAnimationFrame(image)
      else resolve()
    }
    requestAnimationFrame(image)
  })
  recorder.stop()
  await fini
  flux.getTracks().forEach((track) => track.stop())
  const extension = mimeType.startsWith('video/mp4') ? 'mp4' : 'webm'
  const blob = new Blob(morceaux, { type: mimeType })
  const lien = document.createElement('a')
  lien.href = URL.createObjectURL(blob)
  lien.download = `comparatif-run-avant-apres.${extension}`
  lien.click()
  return { mimeType, extension, taille: blob.size, duree: DUREE }
}

renderAt(0)
window.__runReview = { ready: true, renderAt, enregistrer, duree: DUREE }
