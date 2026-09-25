#!/usr/bin/env sh
# Downloads the Higgsfield-generated illustrations into src/assets/gen.
# The site falls back to its drawn SVG art for any file that is missing.
set -e
BASE=https://d8j0ntlcm91z4.cloudfront.net/user_3IHN2cVptCI91PYiNaURSpq85g0
DIR="$(dirname "$0")/../src/assets/gen"
mkdir -p "$DIR"
while read -r name file; do
  curl -fsSL -o "$DIR/$name.webp" "$BASE/${file}_min.webp"
  echo "fetched $name"
done <<LIST
landscape hf_20260925_132939_9fdbfaf5-61ad-407c-b2d1-c19d1d4e784b
quince hf_20260925_132939_cb05483f-a90a-4d46-b8b5-82e07558b684
plum hf_20260925_132902_832b61cb-1904-497a-a80b-1fdb6a7f1744
pear hf_20260925_132939_d9d3b0e7-70e2-40e6-9458-de6af8b4aa32
fig hf_20260925_133024_948af5fc-978c-4575-a596-758c43251123
currant hf_20260925_133045_b18d3efe-9bdd-453f-80e2-e93158e0be0a
grape hf_20260925_133004_c4649c3c-4050-4220-94f5-989a6d87562c
picker hf_20260925_132939_0c7f6756-74f6-4a59-8676-dc90a337add5
LIST
