# images/

Put the original camera-named photos here, plus the logo. Nothing in this
folder is committed except this file — the optimized output is generated.

Expected sources (13 photos):

| Camera file | Becomes |
|---|---|
| IMG_9148 | hero-front-yard-armour-stone |
| IMG_0566 | backyard-transformation-before |
| IMG_0547 | backyard-transformation-after |
| IMG_7969 | crew-loaded-bin-junk-removal |
| IMG_0543 | river-rock-shed-bed |
| IMG_0580 | cleanup-side-yard-before |
| IMG_0733 | mulch-backyard-japanese-maple |
| IMG_9337 | front-bed-hostas-rock-accent |
| IMG_0717 | foundation-bed-hemlock |
| IMG_0704 | mulch-ring-mature-pine-after |
| IMG_0685 | mulch-ring-fabric-during |
| IMG_9570 | new-planting-timber-edge |
| IMG_9560 | cedar-hedge-stained-fence |

Then run `npm run images` from the repo root. Anything not on this list is left
alone and reported rather than renamed on a guess.

The logo is not part of the photo pipeline — the header and footer currently use
an inline SVG placeholder mark that needs swapping for the real asset.
