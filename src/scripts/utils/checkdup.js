// const { connectToDatabase, getDatabase } = require('./database');

// async function checkDuplicatesByName() {
//   await connectToDatabase();
//   const db = getDatabase();
//   const allDishes = await db.collection('dishes').find({}).toArray();

//   const seen = new Map();
//   const duplicates = [];

//   allDishes.forEach(dish => {
//     const key = dish.name.trim().toLowerCase();
//     if (seen.has(key)) {
//       seen.get(key).push(dish);
//     } else {
//       seen.set(key, [dish]);
//     }
//   });

//   for (const [name, items] of seen.entries()) {
//     if (items.length > 1) {
//       duplicates.push({ name, count: items.length, ids: items.map(i => i._id) });
//     }
//   }

//   console.log(`🍽️ Total duplicate names: ${duplicates.length}`);
//   duplicates.forEach(d => {
//     console.log(`→ ${d.name} (x${d.count})`);
//   });
// }

// checkDuplicatesByName();


const fs = require('fs');

const data = JSON.parse(fs.readFileSync('unique_food_dishes_5000.json', 'utf-8'));

const seen = new Set();
let duplicates = [];

data.forEach(dish => {
  const name = dish.name.toLowerCase().trim();
  if (seen.has(name)) {
    duplicates.push(name);
  } else {
    seen.add(name);
  }
});

console.log(`✅ Unique Dishes: ${seen.size}`);
console.log(`❌ Duplicates Found: ${duplicates.length}`);
if (duplicates.length > 0) console.log(duplicates);

