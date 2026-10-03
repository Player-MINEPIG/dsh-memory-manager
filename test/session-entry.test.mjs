import {test} from 'node:test'
import assert from 'node:assert/strict'
import {currentSessionId} from '../src/session-entry.js'
test('session entry selects only the main conversation, including an initial session',()=>{
 const byId={catalog:{id:'catalog',blank:false,retainedBy:{}},side:{id:'side',retainedBy:{rightbar:1}},initial:{id:'initial',blank:true,retainedBy:{mainView:1}}}
 assert.equal(currentSessionId({byId}),'initial')
 byId.initial.retainedBy.mainView=0;byId.side.retainedBy.mainView=1
 assert.equal(currentSessionId({byId}),'side')
 byId.side.retainedBy.mainView=0;assert.equal(currentSessionId({byId}),null)
 assert.equal(currentSessionId(null),null)
})
