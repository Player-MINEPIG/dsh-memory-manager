import {createElement as h,useEffect,useState,useRef,useLayoutEffect,useSyncExternalStore} from 'react'
import {createPortal} from 'react-dom'
import {Tooltip} from '@deepseek-ai/dsh-client-ui-primitives'
import {currentSessionId,entryPlacement,createSessionPanel} from './session-entry.js'

function visibleControlRects(anchor,control,header){
 const viewport={width:document.documentElement.clientWidth,height:document.documentElement.clientHeight}
 return [...document.querySelectorAll('button,a,[role=button],input,select')].flatMap(e=>{
  if(e===control||anchor.contains(e)||e.closest('.dmm-overlay,[role=tooltip]')||!e.getClientRects().length||getComputedStyle(e).visibility==='hidden')return []
  const r=e.getBoundingClientRect()
  if(r.top>=header.top+43||r.bottom<=header.top+7||r.right<=0||r.left>=viewport.width)return []
  const points=[[r.left+r.width/2,r.top+r.height/2],[r.left+2,r.top+2],[r.right-2,r.top+2],[r.left+2,r.bottom-2],[r.right-2,r.bottom-2]]
  return points.some(([x,y])=>x>=0&&x<viewport.width&&y>=0&&y<viewport.height&&document.elementsFromPoint(x,y).some(hit=>e.contains(hit)))?[r]:[]
 })
}

function useEntryLayout(element,button,fallback){
 const [layout,setLayout]=useState({mode:'normal'}),size=useRef(null)
 useLayoutEffect(()=>{
  const anchor=element.current,control=button.current,header=anchor?.closest('header')
  if(!anchor||!control||(!fallback&&!header))return
  size.current={width:parseFloat(getComputedStyle(anchor).width),height:parseFloat(getComputedStyle(anchor).height)}
  let frame=0,settlingUntil=0
  const update=()=>{
   frame=0
   const headerRect=fallback?{left:0,right:document.documentElement.clientWidth,top:0,bottom:50}:header.getBoundingClientRect(),anchorRect=anchor.getBoundingClientRect()
   const controls=visibleControlRects(anchor,control,headerRect)
   let placement=entryPlacement(anchorRect,headerRect,controls,document.documentElement.clientWidth)
   // A popup's painted container may block a gap even when its buttons are
   // below the top band. Inspect the actual target before moving our button;
   // only background ancestors and our own nodes are safe to occupy.
   for(let attempt=0;attempt<6&&placement.mode!=='unavailable';attempt++){
    const r=placement.mode==='compact'?{left:placement.left,top:placement.top,width:placement.width,height:placement.height}:anchorRect
    // Check the whole target, beneath our moving button/placeholder too. A
    // clear center alone can still leave its edge over a foreign surface.
    const points=[[r.left+r.width/2,r.top+r.height/2],[r.left+1,r.top+1],[r.left+r.width-1,r.top+1],[r.left+1,r.top+r.height-1],[r.left+r.width-1,r.top+r.height-1]]
    const hit=points.map(([x,y])=>document.elementsFromPoint(x,y).find(node=>!anchor.contains(node))).find(node=>{
     if(!node||node.contains(anchor)||node.closest('.dmm-overlay,[role=tooltip]'))return false
     // The root fallback is outside the native header. Its empty public slot
     // background is safe after controls were excluded geometrically.
     return !(fallback&&node.closest('[data-slot="conversation.header"]')&&!node.closest('button,a,[role=button],input,select'))
    })
    if(!hit)break
    const obstacle=hit.getBoundingClientRect()
    if(!obstacle.width||!obstacle.height){placement={mode:'unavailable'};break}
    controls.push(obstacle);placement=entryPlacement(anchorRect,headerRect,controls,document.documentElement.clientWidth)
    if(attempt===5)placement={mode:'unavailable'}
   }
   const zoom=Math.round(anchorRect.width/parseFloat(getComputedStyle(anchor).width)*1e6)/1e6||1
   const next=placement.mode==='compact'?{...placement,zoom}:placement
   setLayout(previous=>JSON.stringify(previous)===JSON.stringify(next)?previous:next)
   if(performance.now()<settlingUntil)schedule()
  }
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update)}
  const settling=()=>{settlingUntil=performance.now()+750;schedule()}
  update();const resize=new ResizeObserver(schedule);resize.observe(header??document.documentElement)
  const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class','hidden','dir','data-open','data-state','aria-expanded','aria-hidden','open']})
  window.addEventListener('resize',schedule)
  const starts=['transitionrun','animationstart'],ends=['transitionend','transitioncancel','animationend','animationcancel']
  for(const event of starts)document.addEventListener(event,settling,true)
  for(const event of ends)document.addEventListener(event,schedule,true)
  return()=>{resize.disconnect();observer.disconnect();window.removeEventListener('resize',schedule);for(const event of starts)document.removeEventListener(event,settling,true);for(const event of ends)document.removeEventListener(event,schedule,true);if(frame)cancelAnimationFrame(frame)}
 },[fallback])
 return {layout,size:size.current}
}

const memoryIcon=()=>h('svg',{width:16,height:16,viewBox:'0 0 16 16',fill:'none',stroke:'currentColor','aria-hidden':true},h('rect',{x:3,y:2,width:10,height:12,rx:1.5}),h('path',{d:'M5.5 6h5M5.5 9h5'}))

export function createSessionEntries(Panel){
 const panel=createSessionPanel()
 function Header({sessionId,fallback=false}){
  const owner=useSyncExternalStore(panel.subscribe,panel.getSnapshot,panel.getSnapshot),open=owner?.sessionId===sessionId
  const element=useRef(null),button=useRef(null),{layout,size}=useEntryLayout(element,button,fallback)
  const compact=layout.mode==='compact',label=layout.mode==='unavailable'?'记忆管理；顶栏空间不足或被覆盖，请关闭弹出菜单、收起侧栏或扩大窗口。':'记忆管理'
  const toggle=()=>{if(open)panel.close();else panel.open(sessionId,button.current)}
  return h('div',{ref:element,className:fallback?'dmm-session-entry':'dmm-header-entry',style:fallback&&layout.mode==='unavailable'?{visibility:'hidden'}:compact?size:undefined},h(Tooltip,{label,side:'bottom',portal:true,maxWidth:260,disabled:open||layout.mode==='normal'},h('button',{ref:button,type:'button',className:compact?'dmm-entry-compact':undefined,style:compact?{position:'fixed',left:layout.left/layout.zoom,top:layout.top/layout.zoom,width:layout.width/layout.zoom,height:layout.height/layout.zoom}:undefined,'data-dmm-layout':layout.mode,'data-dmm-session-entry':sessionId,'data-dmm-native-entry':fallback?undefined:sessionId,onClick:toggle,'aria-label':'记忆管理','aria-expanded':open,'aria-haspopup':'dialog'},compact?memoryIcon():'记忆')))
 }
 function SessionEntry({useSessions}){
  const sessionId=useSessions(currentSessionId),[visibility,setVisibility]=useState({native:true,conversation:false})
  const owner=useSyncExternalStore(panel.subscribe,panel.getSnapshot,panel.getSnapshot)
  const close=()=>{
   const previous=panel.getSnapshot();panel.close()
   const visible=e=>e?.isConnected&&e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden'
   const target=visible(previous?.anchor)?previous.anchor:[...document.querySelectorAll('[data-dmm-session-entry]')].find(e=>e.dataset.dmmSessionEntry===sessionId&&visible(e))
   target?.focus()
  }
  useLayoutEffect(()=>{if(owner&&(owner.sessionId!==sessionId||!visibility.conversation))panel.close()},[sessionId,visibility.conversation,owner])
  useEffect(()=>()=>panel.close(),[])
  useEffect(()=>{if(!owner)return;const key=e=>{if(e.key==='Escape'&&!document.querySelector('[role=tooltip]')){e.preventDefault();close()}};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key)},[owner,sessionId])
  useLayoutEffect(()=>{
   if(!sessionId)return
   const update=()=>{
    const native=[...document.querySelectorAll('[data-dmm-native-entry]')].some(button=>button.dataset.dmmNativeEntry===sessionId&&button.getClientRects().length>0&&getComputedStyle(button).visibility!=='hidden')
    const conversation=[...document.querySelectorAll('[data-slot="main.conversation"]')].some(slot=>[...slot.children].some(e=>e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0&&getComputedStyle(e).visibility!=='hidden'))
    setVisibility(previous=>previous.native===native&&previous.conversation===conversation?previous:{native,conversation})
   }
   update();const observer=new MutationObserver(update);observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class','hidden','data-dmm-native-entry']});window.addEventListener('resize',update)
   return()=>{observer.disconnect();window.removeEventListener('resize',update)}
  },[sessionId])
  const active=owner?.sessionId===sessionId&&visibility.conversation
  return h('div',{style:{display:'contents'}},sessionId&&visibility.conversation&&!visibility.native?h(Header,{key:sessionId,sessionId,fallback:true}):null,active&&createPortal(h('div',{className:'dmm-overlay',role:'dialog','aria-label':'会话记忆管理'},h(Panel,{key:sessionId,sessionId,onClose:close})),document.body))
 }
 return {Header,SessionEntry}
}
