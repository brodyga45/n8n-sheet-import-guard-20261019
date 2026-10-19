import {readFileSync,writeFileSync} from 'node:fs';
const guard=readFileSync(new URL('./guard.js',import.meta.url),'utf8');
const fixture=`// Synthetic data only. Set true to demonstrate a blocked conflict.
const DEMONSTRATE_CONFLICT = false;
const rows = [
 {source:'catalog-a', record_id:'001', label:'Example A', status:'new'},
 {source:'catalog-a', record_id:'001', label:'Example A', status:'new'},
 {source:'catalog-b', record_id:'001', label:'Example B', status:'new'},
];
if (DEMONSTRATE_CONFLICT) rows.push({source:'catalog-a',record_id:'001',label:'Different payload',status:'new'});
return rows.map(json=>({json}));`;
const codeNode=(id,name,jsCode,x)=>({parameters:{mode:'runOnceForAllItems',language:'javaScript',jsCode},id,name,type:'n8n-nodes-base.code',typeVersion:2,position:[x,0]});
const workflow={name:'Guard row keys and conflicting duplicates before Google Sheets import',nodes:[
 {parameters:{},id:'6a41a8bc-837a-4087-9545-399fd1faf6df',name:'Run synthetic demo',type:'n8n-nodes-base.manualTrigger',typeVersion:1,position:[0,0]},
 codeNode('fb9e563e-d932-44ef-8f6b-18e281f57787','Synthetic rows',fixture,240),
 codeNode('78ab813d-edda-4d57-acce-d20560dc5cfd','Validate import batch',guard,500),
 {parameters:{content:'## Safe demo: no network or credentials\nRun once: 3 synthetic rows become 2 keyed rows.\nIn Synthetic rows, set DEMONSTRATE_CONFLICT=true: validation throws.\nProduction: replace fixture with your data source. Keep Stop Workflow on errors. Add Google Sheets Append or Update Row after validation; match on import_key.\nOne batch only; this does not lock Sheets or make concurrent writes atomic. Read README.',height:300,width:600},id:'2c2934ed-2106-4b7d-b563-c6ec6e5362fd',name:'Read before connecting a destination',type:'n8n-nodes-base.stickyNote',typeVersion:1,position:[0,-350]}
],connections:{'Run synthetic demo':{main:[[{node:'Synthetic rows',type:'main',index:0}]]},'Synthetic rows':{main:[[{node:'Validate import batch',type:'main',index:0}]]}},pinData:{},settings:{executionOrder:'v1'},active:false};
writeFileSync(new URL('./workflow.json',import.meta.url),JSON.stringify(workflow,null,2)+'\n');
console.log('Built workflow.json from exact guard.js source.');
