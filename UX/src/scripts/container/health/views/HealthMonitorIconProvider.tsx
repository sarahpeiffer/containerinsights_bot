/** svgs */
import { GreenSvg } from '../../../shared/svg/green';
import { UnknownSvg } from '../../../shared/svg/unknown';
import { WarnSvg } from '../../../shared/svg/warn';

/** tpl */
import * as React from 'react';

/** local */
import { HealthState } from '../HealthState';
import { NoneHealthStateSvg } from '../../../shared/svg/none-health-state';
import { FailedSvg } from '../../../shared/svg/failed';
import { NoneSvg } from '../../../shared/svg/none';

/**
 * provides UX icon for a monitor state
 */
export class HealthMonitorIconProvider {
    /**
     * provides UX icon for a monitor state
     * @param state monitor state
     * @returns icon to display for state
     */
    public static getIcon(state: HealthState): JSX.Element {
        switch (state) {
            case HealthState.Healthy:
                return <GreenSvg />;
            case HealthState.Warning:
                return <WarnSvg />;
            case HealthState.Critical:
            case HealthState.Error:
                return <FailedSvg />;
            case HealthState.None:
                return <NoneHealthStateSvg />
            case HealthState.Unknown:
                // TODO-TASK-4648377: do real error state icon
                return <UnknownSvg />;
            case HealthState.None:
                return <NoneSvg />
            default:
                throw new Error(`Icon not defined for monitor state MonitorState.${HealthState[state]}`);
        }
    }
}
