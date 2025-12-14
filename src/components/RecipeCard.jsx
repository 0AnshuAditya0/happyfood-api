import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function RecipeCard({ recipe }) {
    const [imgSrc, setImgSrc] = useState(recipe.image);

    return (
        <Link href={`/recipe/${recipe.id}`} className="block h-full">
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
                <div className="relative w-full h-48 bg-gray-200">
                    <Image
                        src={imgSrc || '/placeholder-recipe.jpg'} // Fallback if no image initially
                        alt={recipe.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        onError={() => setImgSrc('/placeholder-recipe.jpg')}
                        loading="lazy"
                    />
                    {/* Difficulty Badge */}
                    <span className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold text-white
            ${recipe.difficulty === 'Easy' ? 'bg-green-500' :
                            recipe.difficulty === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'}`}>
                        {recipe.difficulty}
                    </span>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-gray-800 line-clamp-2">{recipe.name}</h3>
                    </div>

                    <div className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                        <span>🌍 {recipe.country}</span>
                        <span>🔥 {recipe.calories} kcal</span>
                    </div>

                    <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-1">
                        {recipe.description}
                    </p>

                    <div className="mt-auto flex flex-wrap gap-1">
                        {recipe.dietaryInfo && recipe.dietaryInfo.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </Link>
    );
}
