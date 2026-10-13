/* Source-language hints for multilingual speech and English recipe review. */
(function (root) {
  'use strict';
  const languages = Object.freeze([
    ['auto', 'Automatic detection'], ['en', 'English'], ['ro', 'Romanian'], ['pl', 'Polish'],
    ['fr', 'French'], ['de', 'German'], ['es', 'Spanish'], ['it', 'Italian'], ['pt', 'Portuguese'],
    ['uk', 'Ukrainian'], ['ru', 'Russian'], ['hu', 'Hungarian'], ['bg', 'Bulgarian'], ['el', 'Greek'],
    ['cs', 'Czech'], ['sk', 'Slovak'], ['nl', 'Dutch'], ['sv', 'Swedish'], ['tr', 'Turkish'],
    ['ar', 'Arabic'], ['he', 'Hebrew'], ['hi', 'Hindi'], ['zh', 'Chinese'], ['ja', 'Japanese'], ['ko', 'Korean']
  ].map(row => Object.freeze(row)));
  function source(value) {
    if (value == null || value === '') return 'auto';
    if (typeof value === 'string' && languages.some(([code]) => code === value)) return value;
    throw new TypeError('Choose Automatic detection or a supported source language.');
  }
  function detected(value) {
    return typeof value === 'string' && value !== 'auto' && languages.some(([code]) => code === value) ? value : null;
  }
  const label = value => languages.find(([code]) => code === value)?.[1] || 'Unknown';
  root.RecipeLanguageCore = Object.freeze({ languages, source, detected, label, needsTranslation: value => !['auto', 'en'].includes(source(value)) });
})(globalThis);
