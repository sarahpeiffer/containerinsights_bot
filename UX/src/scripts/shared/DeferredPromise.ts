import { Promise } from 'es6-promise';

/**
 * deferred promises, use with caution, this is an antipattern if used incorrectly
 * usage:
 * 
 * function ourFunction() {
 *  const deferred = new DeferredPromise();
 *  timeout(100, () => { deferred.resolve(); });
 *  return deferred.promise();
 * }
 */
export class DeferredPromise<T> {

    private _promise: Promise<T>;
    private _resolve: (data: T) => void;
    private _reject: (error: any) => void;
    private _isFinalized: boolean = false;
    private _timeout: any = null;

    constructor() {
        const promise = new Promise<T>((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });

        this._promise = promise;
    }

    public withTimeout(interval: number, errorMessage: string): DeferredPromise<T> {
        this._timeout = setTimeout(() => {
            this.reject(new Error(errorMessage))
        }, interval);
        return this;
    }

    public resolve(data: T) {
        this.clearInterval();
        this._resolve(data);

        this._isFinalized = true;
    }

    public reject(error: any) {
        this.clearInterval();
        this._reject(error);

        this._isFinalized = true;
    }

    public promise(): Promise<T> {
        if (this._isFinalized) { throw 'Promise is already finalized!';  }
        
        return this._promise;
    }

    private clearInterval() {
        if (this._timeout !== null) {
            clearInterval(this._timeout);
            this._timeout = null;
        }
    }
}
