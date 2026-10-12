/* Tiny bounded vertex search for at most four meal-portion variables. */
import '../public/macro-goals-core.js';
const EPS = 1e-8;
function subsets(values, size) {
  const result = [];
  const visit = (start, chosen) => { if (chosen.length === size) { result.push(chosen); return; }
    for (let index = start; index <= values.length - (size - chosen.length); index++) visit(index + 1, [...chosen, values[index]]); };
  visit(0, []); return result;
}
function solve(matrix, values) {
  const rows = matrix.map((row, index) => [...row, values[index]]), count = rows.length;
  for (let column = 0; column < count; column++) {
    let pivot = column;
    for (let row = column + 1; row < count; row++) if (Math.abs(rows[row][column]) > Math.abs(rows[pivot][column])) pivot = row;
    if (Math.abs(rows[pivot][column]) < EPS) return null;
    [rows[column], rows[pivot]] = [rows[pivot], rows[column]];
    const divisor = rows[column][column]; for (let index = column; index <= count; index++) rows[column][index] /= divisor;
    for (let row = 0; row < count; row++) if (row !== column) {
      const factor = rows[row][column]; for (let index = column; index <= count; index++) rows[row][index] -= factor * rows[column][index];
    }
  }
  return rows.map(row => row[count]);
}
export function macroPortionVertices(rows, profile, fixed = []) {
  const goals = globalThis.MacroGoalsCore, limits = goals.targets(profile), count = rows.length;
  if (count < 2 || count > 4 || rows.some(row => !goals.complete(row.n || row.nutrition || row, profile))) return [];
  const bounds = rows.map((_, index) => fixed[index] != null ? [fixed[index], fixed[index]] : [.5, 2]);
  const result = [], seen = new Set(), indexes = rows.map((_, index) => index);
  const add = factors => {
    if (factors.some((factor, index) => !Number.isFinite(factor) || factor < bounds[index][0] - EPS || factor > bounds[index][1] + EPS)) return;
    if (!goals.meets(goals.total(rows, factors), profile)) return;
    const key = factors.map(factor => factor.toFixed(7)).join(','); if (seen.has(key)) return;
    seen.add(key); result.push(factors);
  };
  const constraints = [['kcal', limits.min], ['kcal', limits.max], ['p', limits.protein]];
  if (limits.requireC) constraints.push(['c', limits.carbMin], ['c', limits.carbMax]);
  if (limits.fatMax !== null) constraints.push(['f', limits.fatMax]);
  const coefficient = (row, key) => Number((row.n || row.nutrition || row)[key]);
  for (let freeCount = 0; freeCount <= count; freeCount++) for (const free of subsets(indexes.filter(index => bounds[index][0] !== bounds[index][1]), freeCount)) {
    const chosen = new Set(free), factors = new Array(count);
    const visitBounds = index => {
      if (index === count) {
        if (!freeCount) { add(factors.slice()); return; }
        for (const active of subsets(constraints, freeCount)) {
          const matrix = active.map(([key]) => free.map(index => coefficient(rows[index], key)));
          const remaining = active.map(([key, value]) => value - rows.reduce((sum, row, index) => chosen.has(index) ? sum : sum + coefficient(row, key) * factors[index], 0));
          const solution = solve(matrix, remaining); if (!solution) continue;
          const candidate = factors.slice(); free.forEach((index, offset) => { candidate[index] = solution[offset]; }); add(candidate);
        }
        return;
      }
      if (chosen.has(index)) { visitBounds(index + 1); return; }
      factors[index] = bounds[index][0]; visitBounds(index + 1);
      if (bounds[index][1] !== bounds[index][0]) { factors[index] = bounds[index][1]; visitBounds(index + 1); }
    };
    visitBounds(0);
  }
  return result;
}
