/** shared */
import * as GlobalConstants from '../../../shared/GlobalConstants';
import { KustoArmDataProvider } from '../../../shared/data-provider/v2/KustoDataProvider';
import { RetryPolicyFactory } from '../../../shared/data-provider/RetryPolicyFactory';
import { EnvironmentConfig } from '../../../shared/EnvironmentConfig';
import { RetryHttpDataProvider } from '../../../shared/data-provider/v2/RetryHttpDataProvider';
import { ArmDataProvider } from '../../../shared/data-provider/v2/ArmDataProvider';
import { InitializationInfo, AuthorizationTokenType } from '../../../shared/InitializationInfo';

/** local */
import { HealthDataProvider } from '../services/data-provider/HealthDataProvider';
import { BladeLoadManager } from '../../messaging/BladeLoadManager';

/**
 * provides functionality to construct health data provider
 */
export class HealthDataProviderFactory {
    /** provider factory singleton */
    private static factory: HealthDataProviderFactory;

    /** internal private constructor */
    private constructor() { }

    /**
     * gets an instance of the provider factory
     */
    public static instance(): HealthDataProviderFactory {
        if (!this.factory) {
            this.factory = new HealthDataProviderFactory();
        }

        return this.factory;
    }

    /**
     * constructs default health data provider
     */
    public createDefaultDataProvider(): HealthDataProvider {
        return new HealthDataProvider(
            new KustoArmDataProvider(
                GlobalConstants.ContainerInsightsApplicationId,
                new ArmDataProvider(
                    EnvironmentConfig.Instance().getARMEndpoint(),
                    () => { return InitializationInfo.getInstance().getAuthorizationHeaderValue(AuthorizationTokenType.Arm); },
                    new RetryHttpDataProvider(new RetryPolicyFactory())
                )
            ),
            BladeLoadManager.Instance()
        );
    }
}
