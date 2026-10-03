import {createElement as h,useEffect,useState,useRef,useLayoutEffect} from 'react'
import {createPortal} from 'react-dom'
import {currentSessionId} from './session-entry.js'

export function createSessionEntries(Panel){
 function Header({sessionId,fallback=false}){
  const [open,setOpen]=useState(false)
  const button=useRef(null)
  const close=()=>{setOpen(false);button.current?.focus()}
  useEffect(()=>setOpen(false),[sessionId])
  useEffect(()=>{if(!open)return;const key=e=>{if(e.key==='Escape'&&!document.querySelector('[role=tooltip]')){e.preventDefault();close()}};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key)},[open])
  return h('div',{className:fallback?'dmm-session-entry':'dmm-header-entry'},h('button',{ref:button,type:'button','data-dmm-native-entry':fallback?undefined:sessionId,onClick:()=>setOpen(!open),'aria-label':'记忆管理','aria-expanded':open,'aria-haspopup':'dialog'},'记忆'),open&&createPortal(h('div',{className:'dmm-overlay',role:'dialog','aria-label':'会话记忆管理'},h(Panel,{key:sessionId,sessionId,onClose:close})),document.body))
 }
 function SessionEntry({useSessions}){
  const sessionId=useSessions(currentSessionId),[nativeVisible,setNativeVisible]=useState(true)
  useLayoutEffect(()=>{
   if(!sessionId)return
   const update=()=>setNativeVisible([...document.querySelectorAll('[data-dmm-native-entry]')].some(button=>button.dataset.dmmNativeEntry===sessionId&&button.getClientRects().length>0&&getComputedStyle(button).visibility!=='hidden'))
   update();const observer=new MutationObserver(update);observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class','hidden','data-dmm-native-entry']});window.addEventListener('resize',update)
   return()=>{observer.disconnect();window.removeEventListener('resize',update)}
  },[sessionId])
  return sessionId&&!nativeVisible?h(Header,{key:sessionId,sessionId,fallback:true}):null
 }
 return {Header,SessionEntry}
}
