import test from 'node:test'
import assert from 'node:assert/strict'
import {css} from '../src/client-style.js'
import {statusLabels,resourceStatus,roundRows,policySkipReasons} from '../src/session-rounds.js'

test('an absent receipt is not labelled as proof of non-use, while application and active work stay distinct',()=>{
 const data={rows:[{id:'world-book:fixture',config:null,managementMode:'native',facts:[],activeFacts:[]}]}
 const unseen=roundRows(data,'1')[0]
 assert.equal(unseen.status,'never');assert.equal(resourceStatus(unseen),'未记录触发');assert.equal(statusLabels.never,'未记录触发')
 data.rows[0].facts.push({turn:2,phase:'skipped',code:'WORLD_BOOK_POLICY_SKIPPED',reason:'config-unavailable'})
 assert.equal(resourceStatus(roundRows(data,'2')[0]),'策略跳过');assert.equal(policySkipReasons(roundRows(data,'2')[0]),'config-unavailable')
 data.rows[0].facts=[]
 data.rows[0].facts.push({turn:2,phase:'triggered'})
 assert.equal(resourceStatus(roundRows(data,'2')[0]),'曾触发')
 data.rows[0].facts.push({turn:2,phase:'applied'})
 assert.equal(resourceStatus(roundRows(data,'2')[0]),'已应用')
 assert.equal(resourceStatus(roundRows(data,'1')[0]),'未记录触发')
 data.rows[0].activeFacts.push({turn:2,phase:'started'})
 assert.equal(resourceStatus(roundRows(data,'2')[0]),'正在触发')
})

test('default and sticky buttons use neutral theme fill, without the dark toolbar overlay in light mode',()=>{
 assert.match(css,/--dmm-button-fill:var\(--dsw-alias-bg-module-platform,color-mix\(in srgb,currentColor 5%,transparent\)\)/)
 assert.match(css,/\.dmm button\{[^}]*background:var\(--dmm-button-fill\)/)
 assert.match(css,/linear-gradient\(var\(--dmm-button-fill\),var\(--dmm-button-fill\)\),var\(--dmm-surface\)/)
 assert.doesNotMatch(css,/--dsw-alias-button-tool-bar-fill/)
 assert.match(css,/--dmm-surface:var\(--dsw-alias-bg-layer-2,Canvas\)/)
 assert.match(css,/\.dmm button:hover:not\(:disabled\)\{background:var\(--dsw-alias-interactive-bg-hover/)
 assert.match(css,/\.dmm button:focus-visible/)
})
