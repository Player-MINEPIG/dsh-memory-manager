// Only the main conversation selects this frame-wide control. Catalog presence,
// retained side panels and the most recently updated Session are not selection.
export function currentSessionId(snapshot){
 return Object.values(snapshot?.byId??{}).find(session=>(session.retainedBy?.mainView??0)>0)?.id??null
}

// Native and fallback buttons share one frame-owned panel, including when a
// header is hidden without being unmounted.
export function createSessionPanel(){
 let value=null
 const listeners=new Set(),publish=next=>{if(value===next)return;value=next;for(const listener of listeners)listener()}
 return {getSnapshot:()=>value,subscribe:listener=>{listeners.add(listener);return()=>listeners.delete(listener)},open:(sessionId,anchor)=>publish({sessionId,anchor}),close:()=>publish(null)}
}

const intersects=(a,b)=>a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom
// The caller measures public, visible controls; no product IDs or CSS classes
// determine placement. Keep the ordinary action when it fits. A compact action
// uses only a genuine free interval inside the same header and viewport.
export function entryPlacement(anchor,header,controls,viewportWidth){
 const inside=rect=>rect.left>=Math.max(header.left,0)&&rect.right<=Math.min(header.right,viewportWidth)&&rect.top>=header.top&&rect.bottom<=header.bottom
 if(inside(anchor)&&!controls.some(rect=>intersects(anchor,rect)))return {mode:'normal'}
 const width=28,height=28,top=Math.max(header.top+11,0),left=Math.max(header.left+8,8),right=Math.min(header.right-8,viewportWidth-8)
 if(top+height>header.bottom||right-left<width)return {mode:'unavailable'}
 const blocks=controls.filter(rect=>rect.top<top+height+4&&rect.bottom>top-4).map(rect=>[Math.max(left,rect.left-4),Math.min(right,rect.right+4)]).filter(([a,b])=>a<b).sort((a,b)=>a[0]-b[0])
 const gaps=[];let cursor=left
 for(const [a,b] of blocks){if(a-cursor>=width)gaps.push([cursor,a]);cursor=Math.max(cursor,b)}
 if(right-cursor>=width)gaps.push([cursor,right])
 if(!gaps.length)return {mode:'unavailable'}
 const candidates=gaps.map(([a,b])=>Math.max(a,Math.min(anchor.left,b-width))).sort((a,b)=>Math.abs(a-anchor.left)-Math.abs(b-anchor.left))
 return {mode:'compact',left:candidates[0],top,width,height}
}
