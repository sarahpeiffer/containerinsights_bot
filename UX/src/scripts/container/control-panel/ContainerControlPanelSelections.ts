/** * tpl */
import * as moment from 'moment';
import { TimeValues } from '@appinsights/pillscontrol-es5';

/** shared */
import { IWorkspaceInfo } from '../../shared/IWorkspaceInfo';
import { userAndSystemPodPillOptions } from '../../shared/pill-component/VariablePillContainer';
import { IPillSelections } from '../ContainerMainPageTypings';

/**
 * Defines time range selected on the control panel
 */
export interface ISelectedDateTimeRange {
    /** start time */
    startDateTimeUtc: Date;

    /** end time */
    endDateTimeUtc: Date;

    /** time range in seconds */
    timeRangeSeconds: number;

    /** true if time selection was relative, i.e. "last X hours/minuntes" */
    isTimeRelative: boolean;
}

/** Defines filter values for nodes, controllers, etc. */
export interface ISelectedFilters {
    nameSpace: string; /** namespace name */
    serviceName: string; /** service name */
    hostName: string; /** node name */
    nodePool: string; /** node pool name */
    controllerName: string; /** controller name */
    controllerKind: string; /** controller kind */
}

/**
 * Defines entire control panel filter set but workspace and cluster (which are special)
 */
export interface IContainerControlPanelFilterSelections extends ISelectedDateTimeRange, ISelectedFilters {
}

/**
 * Defines container control panel selections
 */
export interface IContainerControlPanelSelections extends IContainerControlPanelFilterSelections {
    /** selected workspace */
    workspace: IWorkspaceInfo;

    /** cluster name */
    clusterName: string;
}

/**
 * Time selections supported by the control panel
 */
export const timeControlSupportedTimeSelections: number[] = [
    TimeValues.Last30Minutes,
    TimeValues.LastHour,
    TimeValues.Last6Hours,
    TimeValues.Last12Hours,
    TimeValues.LastDay,
    TimeValues.Last3Days,
    TimeValues.Last7Days,
    TimeValues.Last30Days,
    TimeValues.Custom
];

/**
 * Provides functionality to support construction of control panel filter controls
 */
export class ContainerControlPanelSelections {
    public static getDefaultSelections(): IContainerControlPanelFilterSelections {
        let selectedTimeRange: ISelectedDateTimeRange = ContainerControlPanelSelections.getDefaultDateTimeRange();

        return ({
            nameSpace: '', // all
            serviceName: '', // all
            hostName: '', // all
            nodePool: '', // all
            startDateTimeUtc: selectedTimeRange.startDateTimeUtc,
            endDateTimeUtc: selectedTimeRange.endDateTimeUtc,
            timeRangeSeconds: selectedTimeRange.timeRangeSeconds,
            isTimeRelative: selectedTimeRange.isTimeRelative,
            controllerName: '', // all
            controllerKind: '' // all
        });
    }

    /**
     * Constructs sets of filter values for given page navigation property set
     * @param navigationProps page navigation properties
     * @returns filter values matching navigation properties
     */
    public static getPillSelectionsFromNavigationProps(navigationProps: IPillSelections): IContainerControlPanelFilterSelections {
        const selections = ContainerControlPanelSelections.getDefaultSelections();

        if (navigationProps) {
            const { nameSpace, serviceName, hostName, nodePool, controllerName, controllerKind } = navigationProps;

            // Map user pod and system pod filters to the appropriate namespace
            if (nameSpace) { selections.nameSpace = ContainerControlPanelSelections.getNamespaceFilterValue(navigationProps.nameSpace); }
            if (serviceName) { selections.serviceName = serviceName; }
            if (hostName) { selections.hostName = hostName; }
            if (nodePool) { selections.nodePool = nodePool; }
            if (controllerName) { selections.controllerName = controllerName; }
            if (controllerKind) { selections.controllerKind = controllerKind; }
        }

        if (ContainerControlPanelSelections.definesTimeRange(navigationProps)) {
            const {
                startDateTimeISOString,
                endDateTimeISOString,
                isTimeRelative
            } = navigationProps;

            selections.startDateTimeUtc = new Date(startDateTimeISOString);
            selections.endDateTimeUtc = new Date(endDateTimeISOString);
            selections.isTimeRelative = isTimeRelative;

            let timeRangeSeconds =
                Number(moment.duration(moment(selections.endDateTimeUtc).diff(moment(selections.startDateTimeUtc))).asSeconds());

            if (isTimeRelative === true) {
                timeRangeSeconds =
                    ContainerControlPanelSelections.roundTimeRangeToNearestRelativeTimeRangeOption(timeRangeSeconds);
            }

            selections.timeRangeSeconds = timeRangeSeconds;
        }

        return selections;
    }

    /**
     * Returns default date time range
     * @returns date time range used as default when user does not specify one
     */
    public static getDefaultDateTimeRange(): ISelectedDateTimeRange {
        const endDateTimeUtcMoment = moment.utc();
        const startDateTimeUtcMoment = moment(endDateTimeUtcMoment).subtract(6, 'hours');

        return {
            endDateTimeUtc: endDateTimeUtcMoment.toDate(),
            startDateTimeUtc: startDateTimeUtcMoment.toDate(),
            timeRangeSeconds: 60 * 60 * 6, // last 6 hours
            isTimeRelative: true,
        };
    }

    /**
    * Rounds the time range to the nearest supported relative time range option
    * In the case that the time range selection is relative, we need to make sure that the time range being passed around our app
    * is equal one of our supported relative time range options.
    * @param timeRangeSeconds time range in seconds
    */
   public static roundTimeRangeToNearestRelativeTimeRangeOption(timeRangeSeconds: number): number {
        let nearestRelativeTimeRange: number = Number.MAX_SAFE_INTEGER;
        timeControlSupportedTimeSelections.forEach((timeSelection: number) => {
            if (timeSelection !== TimeValues.Custom) { // Time cannot be custom
                const timeSelectionInSec: number = timeSelection / 1000;
                const diff: number = Math.abs(timeRangeSeconds - timeSelectionInSec);

                if (diff < Math.abs(timeRangeSeconds - nearestRelativeTimeRange)) {
                    nearestRelativeTimeRange = timeSelectionInSec;
                }
            }
        });

        return nearestRelativeTimeRange;
    }

    /**
     * Checks to see if navigation props define a time range
     * @param navigationProps page navigation properties
     * @returns true if navigation props contain valid time range definition
     */
    private static definesTimeRange(navigationProps: IPillSelections): boolean {
        if (!navigationProps) { return false; }

        const {
            startDateTimeISOString,
            endDateTimeISOString,
            isTimeRelative } = navigationProps;

        if (startDateTimeISOString &&
            endDateTimeISOString &&
            (isTimeRelative != null) &&
            (isTimeRelative !== undefined)) {
                return true;
        }

        return false;
    }

    /**
     * Maps namespace name provided as input (to the page) to value
     * to be used to construct namespace selection in control panel
     * Allows supplying mnemonic "all user pods", "all system pods" namespace filters
     * @param namespaceName
     */
    private static getNamespaceFilterValue(namespaceName: string): string {
        if (!namespaceName) { return namespaceName; }

        return ((namespaceName in userAndSystemPodPillOptions)
                    ? userAndSystemPodPillOptions[namespaceName].value
                    : namespaceName
                );
    }
}
