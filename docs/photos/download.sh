#!/usr/bin/env bash
# Télécharge les photos de référence dans references/<zone>/ (à lancer depuis la racine du projet).
# Une adresse en échec est signalée puis ignorée.
cd "$(dirname "$0")/../.."
for list in docs/photos/*.txt; do
  zone="$(basename "$list" .txt)"
  [ "$zone" = "commons" ] && continue   # pages Commons : à ouvrir, pas à télécharger
  mkdir -p "references/$zone"
  i=0
  while IFS= read -r url; do
    case "$url" in ""|\#*) continue ;; esac
    i=$((i+1))
    ext="${url##*.}"; ext="${ext%%\?*}"
    out="references/$zone/$(printf '%02d' "$i").$ext"
    [ -s "$out" ] && continue
    if ! curl -sSfL -m 30 -A "Mozilla/5.0" -o "$out" "$url"; then
      echo "  échec : $url"; rm -f "$out"
    fi
  done < "$list"
  echo "→ $zone : $(ls "references/$zone" | wc -l) photo(s)"
done
