import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseScores, compareOffer, normalizePlace } from '../src/lib/admissions.js'
assert.equal(parseScores({}), null)
const valid={lc:'700,50',ch:'600',cn:'500',mt:'800',red:'900'}
assert.deepEqual(parseScores(valid),[700.5,600,500,800,900])
for(const invalid of ['-1','1001','abc','0xFF','1e3','']) assert.equal(parseScores({...valid,lc:invalid}),null)
const offer={weights:[1,1,1,3,2],minimums:[0,0,0,0,1],minimum:0,cutoff:700}
assert.equal(compareOffer(offer,[700,600,500,800,900]).weighted,750)
assert.equal(compareOffer(offer,[700,600,500,800,900]).reaches,true)
assert.equal(compareOffer(offer,[1000,1000,1000,1000,0]).reaches,false)
assert.equal(normalizePlace(' São Luís '),'sao luis')
const data=JSON.parse(readFileSync('public/data/sisu-2025.json'))
assert.equal(data.offers.length,6393)
for(const o of data.offers){assert(o.weights.length===5 && o.minimums.length===5 && o.cutoff>0 && o.cutoff<=1000);assert(o.date.startsWith('2025-'));assert(o.city && o.uf && o.campus)}
console.log('Admissions: input validation, weighted scores, minima, cities and dataset verified.')
