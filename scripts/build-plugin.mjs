import { build } from 'esbuild'
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const reactDomRequire = createRequire(require.resolve('react-dom/package.json'))

const out = 'dist/plugin'
await mkdir(`${out}/lib`, { recursive: true })
const manifest = {
  name: 'dsh-agentarium', version: '0.1.0', private: true, type: 'module',
  description: 'Experimental read-only Agentarium conversation view. Verified against dsh 687f282e8625.',
  main: './lib/index.js', exports: { '.': './lib/index.js', './client': './lib/client.js', './package.json': './package.json' },
  files: ['lib', 'THIRD_PARTY_NOTICES.md', 'README.md'],
  dsh: { client: { platform: 'web', inject: ['@deepseek-ai/dsh-api-session-controller', '@deepseek-ai/dsh-client-ui-conversation', '@deepseek-ai/dsh-client-ui-renderer', '@deepseek-ai/dsh-client-connection'] } },
}
await build({ entryPoints: ['src/dsh/host.ts'], outfile: `${out}/lib/index.js`, bundle: true, format: 'esm', platform: 'node', target: 'es2022' })
await build({
  entryPoints: ['src/dsh/client.tsx'], outfile: `${out}/lib/client.js`, bundle: true, format: 'cjs', platform: 'browser', target: 'es2022', minify: true,
  external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client'], define: { 'process.env.NODE_ENV': '"production"' },
  banner: { js: 'window.__ModuleLoader__.load({ id: "dsh-agentarium", factory: (require) => { var module = { exports: {} }; var exports = module.exports;' },
  footer: { js: 'return module.exports; } });' },
  plugins: [{ name: 'scoped-inline-css', setup(builder) {
    builder.onResolve({ filter: /\.css\?inline$/ }, args => ({ path: resolve(args.resolveDir, args.path.replace('?inline', '')), namespace: 'inline-style' }))
    builder.onLoad({ filter: /.*/, namespace: 'inline-style' }, async args => ({ contents: await readFile(args.path, 'utf8'), loader: 'text' }))
  } }],
})
await writeFile(`${out}/package.json`, `${JSON.stringify(manifest, null, 2)}\n`)
const packages = ['ascii.rest', 'lucide-react', 'react', 'react-dom', 'scheduler']
let notices = '# Third-party notices\n\nRuntime dependency license texts. React/ReactDOM are supplied by the dsh host in the plugin bundle.\n'
for (const name of packages) {
  const packagePath = name === 'scheduler'
    ? reactDomRequire.resolve('scheduler/package.json')
    : resolve('node_modules', name, 'package.json')
  const pkg = JSON.parse(await readFile(packagePath, 'utf8'))
  const license = await readFile(resolve(dirname(packagePath), 'LICENSE'), 'utf8')
  notices += `\n## ${name} ${pkg.version}\n\n${license}\n`
}
await writeFile(`${out}/THIRD_PARTY_NOTICES.md`, notices)
await mkdir('dist/demo', { recursive: true })
await writeFile('dist/demo/THIRD_PARTY_NOTICES.md', notices)
await copyFile('docs/DSH-INTEGRATION.md', `${out}/README.md`)
console.log(`Plugin built: ${out} (shared host React, bundled ASCII, scoped styles)`)
