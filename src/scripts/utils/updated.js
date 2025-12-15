const fs = require("fs");

// Load the dishes.json file
const dishes = JSON.parse(fs.readFileSync("real.json", "utf8"));

const cleaned = dishes.map(dish => {
  // Remove image fields from the main dish object
  delete dish.image;
  delete dish.imageHD;
  delete dish.imageTags;
  delete dish.popularity;

  // If variations exist, remove image fields inside each variation
  if (dish.variations && Array.isArray(dish.variations)) {
    dish.variations = dish.variations.map(variation => {
      delete variation.image;
      return variation;
    });
  }

  return dish;
});

// Save the cleaned data to a new file
fs.writeFileSync("dishes_clean.json", JSON.stringify(cleaned, null, 2));

console.log("✅ Removed image fields from main dishes and variations!");
