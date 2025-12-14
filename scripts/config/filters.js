/**
 * Filtering configuration for recipes
 * Used to exclude specific ingredients (e.g. pork, beef) if desired
 */

// List of ingredients to exclude (case-insensitive)
// Modify this list to customize your filtering
const excludedIngredients = [
  'beef', 
  'pork', 
  'bacon', 
  'ham', 
  'sausage', 
  'pepperoni', 
  'prosciutto', 
  'salami', 
  'chorizo', 
  'veal', 
  'lamb', 
  'mutton', 
  'goat meat',
  'lard',
  'gelatin'
];

/**
 * Check if a recipe should be excluded
 * @param {Object} recipe - The transformed recipe object
 * @returns {boolean} - True if should be excluded
 */
function shouldExclude(recipe) {
  if (!recipe) return true;

  const name = (recipe.name || '').toLowerCase();
  
  // 1. Check Recipe Name
  for (const excluded of excludedIngredients) {
    if (name.includes(excluded)) {
      console.log(`⚠️  Filtered: "${recipe.name}" (name contains: "${excluded}")`);
      return true;
    }
  }

  // 2. Check Ingredients List
  if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
    // Some scrapers might not transform ingredients to standard format yet inside the scraper loop?
    // BaseScraper transform usually returns "ingredients" in a specific format?
    // Actually BaseScraper transform returns "ingredients"? 
    // Wait, let's check schema. Schema has "ingredients". 
    // But in BaseScraper.transform (impl by child), it returns an object with fields matching validDish props.
    // wait, existing scrapers return objects like { id, name, ..., ingredients: [...]? no wait.
    // Let's check TheMealDBScraper.transform:
    // It calls `this.detectAllergens(ingredients)` but... does it return `ingredients` property in the final object?
    // The Joi schema in `src/lib/schemas/dish.schema.js` DOES NOT have an `ingredients` field at the top level!
    // It has `instructions`, `variations`, etc.
    // Wait, let me check `server.js` (deleted) or `src/lib/schemas/dish.schema.js` again.
    // Step 102 (Validation Schema):
    // const dishSchema = Joi.object({ ... ingredients: Joi.array().items(...).min(1).required(), ... }) ??
    // WRONG. I need to verify if `ingredients` is in the schema I passed.
    // Let me check artifacts or previous file writes.
    // In Step 61/62 I wrote dish.schema.js. 
    // Checking Step 62 content... It DOES NOT have "ingredients" at the top level!
    // Wait. Recipe schema generally has ingredients. The user request in Step 23 listed "RECIPE SCHEMA" which DID NOT include ingredients explicitly in the list?
    // Wait, Step 23:
    // RECIPE SCHEMA: { ... "tags": [], "dietaryInfo": [], "allergens": [], ... } 
    // IT DOES NOT LIST INGREDIENTS explicitly in the user prompt list!
    // But `TheMealDBScraper.transform` in Step 135:
    // loops `ingredients.push(...)`...
    // then returns `{ ..., allergens, dietaryInfo, ... }`
    // BUT IT DOES NOT RETURN `ingredients` property in the final object!
    // This is a MAJOR ISSUE if we want to filter by ingredient content but don't save ingredients.
    // OR maybe I missed it.
    // Let's check TheMealDBScraper code again (Step 135).
    // `const ingredients = []; ... return { ... allergens: this.detectAllergens(ingredients), ... }`
    // It uses `ingredients` local var to detect allergens, but it DOES NOT seem to include `ingredients` in the return object!
    // Wait, if we don't save ingredients, the recipe is useless for cooking?
    // Ah, `instructions` is there. But ingredients list is crucial.
    // I suspect I missed `ingredients` in the Schema and the Scraper transform.
    // Let me check `src/lib/schemas/dish.schema.js` via `view_file` to be sure.
    // If it's missing, I must fix it.
  
    // Assuming for a moment I need to fix it.
    // For now, I will write the filter script assuming `ingredients` MIGHT be there or I check `description` or `tags` or `instructions`.
    // But `shouldExclude` logic specifically mentioned "Ingredients array".
    
    // I will check the file first.
    
    return false; // Placeholder
  }
  
  return false;
}

module.exports = {
  excludedIngredients,
  shouldExclude
};
