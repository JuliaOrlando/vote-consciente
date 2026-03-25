import type { Parlamentar } from "@prisma/client";

let deputadosDirectoryCache: Parlamentar[] | null = null;
let deputadosDirectoryPromise: Promise<Parlamentar[]> | null = null;

export async function getCachedDeputadosDirectory(
  loader: () => Promise<Parlamentar[]>
): Promise<Parlamentar[]> {
  if (deputadosDirectoryCache) {
    return deputadosDirectoryCache;
  }

  if (!deputadosDirectoryPromise) {
    deputadosDirectoryPromise = loader()
      .then((items) => {
        deputadosDirectoryCache = items;
        return items;
      })
      .finally(() => {
        deputadosDirectoryPromise = null;
      });
  }

  return deputadosDirectoryPromise;
}
