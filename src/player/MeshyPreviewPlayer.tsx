import { useEffect, useMemo, useState, type MutableRefObject } from 'react'
import { createPortal } from 'react-dom'
import { useFrame } from '@react-three/fiber'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'
import { Avatar, type Anim } from './Avatar'

// Only enabled explicitly with ?meshyPreview=1. Loads selected GLB in memory,
// without uploading it to GitHub, a backend, or Cloudflare.
export function MeshyPreviewPlayer({ anim }: { anim: MutableRefObject<Anim> }) {
  const [gltf, setGltf] = useState<GLTF | null>(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('Choisir jeu770_idle_walk.glb')
  const mixer = useMemo(() => gltf ? new THREE.AnimationMixer(gltf.scene) : null, [gltf])
  const actions = useMemo(() => mixer && gltf ? gltf.animations.map(clip => ({ clip, action: mixer.clipAction(clip) })) : [], [mixer, gltf])
  const active = useMemo(() => ({ name: '' }), [gltf])
  useEffect(() => () => { mixer?.stopAllAction() }, [mixer])
  useFrame((_, delta) => {
    if (!mixer || !gltf || !actions.length) return
    const moving = ['marche', 'course', 'escalier'].includes(anim.current.etat)
    const match = actions.find(({ clip }) => moving ? /walk/i.test(clip.name) : /idle/i.test(clip.name))
    if (match && match.clip.name !== active.name) {
      const previous = actions.find(({ clip }) => clip.name === active.name)
      const next = match.action
      next.reset().play()
      if (previous) previous.action.crossFadeTo(next, 0.22, false)
      active.name = match.clip.name
    }
    mixer.update(Math.min(delta, 0.05))
  })
  async function open(file?: File) {
    if (!file) return
    try {
      const ab = await file.arrayBuffer()
      const parsed = await new GLTFLoader().parseAsync(ab, '')
      if (!parsed.animations.some(c => /walk/i.test(c.name)) || !parsed.animations.some(c => /idle/i.test(c.name)))
        throw new Error('Le GLB doit contenir Idle et Quick Walk')
      const box = new THREE.Box3().setFromObject(parsed.scene)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      if (!size.y) throw new Error('Taille du modèle invalide')
      const scale = 1.8 / size.y
      parsed.scene.scale.setScalar(scale)
      parsed.scene.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale)
      parsed.scene.traverse(o => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true } })
      setGltf(parsed); setInfo('Meshy chargé localement : '+file.name); setError('')
    } catch (e) { setError(String(e)) }
  }
  return <>
    {gltf ? <primitive object={gltf.scene} /> : <Avatar anim={anim} />}
    {typeof document !== 'undefined' && createPortal(
      <div style={{position:'fixed',zIndex:9999,top:8,left:8,padding:12,borderRadius:8,background:'#17212de8',color:'white',font:'13px system-ui',maxWidth:350}}>
        <div><strong>770 — Mode test Meshy</strong></div>
        <input type="file" accept=".glb" onChange={e => void open(e.target.files?.[0])} aria-label="Importer personnage Meshy GLB" />
        <div>{info}</div>{error && <div style={{color:'#ffaaaa'}}>{error}</div>}
      </div>, document.body)}
  </>
}
