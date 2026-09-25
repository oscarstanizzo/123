// Folds the Vite build into one self-contained page (dist/artifact.html)
// so it can be published as a single-file artifact.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'

const dir = 'dist/assets'
const files = readdirSync(dir)
const read = (ext) =>
  files.filter((f) => f.endsWith(ext)).map((f) => readFileSync(`${dir}/${f}`, 'utf8')).join('\n')

const head = readFileSync('head.html', 'utf8')
const css = read('.css')
const js = read('.js').replace(/<\/script/gi, '<\\/script')

writeFileSync(
  'dist/artifact.html',
  `${head}<style>\n${css}\n</style>\n<div id="root"></div>\n<script type="module">\n${js}\n</script>\n`,
)
console.log('wrote dist/artifact.html')
