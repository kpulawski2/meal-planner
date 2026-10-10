import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { performance } from 'node:perf_hooks';
import { readRecipeLibrary } from './recipe-fixtures.js';
import { validateRecipeLibrary } from './recipe-library.js';
import { normalizePlannerRequest } from './planner-request.js';
import '../public/recipe-library-core.js';

test('the shipped complete source snapshot streams to the phone without blocking health checks',async t=>{
 process.env.PORT='0';
 const {httpServer}=await import('./server.js');
 t.after(async()=>{httpServer.closeAllConnections();await new Promise(resolve=>httpServer.close(resolve));});
 if(!httpServer.listening)await once(httpServer,'listening');
 const base='http://127.0.0.1:'+httpServer.address().port;
 const started=performance.now(),libraryRequest=fetch(base+'/recipe-library.json');
 const health=await fetch(base+'/health',{signal:AbortSignal.timeout(5000)});
 assert.equal(health.status,200);assert.ok(performance.now()-started<1500);
 const response=await libraryRequest;
 assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/json/);
 assert.equal(response.headers.get('cache-control'),'no-cache');
 const library=await response.json();
 assert.equal(validateRecipeLibrary(library).valid,true);
 assert.equal(globalThis.RecipeLibraryCore.validLibrary(library),true);
 assert.ok(library.recipes.length>3000);
 assert.equal(library.coverage.indexed,library.coverage.discovered);
 assert.equal(library.coverage.validated,library.recipes.length);
 for(const row of library.recipes)assert.ok(row.source&&row.license&&row.authorsUrl&&row.modifications);
});

test('the entire browsable collection yields bounded, quantified planner inputs with source credit preserved',async()=>{
 const recipes=await readRecipeLibrary({includeWeb:true});
 assert.ok(recipes.length>3000);
 const profile={days:7,meals:4,people:1,budget:45,equipment:['Ninja CREAMi']};
 const selected=globalThis.RecipeLibraryCore.selectPlannerRecipes(recipes,{profile});
 assert.ok(selected.length<=250);
 assert.ok(selected.some(row=>row.id.startsWith('world-')));
 assert.ok(selected.some(row=>row.id.startsWith('creami-')));
 assert.ok(selected.every(row=>globalThis.RecipeLibraryCore.planReady(row)));
 const request=normalizePlannerRequest({profile,recipes:selected});
 assert.ok(request.recipes.every(row=>row.nutrition.complete&&row.ings.every(ing=>ing[1]>0)));
 assert.ok(request.recipes.some(row=>row.fixedBatch&&row.freezeMinutes===1440));
});
