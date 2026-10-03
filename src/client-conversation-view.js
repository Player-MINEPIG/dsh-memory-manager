import {createElement as h} from 'react'
export function createConversationView(Panel){
 return function MemoryConversationView({sessionId}){return h('div',{className:'dmm-conversation-view'},h(Panel,{sessionId,sessionView:true}))}
}
export function registerConversationView(ctx,View){
 return ctx.slots.inject('conversation.view',()=>ctx.slots.register({name:'conversation.view',id:'dsh-memory-manager',order:30,label:'记忆管理',inject:()=>({})},View))
}
