import * as THREE from 'three'

// Pieds au sol pendant la marche (retour de Samuel, 12/11/2026 : « il marche
// 2 ou 3 cm au-dessus du sol »). Le clip Walking de Meshy garde les semelles
// 2 à 5 cm au-dessus du sol (mesuré sur le maillage déformé). À chaque image,
// après l'animation, on mesure le point le plus bas des semelles (quelques
// sommets du dessous des chaussures, choisis une fois) et on décale le corps
// pour qu'il touche le sol. Les os ne suffisent pas : en marche, la cheville
// descend pendant que la semelle, inclinée, remonte.

const MAX_HAUT = 0.08
const MAX_BAS = 0.05
const V = new THREE.Vector3()
const B = new THREE.Vector3()

export function creerPiedsAuSol(racine: THREE.Object3D) {
  let sk: THREE.SkinnedMesh | undefined
  racine.traverse((o) => {
    if (!sk && (o as THREE.SkinnedMesh).isSkinnedMesh) sk = o as THREE.SkinnedMesh
  })
  const indices: number[] = []
  if (sk) {
    // Sommets du dessous des chaussures, en pose de liaison
    const pos = sk.geometry.attributes.position
    const ys: number[] = []
    for (let i = 0; i < pos.count; i++) ys.push(V.fromBufferAttribute(pos, i).applyMatrix4(sk.bindMatrix).y)
    const min = Math.min(...ys)
    for (let i = 0; i < pos.count; i++) if (ys[i] < min + 0.04) indices.push(i)
    // Au plus 160 sommets, répartis
    const pasI = Math.max(1, Math.ceil(indices.length / 160))
    for (let k = indices.length - 1; k >= 0; k--) if (k % pasI) indices.splice(k, 1)
  }
  return {
    appliquer() {
      racine.position.y = 0
      if (!sk || !indices.length) return
      racine.updateMatrixWorld(true)
      const base = racine.getWorldPosition(B).y
      let bas = Infinity
      for (const i of indices) {
        sk.getVertexPosition(i, V)
        V.applyMatrix4(sk.matrixWorld)
        if (V.y < bas) bas = V.y
      }
      const d = THREE.MathUtils.clamp(bas - base, -MAX_BAS, MAX_HAUT)
      racine.position.y = -d
    },
  }
}
