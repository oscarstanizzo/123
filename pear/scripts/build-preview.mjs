/* Bundle the site into one self-contained file for the Artifact viewer, whose
   CSP blocks every external host — so CSS, JS and both fonts are inlined.
   The viewer supplies its own <!doctype>/<html>/<head>/<body>, so this emits
   the page's *contents* only.
   node pear/scripts/build-preview.mjs                                      */
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => readFile(path.join(dir, f), 'utf8');

const html = await read('index.html');
let css = await read('css/pear.css');
const js = await read('js/pear.js');

/* fonts -> data URIs, so @font-face resolves with no network at all */
for (const name of ['archivo-var-latin', 'publicsans-var-latin']) {
  const b64 = (await readFile(path.join(dir, 'fonts', `${name}.woff2`))).toString('base64');
  const before = css;
  css = css.replace(`url("../fonts/${name}.woff2")`,
                    `url("data:font/woff2;base64,${b64}")`);
  if (css === before) throw new Error(`font ${name} was not referenced by the CSS`);
}

/* take the page's contents, minus the tags the viewer provides itself */
const body = html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>'))
  .replace(/\n<script src="js\/pear\.js" defer><\/script>/, '');
if (!body.includes('id="stage"')) throw new Error('body extraction looks wrong');

const out = `<title>Pear Ora</title>
<meta name="description" content="Marketing site for Pear, a fictional house that makes one luxury phone a year. The product is drawn in SVG and recolours live.">
<style>
${css}
</style>
${body}
<script>
${js}
</script>
`;
await writeFile(path.join(dir, 'preview.html'), out);
console.log(`preview.html  ${(Buffer.byteLength(out) / 1024).toFixed(0)} KB (self-contained)`);
