import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const code = readFileSync(new URL('./guard.js', import.meta.url), 'utf8');
const run = rows => JSON.parse(JSON.stringify(vm.runInNewContext('(function(){'+code+'})()', {$input: {all: () => rows.map(json=>({json}))}}, {timeout: 3000})));
const row = (id, extra={}) => ({source:'demo', record_id:id, status:'new', ...extra});
const cases = [
 ['collapse identical rows and preserve item links', () => {
   const out=run([row('001'), row('001'), row('002')]);
   assert.equal(out.length,2); assert.deepEqual(out.map(x=>x.pairedItem.item),[0,2]);
   assert.equal(out[0].json.record_id,'001');
 }],
 ['reject a conflicting duplicate before returning any writes',()=>assert.throws(()=>run([row('a'),row('a',{status:'changed'})]),/same key, conflicting payload/)],
 ['reject blank, missing, numeric and padded IDs',()=>{for(const id of ['',null,undefined,42,' x','x ']) assert.throws(()=>run([row(id)]),/keys must/);}],
 ['composite keys cannot collide through separators',()=>assert.equal(run([row('b|c',{source:'a'}),row('c',{source:'a|b'})]).length,2)],
 ['payload property order is irrelevant',()=>assert.equal(run([{source:'demo',record_id:'a',x:{a:1,b:2}},{x:{b:2,a:1},record_id:'a',source:'demo'}]).length,1)],
 ['payload types and missing fields remain distinct',()=>{assert.throws(()=>run([row('a',{x:1}),row('a',{x:'1'})]),/conflicting/);assert.throws(()=>run([row('a'),row('a',{x:null})]),/conflicting/);}],
 ['prototype-like IDs are ordinary data',()=>assert.equal(run([row('__proto__'),row('constructor')]).length,2)],
 ['reserved output keys cannot be overwritten silently',()=>assert.throws(()=>run([row('a',{import_key:'other'})]),/reserved output field/)],
 ['errors omit private values',()=>assert.throws(()=>run([row('secret',{email:'private@example.invalid'}),row('secret',{email:'other@example.invalid'})]),e=>!e.message.includes('secret')&&!e.message.includes('example.invalid'))],
 ['empty batch is a no-op',()=>assert.deepEqual(run([]),[])],
 ['oversized batch stops early',()=>assert.throws(()=>run(Array.from({length:10001},()=>row('a'))),/Batch exceeds/)],
];
for(const [name,test] of cases){test();process.stdout.write('PASS '+name+'\n');}
process.stdout.write(`${cases.length} checks passed. Harness executes the exact Code-node source; it is not an n8n runtime test.\n`);
