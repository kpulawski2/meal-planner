import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizePriceBenchmark, chooseBestPackCandidate } from './price-adapter.js';

test('benchmark only uses confident, recent, unit-comparable candidates', () => {
  const candidates = [
    { score: .8, ageDays: 2, canApply: true, packPrice: 2, packBase: 1000, dimension: 'mass', productName: 'Chicken breast', productCode: 'A', date: '2026-10-05' },
    { score: .78, ageDays: 3, canApply: true, packPrice: 3, packBase: 1000, dimension: 'mass', productName: 'Chicken breast', productCode: 'B', date: '2026-10-04' },
    { score: .9, ageDays: 100, canApply: true, packPrice: 100, packBase: 1000, dimension: 'mass', productName: 'Chicken breast', productCode: 'C', date: '2026-06-28' },
  ];
  const result = summarizePriceBenchmark(candidates, { minimumScore: .54, relevanceBand: .15, maxAgeDays: 45 });
  assert.ok(result);
  assert.equal(result.sampleSize, 2);
});

test('best-pack selector does not select weak name matches', () => {
  const result = chooseBestPackCandidate([{ score: .2, canApply: true, checkoutCost: 1, packPrice: 1, packBase: 500, dimension: 'mass', productName: 'Chocolate biscuits' }]);
  assert.equal(result, null);
});
