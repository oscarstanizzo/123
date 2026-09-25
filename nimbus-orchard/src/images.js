// Higgsfield-generated illustrations (Z Image), fetched by scripts/fetch-images.sh.
// Missing files resolve to undefined and the components fall back to SVG art.
const files = import.meta.glob('./assets/gen/*.webp', { eager: true, import: 'default' })

export const img = (name) => files[`./assets/gen/${name}.webp`]
