import { AppLocalStorage } from "./local-storage-utils";

type CacheItem = {
    data: any;
    expiresAt: number;
}

const cache = new Map<string, CacheItem>();

export const setCache = async (key: string, data: any, ttl: number) => {
    cache.set(key, {
        data,
        expiresAt: Date.now() + ttl
    });

    saveCache();
}

export const getCache = (key: string): any => {
    const item = cache.get(key);
    if (!item) {
        return null;
    }
    if (item.expiresAt < Date.now()) {
        cache.delete(key);
        saveCache();
        return null;
    }
    return item.data;
}

const saveCache = () => {
    const cacheArray = Array.from(cache.entries());
    const cacheJson = JSON.stringify(cacheArray);
    AppLocalStorage.setItem('cache', cacheJson);
}

const loadCache = () => {
    const cacheJson = AppLocalStorage.getItem<string>('cache');
    if (cacheJson) {
        const cacheArray = JSON.parse(cacheJson);
        cacheArray.forEach((item: [string, CacheItem]) => {
            cache.set(item[0], item[1]);
        });
    }
    console.log('Cache loaded');
}

// each 12 hours
const clearCache = () => {
    console.log('Clearing cache');
    let deleted = 0;
    cache.forEach((value, key) => {
        if (value.expiresAt < Date.now()) {
            cache.delete(key);
            deleted++;
        }
    });
    if(deleted > 0) {
        saveCache();
    }
}

loadCache();

setInterval(() => {
    clearCache();
}, 1000 * 60 * 60 * 12);