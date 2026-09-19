const assert = require('node:assert/strict');
const {QUESTIONS,buildReport,classifyPreferences,escapeHTML} = require('../assets/app.js');
assert.equal(QUESTIONS.length,16);
assert.equal(buildReport({}).count,0);
assert.deepEqual(buildReport({}).insights,[]);
assert.match(buildReport({chat:'经常不知道怎么接话'}).insights[0].action,/追问/);
assert.match(buildReport({care:'有长期照护安排，需要提前沟通'}).insights[0].meaning,/不是/);
assert.ok(classifyPreferences({age:{min:40,max:25}}).error);
assert.ok(classifyPreferences({age:{min:17,max:25}}).error);
assert.ok(classifyPreferences({age:{min:25.5}}).error);
assert.ok(classifyPreferences({age:{priority:'必须满足'}}).error);
assert.deepEqual(classifyPreferences({age:{min:25,max:35,priority:'必须满足'}}).groups['必须满足'],['年龄范围：25—35岁']);
assert.deepEqual(classifyPreferences({height:{min:170,priority:'可以商量'}}).groups['可以商量'],['身高范围：170cm及以上']);
assert.equal(escapeHTML('<img src=x onerror=alert(1)>'),'&lt;img src=x onerror=alert(1)&gt;');
console.log('Report and preference checks passed.');

