/**
 * Base class for all recipe scrapers
 * Provides common utilities for data normalization and estimation
 */
const logger = require('../../lib/activity-logger');

class BaseScraper {
  /**
   * @param {string} sourceName - Name of the source (e.g. 'TheMealDB')
   * @param {number} rateLimit - Delay between requests in ms
   */
  constructor(sourceName, rateLimit = 1000) {
    this.source = sourceName;
    this.rateLimit = rateLimit;
    this.uploadPipeline = null; // Will be injected by the runner
  }
  
  /**
   * Fetch recipes from the source
   * @returns {Promise<Array>} Raw recipes
   */
  async fetchRecipes() {
    throw new Error('fetchRecipes() must be implemented');
  }
  
  /**
   * Transform raw recipe to the application schema
   * @param {Object} rawRecipe 
   * @returns {Object} Transformed recipe
   */
  transform(rawRecipe) {
    throw new Error('transform() must be implemented');
  }
  
  /**
   * Generate a unique ID for the recipe
   * @param {string} prefix 
   * @returns {string}
   */
  generateUniqueId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Estimate calories based on ingredients count (fallback)
   * @param {Array} ingredients 
   * @returns {number}
   */
  estimateCalories(ingredients) {
    // Simple estimation: random value between 200 and 800 based on randomness for now, 
    // but ideally could be grounded in ingredient count * 50?
    // User provided implementation:
    return Math.floor(Math.random() * (800 - 200) + 200);
  }
  
  /**
   * Estimate difficulty based on instruction length
   * @param {string} instructions 
   * @returns {'Easy'|'Medium'|'Hard'}
   */
  estimateDifficulty(instructions) {
    if (!instructions) return 'Medium';
    const steps = instructions.split(/\.\s|\n/).filter(s => s.trim()).length;
    if (steps < 5) return 'Easy';
    if (steps < 10) return 'Medium';
    return 'Hard';
  }
  
  /**
   * Estimate cook time from text
   * @param {string} instructions 
   * @returns {number} minutes
   */
  estimateCookTime(instructions) {
    if (!instructions) return 30;
    // Try to extract time from instructions
    const timeMatch = instructions.match(/(\d+)\s*(min|minute|hour)/i);
    if (timeMatch) {
      const value = parseInt(timeMatch[1]);
      const unit = timeMatch[2].toLowerCase();
      return unit.startsWith('hour') ? value * 60 : value;
    }
    return 30; // Default
  }
  
  /**
   * Detect allergens from ingredients list
   * @param {Array} ingredients - Array of objects { name: string, ... }
   * @returns {Array<string>}
   */
  detectAllergens(ingredients) {
    const allergenMap = {
      'Dairy': ['milk', 'butter', 'cheese', 'cream', 'yogurt', 'ghee'],
      'Gluten': ['flour', 'bread', 'pasta', 'wheat', 'barley', 'rye'],
      'Nuts': ['almond', 'peanut', 'walnut', 'cashew', 'pistachio', 'pecan'],
      'Eggs': ['egg'],
      'Shellfish': ['shrimp', 'crab', 'lobster', 'oyster', 'clam', 'mussel'],
      'Soy': ['soy', 'tofu', 'edamame'],
      'Fish': ['fish', 'salmon', 'tuna', 'cod', 'trout', 'halibut']
    };
    
    const detected = new Set();
    for (const [allergen, keywords] of Object.entries(allergenMap)) {
      const hasAllergen = ingredients.some(ing => {
        const name = (ing.name || '').toLowerCase();
        return keywords.some(kw => name.includes(kw));
      });
      if (hasAllergen) detected.add(allergen);
    }
    return Array.from(detected);
  }
  
  /**
   * Detect dietary info (Vegan, Vegetarian, etc.)
   * @param {Array} ingredients 
   * @param {string} category 
   * @returns {Array<string>}
   */
  detectDietaryInfo(ingredients, category = '') {
    const info = new Set();
    const cat = category.toLowerCase();
    
    const meatKeywords = ['chicken', 'beef', 'pork', 'lamb', 'fish', 'turkey', 'bacon', 'ham', 'sausage', 'meat', 'steak'];
    const animalProducts = ['milk', 'butter', 'cheese', 'egg', 'honey', 'cream', 'yogurt', 'ghee'];
    
    const hasMeat = ingredients.some(ing => {
      const name = (ing.name || '').toLowerCase();
      return meatKeywords.some(kw => name.includes(kw));
    });
    
    const hasAnimalProducts = ingredients.some(ing => {
      const name = (ing.name || '').toLowerCase();
      return animalProducts.some(kw => name.includes(kw));
    });
    
    if (!hasMeat && !hasAnimalProducts) info.add('Vegan');
    if (!hasMeat) info.add('Vegetarian');
    if (!hasMeat && !hasAnimalProducts) info.add('Vegetarian'); // All vegans are vegetarian
    if (cat.includes('vegan')) info.add('Vegan');
    if (cat.includes('vegetarian')) info.add('Vegetarian');
    
    // Explicit exclusions
    if (!info.has('Vegan') && !info.has('Vegetarian')) {
      // It's likely non-vegetarian, but we don't label "Non-Vegetarian" explicitly in the requested schema usually, 
      // but let's stick to positive labels.
    }
    
    return Array.from(info);
  }
  
  /**
   * Delay execution
   * @param {number} ms 
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  /**
   * Apply filters to a list of recipes
   * @param {Array} recipes 
   * @returns {Array} Filtered recipes
   */
  applyFilters(recipes) {
    const { shouldExclude } = require('../config/filters');
    
    if (!recipes || recipes.length === 0) return [];
    
    const initialCount = recipes.length;
    const filtered = recipes.filter(recipe => {
      // 1. Check title
      if (shouldExclude({ name: recipe.name })) {
        console.log(`x⚠️  Filtered: "${recipe.name}" (name contains: "${shouldExclude({ name: recipe.name }, true)}")`);
        // We might not want to log EVERY filter hit to persistent log if it's too noisy, but requested "Log when filtering removes recipes"
        // Let's log simpler batched or just important ones? No, user asked "Log when filtering removes recipes".
        // To avoid spamming, maybe just log count?
        // "Log when recipe is filtered" implies individual. 
        // I'll add it but maybe fire-and-forget.
        logger.log('filter', `Recipe filtered: ${recipe.name}`, { reason: 'keyword_match' }).catch(() => {});
        return false;
      }
      
      // 2. Check ingredients (if available in raw text or array)
      // Note: Scrapers might not populate ingredients fully before this check if run early?
      // But applyFilters is run on transformed recipes which should have ingredients.
      if (recipe.ingredients) {
         if (shouldExclude({ ingredients: recipe.ingredients })) {
           console.log(`x⚠️  Filtered: "${recipe.name}" (ingredients match)`);
           logger.log('filter', `Recipe filtered: ${recipe.name}`, { reason: 'ingredient_match' }).catch(() => {});
           return false;
         }
      }

      return true;
    });

    const filteredCount = initialCount - filtered.length;
    if (filteredCount > 0) {
      console.log(`🔍 Filtered out ${filteredCount} recipes (${filtered.length} remaining)`);
    } else {
      console.log(`🔍 No recipes filtered (${filtered.length} passing)`);
    }
    
    return filtered;
  }
}

module.exports = BaseScraper;
