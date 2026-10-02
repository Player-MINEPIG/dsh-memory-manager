import { build } from 'esbuild'
import { readFileSync,writeFileSync,rmSync } from 'node:fs'
await build({entryPoints:['src/client.js'],bundle:true,format:'cjs',platform:'browser',target:'es2022',outfile:'dist/client.cjs',external:['react','@deepseek-ai/*']})
writeFileSync('dist/client.js',`window.__ModuleLoader__.load({id:"dsh-memory-manager",factory:(require)=>{var module={exports:{}};var exports=module.exports;\n${readFileSync('dist/client.cjs','utf8')}\nreturn module.exports;}});\n`)
rmSync('dist/client.cjs')
