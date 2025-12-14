"use client";

import React, { useState } from 'react';
import { useRecipes } from '@/hooks/useRecipes';
import RecipeCard from './RecipeCard';
import RecipeCardSkeleton from './RecipeCardSkeleton';

export default function RecipeList({ initialFilters = {} }) {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState(initialFilters.search || '');


    const filters = {
        ...initialFilters,
        page,
        search: search.trim()
    };

    const { recipes, pagination, isLoading, error } = useRecipes(filters);

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(1); // Reset to page 1 on search
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (error) {
        return (
            <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg">
                <h3 className="text-xl font-bold">Error loading recipes</h3>
                <p>Please try again later.</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Controls Bar */}
            <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold text-gray-800">
                    Recipes
                    {!isLoading && <span className="text-gray-500 text-sm font-normal ml-2">({pagination.total || 0} found)</span>}
                </h2>

                <input
                    type="text"
                    placeholder="Search recipes..."
                    value={search}
                    onChange={handleSearchChange}
                    className="border border-gray-300 rounded-md px-4 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <RecipeCardSkeleton count={6} />
                ) : recipes.length > 0 ? (
                    recipes.map(recipe => (
                        <RecipeCard key={recipe.id} recipe={recipe} />
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-gray-500">
                        <p className="text-lg">No recipes found matching your criteria.</p>
                        <button
                            onClick={() => { setSearch(''); setPage(1); }}
                            className="mt-4 text-orange-600 hover:underline"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {!isLoading && recipes.length > 0 && (
                <div className="mt-8 flex justify-center items-center gap-4">
                    <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page <= 1}
                        className="px-4 py-2 bg-white border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50 transition-colors"
                    >
                        Previous
                    </button>

                    <span className="text-gray-600">
                        Page <span className="font-bold">{page}</span> of {pagination.totalPages || 1}
                    </span>

                    <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={!pagination.hasMore}
                        className="px-4 py-2 bg-white text-orange-600 border border-orange-200 rounded disabled:opacity-50 hover:bg-orange-50 transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
