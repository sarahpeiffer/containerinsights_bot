export class LimitedCache<T> {

    private cache: StringMap<T>;
    private cacheLimit: number;
    private overFlowIndex: number = 0;
    private currentCacheSize: number = 0;
    private cacheKeys: string[] = [];

    constructor(cacheLimit?: number) {
        this.cache = {};
        this.cacheLimit = cacheLimit || 50;
    }

    public insert(key: string, element: T): void {
        if (this.cache.hasOwnProperty(key)) {
            this.cache[key] = element;
            return;
        }

        if (this.currentCacheSize >= this.cacheLimit) {
            delete this.cache[this.cacheKeys[this.overFlowIndex]];
        } else {
            this.currentCacheSize++;
        }

        this.cache[key] = element;
        this.cacheKeys[this.overFlowIndex] = key;
        this.overFlowIndex = (this.overFlowIndex + 1) % this.cacheLimit;
    }

    public get(key: string): T {
        return this.cache[key];
    }

    public clear() {
        this.cache = {};
        this.overFlowIndex = 0;
        this.currentCacheSize = 0;
        this.cacheKeys = [];
    }
}
