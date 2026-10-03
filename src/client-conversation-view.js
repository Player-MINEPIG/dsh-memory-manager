import {createElement as h} from 'react'
export function createConversationView(Panel){
 return function MemoryConversationView({sessionId}){return h('div',{className:'dmm-conversation-view'},h(Panel,{sessionId,sessionView:true}))}
}
export function registerConversationView(ctx,View){
 return ctx.slots.inject('conversation.view',()=>{
  // The official roster has no overflow rule. Mark only its visible tablist
  // containing our registered label; never replace tabs or select a View.
  ctx.effect(()=>{
   const marked=new Set(),refresh=()=>{
    for(const list of document.querySelectorAll('[data-conversation-tabs][role=tablist]')){
     const present=[...list.querySelectorAll('[role=tab]')].some(tab=>tab.textContent.trim()==='记忆管理')
     if(present&&!marked.has(list)){list.classList.add('dmm-conversation-tabs');marked.add(list)}
     else if(!present&&marked.has(list)){list.classList.remove('dmm-conversation-tabs');marked.delete(list)}
    }
    for(const list of marked)if(!list.isConnected){list.classList.remove('dmm-conversation-tabs');marked.delete(list)}
   }
   const observer=new MutationObserver(refresh);observer.observe(document.body,{childList:true,subtree:true});refresh()
   return()=>{observer.disconnect();for(const list of marked)list.classList.remove('dmm-conversation-tabs')}
  })
  return ctx.slots.register({name:'conversation.view',id:'dsh-memory-manager',order:30,label:'记忆管理',inject:()=>({})},View)
 })
}
