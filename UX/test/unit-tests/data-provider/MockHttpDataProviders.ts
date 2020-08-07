import { HttpVerb, IHttpDataProvider, IHttpRequestContent } from '../../../src/scripts/shared/data-provider/v2/HttpDataProvider';

/**
 * Logs all requests made
 */
export class LoggingHttpDataProvider implements IHttpDataProvider {
    private log: any[];

    constructor() {
        this.log = [];
    }

    public executeRequest(
        verb: HttpVerb,
        url: string, 
        timeoutMs: number,
        headers?: StringMap<string>,
        content?: IHttpRequestContent,
    ): Promise<any> {
        this.log.push({verb, url, timeoutMs, headers, content});
        return Promise.resolve();
    }

    public getLog(): any[] {
        return this.log;
    }

    public reset(): void {
        this.log = [];
    }
}

/**
 * Mock data provider that always returns a promise that resolves with resolveValue parameter 
 */
export class AlwaysSucceedingHttpDataProvider implements IHttpDataProvider {
    private resolveValue: any;

    constructor(resolveValue: any) {
        this.resolveValue = resolveValue;
    }
    
    public executeRequest(
        verb: HttpVerb, 
        url: string, 
        timeoutMs: number, 
        headers?: StringMap<string>, 
        content?: IHttpRequestContent
    ): Promise<any> {
        return Promise.resolve(this.resolveValue);
    }
}

/**
 * Mock data provider that always returns a promise that rejects with rejectValue parameter
 */
export class AlwaysFailingHttpDataProvider implements IHttpDataProvider {
    private rejectValue: any;

    constructor(rejectValue: any) {
        this.rejectValue = rejectValue;
    }

    public executeRequest(
        verb: HttpVerb, 
        url: string, 
        timeoutMs: number, 
        headers?: StringMap<string>, 
        content?: IHttpRequestContent
    ): Promise<any> {
        return Promise.reject(this.rejectValue);
    }
}

/**
 * Mock data provider that fails x times, before succeeding thereafter
 */
export class FailThenSucceedHttpDataProvider implements IHttpDataProvider {
    private numTimesToFail: number;
    private numFailures: number;
    private resolveValue: any;
    private rejectValue: any;

    constructor(resolveValue: any, rejectValue: any, numTimesToFail?: number) {
        this.resolveValue = resolveValue;
        this.rejectValue = rejectValue;
        this.numTimesToFail = numTimesToFail || 0;
        this.numFailures = 0;
    }

    public executeRequest(
        verb: HttpVerb, 
        url: string, 
        timeoutMs: number, 
        headers?: StringMap<string>, 
        content?: IHttpRequestContent
    ): Promise<any> {
        if (this.numFailures < this.numTimesToFail) {
            this.numFailures++;
            return Promise.reject(this.rejectValue);
        } else {
            return Promise.resolve(this.resolveValue);
        }
    }

    public getNumFailures(): number {
        return this.numFailures;
    }
}

/**
 * Mock data provider that succeeds once before failing thereafter
 */
export class SucceedThenFailHttpDataProvider implements IHttpDataProvider {
    private resolveValue: any;
    private rejectValue: any;
    private hasSucceededOnce: boolean;
    private numFailures: number;

    constructor(resolveValue: any, rejectValue: any) {
        this.resolveValue = resolveValue;
        this.rejectValue = rejectValue;
        this.hasSucceededOnce = false;
        this.numFailures = 0;
    }

    public executeRequest(
        verb: HttpVerb, 
        url: string, 
        timeoutMs: number, 
        headers?: StringMap<string>, 
        content?: IHttpRequestContent
    ): Promise<any> {
        if (!this.hasSucceededOnce) {
            return Promise.resolve(this.resolveValue);
        } else {
            this.numFailures++;
            return Promise.reject(this.rejectValue);
        }
    }

    public getNumFailures(): number {
        return this.numFailures;
    }
}
