const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')
const link=href=>/^(https?:\/\/|\/(?!\/)|#)[^\s]*$/.test(href)&&!/["'<>]/.test(href)
function inline(text){
 return escape(text).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\[([^\]]+)\]\(([^)]+)\)/g,(_,label,href)=>link(href)?`<a href="${href}" rel="noreferrer">${label}</a>`:label).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
}
export function renderDocumentation(markdown,title='记忆管理文档'){
 const lines=markdown.split('\n'),out=[];let code=null,list=false,table=false
 const close=()=>{if(list){out.push('</ul>');list=false}if(table){out.push('</tbody></table></div>');table=false}}
 for(let i=0;i<lines.length;i++){
  const line=lines[i]
  if(line.startsWith('```')){close();if(code!==null){out.push('<pre><code>'+escape(code.join('\n'))+'</code></pre>');code=null}else code=[];continue}
  if(code!==null){code.push(line);continue}
  if(/^\|/.test(line)&&/^\|[\s:|\-]+\|$/.test(lines[i+1]??'')){close();out.push('<div class="table"><table><thead><tr>'+line.split('|').slice(1,-1).map(v=>'<th>'+inline(v.trim())+'</th>').join('')+'</tr></thead><tbody>');table=true;i++;continue}
  if(table&&/^\|/.test(line)){out.push('<tr>'+line.split('|').slice(1,-1).map(v=>'<td>'+inline(v.trim())+'</td>').join('')+'</tr>');continue}
  if(table){out.push('</tbody></table></div>');table=false}
  const heading=line.match(/^(#{1,6}) (.*)$/)
  if(heading){close();const id=heading[2].toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'');out.push(`<h${heading[1].length} id="${escape(id)}">${inline(heading[2])}</h${heading[1].length}>`)}
  else if(/^[-*] /.test(line)){if(!list){out.push('<ul>');list=true}out.push('<li>'+inline(line.slice(2))+'</li>')}
  else if(line.trim()){close();out.push('<p>'+inline(line)+'</p>')}else close()
 }
 close();if(code!==null)out.push('<pre><code>'+escape(code.join('\n'))+'</code></pre>')
 return '<!doctype html><html lang="zh"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(title)+'</title><style>html{color-scheme:light dark}body{max-width:920px;margin:32px auto;padding:0 24px 60px;font:15px/1.7 system-ui}a{color:light-dark(#27635e,#8cc9bd)}pre{padding:16px;background:#8881;overflow:auto;border-radius:8px}code{overflow-wrap:anywhere}h2{margin-top:36px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #8885;padding:8px;text-align:left}.table{overflow:auto}nav{display:flex;gap:16px;flex-wrap:wrap}@media(max-width:500px){body{margin:20px auto;padding:0 16px 40px}}</style></head><body><nav>'+['OPTIONS','API','VALIDATION','README'].map(key=>`<a href="/api/dsh-memory-manager/documentation?document=${key}">${key}</a>`).join('')+'</nav><main>'+out.join('\n')+'</main></body></html>'
}
