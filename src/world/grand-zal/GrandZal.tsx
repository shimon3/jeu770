import { useEffect } from 'react'
import { useChargement } from '../../state/chargement'
import { ZAL } from '../../config/grandZal'
import { useMateriauxZal } from './materiauxZal'
import { EnveloppeZal } from './EnveloppeZal'
import { MobilierZal } from './MobilierZal'
import { BimahZal } from './BimahZal'
import { AronKodesh } from './AronKodesh'
import { PlaceVide } from './PlaceVide'
import { PieceChaise } from './PieceChaise'
import { DecorZal, EclairageZal, PlafonniersZal } from './PlafonniersZal'
import { ObjetsMissionsZal } from './ObjetsMissionsZal'
import { PnjZal } from '../../npc/PnjZal'
import { useGame } from '../../state/store'
import { pnjLegersActifs } from '../../npc/PnjEnfant'
import { GroupeDiscussion } from '../../npc/GroupeDiscussion'
import { EtudeZal } from './EtudeZal'

const PNJ_LEGERS = pnjLegersActifs()
// Autour des tables d'étude, sans traverser les bancs ni les tables
const LIEUX_GARCONS_ZAL: [number, number][] = [
  [8.8, -23.2],
  [8.8, -28.4],
  [-2.85, -28.4],
  [-2.85, -23.2],
]

// Grand Zal souterrain (état de référence : Tichri 2025). Voir
// config/grandZal.ts pour ce qui est confirmé et ce qui est reconstitué.

const S = ZAL.sol

export function GrandZal() {
  // Monté : le préchauffage de la scène peut l'inclure
  useEffect(() => void useChargement.setState({ zal: true }), [])
  const m = useMateriauxZal()
  // Allègement : les PNJ du Zal n'existent que lorsque le joueur est dans le
  // Zal ou l'escalier ; ailleurs, ils ne sont ni dessinés ni calculés
  const zone = useGame((s) => s.zone)
  const pnjActifs = zone === 'grand-zal' || zone === 'escalier-zal' || zone === 'chaise-rabbi'
  return (
    <>
      <EnveloppeZal m={m} />
      <MobilierZal m={m} />
      <BimahZal m={m} />
      <AronKodesh m={m} />
      <PlaceVide m={m} />
      <PieceChaise m={m} />
      <PlafonniersZal m={m} />
      <DecorZal m={m} />
      <EclairageZal />
      <ObjetsMissionsZal m={m} />

      {/* PNJ : hassidim anonymes. Aucun ne s'approche de la place vide (npc/routines.ts). */}
      {pnjActifs && (
      <group>
      {/* Immobile seulement pour parler : le joueur peut lui adresser la parole */}
      <PnjZal id="pnj-entree-interieur" position={[28.5, S, -2.7]} rotationY={-Math.PI / 2} />
      <PnjZal id="pnj-zal" position={[5.0, S, -24.0]} rotationY={Math.PI * 0.85} nomCle="zal.pnjNom" peau="#d2a07f" barbe="#3a2a1e" />
      <PnjZal id="pnj-etudiant" position={[3.6, S, -26.4]} rotationY={0} etat="assis" nomCle="zal.etudiantNom" repliqueCle="zal.etudiantRepos" peau="#c58f6c" barbe="#1f1712" />
      <PnjZal id="pnj-balancement-1" position={[10.0, S, -16.0]} rotationY={Math.PI / 2} etat="balancement" parle={false} barbe="#6b6b6b" />
      <PnjZal id="pnj-balancement-2" position={[2.0, S, -29.4]} rotationY={Math.PI} etat="balancement" parle={false} peau="#b98466" />
      <PnjZal id="pnj-assis-1" position={[13.8, S, -12.0]} rotationY={Math.PI / 2} etat="assis" parle={false} barbe="#2b1d14" />
      <PnjZal id="pnj-assis-2" position={[17.4, S, -19.5]} rotationY={Math.PI / 2} etat="assis" parle={false} peau="#d9b08f" barbe="#8a6a4a" />
      <PnjZal id="pnj-assis-3" position={[29.6, S, -24.5]} rotationY={Math.PI / 2} etat="assis" parle={false} barbe="#3d2b1f" />
      <PnjZal id="pnj-assis-4" position={[32.0, S, -7.0]} rotationY={Math.PI / 2} etat="assis" parle={false} peau="#c89a7a" barbe="#555" />
      <PnjZal
        id="pnj-marcheur-1"
        position={[21.0, S, -3.0]}
        rotationY={Math.PI}
        parle={false}
        chemin={[
          [21.0, -3.0],
          [21.0, -27.0],
          [26.0, -27.0],
          [26.0, -3.0],
        ]}
      />
      <PnjZal
        id="pnj-marcheur-2"
        position={[-2.85, S, -23.8]}
        rotationY={Math.PI / 2}
        parle={false}
        peau="#d5a585"
        barbe="#222"
        chemin={[
          [-2.85, -23.8],
          [8.8, -23.8],
          [8.8, -28.3],
          [-2.85, -28.3],
        ]}
      />
      {/* Hommes qui étudient en havrouta (groupes de 2 ou 4) */}
      <EtudeZal />
      {/* Garçons (section des hommes : ni fille ni femme ici) */}
      {PNJ_LEGERS && (
        <>
          <GroupeDiscussion
            id="groupe-garcons-zal"
            y={S}
            lieux={LIEUX_GARCONS_ZAL}
            membres={[
              { id: 'enfant-zal-1', modele: 'enfant' },
              { id: 'enfant-zal-2', modele: 'enfant' },
            ]}
          />
        </>
      )}
      </group>
      )}
    </>
  )
}
