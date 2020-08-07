/** tpl */
import * as React from 'react';

/** local */
import { DisplayStrings } from './DisplayStrings';
import { UnknownSvg } from './svg/unknown';
import { WarnSvg } from './svg/warn';
import { GreenSvg } from './svg/green';
import { StoppedSvg, StoppedSvgColor } from './svg/stopped';
import { FailedSvg } from './svg/failed';

/** interfaces */
/**
 * Used by Node view to define icon rendering...
 * Note: I plan to refactor this in the coming PR for icons anyway so I left this alone
 */
export interface IPodStatusObject {
    displayStatus: JSX.Element[];
    tooltipStatus: string;
}

/** enums */
export enum PodStatus {
    Stopped,
    Green,
    Error,
    Unknown,
    Warn
}

/** constants */
export const LastReportedThreshold: number = 1000 * 60 * 30;

export class PodStatusInterpreter {

    /**
     * primary logic for deciding how pod status works...
     * possible pod status are 'pending', 'running', 'succeeded', 'failed' and 'unknown'
     * https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-phase
     * https://github.com/Microsoft/Docker-Provider/blob/ci_feature_prod/source/code/plugin/in_kube_podinventory.rb
     *  @param status status string of the pod 
     * @returns computed PodStatus
     */
    public static getPodStatusFromKustoPodStatus(KustoPodStatus: string): PodStatus {
        const safeStatus: string = KustoPodStatus || '?';
        const lowerState = safeStatus.toLocaleLowerCase();
        const isSucceeded = lowerState.indexOf('succeeded') >= 0;
        const isFailed = lowerState.indexOf('failed') >= 0;
        const isUnknown = lowerState.indexOf('unknown') >= 0;
        const isRunning = lowerState.indexOf('running') >= 0;

        if (isSucceeded) {
            return PodStatus.Stopped;
        } else if (isRunning) {
            return PodStatus.Green;
        } else if (isFailed) {
            return PodStatus.Error;
        } else if (isUnknown) {
            return PodStatus.Unknown;
        } else {
            //pending considered as warning
            return PodStatus.Warn;
        }
    }

    /**
    * convert a container status to unknown if it hasn't reported in a while and it's status
    * still "thinks" it is running... it's likely never coming back
    * @param duration how long since it last reported
    * @param realStatus the status the container thinks it is in
    */
    public static getStatusOfPod(duration: number, realStatus: string): IPodStatusObject {
        let result: JSX.Element[] = PodStatusInterpreter.getRealStatusOfPod(realStatus);
        let tooltipStatus = realStatus;

        if (!result || (realStatus.indexOf('running') > -1 && duration > LastReportedThreshold)) {
            return {
                displayStatus: [<span className='sg-icon'><UnknownSvg /> {DisplayStrings.ContainerNodeStatusUnknownAlt}</span>],
                tooltipStatus: realStatus
            };
        }

        return { displayStatus: result, tooltipStatus: tooltipStatus };
    }

    /**
    * given a status of a pod translate into a JSX element including an icon and text for this status
    * @param status real status of the pod ('Running' for example)
    */
    private static getRealStatusOfPod(status: string): JSX.Element[] {
        const safeStatus: string = status || '?';
        const lowerState = safeStatus.toLocaleLowerCase();
        const isSucceeded = lowerState.indexOf('succeeded') >= 0;
        const isFailed = lowerState.indexOf('failed') >= 0;
        const isUnknown = lowerState.indexOf('unknown') >= 0;
        const isRunning = lowerState.indexOf('running') >= 0;

        if (isSucceeded) {
            return [<span className='sg-icon' > <StoppedSvg color={StoppedSvgColor.Green} /> {DisplayStrings.PodStatusSuccessAlt}</span>];
        } else if (isRunning) {
            return [<span className='sg-icon' > <GreenSvg /> {DisplayStrings.ContainerNodeStatusGreenAlt}</span>];
        } else if (isFailed) {
            return [<span className='sg-icon' > <FailedSvg /> {DisplayStrings.ContainerNodeStatusErrorAlt}</span>];
        } else if (isUnknown) {
            return [<span className='sg-icon' > <UnknownSvg /> {DisplayStrings.ContainerNodeStatusUnknownAlt}</span>];
        } else {
            return [<span className='sg-icon' > <WarnSvg /> {DisplayStrings.ContainerNodeStatusWarningAlt}</span>];
        }
    }

}
