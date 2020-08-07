/** shared imports */
import { ITelemetryBucket } from '../shared/globals/globals';

/** local imports */
import { IContainerInsightsPreloadState } from './IContainerInsightsPreloadState';
import { IBladeLoadManager } from './messaging/IBladeLoadManager';

/**
 * Defines container insights global variables
 */
export interface IContainerGlobals {
    /** preload state */
    preloadState: IContainerInsightsPreloadState;

    /** container insights page load telemetry */
    performanceMeasures: ITelemetryBucket;

    /** 
     * true preload state was previously processed by the page
     * Controlled by ContainerClusterPane component and allows
     * it to process preload state just once - on first DOM mount
     */
    preloadStatePreviouslyProcessed: boolean;

    /** blade load manager */
    bladeLoadManager: IBladeLoadManager;
}

if (!((window as any).containerInsights)) {
    (window as any).containerInsights = {};
}

/**
 * Global variables related to container insights
 */
export const ContainerGlobals: IContainerGlobals = (window as any).containerInsights;

if (!ContainerGlobals.preloadState) {
    ContainerGlobals.preloadState = {};
}

if (!ContainerGlobals.performanceMeasures) {
    ContainerGlobals.performanceMeasures = {};
}
