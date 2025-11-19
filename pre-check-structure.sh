#!/bin/bash
# Pre-Check: Zeigt deutsche Struktur als Referenz

echo "=== Deutsche Referenz-Struktur ==="
tree -d de/entwicklungshandbuch -L 3

echo -e "\n=== Dateinamen in de/entwicklungshandbuch/module/karten ==="
ls -1 de/entwicklungshandbuch/module/karten/

echo -e "\n=== Erwartete englische Struktur ==="
echo "en/entwicklungshandbuch/ (gleiche Unterverzeichnisse wie de/)"

