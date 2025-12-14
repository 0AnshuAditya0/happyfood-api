import useSWR from 'swr';

const fetcher = (url) => fetch(url).then(r => r.json());

export function useRecipes(filters = {}) {
  // Construct query params
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit || 20);
  if (filters.search) params.append('search', filters.search);
  if (filters.country) params.append('country', filters.country);
  if (filters.difficulty) params.append('difficulty', filters.difficulty);
  if (filters.maxCalories) params.append('maxCalories', filters.maxCalories);
  if (filters.dietary) params.append('dietary', filters.dietary);
  if (filters.sort) params.append('sort', filters.sort);

  const queryString = params.toString();
  const key = `/api/dishes?${queryString}`;

  const { data, error, mutate, isValidating } = useSWR(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
      keepPreviousData: true, // Good for pagination UX
    }
  );

  return {
    recipes: data?.data || [],
    pagination: data?.pagination || {},
    isLoading: !error && !data,
    isValidating,
    error,
    mutate,
  };
}
