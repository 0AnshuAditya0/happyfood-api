require('dotenv').config();
const axios = require("axios");

const KEY = process.env.PIXA_API_KEY;

const API_KEY = "KEY"; // Your Pixabay API key
const BASE_URL = "https://pixabay.com/api/?";


// Default fallback images for different food categories
const FALLBACK_IMAGES = {
  pizza: "https://cdn.pixabay.com/photo/2017/12/09/08/18/pizza-3007395_640.jpg",
  pasta: "https://cdn.pixabay.com/photo/2018/07/18/19/12/pasta-3547078_640.jpg",
  burger: "https://cdn.pixabay.com/photo/2016/03/05/19/02/hamburger-1238246_640.jpg",
  default: "https://cdn.pixabay.com/photo/2017/06/02/18/24/tag-2367663_640.jpg"
};

const fetchImage = async (foodName, category = 'default') => {
  try {
    // Clean food name for better search results
    const cleanFoodName = foodName.toLowerCase()
      .replace(/[^\w\s]/gi, '') // Remove special characters
      .trim();

    console.log(`🔍 Searching for image: ${cleanFoodName}`);

    const response = await axios.get(BASE_URL, {
      params: {
        key: API_KEY,
        q: encodeURIComponent(cleanFoodName),
        image_type: "photo",
        safesearch: true,
        per_page: 20, // Get more options
        min_width: 640, // Ensure decent quality
        min_height: 480,
        category: "food" // Focus on food images
      },
    });

    if (response.data.hits && response.data.hits.length > 0) {
      // Filter images by size and quality
      const qualityImages = response.data.hits.filter(img => 
        img.webformatWidth >= 640 && 
        img.webformatHeight >= 480
      );

      const imagesToUse = qualityImages.length > 0 ? qualityImages : response.data.hits;
      const randomIndex = Math.floor(Math.random() * imagesToUse.length);
      const selectedImage = imagesToUse[randomIndex];

      console.log(`✅ Found image for ${foodName}: ${selectedImage.previewURL}`);
      
      return {
        preview: selectedImage.previewURL,
        webformat: selectedImage.webformatURL,
        tags: selectedImage.tags
      };
    } else {
      console.log(`⚠️ No image found for ${foodName}, using fallback`);
      return {
        preview: FALLBACK_IMAGES[category] || FALLBACK_IMAGES.default,
        webformat: FALLBACK_IMAGES[category] || FALLBACK_IMAGES.default,
        tags: foodName
      };
    }
  } catch (error) {
    console.error(`❌ Error fetching image for ${foodName}:`, error.response?.data || error.message);
    
    // Return fallback image on error
    return {
      preview: FALLBACK_IMAGES[category] || FALLBACK_IMAGES.default,
      webformat: FALLBACK_IMAGES[category] || FALLBACK_IMAGES.default,
      tags: foodName
    };
  }
};

// Function to update existing dishes with new images
const updateDishImages = async (db) => {
  try {
    const dishes = await db.collection("dishes").find({}).toArray();
    
    for (const dish of dishes) {
      if (!dish.image || dish.image.includes('placeholder')) {
        const imageData = await fetchImage(dish.name);
        
        await db.collection("dishes").updateOne(
          { id: dish.id },
          { 
            $set: { 
              image: imageData.preview,
              imageHD: imageData.webformat,
              imageTags: imageData.tags
            }
          }
        );
        
        console.log(`Updated image for: ${dish.name}`);
        
        // Add delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log("✅ All dish images updated!");
  } catch (error) {
    console.error("❌ Error updating images:", error);
  }
};

module.exports = { fetchImage, updateDishImages };