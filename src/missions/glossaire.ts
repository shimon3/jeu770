// Mots hassidiques expliqués dans la fiche de départ des missions
// (22/11/2026). Mot et définition dans src/i18n (glossaire.<id>.mot / .def).
const TERMES = ["farbrenguen", "pouchke", "tsedaka", "mivtsaim", "gabbai", "bimah", "siddour", "chaliah", "tefilines", "aron", "zal"]

const sansAccents = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

// Termes présents dans le texte (dans la langue affichée)
export function termesDe(texte: string, t: (cle: string) => string): { mot: string; def: string }[] {
  const tx = sansAccents(texte)
  return TERMES.filter((id) => tx.includes(sansAccents(t(`glossaire.${id}.mot`)))).map((id) => ({ mot: t(`glossaire.${id}.mot`), def: t(`glossaire.${id}.def`) }))
}
