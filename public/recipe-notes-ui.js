(function (root) {
  'use strict';let api;
  const html = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const arg = value => encodeURIComponent(String(value)).replace(/'/g, '%27');
  function panel(recipe) {
    if (!api || recipe.unavailable) return '';
    return '<details class="recipe-personal-notes"><summary>Your cooking notes</summary><label for="personalRecipeNote">Things to remember for next time</label><textarea id="personalRecipeNote" rows="4" maxlength="2000" placeholder="Less seasoning, try a different topping, pack the dressing separately…">' + html(root.RecipeExperience.personalNote(recipe, api.state())) + '</textarea><p class="sub">Notes are saved on this device and included in backups. Edit the recipe ingredients to change its nutrition.</p><button class="btn secondary small" onclick="RecipeNotesUI.save(decodeURIComponent(\'' + arg(recipe.id) + '\'))">Save note</button><span id="recipeNoteStatus" class="sub" role="status"></span></details>';
  }
  root.RecipeNotesUI = Object.freeze({ configure: value => { api = value; }, panel,
    save(id) { try { root.RecipeExperience.setPersonalNote(api.state(), id, document.getElementById('personalRecipeNote').value);api.save();document.getElementById('recipeNoteStatus').textContent = 'Saved';api.toast('Recipe note saved'); } catch (error) { api.toast(error.message); } } });
})(globalThis);
