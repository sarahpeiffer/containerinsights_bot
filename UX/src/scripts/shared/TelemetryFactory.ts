import * as Constants from './GlobalConstants';

import { TelemetryMainArea, ITelemetry, NullTelemetry } from './Telemetry';
import { Telemetry } from './ApplicationInsightsTelemetry';

import { ApplicationInsightsProvider } from './data-provider/TelemetryProvider';

/**
 * Wrapper used by the application; owns the per-area telemetry singletons... this keeps the singleton
 * code seperate from teh Telemetry wrapper, but also keeps application insights away from mocha (which
 * really didnt want to compile app insights)
 */
export class TelemetryFactory {
    /**
     * singleton instances for the per-area telemetry wrappers
     */
    private static instanceTypes: Object = {};

    /**
     * dummy/null implementation of the telemetry interface
     */
    private static nullTelemetry: ITelemetry = new NullTelemetry();

    /**
     * retreive the singleton for a given area for telemetry; create one if it doesn't exist...
     * Note: setContext() will be building up... first application level context, then area level context
     * then sub area level context... ensure you utilize the singleton for your area!! you will be incomplete
     * context if you do not do so (say if you use a new Telemetry() object)
     * @param type main area you want the teletry context for (say compute, maps, containers, storage for example)
     * @returns {ITelemetry} the single instance of telemetry context for the given area
     */
    public static get(type: TelemetryMainArea): ITelemetry {
        if (!TelemetryFactory.instanceTypes.hasOwnProperty(type)) {
            // TODO: old behavior would result in localhost logging... hotfixing back to this behavior... we can carefully think
            // through and address this properly after ignite
            const appInsights = new ApplicationInsightsProvider({
                instrumentationKey: Constants.ContainerInsightsApplicationInsighstKeyMap.PublicCloud
            });
            TelemetryFactory.instanceTypes[type] = new Telemetry(appInsights, { mainArea: type, urlHint: window.location.toString() });
        }
        return TelemetryFactory.instanceTypes[type];
    }

    /**
     * gets dummy/null implementation of the telemetry interface
     */
    public static getNull(): ITelemetry {
        return this.nullTelemetry;
    }
}
