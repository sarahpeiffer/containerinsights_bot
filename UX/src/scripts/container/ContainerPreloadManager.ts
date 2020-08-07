import { polyfillObjectAssign } from '../shared/ObjectAssignShim';
polyfillObjectAssign();

/** shared imports */
import { TimeInterval } from '../shared/data-provider/TimeInterval';

import { PortalMessagingProvider } from '../shared/messaging/v2/PortalMessagingProvider';
import { ThemeMessageProcessor } from '../shared/messaging/v2/ThemeMessageProcessor';

/** local imports */
import { IContainerInsightsPreloadState } from './IContainerInsightsPreloadState';
import { ContainerGlobals } from './ContainerGlobals';
import { createWorker, IQueryTimeRange } from './ContainerPreloadWorker';
import { ContainerPreloadQueryManager } from './ContainerPreloadQueryManager';
import { AuthorizationTokenType } from '../shared/InitializationInfo';
import { LocaleStringsHandler } from '../shared/LocaleStringsHandler';
import { EnvironmentConfig, AzureCloudType } from '../shared/EnvironmentConfig';
import { MdmCustomMetricAvailabilityLocations } from '../shared/MdmCustomMetricAvailabilityLocations';
import { BladeContext } from './BladeContext';
import { INavigationProps } from './ContainerMainPageTypings';

/**
 * Properties of the initialization event used by / required by preload script
 */
interface IPreloadInitEventProps {
    /** true if we're in 'in-blade' experience */
    isInBlade: boolean;

    /** arm auth token */
    armAuthorizationHeaderValue: string;

    /** log analytics auth token */
    logAnalyticsAuthorizationHeaderValue: string;

    /** workspace resource id */
    workspaceResourceId: string;

    /** cluster name */
    containerClusterName: string;

    /** container cluster resource id */
    containerClusterResourceId: string;

    /** location of the auth.html landing page for sso / aad login redirect */
    authorizationUrl: string;

    /** feature flag set if loading in mpac mode */
    isMpac: boolean;

    /** cluster location / region */
    containerClusterLocation: string;

    /** Azure cloud type, i.e. Nonpublic, Public, Mooncake, Fairfax, Blackforest */
    azureCloudType?: AzureCloudType;

    /** Navigation props */
    navigationProps: INavigationProps;
}

/**
 * General shim class... this is responsible for being extremely small (prefer under 50kb)
 * and making our network calls.  The idea being the sooner we get our kusto calls started
 * they will take far longer then any UI load for the foresable future.  This gives the UI
 * free reign to load as slow as it needs because the CPU has nothing to do but load the UI
 * while we wait for kusto to respond.  Note: we load the rest of our application here as well
 * so the UI thread doesn't get suddenly innundated with requests to do iFrame loading
 * from teh HTML
 */
export class ContainerPreloadManager {
    /** state of the preload operation */
    private preloadState: IContainerInsightsPreloadState;

    /** container insights page load perf measurements */
    private performanceMeasures: any;

    /** init message has ocurred on the ui thread */
    private _worker: Worker;

    /** descriptor, this must be freed to prevent a memory leak for web workers */
    private _workerDescriptor: string;

    /** true if post-preload javascript was loaded */
    private isPostPreloadJavascriptLoaded: boolean;

    /**
     * .ctor(): setup the data provider.. this class serves one purpose (trigger off the
     * initial kusto requests so retry not required)
     */
    public constructor() {

        const { worker, uri } = createWorker();
        this._worker = worker;
        this._workerDescriptor = uri;

        if (this._worker) {
            this._worker.onerror = this.onWorkerError.bind(this);
            this._worker.onmessage = this.onWorkerEvent.bind(this);
        }

        this.processInitEvent = this.processInitEvent.bind(this);
        this.preloadState = ContainerGlobals.preloadState;
        this.performanceMeasures = ContainerGlobals.performanceMeasures;

        this.isPostPreloadJavascriptLoaded = false;
    }

    /**
     * Load the actual application (this is us!!)
     */
    public loadPostQuestJavascript(): void {
        if (this.isPostPreloadJavascriptLoaded === true) { return; }

        this.performanceMeasures['pre_JSBootstrap'] = Date.now();

        this.loadScript('../web/base-libs/react.16.7.0.production.min.js');
        this.loadScript('../web/base-libs/react-dom.16.7.0.production.min.js');
        this.loadScript('../web/base-libs/d3.3.5.12.min.js');
        this.loadScript('../web/base-libs/q.1.5.1.min.js');
        this.loadScript('./container-perf.js');

        this.isPostPreloadJavascriptLoaded = true;
    }

    /**
     * Establish a connection to Ibiza.  we need the arm and la tokens...
     */
    public startPreload() {
        console.log(`PRELOAD SCRIPT::Starting preload`);
        console.log(`PRELOAD SCRIPT::Initializing messaging...`);

        try {
            const messagingProvider = PortalMessagingProvider.Instance();

            messagingProvider.registerProcessor('theme', ThemeMessageProcessor.Instance().handleEvent);
            messagingProvider.registerProcessor('init', this.processInitEvent);
            messagingProvider.registerProcessor('localeStrings', LocaleStringsHandler.Instance().handleLocaleEvent);

            messagingProvider.startMessaging();

            console.log(`PRELOAD SCRIPT::Successfully initialized messaging.`);
        } catch (error) {
            console.error('PRELOAD SCRIPT::Preload messaging initialization failed. Error:', error);
            this.terminatePreload(error);
        }
    }

    /**
      * Terminates preloading process
      * @param error optional error in case preload failed or failed to initialize
      */
    public terminatePreload(error?: any): void {
        console.log(`PRELOAD SCRIPT::Terminating preload...`);

        try {
            this.unregisterInitEventListener();

            this.preloadState.preloadCompleted = true;
            this.preloadState.preloadSucceeded = false;
            this.preloadState.preloadError = error;

            console.log(`PRELOAD SCRIPT::Preload terminated.`);
        } catch (error) {
            console.error(`PRELOAD SCRIPT::Preload failed to terminate. Error:`, error);
        }

        this.loadPostQuestJavascript();
    }

    /**
     * webworkers are going to need to merge the details somehow, they will send a JSON object
     * to the UI thread who will merge the state they have with the webworker final state
     * @param containerInsights root object to merge
     */
    public mergeGlobals(containerInsights: IContainerInsightsPreloadState): void {
        containerInsights.initializationEvent = this.preloadState.initializationEvent;
        containerInsights.preloadPossible = this.preloadState.preloadPossible;

        // vitalyf: fix the dates since those are not serialized correctly
        const timeIntervalUntyped = (containerInsights.timeInterval as any);

        let startDate = new Date(timeIntervalUntyped.startTime);
        let endDate = new Date(timeIntervalUntyped.endTime);

        const newInterval = new TimeInterval(startDate, endDate, timeIntervalUntyped.idealNumberOfDataPoints);
        containerInsights.timeInterval = newInterval;

        ContainerGlobals.preloadState = containerInsights;
    }

    /**
     * used to terminate a worker if it exists
     */
    private terminateWorker() {
        if (this._worker) {
            this._worker.terminate();
        }

        if (this._workerDescriptor) {
            URL.revokeObjectURL(this._workerDescriptor);
        }

        this._worker = null;
        this._workerDescriptor = null;
    }

    /**
     * invoked if webworker is present when the webworker postMessage() to the UI thread
     * @param event the event from the webworker
     */
    private onWorkerEvent(event: any) {
        console.log('PRELOAD SCRIPT::Received event from worker');

        const { containerInsights, performanceMeasures } = event.data;
        this.mergeGlobals(JSON.parse(containerInsights));

        Object.assign(ContainerGlobals.performanceMeasures, JSON.parse(performanceMeasures));

        this.terminateWorker();
    }

    /**
     * invoked if the webworker crashes
     * @param error if specified
     */
    private onWorkerError(error?: any) {
        console.error('PRELOAD SCRIPT::Web worker crashed!');
        console.log(error);

        // remap error from ErrorEvent sent by web worker to Error object
        let errorObject: Error;

        if ((error instanceof ErrorEvent) && error.message) {
            errorObject = new Error('Error in web worker: ' + error.message);
        } else {
            errorObject = error;
        }

        this.terminateWorker();
        this.terminatePreload(errorObject);
    }

    /**
      * returns false if the metadata is obviously making this incapable of doing mdm metrics
      * @param initializationEvent the init event from preload script
      */
    private shouldQueryMdm(data: IPreloadInitEventProps): boolean {

        // bbax: without cluster resource details querying will be impossible; we need
        // these details for the ARM path for MDM
        if (!data.containerClusterResourceId) {
            return false;
        }

        if (data.containerClusterResourceId.toLowerCase().indexOf('microsoft.containerservice/managedclusters') < 0) {
            return false;
        }

        const bladeLocation = data.containerClusterLocation || '';

        const isAvailableLocation: boolean =
            MdmCustomMetricAvailabilityLocations.indexOf(bladeLocation.toLocaleLowerCase()) > -1;

        return isAvailableLocation;
    }

    /**
     * Processes initialization event received from hosting blade
     * @param initEvent initialization event
     */
    private processInitEvent(initEvent: CustomEvent): void {
        try {
            console.log(`PRELOAD SCRIPT::Processing init "event"...`);

            if (!initEvent.detail || (!initEvent.detail.rawData)) {
                console.warn(`PRELOAD SCRIPT::"Init" event received by pre-load script missing detail.rawData`);
                return;
            }

            // save initialization event for possible later use by the main script
            this.preloadState.initializationEvent = initEvent;

            const data: IPreloadInitEventProps = JSON.parse(initEvent.detail.rawData) as IPreloadInitEventProps;

            if (!EnvironmentConfig.Instance().isConfigured()) {
                EnvironmentConfig.Instance().initConfig(data.azureCloudType, data.isMpac, data.authorizationUrl);
            }

            // preload works only for in-blade experience charts tab
            // in case cluster is onboarded to Container Insights (workspace id present)
            if (!data.isInBlade || !this.isSelectedTabCharts(data) || !data.workspaceResourceId) {
                console.warn(`PRELOAD SCRIPT::Preload only possible for in-blade experience and charts tab for onboarded cluster`);
                this.performanceMeasures['pre_conditionNotMet'] = Date.now();
                this.preloadState.preloadPossible = false;
                this.terminatePreload();
                return;
            }

            this.preloadState.preloadPossible = true;
            this.performanceMeasures['pre_conditionMet'] = Date.now();
            this.performanceMeasures['pre_tokenReceived'] = Date.now();

            console.log(`PRELOAD SCRIPT::Starting chart queries`);
            if (this._worker) {
                console.log(`PRELOAD SCRIPT::Handle init message via web worker`);
                this._worker.postMessage({
                    type: 'init', initMessage: {
                        armKey: data.armAuthorizationHeaderValue,
                        laKey: data.logAnalyticsAuthorizationHeaderValue,
                        workspace: data.workspaceResourceId,
                        cluster: data.containerClusterName,
                        authorizationUrl: data.authorizationUrl,
                        containerClusterResourceId: data.containerClusterResourceId,
                        navigationProps: data.navigationProps,
                        shouldQueryMdm: this.shouldQueryMdm(data),
                        azureCloudType: data.azureCloudType
                    }
                });
                this.loadPostQuestJavascript();
            } else {
                const queryManager = new ContainerPreloadQueryManager(ContainerGlobals.preloadState,
                    ContainerGlobals.performanceMeasures);

                console.log(`PRELOAD SCRIPT::Handle init message via primary preload path`);

                const authorizationValues = {};
                authorizationValues[AuthorizationTokenType.Arm] = data.armAuthorizationHeaderValue;
                authorizationValues[AuthorizationTokenType.LogAnalytics] = data.logAnalyticsAuthorizationHeaderValue;

                queryManager.setAuthorizationValues(authorizationValues);

                const bladeContext = BladeContext.instance();
                bladeContext.initialize(
                    data.containerClusterResourceId,
                    data.containerClusterName,
                    data.workspaceResourceId);

                if (data.navigationProps &&
                    data.navigationProps.pillSelections &&
                    data.navigationProps.pillSelections.startDateTimeISOString &&
                    data.navigationProps.pillSelections.endDateTimeISOString) {

                    const queryTimeRange: IQueryTimeRange = {
                        startDateTimeISOString: data.navigationProps.pillSelections.startDateTimeISOString,
                        endDateTimeISOString: data.navigationProps.pillSelections.endDateTimeISOString
                    };

                    queryManager.startChartsQuery(
                        data.workspaceResourceId,
                        bladeContext.cluster,
                        queryTimeRange,
                        this.shouldQueryMdm(data));
                } else {

                    queryManager.startChartsQuery(
                        data.workspaceResourceId,
                        bladeContext.cluster,
                        undefined,
                        this.shouldQueryMdm(data));
                }

                setTimeout(this.loadPostQuestJavascript.bind(this), 500);
            }

            this.unregisterInitEventListener();
        } catch (error) {
            console.error(`PRELOAD SCRIPT::Failed to process "init" event. Error:`, error);
            this.terminatePreload(error);
        }
    }

    /**
     * Checks if the selected tab is Charts tab
     * @param data init event data
     */
    private isSelectedTabCharts(data: IPreloadInitEventProps): boolean {
        return data && data.navigationProps && (data.navigationProps.selectedTab == null || data.navigationProps.selectedTab === 0);
    }

    /**
     * Stops listening to initialization events
     */
    private unregisterInitEventListener(): void {
        console.log(`PRELOAD SCRIPT::Unregistering "init" event listener...`);

        PortalMessagingProvider.Instance().unregisterProcessor('init', this.processInitEvent);

        console.log(`PRELOAD SCRIPT::"init" event listener unregistered.`);
    }

    /**
     * helpful wrapper around getScript from jQuery wrapping in a promise
     * @param path path to script to load
     */
    private loadScript(path: string): void {
        const scriptElement = document.createElement('script');
        scriptElement.src = path;
        scriptElement.async = false;

        document.head.appendChild(scriptElement);
    }
}
