/**
 * Simple cache interface
 */
export interface ISimpleCache {
    /**
     * Gets item from cache
     * @param key item key
     * @returns item or 'undefined' if specified key is not present in cache
     */
    getItem(key: string): any;

    /**
     * Adds item to cache
     * @param key item key
     * @param item item to add
     */
    addItem(key: string, item: any): void;
}

/**
 * Simple cache with time-based item expiration
 */
export class IntervalExpirationCache implements ISimpleCache {
    /** cache expiration interval */
    private expirationIntervalMilliseconds: number;

    /** cache object */
    private cache: any;

    /**
     * .ctor
     * @param expirationIntervalMilliseconds cache expiration interval
     */
    constructor(expirationIntervalMilliseconds: number) {
        if (expirationIntervalMilliseconds <= 0) { 
            throw new Error('Parameter @expirationIntervalMilliseconds must be >= 0'); 
        }

        this.expirationIntervalMilliseconds = expirationIntervalMilliseconds;
        this.cache = {};
    }

    /**
     * Gets item from cache
     * @param key item key
     * @returns item or 'undefined' if specified key is not present in cache
     */
    public getItem(key: string): any {
        if (key === undefined) { throw new Error('Parameter @key may not be undefined'); }

        const cacheItem = this.cache[key];

        if (!cacheItem) { return undefined; }

        // check for expiration
        const cacheTime = cacheItem.timestamp;
        if (!cacheTime) { return undefined; }

        const elapsedMilliseconds = Date.now() - cacheTime;
        if (elapsedMilliseconds > this.expirationIntervalMilliseconds) { return undefined; }

        return cacheItem.item;
    }

    /**
     * Adds item to cache
     * @param key item key
     * @param item item to add
     */
    public addItem(key: string, item: any): void {
        if (key === undefined) { throw new Error('Parameter @key may not be undefined'); }
        if (item === undefined) { throw new Error('Parameter @item may not be undefined'); }

        this.cache[key] = {
            timestamp: Date.now(),
            item: item
        };
    }
}
