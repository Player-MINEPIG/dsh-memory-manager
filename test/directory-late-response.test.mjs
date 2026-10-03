import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const states=['p','','',[],[],'old-cursor',null,false],effects=[]
let at=0,ei=0,resolveFetch,request
const useState=initial=>{const index=at++;return [states[index]??(states[index]=typeof initial==='function'?initial():initial),v=>states[index]=typeof v==='function'?v(states[index]):v]}
const useEffect=(run,deps)=>{const index=ei++,old=effects[index];if(!old||JSON.stringify(old.deps)!==JSON.stringify(deps)){old?.cleanup?.();effects[index]={deps,cleanup:run()}}}
const h=(type,props,...children)=>({type,props:{...props,children:children.flat(Infinity)}})
const flatten=node=>node&&typeof node==='object'?[node,...(node.props?.children??[]).flatMap(flatten)]:[]
const fetch=async(url,options)=>{request={url:String(url),hasSignal:!!options?.signal};return await new Promise(resolve=>resolveFetch=resolve)}
const source=readFileSync('src/client-directory.js','utf8').replace(/^import.*\n/,'').replace('export function','function')
const create=new Function('h','useState','useEffect','fetch','setTimeout','clearTimeout',source+';return DirectoryPicker')
const Picker=create(h,useState,useEffect,fetch,()=>1,()=>{})
const props={kind:'characterId',catalog:{directories:[{id:'p',enabled:true,kinds:['characterId'],label:'P'}]},onSelect(){},onBack(){}}
const render=()=>{at=ei=0;return flatten(Picker(props))}
let tree=render();states[5]='old-cursor';tree=render()
const next=tree.find(n=>n.type==='button'&&n.props.children.includes('加载下一页'));const pending=next.props.onClick()
tree.find(n=>n.type==='input'&&n.props['aria-label']==='搜索作用域').props.onChange({target:{value:'new-query'}})
render();assert.deepEqual(states[3],[])
resolveFetch({ok:true,json:async()=>({items:[{id:'old-query-row',label:'Old query'}],nextCursor:null})});await pending
console.log(JSON.stringify({request,currentQuery:states[1],items:states[3]},null,2))
assert.deepEqual(states[3],[],'Previous query page must not populate the new query')
