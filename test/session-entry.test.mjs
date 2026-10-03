import {test} from 'node:test'
import assert from 'node:assert/strict'
import {currentSessionId,entryPlacement,createSessionPanel} from '../src/session-entry.js'
test('session entry selects only the main conversation, including an initial session',()=>{
 const byId={catalog:{id:'catalog',blank:false,retainedBy:{}},side:{id:'side',retainedBy:{rightbar:1}},initial:{id:'initial',blank:true,retainedBy:{mainView:1}}}
 assert.equal(currentSessionId({byId}),'initial')
 byId.initial.retainedBy.mainView=0;byId.side.retainedBy.mainView=1
 assert.equal(currentSessionId({byId}),'side')
 byId.side.retainedBy.mainView=0;assert.equal(currentSessionId({byId}),null)
 assert.equal(currentSessionId(null),null)
})

test('native and fallback share exactly one session panel owner with revocable subscriptions',()=>{
 const panel=createSessionPanel(),native={},fallback={};let calls=0
 const stop=panel.subscribe(()=>calls++)
 assert.equal(panel.getSnapshot(),null)
 panel.open('one',native);assert.equal(panel.getSnapshot().anchor,native)
 panel.open('one',fallback);assert.deepEqual(panel.getSnapshot(),{sessionId:'one',anchor:fallback})
 panel.open('two',native);assert.equal(panel.getSnapshot().sessionId,'two')
 panel.close();panel.close();assert.equal(calls,4)
 stop();panel.open('one',native);assert.equal(calls,4)
})

const rect=(left,top,width,height)=>({left,top,right:left+width,bottom:top+height})
test('compact entry uses a real gap inside a cramped header, keeping controls and edge clearance',()=>{
 const header=rect(280,0,110,76),anchor=rect(310,12.5,43,25),controls=[rect(321,14,23,22),rect(344,14,18,22),rect(371,11,28,28),rect(338,14,44,44),rect(240,22,28,28)]
 const place=entryPlacement(anchor,header,controls,390)
 assert.deepEqual(place,{mode:'compact',left:289,top:11,width:28,height:28})
 assert(place.left>=header.left&&place.left+place.width<=header.right)
 for(const control of controls)assert(place.left+place.width<=control.left||place.left>=control.right||place.top+place.height<=control.top||place.top>=control.bottom)
})
test('normal action restores after resize; placement is geometric in RTL and reports no gap',()=>{
 assert.deepEqual(entryPlacement(rect(193,12,43,25),rect(56,0,334,76),[rect(300,11,28,28)],390),{mode:'normal'})
 const leftSide=entryPlacement(rect(28,12,43,25),rect(0,0,110,76),[rect(10,11,28,28),rect(40,11,23,28)],390)
 assert.equal(leftSide.mode,'compact');assert.equal(leftSide.left,67)
 assert.deepEqual(entryPlacement(rect(10,12,43,25),rect(0,0,50,40),[rect(0,0,50,40)],390),{mode:'unavailable'})
 assert.deepEqual(entryPlacement(rect(400,12,43,25),rect(380,0,110,76),[],390),{mode:'unavailable'})
})


test('initial-session top fallback clears a foreign settings surface or reports no room',()=>{
 const anchor=rect(1610,12,46,30),band=rect(0,0,1728,50),settings=rect(1288,0,440,907)
 const placement=entryPlacement(anchor,band,[settings],1728)
 assert.equal(placement.mode,'compact');assert(placement.left+28<settings.left)
 assert.deepEqual(entryPlacement(rect(272,12,46,30),rect(0,0,390,50),[rect(0,0,56,50),rect(56,0,334,844)],390),{mode:'unavailable'})
})
