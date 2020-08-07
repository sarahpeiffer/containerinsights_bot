/**
 * this script is loaded on a webworker.  there are pre-requisites still that must be preloaded
 * in the webworker before this can be loaded successfully so look cautiously are preload
 * bootstrap processes
 */
import { ContainerPreloadQueryManager } from './container/ContainerPreloadQueryManager';
import { ContainerGlobals } from './container/ContainerGlobals';
import { EnvironmentConfig } from './shared/EnvironmentConfig';

/**
 * invoked by preload query manager when the query is complete, we need to notify the ui thread
 * that the query is complete and we have staged the results in the data
 */
const queryCompleteHandler = () => {
    (<any>self).postMessage({
        type: 'done',
        containerInsights: JSON.stringify(ContainerGlobals.preloadState),
        performanceMeasures: JSON.stringify(ContainerGlobals.performanceMeasures)
    });
}

/**
 * query manager used by the web worker... at this point we are fully bootstrapped
 * and can start the real work on the webworker... this query manager is still
 * shared with the ui thread preload mechanism if webworker fails or isn't supported
 */
(window as any).queryManagerFactory = (() => {
    return new ContainerPreloadQueryManager(
        ContainerGlobals.preloadState,
        ContainerGlobals.performanceMeasures,
        queryCompleteHandler
    );
});

/**
 * Environment config engine being passed to the micro script
 */
(window as any).environmentConfigInstance = EnvironmentConfig.Instance();
