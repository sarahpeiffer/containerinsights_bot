import { IARMDataProvider } from '../../src/scripts/shared/data-provider/ARMDataProvider';

/**
 * Mock ARM data provider that always returns a promise that resolves with resolveValue parameter 
 * @param resolveValue the value that you want the returned promise to resolve with
 */
export class AlwaysSucceedingARMDataProvider implements IARMDataProvider {
    private resolveValue: any;

    /**
     * @param resolveValue the value that you want the returned promise to resolve with
     */
    constructor(resolveValue: any) {
        this.resolveValue = resolveValue;
    }
    
    public executePost(uri: string, timeoutMs: number, data?: string, headers?: StringMap<string>): Promise<any> {
        return new Promise((resolve, reject) => resolve(this.resolveValue));
    }

    public executeGet(uri: string, timeoutMs: number, headers?: StringMap<string>): Promise<any> {
        return new Promise((resolve, reject) => resolve(this.resolveValue));
    }
}

/**
 * Mock ARM data provider that always returns a promise that rejects with rejectValue parameter
 * @param rejectValue the value that you want the returned promise to reject with
 */
export class AlwaysFailingARMDataProvider implements IARMDataProvider {
    private rejectValue: any;

    /**
     * @param rejectValue the value that you want the returned promise to reject with
     */
    constructor(rejectValue: any) {
        this.rejectValue = rejectValue;
    }

    public executePost(uri: string, timeoutMs: number, data?: string, headers?: StringMap<string>): Promise<any> {
        return new Promise((resolve, reject) => reject(this.rejectValue));
    }

    public executeGet(uri: string, timeoutMs: number, headers?: StringMap<string>): Promise<any> {
        return new Promise((resolve, reject) => reject(this.rejectValue));
    }
}

/**
 * Mock ARM data provider that fails x times, before succeeding thereafter
 * @param resolveValue the value you want your promise to resolve to
 * @param rejectValue the value you want your promise to reject with
 * @param numTimesToFail the number of times the mock ARM data provider is supposed to fail, before finally succeeding
 */
export class FailThenSucceedARMDataProvider implements IARMDataProvider {
    private numTimesToFail: number;
    private numFailures: number;
    private resolveValue: any;
    private rejectValue: any;

    /**
     * @param resolveValue the value you want your promise to resolve to
     * @param rejectValue the value you want your promise to reject with
     * @param numTimesToFail the number of times the mock ARM data provider is supposed to fail, before finally succeeding
     */
    constructor(resolveValue: any, rejectValue: any, numTimesToFail?: number) {
        this.resolveValue = resolveValue;
        this.rejectValue = rejectValue;
        this.numTimesToFail = numTimesToFail || 0;
        this.numFailures = 0;
    }

    public executePost(uri: string, timeoutMs: number, data?: string, headers?: StringMap<string>): Promise<any> {
        if (this.numFailures < this.numTimesToFail) {
            this.numFailures++;
            return new Promise((resolve, reject) => reject(this.rejectValue));
        } else {
            return new Promise((resolve, reject) => resolve(this.resolveValue));            
        }
    }

    public executeGet(uri: string, timeoutMs: number, headers?: StringMap<string>): Promise<any> {
        if (this.numFailures < this.numTimesToFail) {
            this.numFailures++;
            return new Promise((resolve, reject) => reject(this.rejectValue));
        } else {
            return new Promise((resolve, reject) => resolve(this.resolveValue));            
        }
    }

    /**
     * @return returns the number of times that executePost has failed
     */
    public getNumFailures(): number {
        return this.numFailures;
    }
}

/**
 * Mock ARM data provider that succeeds once before failing thereafter
 * @param resolveValue the value you want your promise to resolve to
 * @param rejectValue the value you want your promise to reject with
 */
export class SucceedThenFailARMDataProvider implements IARMDataProvider {
    private resolveValue: any;
    private rejectValue: any;
    private hasSucceededOnce: boolean;
    private numFailures: number;

    /**
     * @param resolveValue the value you want your promise to resolve to
     * @param rejectValue the value you want your promise to reject with
     */
    constructor(resolveValue: any, rejectValue: any) {
        this.resolveValue = resolveValue;
        this.rejectValue = rejectValue;
        this.hasSucceededOnce = false;
        this.numFailures = 0;
    }

    public executePost(uri: string, timeoutMs: number, data?: string, headers?: StringMap<string>): Promise<any> {
        if (!this.hasSucceededOnce) {
            return new Promise((resolve, reject) => resolve(this.resolveValue));            
        } else {
            this.numFailures++;
            return new Promise((resolve, reject) => reject(this.rejectValue));
        }
    }

    public executeGet(uri: string, timeoutMs: number, headers?: StringMap<string>): Promise<any> {
        if (!this.hasSucceededOnce) {
            return new Promise((resolve, reject) => resolve(this.resolveValue));            
        } else {
            this.numFailures++;
            return new Promise((resolve, reject) => reject(this.rejectValue));
        }
    }

    /**
     * @return returns the number of times that executePost has failed
     */
    public getNumFailures(): number {
        return this.numFailures;
    }
}
