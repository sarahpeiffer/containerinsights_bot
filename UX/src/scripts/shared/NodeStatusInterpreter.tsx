/** tpl */
import * as React from 'react';

/** local */
import { DisplayStrings } from './DisplayStrings';
import { UnknownSvg } from './svg/unknown';
import { WarnSvg } from './svg/warn';
import { GreenSvg } from './svg/green';
import { FailedSvg } from './svg/failed';

/** interfaces */
/**
 * Used by Node view to define icon rendering...
 * Note: I plan to refactor this in the coming PR for icons anyway so I left this alone
 */
export interface INodeStatusObject {
    displayStatus: JSX.Element[];
    tooltipStatus: string;
}

/** enums */
export enum NodeStatus {
    Error,
    Warn,
    Green
}

/** constants */
export const LastReportedThreshold: number = 1000 * 60 * 30;

export class NodeStatusInterpreter {
    /**
     * used by the node view, this function understands how to connect icons to status... i'm leaving
     * this here because my upcoming icon work helps justify this location
     */
    public static getStatusOfNode(duration: number, realStatus: string): INodeStatusObject {
        let result: JSX.Element[] = NodeStatusInterpreter.getRealStatusOfNode(realStatus);
        let tooltipStatus = realStatus;

        if (!result || duration > LastReportedThreshold) {
            return {
                displayStatus: [<span className='sg-icon'><UnknownSvg /> {DisplayStrings.ContainerNodeStatusUnknownAlt}</span>],
                tooltipStatus: realStatus
            };
        }

        return { displayStatus: result, tooltipStatus: tooltipStatus };
    }

    /**
     * primary logic for deciding how node status works... this is all going to get reworked in my next pr...
     * @param status status of the node right now
     */
    public static getRealStatusOfNode(status: string): JSX.Element[] {
        const safeStatus: string = status || '?';
        const lowerState = safeStatus.toLocaleLowerCase();
        const hasPressure = lowerState.indexOf('pressure') >= 0;
        const outOfDisk = lowerState.indexOf('outofdisk') >= 0;
        const networkOffine = lowerState.indexOf('networkunavailable') >= 0;
        const ready = lowerState.indexOf('ready') >= 0;

        if (networkOffine || outOfDisk) {
            return [<span className='sg-icon' > <FailedSvg /> {DisplayStrings.ContainerNodeStatusErrorAlt}</span>];
        } else if (hasPressure) {
            return [<span className='sg-icon' > <WarnSvg /> {DisplayStrings.ContainerNodeStatusWarningAlt}</span>];
        } else if (ready) {
            return [<span className='sg-icon' > <GreenSvg /> {DisplayStrings.ContainerNodeStatusGreenAlt}</span>];
        }
        // bbax: when shutting down we have observed status of completely empty... dont render here at all
        // the parent will render "unknown" in the presence of null
        return null;
    }

    /**
     * primary logic for deciding how node status works... this is all going to get reworked in my next pr...
     * @param status status of the node right now
     */
    public static getNodeStatusFromKustoNodeStatus(KustoNodeStatus: string): NodeStatus {
        const safeStatus: string = KustoNodeStatus || '?';
        const lowerState = safeStatus.toLocaleLowerCase();
        const hasPressure = lowerState.indexOf('pressure') >= 0;
        const outOfDisk = lowerState.indexOf('outofdisk') >= 0;
        const networkOffine = lowerState.indexOf('networkunavailable') >= 0;
        const ready = lowerState.indexOf('ready') >= 0;

        if (networkOffine || outOfDisk) {
            return NodeStatus.Error;
        } else if (hasPressure) {
            return NodeStatus.Warn;
        } else if (ready) {
            return NodeStatus.Green;
        }
        // bbax: when shutting down we have observed status of completely empty... dont render here at all
        // the parent will render "unknown" in the presence of null
        return null;
    }

    /**
     * convert a status into a position number
     * 1 - Ready, 2 - Pressure, 3 - Unknown, 4 - networkunavailable, 5 - outofdisk
     * @param status status to convert
     */
    public static nodeStatusSortNumber(status: string): number {
        // bbax: pressure is managed by our catch all "2"
        // const hasPressure = status.indexOf('pressure') >= 0;
        const outOfDisk = status.indexOf('outofdisk') >= 0;
        const unknown = status.indexOf('unknown') >= 0;
        const networkOffine = status.indexOf('networkunavailable') >= 0;
        const ready = status.indexOf('ready') >= 0;
        if (outOfDisk) {
            return 5;
        } else if (networkOffine) {
            return 4;
        } else if (unknown) {
            return 3;
        } else if (ready) {
            return 1;
        } else {
            return 2;
        }
    }
}
