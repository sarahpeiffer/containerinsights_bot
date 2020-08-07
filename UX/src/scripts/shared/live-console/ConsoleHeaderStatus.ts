/**
 * Status of the live log query
 */
export enum FetchStatus {
    New,
    Running,
    Paused,
    Error
}

/**
 * Status of the live log query engine, changes every 2 seconds or so to delay screen changes
 * so humans can actually see what happened
 */
export interface IConsoleRefreshDetails {
    count: number;
    eventCount: number;
    isError: boolean;
    isPaused: boolean;
    isLogsTabPresent: boolean;
}

/**
 * Callback type for subscribing for details about the status of live logging
 */
export type CallbackConsoleRefresh = (details: IConsoleRefreshDetails) => void;

/**
 * Manages the status of the live logging system as a human readable pace
 */
export class ConsoleHeaderStatus {

    /**
     * Singleton
     */
    private static instance: ConsoleHeaderStatus;

    /**
     * subscribed handlers...
     */
    private callbackHandlers: StringMap<CallbackConsoleRefresh>;

    /**
     * interval our human readable refreshes occurs at... starts when our first subscriber
     * registers and ends when our last subscriber unregisters (restartable)
     */
    private interval: any;

    /**
     * current status of the live log system; tracked across multiple of
     * the 500ms queries
     */
    private refreshDetails: IConsoleRefreshDetails;

    private isQueryStopped: boolean;
    private instanceName: string;

    /**
     * .ctor(), establish starting values
     */
    constructor() {
        this.callbackHandlers = {};
        this.isQueryStopped = false;
        this.instanceName = null;
        this.refreshDetails = {
            count: 0,
            eventCount: 0,
            isError: false,
            isPaused: false,
            isLogsTabPresent: false
        };
    }

    /**
     * Singleton accessor
     * @returns the single instance of this engine
     */
    public static Instance(): ConsoleHeaderStatus {
        if (!ConsoleHeaderStatus.instance) {
            ConsoleHeaderStatus.instance = new ConsoleHeaderStatus();
        }
        return ConsoleHeaderStatus.instance;
    }

    /**
     * Allows the live log engine to transition our human readable engine into
     * an error state for display in the user interface
     * @param isQueryStopped boolean which states wether we've stopped querying due to error state or not
     */
    public static TransitionErrorState(isQueryStopped: boolean): void {
        ConsoleHeaderStatus.Instance().refreshDetails.isError = true;
        ConsoleHeaderStatus.Instance().isQueryStopped = isQueryStopped;
    }

    /**
     * Sets the isLogsTabPresent variable to the value being passed as an argument
     * @param value boolean which sets the value for the log tab being present or not
     */
    public static SetLogTabPresent(value: boolean): void {
        const instance = ConsoleHeaderStatus.Instance();
        instance.refreshDetails.isLogsTabPresent = value;
    }

    /**
     * Allows the live log engine to tell us the engine is paused.
     */
    public static TogglePaused(): void {
        const instance = ConsoleHeaderStatus.Instance();
        instance.refreshDetails.isPaused = !instance.refreshDetails.isPaused;
    }

    /**
     * Called by live logging engine on successful invokes to the proxy telling us
     * how many (including zero) logs were added this time
     * @param newLogsCount number of logs added to live logging cache this query
     */
    public static AppendLogCount(newLogsCount: number) {
        ConsoleHeaderStatus.Instance().refreshDetails.count += newLogsCount;
    }

    /**
     * Called by live data engine on successful invokes to the proxy tellins us how many 
     * (including zero) events where found while doing a 'kubectl get events' type query
     * @param eventCount number of events being set each time (similar to doing a 'watch' on kubectl get events)
     */
    public static AppendEventCount(eventCount: number) {
        ConsoleHeaderStatus.Instance().refreshDetails.eventCount = eventCount;
    }

    /**
     * Allows the user interface to register for human readable updates to the live logging engine
     * @param name name to register this handler under
     * @param refresh callback to register to be invoked at human readable paces
     */
    public register(name: string, refresh: CallbackConsoleRefresh): void {
        if (Object.keys(this.callbackHandlers).length < 1) {
            this.interval = setInterval(this.onIntervalTick.bind(this), 2000);
        }
        this.instanceName = name;
        this.callbackHandlers[name] = refresh;
    }

    /**
     * Allows the user interface to unregister itself from the human readable engine
     * @param name callback to unregister from the human readable engine
     */
    public unregister(name: string) {
        delete this.callbackHandlers[name];
        this.refreshDetails = {
            count: 0,
            eventCount: 0,
            isError: false,
            isPaused: false,
            isLogsTabPresent: false
        };

        if (Object.keys(this.callbackHandlers).length < 1) {
            clearInterval(this.interval);
        }
    }

    /**
     * Called by the interval internally to invoke the handlers for any subscribers
     */
    private onIntervalTick() {
        const keys = Object.keys(this.callbackHandlers);
        keys.forEach((key) => {
            this.callbackHandlers[key](this.refreshDetails);
        });

        this.refreshDetails.count = 0;
        this.refreshDetails.eventCount = 0;
        if (this.isQueryStopped) {
            this.isQueryStopped = false;
            ConsoleHeaderStatus.Instance().unregister(this.instanceName);
        }
        this.refreshDetails.isError = false;
    }
}
