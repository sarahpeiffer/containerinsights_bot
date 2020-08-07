/**
 * NOTE: Please do NOT include anything in this file except for interfaces.
 * some functionality in here will NOT have access to webpack which can cause
 * a nightmare.  to avoid this, just don't utilize any code from webpack!
 */
import { IContainerGlobals } from './ContainerGlobals';

/** 
 * DOM Shim: This is currently used by JQuery... in a webworker there is no dom, we are shimming the dom here so jquery can load
 * NOTE: Parts of JQuery still wont work (ie. xml parsing or dom manipulation functionality)
 */
// tslint:disable-next-line:max-line-length
const domShim = `var document=self.document={parentNode:null,nodeType:9,toString:function(){return"f"}},window=self.window=self;var a=Object.create(document);a.nodeType=1,a.toString=function(){return"f"},a.parentNode=a.firstChild=a.lastChild=a,(a.ownerDocument=document).head=document.body=a,document.ownerDocument=document.documentElement=document,document.getElementById=document.createElement=function(){return a},document.createDocumentFragment=function(){return this},document.getElementsByTagName=document.getElementsByClassName=function(){return[a]},document.getAttribute=document.setAttribute=document.removeChild=document.addEventListener=document.removeEventListener=function(){return null},document.cloneNode=document.appendChild=function(){return this},document.appendChild=function(e){return e},document.childNodes=[],document.implementation={createHTMLDocument:function(){return document}};`;

/**
 * windowGlobalsShim is present to emulate what the HTML file does.  a webworker will not have access to ANYTHING the html file already 
 * bootstrapped so we need to shim EVERYTHING including the containerInsights stuff
 */
const windowGlobalsShim = `window.containerInsights={};window.containerInsights.performanceMeasures={};`;

/**
 * provide worker with ability to see main thread's window.location
 * such that in absence of its own it can still make determination of environment, etc
 */
const windowLocationShim = `window.mainThreadLocation=${JSON.stringify(window.location)};`;

/**
 * Webworker support matrix
 */
const browserSupportsWebWorkers = [
    (<any>global).Worker,
    (<any>global).fetch,
    (<any>global).Promise,
    (<any>global).Blob
].indexOf(undefined) === -1;

/**
 * interface for the Query Time Range
 */
export interface IQueryTimeRange {
    /**
     * query startDateTime string in ISO format
     */
    startDateTimeISOString: string;

    /**
     * query startDateTime string in ISO format
     */
    endDateTimeISOString: string;
}
/**
 * Query manager wrapper, we keep this here so we can avoid as much possible
 * interference from webpack as possible...
 */
export interface IQueryManager {
    /**
     * start the charts query originated by preload process running inside worker thread
     * @param workspaceId workspace id as a string
     * @param clusterResourceId cluster arm resource id
     * @param clusterName cluster name as a string
     * @param queryTimeRange optional query time range to override the default time range(6h)
     * @param shouldQueryMdm optional if true will query MDM before kusto
     */
    startChartsQueryPreloadWorker(workspaceId: string, clusterResouceId: string,
        clusterName: string, queryTimeRange: IQueryTimeRange, shouldQueryMdm: boolean): void;

    /**
     * provide the authorization head key values to the query engine
     * @param authorizationTable list of all authorization keys we want to add
     */
    setAuthorizationValues(authorizationTable: StringMap<string>): void;
}

/**
 * retreive the absolute path to a script.. the web worker will execute in null land (no path)
 * so we need to use absolute paths when loading the pre-requisites of the webpack script
 * Note: must be invoked on the UI thread
 * @param relative relative path we want an absolute path for
 */
function getAbsPathFromRelative(relative: string): string {
    const link = document.createElement('a');
    link.href = relative;
    return link.href;
}

/**
 * Invoked by the UI thread... this will kick off a web worker if possible.
 * Note: the worker handlers (onerror and onmessage) are both the recieving end of the web worker
 * which means this code is executing on the UI thread... you have access to the DOM in this function throughout
 * @param preloadManager preload manager from webpack... the workhorse of this engine
 */
export function createWorker(): any {
    if (!browserSupportsWebWorkers) { return { worker: null, uri: null }; }

    const globalWindow: any = (window as any);
    const containerInsights: IContainerGlobals = globalWindow.containerInsights;

    containerInsights.performanceMeasures['pre_threadStage'] = Date.now();

    const jQuery = getAbsPathFromRelative('../web/base-libs/jquery.3.2.1.min.js');
    const moment = getAbsPathFromRelative('../web/base-libs/moment.2.20.1.min.js');
    const preLoad = getAbsPathFromRelative('./container-preload-worker.js');

    const loadScriptLocations = { jQuery, moment, preLoad };

    const absolutePathScriptLocations = `window.lsls='${JSON.stringify(loadScriptLocations)}';`;

    const uri = URL.createObjectURL(new Blob([domShim + absolutePathScriptLocations +
        windowGlobalsShim + windowLocationShim +
        '(' + webworkerThreadStart + ')()'], { type: 'text/javascript' }));

    containerInsights.performanceMeasures['pre_workerThreadCreate'] = Date.now();
    return { worker: new Worker(uri), uri };
}

/**
 * The most basic javascript I could muster to get the pre-requisites of webpack shimmed and ready
 * otherwise when the preload script tries to execute it will crash...
 * Note: this will still crash if no jQueryShim is inserted or the script locations we are loading...
 * the composition of this chain is handled by the UI thread that boots up the webworker
 * ** ANOTHER NOTE **: You don't have access to webpack here!! don't try to use ContainerGlobals for example
 * that will fail badly since this is being converted to a raw binary javascript blob
 */
function webworkerThreadStart(): void {
    console.log('PRELOAD WORKER THREAD::PRELOAD WEB WORKER STARTING');

    const globalWindow: any = (window as any);

    const containerInsights: IContainerGlobals = globalWindow.containerInsights;
    containerInsights.performanceMeasures['preThread_threadEntry'] = Date.now();

    let initValues: any = null;
    const tryStartQuery = () => {
        const queryManagerFactory = <any>globalWindow.queryManagerFactory;
        const environmentConfigInstance = <any>globalWindow.environmentConfigInstance
        if (!!initValues && !!queryManagerFactory && !!environmentConfigInstance) {
            console.log('PRELOAD WORKER THREAD::Preload Manager is ready!');

            // bbax: this is hard coded here because this script can't utilize
            // webpack... ensure this stays in sync with the types of AuthorizeTokenType
            const authorizationValues = {};
            authorizationValues['Arm'] = initValues.armKey;
            authorizationValues['LogAnalytics'] = initValues.laKey;

            if (!environmentConfigInstance.isConfigured()) {
                environmentConfigInstance.initConfig(initValues.azureCloudType, initValues.authorizationUrl);
            }

            const queryManager = queryManagerFactory();
            if (!queryManager) {
                throw new Error('PRELOAD WORKER THREAD::Failed to utilize query manager factory to generate new queryManager');
            }
            queryManager.setAuthorizationValues(authorizationValues);

            if (initValues.pillSelectionsOnNavigation &&
                initValues.pillSelectionsOnNavigation.startDateTimeISOString &&
                initValues.pillSelectionsOnNavigation.endDateTimeISOString) {

                const queryTimeRange: IQueryTimeRange = {
                    startDateTimeISOString: initValues.pillSelectionsOnNavigation.startDateTimeISOString,
                    endDateTimeISOString: initValues.pillSelectionsOnNavigation.endDateTimeISOString
                };

                queryManager.startChartsQueryPreloadWorker(initValues.workspace, initValues.containerClusterResourceId,
                    initValues.cluster, queryTimeRange, initValues.shouldQueryMdm);
            } else {

                queryManager.startChartsQueryPreloadWorker(initValues.workspace, initValues.containerClusterResourceId,
                    initValues.cluster, undefined, initValues.shouldQueryMdm);
            }
        }
    };

    self.onmessage = (event: any) => {
        if (!event) {
            console.error(`PRELOAD WORKER THREAD::Null event encountered by worker`);
            return;
        }

        const data = event.data || {};
        console.log(`PRELOAD WORKER THREAD::On Message '${data.type}':`, event);
        if (data.type === 'init') {
            initValues = data.initMessage;

            tryStartQuery();
        } else {
            console.error(`PRELOAD WORKER THREAD::Unexpected message type from ui thread: `, event);
        }
    };

    const loadScriptLocations = JSON.parse(globalWindow.lsls);

    importScripts(loadScriptLocations.jQuery);
    importScripts(loadScriptLocations.moment);
    importScripts(loadScriptLocations.preLoad);

    tryStartQuery();

    globalWindow.containerInsights.performanceMeasures['preThread_webpackReady'] = Date.now();

    console.log('PRELOAD WORKER THREAD::PRELOAD WEB WORKER Imported');
}

