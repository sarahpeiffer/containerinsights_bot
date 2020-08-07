/** tpl */
import { Promise } from 'es6-promise';

/** default timeout for checking 'is script already loaded' in ms */
const DEFAULT_LOAD_COMPLETED_CHECK_TIMEOUT_MS = 50;

/** default timeout for checking if script failed to load in ms */
const DEFAULT_LOAD_TIMEDOUT_CHECK_TIMEOUT_MS = 10 * 1000;

/**
 * provides functionality to load javascript bundles asynchronously
 */
export class AsyncScriptLoadManager {
    /** script name */
    private _script: string;

    /** callback invoked to check whether script is loaded */
    private _isLoadCompletedCheck: () => boolean;

    /** script loaded check interval */
    private _loadCheckInterval: any;

    /** time interval to check whether script finished loading */
    private _loadCompletedCheckTimeoutMs: number;

    /** time interval after which to consider loading a failure unless completed */
    private _loadTimedOutCheckTimeoutMs: number;

    /** true if load was started */
    private _isLoadStarted: boolean;

    /** true if load was completed */
    private _isLoadCompleted: boolean;

    /** true if load succeeded */
    private _isLoadSucceeded: boolean;

    /**
     * initializes an instance of the class
     * @param script script to load (i.e. abc.js)
     * @param isLoadCompletedCheck callback to check if script was loaded, parsed and executed
     * @param loadCompletedCheckTimeoutMs time interval for 'is script loaded' check
     * @param loadTimedOutCheckTimeoutMs time interval after which to consider loading a failure unless completed
     * 
     * @see ~/health/index.emulator.d.ts for more information and usage example
     */
    public constructor(
        script: string,
        isLoadCompletedCheck: () => boolean,
        loadCompletedCheckTimeoutMs?: number,
        loadTimedOutCheckTimeoutMs?: number
    ) {
        if (!script) { throw new Error('@script may not be null at AsyncScriptLoadManager.ctor()'); }
        if (!isLoadCompletedCheck) { throw new Error('@isLoadCompletedCheck may not be null at AsyncScriptLoadManager.ctor()'); }

        this._script = script;
        this._isLoadCompletedCheck = isLoadCompletedCheck;
        this._loadCompletedCheckTimeoutMs = loadCompletedCheckTimeoutMs || DEFAULT_LOAD_COMPLETED_CHECK_TIMEOUT_MS;
        this._loadTimedOutCheckTimeoutMs = loadTimedOutCheckTimeoutMs || DEFAULT_LOAD_TIMEDOUT_CHECK_TIMEOUT_MS;

        this._isLoadStarted = false;
        this._isLoadCompleted = false;
        this._isLoadSucceeded = false;

        console.log(`BUNDLE LOAD: Initialized async loading of script ${this._script}`);
    }

    /**
     * starts script load
     * @returns promise of operation completion
     */
    public load(): Promise<void> {
        if (this._isLoadStarted) { throw new Error(`Script load already started for ${this._script}`); }
        this._isLoadStarted = true;

        return this.startLoad();
    }

    /**
     * gets a value indicating whether script load completed (successfully of not)
     */
    public get isLoadCompleted(): boolean {
        return this._isLoadCompleted;
    }

    /**
     * starts script loading
     * @returns promise of operation completion
     */
    private startLoad(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                console.log(`BUNDLE LOAD: Starting async loading of script ${this._script}`);

                const scriptElement = document.createElement('script');
                scriptElement.src = this._script;
                scriptElement.async = false;

                document.head.appendChild(scriptElement);

                this._loadCheckInterval = 
                    setInterval(() => this.checkCompletion(resolve, reject), this._loadCompletedCheckTimeoutMs);

                setTimeout(() => this.checkTimedOut(reject), this._loadTimedOutCheckTimeoutMs);
            } catch (error) {
                this.recordFailure(error);
                reject(error);
            }
        });
    }

    /**
     * callback invoked to check whether script finished loading
     * @param resolve promise callback in case of success
     * @param reject promise callback for in case of failure
     */
    private checkCompletion(resolve: () => void, reject: (error: any) => void): void {
        try {
            if (!this._isLoadCompletedCheck()) { 
                console.log(`BUNDLE LOAD: Load completion check indicates 'NOT YET LOADED' for script ${this._script}`);
                return; 
            }

            console.log(`BUNDLE LOAD: Load completion check indicates 'LOADED' for script ${this._script}`);

            this._isLoadCompleted = true;
            this._isLoadSucceeded = true;
            clearInterval(this._loadCheckInterval);

            resolve();
        } catch (error) {
            this.recordFailure(error);
            reject(error);
        }
    }

    /**
     * callback invoked to check whether script loading timed out
     * @param reject promise callback for in case of failure
     */
    private checkTimedOut(reject: (error: any) => void): void {
        console.log(`BUNDLE LOAD: Checking for timeout loading script ${this._script}`);

        if (this._isLoadCompleted) {
            console.log(`BUNDLE LOAD: Script ${this._script} timeout check: load previously ` 
                      + `${this._isLoadSucceeded ? 'succeeded' : 'failed'}.`);
            return;
        }

        const errorMessage = `Script ${this._script} load timed out`;

        this.recordFailure(errorMessage);
        reject(errorMessage);
    }

    /**
     * records failure during script load
     * @param error error object
     */
    private recordFailure(error: string | Error): void {
        if (this._loadCheckInterval) { clearInterval(this._loadCheckInterval); }

        this._isLoadCompleted = true;
        this._isLoadSucceeded = false;

        console.error(`BUNDLE LOAD: Script ${this._script} failed to load.`, error);
    }
}
