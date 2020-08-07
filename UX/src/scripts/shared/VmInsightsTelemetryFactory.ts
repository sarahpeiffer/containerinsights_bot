import * as Constants from './GlobalConstants';

import { TelemetryMainArea, ITelemetry } from './Telemetry';
import { Telemetry } from './ApplicationInsightsTelemetry';
import { ApplicationInsightsProvider } from './data-provider/TelemetryProvider';

/**
 * Wrapper used by the application; owns the per-area telemetry singletons... this keeps the singleton
 * code seperate from the Telemetry wrapper, but also keeps application insights away from mocha (which
 * really didnt want to compile app insights)
 */
export class VmInsightsTelemetryFactory {
    /**
     * singleton instances for the per-area telemetry wrappers
     */
    private static instanceTypes: Object = {};

    /**
     * retreive the singleton for a given area for telemetry; create one if it doesn't exist...
     * Note: setContext() will be building up... first application level context, then area level context
     * then sub area level context... ensure you utilize the singleton for your area!! you will be incomplete
     * context if you do not do so (say if you use a new Telemetry() object)
     *
     * TODO IE11 polyfill for URL
     * https://msazure.visualstudio.com/InfrastructureInsights/_workitems/edit/3487467
     *
     * @param type main area you want the teletry context for (say compute, maps, containers, storage for example)
     * @returns {ITelemetry} the single instance of telemetry context for the given area
     */
    public static get(type: TelemetryMainArea): ITelemetry {
        if (!VmInsightsTelemetryFactory.instanceTypes.hasOwnProperty(type)) {
            const appInsights = new ApplicationInsightsProvider(
                {
                    instrumentationKey: Constants.VmInsightsTelemetryInstrumentationKey
                },
                (window as any).appInsights);
            const href: string = window.location.href;
            let trafficType: string;
            if (URL.prototype) {
                const url: URL = new URL(href);
                trafficType = url.searchParams.get('trafficType');
            }
            VmInsightsTelemetryFactory.instanceTypes[type] =
                new Telemetry(appInsights, { mainArea: type, urlHint: href, trafficType });
        }
        return VmInsightsTelemetryFactory.instanceTypes[type];
    }
}
