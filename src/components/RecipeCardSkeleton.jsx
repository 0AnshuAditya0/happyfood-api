import React from 'react';

export default function RecipeCardSkeleton({ count = 6 }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse flex flex-col h-full">
                    {/* Image Placeholder */}
                    <div className="w-full h-48 bg-gray-300"></div>

                    <div className="p-4 flex-1 flex flex-col">
                        {/* Title */}
                        <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>

                        {/* Meta Tags (Country, Difficulty) */}
                        <div className="flex gap-2 mb-3">
                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </div>

                        {/* Description lines */}
                        <div className="h-3 bg-gray-100 rounded w-full mb-1"></div>
                        <div className="h-3 bg-gray-100 rounded w-5/6 mb-4"></div>

                        {/* Footer / Button */}
                        <div className="mt-auto pt-4 flex justify-between items-center">
                            <div className="h-4 bg-gray-200 rounded w-12"></div>
                            <div className="h-8 bg-gray-300 rounded w-24"></div>
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
}
