// Retrieves (or creates) a Query from the client and returns its store for subscription.
export function useQuery(key, cb, options = {}, queryClient) {
  const query = queryClient.getQuery(key, cb, options)
  return query.store
}
