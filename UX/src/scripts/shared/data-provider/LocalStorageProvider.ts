import { StringMap } from '../StringMap'
/**
 * interface wrapper to hide localStorage with (acts as our typings file almost too)
 */
export interface ILocalStorage {
    /**
     * from a given key return the value in storage method
     * @param key key to search for in memory
     * @returns <string> the value for the key
     */
    getItem(key: string): string;

    /**
     * set the value of a given key to a provided value
     * @param key key to store the new value at
     * @param value value to store in this given key
     * @returns <void>
     */
    setItem(key: string, value: string): void;

    /**
     * remove a target key from the storage system
     * @param key key to remove from the storage system
     * @returns <void>
     */
    removeItem(key: string): void;

    /**
     * clear all of the storage; for true localStorage will clear all memory for this domain, use cautiously
     * @returns <void>
     */
    clear(): void;
}

/**
 * interface to the main localstorage wrapper; use this to interact safely with localStorage
 * NOTE: Please check if enabled before taking actions, the default actions performed otherwise
 * are stored in local memory only and will be lost!
 */
export interface ILocalStorageWrapper extends ILocalStorage {
    /**
     * responds as true if the real localStorage is active; otherwise false
     * @returns <booelan> true if localStorage is truely enabled; false otherwise
     */
    isEnabled(): boolean;
}

/**
 * mocked storage in memory; if local storage is not permitted by security it will
 * allow us to keep some experience going but information will be extremely volitile
 */
class MockedStorage implements ILocalStorage {
    private memory: StringMap<string> = {};
    
    /**
     * from a given key return the value in storage method
     * @param key key to search for in memory
     * @returns <string> the value for the key
     */
    public getItem(key: string): string {
        if (key in this.memory) {
            return this.memory[key];
        }
        return null;
    }

    /**
     * set the value of a given key to a provided value
     * @param key key to store the new value at
     * @param value value to store in this given key
     * @returns <void>
     */
    public setItem(key: string, value: string): void {
        this.memory[key] = value;
    }

    /**
     * remove a target key from the storage system
     * @param key key to remove from the storage system
     * @returns <void>
     */
    public removeItem(key: string) {
        if (key in this.memory) {
            delete this.memory[key];
        }
    }

    /**
     * clear all of the storage; for true localStorage will clear all memory for this domain, use cautiously
     * @returns <void>
     */
    clear(): void {
        this.memory = {};
    }
}

export class LocalStorageWrapper implements ILocalStorageWrapper {
    private storageEngine: ILocalStorage;
    private enabled: boolean;

    /**
     * .ctor() setup localStorage, if security policies are rejecting the name localStorage create
     * a mocked dummy object to utilize instead but note no storage will occur!
     */
    public constructor() {
        try {
            this.storageEngine = localStorage;
            this.storageEngine.setItem('infrainsights.lstest.key', 'test');
            this.storageEngine.removeItem('infrainsights.lstest.key');
            this.enabled = true;
        } catch {
            this.storageEngine = new MockedStorage();
            this.enabled = false;
        }
    }

    /**
     * responds as true if the real localStorage is active; otherwise false
     * @returns <booelan> true if localStorage is truely enabled; false otherwise
     */
    public isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * from a given key return the value in storage method
     * @param key key to search for in memory
     * @returns <string> the value for the key
     */
    public getItem(key: string): string {
        return this.storageEngine.getItem(key);
    }

    /**
     * set the value of a given key to a provided value
     * @param key key to store the new value at
     * @param value value to store in this given key
     * @returns <void>
     */
    public setItem(key: string, value: string) {
        this.storageEngine.setItem(key, value);
    }

    /**
     * remove a target key from the storage system
     * @param key key to remove from the storage system
     * @returns <void>
     */
    public removeItem(key: string) {
        this.storageEngine.removeItem(key);
    }

    /**
     * clear all of the storage; for true localStorage will clear all memory for this domain, use cautiously
     * @returns <void>
     */
    public clear(): void {
        this.storageEngine.clear();
    }
}
