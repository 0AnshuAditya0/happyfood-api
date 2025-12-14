import useSWR from 'swr';

const fetcher = (url) => fetch(url).then(r => r.json());

export function useRecipe(id) {
  const { data, error, mutate, isValidating } = useSWR(
    id ? `/api/dishes/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 3600000, // 1 hour (recipes dont change often)
    }
  );

  return {
    recipe: data?.data || null,
    isLoading: !error && !data,
    isValidating,
    error,
    mutate,
  };
}
