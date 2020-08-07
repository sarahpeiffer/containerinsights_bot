/** shared */
import { ITelemetry, TelemetryMainArea } from '../Telemetry';
import { EnvironmentConfig } from '../EnvironmentConfig';
import { TelemetryFactory } from '../TelemetryFactory';

/** defines telemetry provider factory interface */
export interface ITelemetryProviderFactory {
    /**
     * gets a value indicating if system configuration was completed
     * @returns true in case configuration was received and provider is
     *          safe to cache
     */
    readonly isConfigured: boolean;

    /**
     * telemetry provider for logging telemetry
     * note: provider is safe to cache in case *previous*
     * call to isConfigured() returns true
     */
    getTelemetryProvider(): ITelemetry;
}

/**
 * provides telemetry provider factory functionality
 */
export class TelemetryProviderFactory implements ITelemetryProviderFactory {
    /** factory singleton */
    private static _factory: TelemetryProviderFactory;

    /**
     * initializes a new instance of the class
     */
    private constructor() {}

    /**
     * gets factory instance
     */
    public static instance(): ITelemetryProviderFactory {
        if (!this._factory) {
            this._factory = new TelemetryProviderFactory();
        }

        return this._factory;
    }

    /**
     * gets a value indicating if system configuration was completed
     * @returns true in case configuration was received and provider is
     *          safe to cache
     */
    public get isConfigured(): boolean {
        return EnvironmentConfig.Instance().isConfigured();
    }

    /**
     * telemetry provider for logging telemetry
     * note: provider is safe to cache in case *previous*
     * call to isConfigured() returns true
     */
    public getTelemetryProvider(): ITelemetry {
        return this.isConfigured
                ? TelemetryFactory.get(TelemetryMainArea.Containers)
                : TelemetryFactory.getNull();
    }
}
