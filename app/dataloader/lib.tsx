import { useId, useMemo } from "react";
import { useLocation } from "remix";
import invariant from "@remix-run/react/invariant";
import jsesc from "jsesc";
import Gun, { GunOptions } from "gun";
import { useDataLoader } from "./context";
import { useIf, useSafeCallback } from "bresnow_utility-react-hooks";
import { useGunStatic } from "~/lib/gun/hooks";
import React from "react";
export { DataloaderProvider } from "./context";
/**
 * @param {string} remix route path to load
 * @param {string} optional nodePath to load cached data from the browser's rad/ indexeddb
 */
export function useDeferedLoaderData<T = any>(
  routePath: string,
  cacheOptions?: { local_only: boolean }
) {
  let dataloader = useDataLoader();
  /**
   * using peer connections and IndexedDB radata for cache storage as defailt. optionally you can use IndexedDB with no peers.
   */
  const [cache] = useGunStatic(
    Gun,
    cacheOptions?.local_only ? { localStorage: false } : undefined
  );
  let [cached, setCachedData] = React.useState<Record<string, any> | undefined>(
    undefined
  );
  let { key } = useLocation();
  useIf([key], () => {
    cache.get(key).on((data: T) => {
      if (data) setCachedData(data);
    });
  });

  let defered = useMemo(() => {
    invariant(dataloader, "Context Provider is undefined for useGunFetcher");
    let defered = { resolved: false } as {
      resolved: boolean;
      value?: T;
      error?: any;
      promise: Promise<void>;
    };
    defered.promise = dataloader
      .load(routePath)
      .then((response) => response.json())
      .then((value) => {
        defered.value = value;
        defered.resolved = true;
      })
      .catch((error) => {
        defered.error = error;
        defered.resolved = true;
      });
    return defered;
  }, [routePath, key]);

  return {
    load(): T {
      if (typeof defered.value !== "undefined") {
        cache.get(key).put(defered.value);
        return defered.value;
      }
      if (typeof defered.error !== "undefined") {
        throw defered.error;
      }

      throw defered.promise;
    },
    cachedData() {
      if (cached) {
        return cached;
      }
    },
  };
}

export function useGraphLoader(path: string) {
  let dataloader = useDataLoader();
  let { key } = useLocation();
  let defered = useMemo(() => {
    invariant(dataloader, "Context Provider is undefined for useGunFetcher");
    let defered = { resolved: false } as {
      resolved: boolean;
      value?: any;
      error?: any;
      promise: Promise<void>;
    };
    defered.promise = dataloader
      .graph(path)
      .then((response) => response.json())
      .then((value) => {
        defered.value = value;
        defered.resolved = true;
      })
      .catch((error) => {
        defered.error = error;
        defered.resolved = true;
      });
    return defered;
  }, [path, key]);

  return {
    load(): any {
      if (typeof defered.value !== "undefined") {
        return defered.value;
      }
      if (typeof defered.error !== "undefined") {
        throw defered.error;
      }

      throw defered.promise;
    },
  };
}
