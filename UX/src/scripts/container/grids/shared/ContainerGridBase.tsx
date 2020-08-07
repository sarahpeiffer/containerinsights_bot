/** tpl */
import * as moment from 'moment';
import * as React from 'react';
import {
    SGSortOrder,
    SGDataRow,
    DropdownWithLinks,
    ComboBoxHeader,
    DropdownOption,
    DropdownAction,
    ExternalLinkSvg
} from 'appinsights-iframe-shared';

/** local */
import { SortOrder } from '../../data-provider/GridDataProvider';
import { ContainerMetricName, ContainerHostMetricName } from '../../shared/ContainerMetricsStrings';
import { GridDataProvider } from '../../data-provider/GridDataProvider';
import { IContainerGridProps } from './IContainerGridProps';
import { SGDataRowExt } from './SgDataRowExt';
import { PropertyPanelQueryTemplates } from '../../data-provider/QueryTemplates/PropertyPanelQueryTemplates';
import { PropertyPanelType } from '../../data-provider/KustoPropertyPanelResponseInterpreter';
import { IClusterObjectInfo } from '../../data-provider/PropertyPanelDataProvider';
import { IPropertyPanelNavigationProps } from '../../ContainerMainPage';

/** shared */
import { DisplayStrings } from '../../../shared/DisplayStrings';
import * as GlobalConstants from '../../../shared/GlobalConstants';
import { KustoDataProvider } from '../../../shared/data-provider/KustoDataProvider';
import { RetryARMDataProvider } from '../../../shared/data-provider/RetryARMDataProvider';
import { ARMDataProvider } from '../../../shared/data-provider/ARMDataProvider';
import { RetryPolicyFactory } from '../../../shared/data-provider/RetryPolicyFactory';
import { RequiredLoggingInfo } from '../../../shared/RequiredLoggingInfo';
import { ILogSearchMessageObject, IMessagingProvider } from '../../../shared/MessagingProvider';
import { IGridLineObject, GridLineObject } from '../../../shared/GridLineObject';
import { ContainerMetaData } from '../../shared/metadata/ContainerMetaData';
import { TimeInterval } from '../../../shared/data-provider/TimeInterval';
import * as Constants from '../../shared/Constants';
import { AggregationOption } from '../../../shared/AggregationOption';
import { ObjectKind } from '../../../shared/property-panel/PropertyPanelSelector';
import { RowType, IMetaDataBase } from '../../shared/metadata/Shared';

/** svgs */
import { UnknownSvg } from '../../../shared/svg/unknown';
import { WarnSvg } from '../../../shared/svg/warn';
import { GreenSvg } from '../../../shared/svg/green';
import { StoppedSvg, StoppedSvgColor } from '../../../shared/svg/stopped';
import { FailedSvg } from '../../../shared/svg/failed';

/** styles */
import '../../../../styles/shared/PropertyPanel.less';
import { PodMetaData } from '../../shared/metadata/PodMetaData';
import { ControllerMetaData } from '../../shared/metadata/ControllerMetaData';
import { NodeMetaData } from '../../shared/metadata/NodeMetaData';
import { StringHelpers } from '../../../shared/Utilities/StringHelpers';
import { TelemetryFactory } from '../../../shared/TelemetryFactory';
import { TelemetryMainArea } from '../../../shared/Telemetry';
import { BladeContext } from '../../BladeContext';
import { SortHelper } from '../../../shared/SortHelper';
import { PodMetaDataLegacy } from '../../shared/metadata/PodMetaDataLegacy';
import { ContainerMetaDataLegacy } from '../../shared/metadata/ContainerMetaDataLegacy';

/** Sort order of the grid */
export enum GridSortOrder {
    Asc = 0,
    Desc = 1
}

export enum PropertyPanelLinkType {
    ContainerEventsLogs = 'ContainerEventsLogs',
    KubEventsLog = 'KubEventsLog',
    ContainerLiveEventsLog = 'ContainerLiveEventsLog'
}

/**
 * used by the hierarchy rollup helper
 */
export interface IHierarchyRollup {
    max: number | string;
    min: number | string;
    sum: number | string;
    average: number | string;
    count: number;
    totalCount: number;
    isRowFullyEmpty: boolean;
}

/**
 * Used by Node view to define icon rendering...
 * Note: I plan to refactor this in the coming PR for icons anyway so I left this alone
 */
export interface IResourceStatusObject {
    displayStatus: JSX.Element[];
    tooltipStatus: string;
    tooltipStatusReason?: string;
}

/**
 * Wrapper around a small part of the query props on the views... giving us access to the sort details here
 */
export interface IQueryPropsRequiredField {
    sortOrder: GridSortOrder;
    sortColumnIndex: number;
}

/** 
 * nib: At the moment, we store the statuses of controllers, pods, and containers in this kind of object
 * All properties are optional because we can't guarantee that any one of them will always exist, only that at least one of them will
 */
export interface IControllerStatusHash {
    succeeded?: number,
    failed?: number,
    unknown?: number,
    running?: number
}

/**
 * The list of possible statuses for containers as reported by Kubernetes
 */
export enum K8sContainerStatusList {
    Succeeded = 'succeeded',
    Failed = 'failed',
    Unknown = 'unknown',
    Running = 'running'
}

/**
 * Shared functionality between the Container, Controller and Host grids\
 */
export class ContainerGridBase {

    /**
     * First: Ensure Other Processes is always on top
     * Second: Ensure '-' based metrics are always on bottom
     * Third: Compare
     * Fourth (optional): If they are equal use the name of the row to break the tie
     * @param a left hand side of comparison used by sort
     * @param b right hand side of comparison used by sort
     * @param queryProps the current props state of the control that calls us (used for sort direction/column)
     */
    public static gridSortValue(a: IGridLineObject<IMetaDataBase>, b: IGridLineObject<IMetaDataBase>,
        queryProps: IQueryPropsRequiredField): number {
        if (a.metaData.rowType === RowType.System) {
            return queryProps.sortOrder === GridSortOrder.Asc ? Number.MIN_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
        }

        if (b.metaData.rowType === RowType.System) {
            return queryProps.sortOrder === GridSortOrder.Asc ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER;
        }

        const sortOrderFinalPassNullData = (target): number => {
            if (typeof target !== 'number') {
                return queryProps.sortOrder !== GridSortOrder.Asc ? Number.MIN_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
            }
            return target;
        }

        // bbax: "-", null, etc... shove that all at the bottom
        const realValueA = sortOrderFinalPassNullData(a.value);
        const realValueB = sortOrderFinalPassNullData(b.value);

        const chooseString = (targetMetaData): string => {
            switch (targetMetaData.rowType) {
                case RowType.Container:
                    return targetMetaData.name;
                case RowType.Controller:
                    return targetMetaData.controllerName;
                case RowType.Node:
                    return targetMetaData.name;
                case RowType.Pod:
                    return targetMetaData.podName;
                default:
                    throw new Error('unexpected type of row ended full stop equal');
            }
        }

        if (realValueA - realValueB === 0) {
            const result = SortHelper.Instance().sortByNameAlphaNumeric(chooseString(a.metaData), chooseString(b.metaData))
            return queryProps.sortOrder === GridSortOrder.Asc ? result * -1 : result;
        }

        return realValueA - realValueB;
    }

    /**
     * An oss product used by react virtualize (source/vendor/detectElementResize.js) is relying on
     * scroll event on load; which triggers onResize in Virtualize Engine, which bubbles up
     * to sg-body... chrome is not sending this event in some scenarios (ie. zoom 90% on load).
     * This can be used to force this event
     */
    public static hackFixOSSVendorResizeBug(): void {
        const contractElement = document.getElementsByClassName('contract-trigger');
        if (contractElement.length < 1) {
            return;
        }

        let event: any = null;
        if (typeof (Event) === 'function') {
            event = new UIEvent('scroll');
        } else {
            event = document.createEvent('UIEvent');
            (event as UIEvent).initEvent('scroll', true, true);
        }

        contractElement[0].dispatchEvent(event);
    }

    /**
     * helper function used for detail rollups, given the root of a hierarchy can give you max, average,
     * sum and count of all children down the entire hierarchy for numeric fields
     * @param target starting row to enumerate
     * @param columnIndex column to enumerate
     * @returns 
     */
    public static getSgRowFullDepthValues(target: SGDataRowExt[], columnTargets: number[]): IHierarchyRollup[] {
        const response: IHierarchyRollup[] = [];

        if (target && target.length > 0) {
            target.forEach((child: any) => {
                columnTargets.forEach((columnIndex) => {
                    const childValue: IGridLineObject<ContainerMetaData> = child.columnData[columnIndex];
                    if (!response[columnIndex]) {
                        response[columnIndex] = {
                            isRowFullyEmpty: true,
                            max: Number.MIN_SAFE_INTEGER,
                            min: Number.MAX_SAFE_INTEGER,
                            sum: 0,
                            count: 0,
                            average: 0,
                            totalCount: 1
                        };
                    } else {
                        response[columnIndex].totalCount++;
                    }

                    if (!childValue || typeof childValue.value !== 'number') {
                        return;
                    }

                    response[columnIndex].isRowFullyEmpty = false;
                    (response[columnIndex].sum as number) += childValue.value;
                    (response[columnIndex].average as number) += childValue.value;
                    response[columnIndex].count++;

                    if (response[columnIndex].max < childValue.value) {
                        response[columnIndex].max = childValue.value;
                    }

                    if (response[columnIndex].min > childValue.value) {
                        response[columnIndex].min = childValue.value;
                    }
                });
            });

            columnTargets.forEach((columIndex) => {
                if (response[columIndex].isRowFullyEmpty) {
                    response[columIndex].min = '-';
                    response[columIndex].max = '-';
                    response[columIndex].average = '-';
                    response[columIndex].sum = '-';
                } else {
                    response[columIndex].average = (+response[columIndex].average) / (+response[columIndex].count);
                }
            });
        }

        return response;
    }

    /**
     * Convert GridSortOrder to SGSortOrder so we can track our own internal
     * Do we really need this second sort enum?
     * @param sortOrder GridSortOrder to conver
     */
    public static convertSortOrderToSgSortOrder(sortOrder: GridSortOrder): SGSortOrder {
        return sortOrder === GridSortOrder.Asc ? SGSortOrder.Ascending : SGSortOrder.Descending;
    }

    /**
     * Gets the container metric corresponding to the host metric
     * @param hostMetric the metric selected for the host
     */
    public static getMetricFromHostMetric(hostMetric: string) {
        switch (hostMetric) {
            case ContainerHostMetricName.CpuCoreUtilization:
                return ContainerMetricName.CpuCoreUtilization;
            case ContainerHostMetricName.MemoryRssBytes:
                return ContainerMetricName.MemoryRssBytes;
            case ContainerHostMetricName.MemoryWorkingSetBytes:
                return ContainerMetricName.MemoryWorkingSetBytes;
        }
        throw 'not implemented!';
    }

    /**
     * used by the node view, this function understands how to connect icons to status... i'm leaving
     * this here because my upcoming icon work helps justify this location
     */
    public static getStatusOfNode(duration: number, realStatus: string): IResourceStatusObject {
        let result: JSX.Element[] = ContainerGridBase.getRealStatusOfNode(realStatus);
        let tooltipStatus = realStatus;

        if (StringHelpers.equal(tooltipStatus, 'unscheduled')) {
            tooltipStatus = DisplayStrings.unscheduled;
        }

        if (!result || duration > Constants.LastReportedThreshold) {
            return {
                displayStatus: [<span className='sg-icon'><UnknownSvg /> {DisplayStrings.ContainerNodeStatusUnknownAlt}</span>],
                tooltipStatus: realStatus
            };
        }

        return { displayStatus: result, tooltipStatus: tooltipStatus };
    }

    /**
     * used by the node view, this function understands how to connect icons to status... i'm leaving
     * this here because my upcoming icon work helps justify this location
     */
    public static getStatusOfController(statusHash: StringMap<number>): {} {
        const result: JSX.Element[] = [];

        let tooltip = '';
        if (statusHash.hasOwnProperty('Failed')) {
            const red = statusHash['Failed'];
            result.push(<span className='sg-icon' > {red} <FailedSvg /> </span >);
            tooltip += `${red} ${DisplayStrings.ContainerStatusGeneralFailed} `;
        }

        let warning = 0;
        const keys = Object.keys(statusHash);
        keys.forEach((key: string) => {
            const lowerKey = key.toLocaleLowerCase();
            const isSucceeded = lowerKey.indexOf('succeeded') >= 0;
            const isFailed = lowerKey.indexOf('failed') >= 0;
            const isUnknown = lowerKey.indexOf('unknown') >= 0;
            const isRunning = lowerKey.indexOf('running') >= 0;

            if (!isSucceeded && !isFailed && !isUnknown && !isRunning) {
                warning += statusHash[key];
            }
        });
        if (warning) {
            result.push(<span className='sg-icon' > {warning} <WarnSvg /> </span >);
            tooltip += `${warning} ${DisplayStrings.ContainerStatusGeneralWarning} `;
        }

        if (statusHash.hasOwnProperty('Unknown')) {
            const unknown = statusHash['Unknown'];
            result.push(<span className='sg-icon' > {unknown} <UnknownSvg /> </span >);
            tooltip += `${unknown} ${DisplayStrings.ContainerStatusUnknownTitle} `;
        }

        if (statusHash.hasOwnProperty('Succeeded')) {
            const greenTerminal = statusHash['Succeeded'];
            result.push(<span className='sg-icon' > {greenTerminal} <StoppedSvg color={StoppedSvgColor.Green} /> </span >);
            tooltip += `${greenTerminal} ${DisplayStrings.ContainerStatusSucceededTitle} `;
        }

        let running = 0;
        if (statusHash.hasOwnProperty('Running')) {
            running = statusHash['Running'];
        }
        if (running > 0) {
            result.push(<span className='sg-icon' > {running} <GreenSvg /> </span >);
            tooltip += `${running} ${DisplayStrings.ContainerStatusRunningTitle} `;
        }

        return { result, tooltip };
    }

    /**
     * used by the all views, this function understands how to connect icons to status for containers
     * @param duration current duration since the last detail about this container arrived
     * @param realStatus the real actual status before transformation (it really is now, i promise!)
     * @param translatedStatus the translated status string
     * @param statusReason
     */
    public static getStatusOfContainer(duration: number, realStatus: string, translatedStatus: string,
        statusReason: string): IResourceStatusObject {
        let result: JSX.Element[] = ContainerGridBase.getRealStatusOfContainer(realStatus);
        let tooltipStatus: string = realStatus;
        let tooltipStatusReason: string = '';
        if (!StringHelpers.isNullOrEmpty(statusReason)) {
            tooltipStatusReason = DisplayStrings.Reason + ' ' + statusReason;
        }

        if (!result || (realStatus.indexOf('running') > -1 && duration > Constants.LastReportedThreshold)) {
            return {
                displayStatus: [<span className='sg-icon'><UnknownSvg /> {DisplayStrings.ContainerNodeStatusUnknownAlt}</span>],
                tooltipStatus: translatedStatus,
                tooltipStatusReason: tooltipStatusReason
            };
        }

        return { displayStatus: result, tooltipStatus: tooltipStatus, tooltipStatusReason: tooltipStatusReason };
    }

    /**
     * generic sorting for status shared by all three views (node, controller, container)
     * @param a left hand side status
     * @param b right hand side status
     * @param sortOrder sort order of the grid so we can force other processes to top for example
     */
    public static sortStatus(a: IGridLineObject<IMetaDataBase>, b: IGridLineObject<IMetaDataBase>, sortOrder: GridSortOrder): number {
        if (a.metaData.rowType === RowType.System) {
            return sortOrder === GridSortOrder.Asc ? Number.MIN_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
        }

        if (b.metaData.rowType === RowType.System) {
            return sortOrder === GridSortOrder.Asc ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER;
        }

        if (a.metaData.rowType !== b.metaData.rowType) { // nib: This shouldn't happen. If it did, not sure how this is the right behavior.
            return sortOrder === GridSortOrder.Asc ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER;
        }

        let result: number = null;
        if (a.metaData.rowType === RowType.Node && b.metaData.rowType === RowType.Node &&
            a.value.hasOwnProperty('status') && a.value.status != null &&
            b.value.hasOwnProperty('status') && b.value.status != null
        ) { // Both rows are nodes. a/b.value.status is a string gotten from Kusto
            const statusOfA: string = (a.value.status.indexOf(K8sContainerStatusList.Running) !== -1 &&
                a.metaData.lastReported > Constants.LastReportedThreshold) ? K8sContainerStatusList.Unknown : a.value.status;
            const statusOfB: string = (b.value.status.indexOf(K8sContainerStatusList.Running) !== -1 &&
                b.metaData.lastReported > Constants.LastReportedThreshold) ? K8sContainerStatusList.Unknown : b.value.status;

            result = ContainerGridBase.sortNodeStatus(statusOfA, statusOfB);
        } else if (a.metaData.rowType === RowType.Controller && b.metaData.rowType === RowType.Controller &&
            a.value && b.value
        ) { // Both rows are controller. a/b.value is an object with a rollup of all the statuses of the containers inside the controller
            const statusOfA: IControllerStatusHash = (a.value.hasOwnProperty(K8sContainerStatusList.Running) &&
                a.metaData.lastReported > Constants.LastReportedThreshold) ? K8sContainerStatusList.Unknown : a.value;
            const statusOfB: IControllerStatusHash = (b.value.hasOwnProperty(K8sContainerStatusList.Running) &&
                b.metaData.lastReported > Constants.LastReportedThreshold) ? K8sContainerStatusList.Unknown : b.value;

            result = ContainerGridBase.sortControllerStatus(statusOfA, statusOfB, sortOrder);
        } else if (a.value.hasOwnProperty('status') && a.value.status != null &&
            b.value.hasOwnProperty('status') && b.value.status != null
        ) { // Both rows are containers or pods. a/b.value.status is a string gotten from Kusto
            const statusOfA: string = (a.value.status.indexOf(K8sContainerStatusList.Running) !== -1 &&
                a.metaData.lastReported > Constants.LastReportedThreshold) ? K8sContainerStatusList.Unknown : a.value.status;
            const statusOfB: string = (b.value.status.indexOf(K8sContainerStatusList.Running) !== -1 &&
                b.metaData.lastReported > Constants.LastReportedThreshold) ? K8sContainerStatusList.Unknown : b.value.status;

            result = ContainerGridBase.sortContainerPodStatus(statusOfA, statusOfB);
        }

        // If all else fails, sort alphabetically
        if (!result) {
            const secondarySortA: string = a.metaData.getSortableKey();
            const secondarySortB: string = b.metaData.getSortableKey();
            const alphaSort: number = SortHelper.Instance().sortByNameAlphaNumeric(secondarySortA, secondarySortB);
            if (sortOrder === GridSortOrder.Asc) {
                return alphaSort;
            } else {
                return alphaSort * -1;
            }
        }

        return result;
    }

    /**
     * covert a container status to unknown if it hasn't reported in a while and it's status
     * still "thinks" it is running... it's likely never coming back
     * @param duration how long since it last reported
     * @param realStatus the status the container thinks it is in
     */
    public static getStatusOfPod(duration: number, realStatus: string): IResourceStatusObject {
        let result: JSX.Element[] = ContainerGridBase.getRealStatusOfPod(realStatus);
        let tooltipStatus = realStatus;

        if (!result || (realStatus.indexOf('running') > -1 && duration > Constants.LastReportedThreshold)) {
            return {
                displayStatus: [<span className='sg-icon'><UnknownSvg /> {DisplayStrings.ContainerNodeStatusUnknownAlt}</span>],
                tooltipStatus: realStatus
            };
        }

        return { displayStatus: result, tooltipStatus: tooltipStatus };
    }

    /**
     * Creates the Kusto data provider used by Container Insights
     * @return ContainerInsightsDataProvider
     */
    public static createDataProvider(): GridDataProvider {
        const dataProvider: GridDataProvider =
            new GridDataProvider(
                new KustoDataProvider(
                    // TODO: Make parameters for RetryPolicyFactory into parameters for createDataProvider
                    new RetryARMDataProvider(new ARMDataProvider(), new RetryPolicyFactory()),
                    GlobalConstants.ContainerInsightsApplicationId
                )
            );
        return dataProvider;
    }

    /**
     * Take appropriate steps to ensure the ibiza blade shows access denied.
     * @param messagingProvider the messaging provider for our application to message back to monext
     * @param workspaceResourceId workspace resource id
     * @param tabName UX tab name
     */
    public static handleRequestAccessDenied(
        messagingProvider: IMessagingProvider,
        workspaceResourceId: string,
        tabName: string
    ): void {
        if (!messagingProvider) { throw new Error('Parameter @messagingProvider may not be null'); }
        if (!workspaceResourceId) { throw new Error('Parameter @workspaceResourceId may not be null'); }

        messagingProvider.bladeLoadFailure(`accessDenied`);

        const errorObj = {
            errorMessage: 'Redirected to hosting blade: Ajax request access denied',
            workspaceResourceId,
            tabName
        };

        throw new Error(JSON.stringify(errorObj));
    }

    /**
     * Returns a string telling you how many items there are in the grid
     * @param unfilteredGridData grid data before it's been filtered
     * @param filteredGridData grid data after it's been filtered by search
     */
    public static getGridItemCountString(filteredGridData: any, unfilteredGridData: any): string {
        let itemCountStr: string;
        const isGridDataFiltered: boolean = filteredGridData.length < unfilteredGridData.length;

        if (!filteredGridData || filteredGridData.length === 0) {
            if (isGridDataFiltered) {
                itemCountStr = DisplayStrings.ZeroItemCountRatio.replace('{0}', `${unfilteredGridData.length}`);
            } else {
                itemCountStr = DisplayStrings.ZeroItemCount;
            }
        } else if (filteredGridData.length === 1) {
            if (isGridDataFiltered) {
                itemCountStr = DisplayStrings.OneItemCountRatio.replace('{0}', `${unfilteredGridData.length}`);
            } else {
                itemCountStr = DisplayStrings.OneItemCount;
            }
        } else {
            if (isGridDataFiltered) {
                itemCountStr = DisplayStrings.MultipleItemCountRatio.replace('{0}', `${filteredGridData.length}`)
                itemCountStr = itemCountStr.replace('{1}', `${unfilteredGridData.length}`);
            } else {
                itemCountStr = DisplayStrings.MultipleItemCount.replace('{0}', `${unfilteredGridData.length}`);
            }
        }

        return itemCountStr;
    }

    /**
     * 
     * @param gridSortOrder 
     */
    public static getGridQuerySortOrder(gridSortOrder: GridSortOrder): SortOrder {
        let sortOrder: SortOrder;

        switch (gridSortOrder) {
            case 0: // Ascending => Asc to play nice w/ data provider and Kusto
                sortOrder = SortOrder.Asc;
                break;
            case 1: // Descending => Desc
                sortOrder = SortOrder.Desc;
                break;
            default:
                throw new Error('Invalid sort direction: ' + gridSortOrder);
        }

        return sortOrder;
    }

    /**
     * Determines the corresponding property panel for a given row
     */
    public static getPropertyPanelType(row: SGDataRow): PropertyPanelType {
        let resourceType: PropertyPanelType;

        const columnData = row.columnData;
        if (!columnData || !Array.isArray(columnData)) {
            throw new Error('The selected row contains faulty column data');
        }
        if (!(columnData[0] instanceof GridLineObject)) {
            throw new Error('The selected row contains faulty first column data');
        }

        const metaData = columnData[0].metaData; // index 0 is the name column in all 3 grids
        if (!metaData) {
            throw new Error('The selected row lacks meta data');
        }

        if (metaData instanceof ContainerMetaData || metaData instanceof ContainerMetaDataLegacy) {
            resourceType = PropertyPanelType.Container;
        } else if (metaData instanceof PodMetaData || metaData instanceof PodMetaDataLegacy) {
            resourceType = PropertyPanelType.Pod;
        } else if (metaData instanceof ControllerMetaData) {
            resourceType = PropertyPanelType.Controller;
        } else if (metaData instanceof NodeMetaData) {
            resourceType = PropertyPanelType.Node;
        } else { // must be unsupported
            resourceType = PropertyPanelType.Unsupported;
        }

        return resourceType;
    }

    public static getContainerLiveLogsLink(
        metaData: NodeMetaData | ContainerMetaData | PodMetaData | IMetaDataBase,
        showLiveLogs: boolean,
        onConsoleOpen: (information: RequiredLoggingInfo) => void,
        selectedTab: string,
        telemetrySelectedPropertyPanel: string
    ): JSX.Element {
        if (!metaData || !onConsoleOpen || !showLiveLogs) {
            return <div></div>;
        }

        let containerName: string = undefined;
        let podName: string = undefined;
        let nodeName: string = undefined;
        if ((metaData as ContainerMetaData).containerName) {
            containerName = (metaData as ContainerMetaData).containerName;
            podName = (metaData as ContainerMetaData).podName;
        }

        if ((metaData as PodMetaData).podName) {
            podName = (metaData as PodMetaData).podName;
        }

        if ((metaData as NodeMetaData).nodeName) {
            nodeName = (metaData as NodeMetaData).nodeName;
        }

        const cluster = BladeContext.instance().cluster;

        const loggingInfo: RequiredLoggingInfo = new RequiredLoggingInfo(
            cluster.subscriptionId,
            cluster.resourceGroupName,
            cluster.resourceName,
            podName,
            containerName,
            metaData.nameSpace,
            nodeName,
            metaData.rowType
        )

        return (
            <div className='action padded-link'
                onClick={() => {
                    const telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
                    telemetry.logNavigationEvent(
                        'SelectedTab: ' + selectedTab + ', SelectedPropertyPanel: ' + telemetrySelectedPropertyPanel, 'LiveData'
                    );
                    onConsoleOpen(loggingInfo);
                }}
                onKeyPress={(e) => {
                    let keycode = (e.keyCode ? e.keyCode : e.which);
                    if (keycode === 13) {
                        const telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
                        telemetry.logNavigationEvent(
                            'SelectedTab: ' + selectedTab + ', SelectedPropertyPanel: ' + telemetrySelectedPropertyPanel, 'LiveData'
                        );
                        onConsoleOpen(loggingInfo);
                    }
                }}
                tabIndex={0}
                aria-label={DisplayStrings.PropertyPanelLiveLinkText}
            >
                {DisplayStrings.PropertyPanelLiveLinkText}
            </div>
        );
    }

    public static getLink(
        linkType: PropertyPanelLinkType,
        resourceName: string,
        navigationProps: IPropertyPanelNavigationProps,
        messageProvider: IMessagingProvider,
        selectedTab: string,
        objectKind?: ObjectKind,
    ): JSX.Element {
        if (!linkType || !resourceName || !navigationProps) {
            return <div></div>;
        }

        const displayName = DisplayStrings.PropertyPanelAnalyticsLinkText;
        const wrapperClassName = 'combobox-loganalytics-propertypanel combobox-dropdown-wrapper';
        const comboBoxHeader =
            <div className='hack-style-for-icon'>
                <ComboBoxHeader displayName={displayName} icon={<ExternalLinkSvg />} />
            </div>;

        const timeIntervalForPP = new TimeInterval(
            navigationProps.startDateTimeUtc,
            navigationProps.endDateTimeUtc,
            Constants.IdealGridTrendDataPoints
        );

        const callback = () => {
            ContainerGridBase.onNavigateToLogAnalyticsForPP(
                linkType,
                resourceName,
                timeIntervalForPP,
                navigationProps,
                selectedTab,
                objectKind)
        }


        let linkText: string;
        switch (linkType) {
            case PropertyPanelLinkType.ContainerEventsLogs:
                linkText = DisplayStrings.PropertyPanelContainerLogsLinkText;
                break;
            case PropertyPanelLinkType.KubEventsLog:
                linkText = DisplayStrings.PropertyPanelKubEventLogsLinkText;
                break;
            default:
                throw new Error('Unknown link requested for property panel');
        }

        const options: any[] = [{
            id: linkText,
            displayName: linkText,
            callback
        }];

        return (
            <DropdownWithLinks
                flyoutClassName={'dropdown-flyout right-flyout-direction'}
                wrapperClassName={wrapperClassName}
                onChange={() => { }}
                label={displayName}
                header={comboBoxHeader}
                role={'combobox'}
                messageService={messageProvider.getAppInsightsProvider()} // bbax: not used by the DropdownAction...
                options={ContainerGridBase.generateLogAnalyticsOptions(options)}
            />);
    }

    /**
     * Provided with a list of SGDataRow[] and a string filter, this function will run a filter across the parents names
     * and filter the list...
     * Note: For children filtering there are comments below on hierarchyIsMatchingFilter
     * @param {SGDataRow[]} gridDataToFilter deep cloned copy of the grid data (note: we will destroy this list in some way likely)
     * @param gridDataFilter the string we would like to filter the grid list doing a contains search
     * @returns {SGDataRow[]} the filtered list
     */
    public static filterGridData(gridDataToFilter: any[], gridDataFilter: string, shouldApplyExactMatch: boolean, 
        skipFilter: boolean): any[] {
        if (!gridDataToFilter) {
            return null;
        }

        if (skipFilter) {
            return gridDataToFilter;
        }

        return gridDataToFilter.filter((gridRow) => {
            return ContainerGridBase.hierarchyIsMatchingFilter(gridRow, gridDataFilter, shouldApplyExactMatch);
        });
    }

    /**
     * Wrapper used to shim some columns; this could be removed with some patience and time
     * @param a left hand side for comparison
     * @param b right hand side for comparison
     */
    public static gridSortAlpha(a: IGridLineObject<IMetaDataBase>, b: IGridLineObject<IMetaDataBase>): number {
        if (!a || !b) {
            return 0;
        }

        let stringA = a.value || '';
        let stringB = b.value || '';
        return SortHelper.Instance().sortByNameAlphaNumeric(stringA, stringB);
    }

    /**
    * Called during property changes... decide if we should requery the grid or not
    * @param nextProps next props incoming
    * @returns {boolean} true if re-query should occur
    */
    public static shouldRequeryGridData(nextProps: IContainerGridProps, prevProps: IContainerGridProps): boolean {
        if (!nextProps) {
            return false;
        }

        // cluser name changes should cause re-render
        if (nextProps.clusterName !== prevProps.clusterName) {
            return true;
        }

        // change of date selection should cause re-render
        if (nextProps.endDateTimeUtc !== prevProps.endDateTimeUtc
            || nextProps.startDateTimeUtc !== prevProps.startDateTimeUtc) {
            return true;
        }

        if (nextProps.aggregationOption !== prevProps.aggregationOption) {
            return true;
        }

        // selected host/node has changed..
        if (nextProps.hostName !== prevProps.hostName) {
            return true;
        }

        if (nextProps.metricName !== prevProps.metricName) {
            return true;
        }

        if (nextProps.nameSpace !== prevProps.nameSpace) {
            return true;
        }

        if (nextProps.serviceName !== prevProps.serviceName) {
            return true;
        }

        if (nextProps.nodePool !== prevProps.nodePool) {
            return true;
        }

        if (nextProps.workspace !== prevProps.workspace) {
            return true;
        }

        if (nextProps.controllerName !== prevProps.controllerName) {
            return true;
        }

        if (nextProps.controllerKind !== prevProps.controllerKind) {
            return true;
        }

        if (nextProps.maxRowsOnLoad) {
            if (nextProps.nameSearchFilterValue !== prevProps.nameSearchFilterValue) { 
                return true;
            }
        }

        return false;
    }

    public static unselectGridDataRows(gridData: SGDataRow[]) {
        gridData.forEach((row: SGDataRow) => {
            row.selected = false;
            if (row.children && row.children.length) {
                ContainerGridBase.unselectGridDataRows(row.children);
            }
        });
    }

    public static getSelectedRowInGridData(gridData: SGDataRow[]) {
        let selectedRow: SGDataRow = undefined;
        for (let i = 0; i < gridData.length; i++) {
            let row = gridData[i];
            if (row.selected === true) {
                selectedRow = row;
                break;
            }
            if (row.children && row.children.length) {
                selectedRow = ContainerGridBase.getSelectedRowInGridData(row.children);
                if (selectedRow !== undefined) {
                    break;
                }
            }
        }
        return selectedRow;
    }

    public static accessGridRowByRowValue(rowValue: string, gridData: SGDataRow[]): SGDataRow {
        const rowValueSet: string[] = rowValue.split(';');
        let accessor: SGDataRow = undefined;
        let targetRowValue: string = '';
        rowValueSet.forEach((rowValue) => {
            if (!accessor) {
                targetRowValue = rowValue;
                gridData.forEach((row) => {
                    if (row.value === rowValue) {
                        accessor = row;
                    }
                });
            } else {
                targetRowValue = targetRowValue + `;${rowValue}`;
                if (accessor.children && accessor.children.length) {
                    accessor.children.forEach((row) => {
                        if (row.value === targetRowValue) {
                            accessor = row;
                        }
                    });
                }
            }
        });
        return accessor;
    }

    /**
     * Compare the status hash of two controllers and determine sort order appropriately
     * @param left left side of comparison
     * @param right right side of comparison
     */
    public static sortControllerStatus(left: IControllerStatusHash, right: IControllerStatusHash, sortOrder: GridSortOrder): number {
        let sortNumber: number = 0;

        // Get number of warning. All keys that are not in K8sContainerStatusList will be counted as a warning status
        const leftKeys: string[] = Object.keys(left);
        const rightKeys: string[] = Object.keys(right);
        const k8sContainerStatusListKeys: string[] = Object.keys(K8sContainerStatusList);
        let numWarningLeft: number = 0;
        let numWarningRight: number = 0;
        leftKeys.forEach((leftKey) => {
            let isKeyAccountedFor: boolean = false;
            k8sContainerStatusListKeys.forEach((statusKey) => {
                if (leftKey.toLowerCase() === statusKey.toLowerCase()) {
                    isKeyAccountedFor = true;
                }
            });
            if (!isKeyAccountedFor) {
                numWarningLeft += left[leftKey];
            }
        });
        rightKeys.forEach((rightKey) => {
            let isKeyAccountedFor: boolean = false;
            k8sContainerStatusListKeys.forEach((statusKey) => {
                if (rightKey.toLowerCase() === statusKey.toLowerCase()) {
                    isKeyAccountedFor = true;
                }
            });
            if (!isKeyAccountedFor) {
                numWarningRight += right[rightKey];
            }
        });

        // nib: For failures, unknowns, and warnings, the fewer the number of these statuses the better
        // compare failures
        if (left.hasOwnProperty(K8sContainerStatusList.Failed) || right.hasOwnProperty(K8sContainerStatusList.Failed)) {
            const numFailedLeft: number = left.failed || 0;
            const numFailedRight: number = right.failed || 0;
            sortNumber = numFailedLeft - numFailedRight;
            // nib: Failures give you points for being bad. 
            // Therefore, in a descending sort scenario you want to put the item with the most failures first
            if (sortNumber !== 0 && sortOrder === GridSortOrder.Desc) {
                sortNumber *= -1;
            }
        }
        // if still even, compare unknowns
        if (sortNumber === 0 &&
            (left.hasOwnProperty(K8sContainerStatusList.Unknown) || right.hasOwnProperty(K8sContainerStatusList.Unknown))
        ) {
            const numUnknownLeft: number = left.unknown || 0;
            const numUnknownRight: number = right.unknown || 0;
            sortNumber = numUnknownLeft - numUnknownRight;
            // nib: Unknowns give you points for being bad. 
            // Therefore, in a descending sort scenario you want to put the item with the most unknowns first
            if (sortNumber !== 0 && sortOrder === GridSortOrder.Desc) {
                sortNumber *= -1;
            }
        }
        // if still even, compare warnings        
        if (sortNumber === 0 && (numWarningLeft !== 0 || numWarningRight !== 0)) {
            sortNumber = numWarningLeft - numWarningRight;
            // nib: Warnings give you points for being bad. 
            // Therefore, in a descending sort scenario you want to put the item with the most warnings first
            if (sortNumber !== 0 && sortOrder === GridSortOrder.Desc) {
                sortNumber *= -1;
            }
        }

        // nib: For succeeded and running resources, the greater the number of these statuses the better
        // if still even, compare successes        
        if (sortNumber === 0 &&
            (left.hasOwnProperty(K8sContainerStatusList.Succeeded) || right.hasOwnProperty(K8sContainerStatusList.Succeeded))
        ) {
            const numSucceededLeft: number = left.succeeded || 0;
            const numSucceededRight: number = right.succeeded || 0;
            sortNumber = numSucceededLeft - numSucceededRight;
            // nib: If you haven't gotten any bad points, we start giving out rewards for being good, i.e. succeeded and running 
            // Therefore, in a ascending sort scenario you want to put the item with the most failures first
            if (sortNumber !== 0 && sortOrder === GridSortOrder.Asc) {
                sortNumber *= -1;
            }
        }
        // if still even, compare runnings        
        if (sortNumber === 0 &&
            (left.hasOwnProperty(K8sContainerStatusList.Running) || right.hasOwnProperty(K8sContainerStatusList.Running))
        ) {
            const numRunningLeft = left.running || 0;
            const numRunningRight = right.running || 0;
            sortNumber = numRunningLeft - numRunningRight;
            if (sortNumber !== 0 && sortOrder === GridSortOrder.Asc) {
                sortNumber *= -1;
            }
        }

        return sortOrder === GridSortOrder.Asc ? sortNumber : sortNumber * -1;
    }

    /**
     * convert a container or pod string status into a position (not numeric)
     * @param left left side of comparison
     * @param right right side of comparison
     */
    public static sortContainerPodStatus(left: string, right: string): number {
        const safeLeftStatus: string = left || '?';
        const leftState = safeLeftStatus.toLocaleLowerCase();

        const safeRightStatus: string = right || '?';
        const rightState = safeRightStatus.toLocaleLowerCase();

        return ContainerGridBase.containerStatusSortNumber(leftState) - ContainerGridBase.containerStatusSortNumber(rightState);
    }

    /**
     * convert a string status into a position (not numeric)
     * @param left left side of comparison
     * @param right right side of comparison
     */
    public static sortNodeStatus(left: string, right: string): number {
        const safeLeftStatus: string = left || '?';
        const leftState = safeLeftStatus.toLocaleLowerCase();

        const safeRightStatus: string = right || '?';
        const rightState = safeRightStatus.toLocaleLowerCase();

        return ContainerGridBase.nodeStatusSortNumber(leftState) - ContainerGridBase.nodeStatusSortNumber(rightState);
    }

    /**
     * Returns the max container time generated in the list of containers
     * @param containerList an array of GridLineObjects that represent containers
     */
    public static getMaxTimeGeneratedInContainerList(containerList: IGridLineObject<ContainerMetaDataLegacy>[][]): string {
        let maxTimeGenerated = moment(containerList[0][0].metaData.timeGenerated);
        for (let i = 1; i < containerList.length; i++) {
            let container: IGridLineObject<ContainerMetaDataLegacy>[] = containerList[i];
            let containerMetaData: ContainerMetaDataLegacy = container[0].metaData;
            let timeGenerated = moment(containerMetaData.timeGenerated);
            if (timeGenerated.isAfter(maxTimeGenerated)) {
                maxTimeGenerated = timeGenerated;
            }
        }
        return maxTimeGenerated.utc().format();
    }

    /**
     * Pulls off the important and helpful information about a row
     * @param row a row from Selectable grid
     */
    public static getClusterObjectInfo(row: SGDataRow): IClusterObjectInfo {
        let clusterObject: IClusterObjectInfo = {
            resourceType: PropertyPanelType.Unsupported,
            containerName: '',
            podName: '',
            controllerName: '',
            nodeName: '',
            timeGenerated: '',
            clusterResourceId: ''
        };

        const columnData = row.columnData;
        if (!columnData || !Array.isArray(columnData)) {
            throw new Error('The selected row contains faulty column data');
        }
        if (!(columnData[0] instanceof GridLineObject)) {
            throw new Error('The selected row contains faulty first column data');
        }

        let metaData: any;
        if (columnData[0].metaData) { // index 0 is the name column in all 3 grids
            metaData = columnData[0].metaData;
        }

        if (!metaData) {
            throw new Error('The selected row lacks meta data');
        }

        if (metaData instanceof ContainerMetaData || metaData instanceof ContainerMetaDataLegacy) {
            clusterObject.resourceType = PropertyPanelType.Container;
            clusterObject.containerName = metaData.containerInstance;
            clusterObject.timeGenerated = metaData.timeGenerated;
            clusterObject.nodeName = metaData.host;
            clusterObject.clusterResourceId = metaData.clusterId;
        } else if (metaData instanceof PodMetaData || metaData instanceof PodMetaDataLegacy) {
            clusterObject.resourceType = PropertyPanelType.Pod;
            clusterObject.podName = metaData.podName;
            clusterObject.timeGenerated = metaData.timeGenerated;
            clusterObject.clusterResourceId = metaData.clusterId;
        } else if (metaData instanceof ControllerMetaData) {
            clusterObject.controllerName = metaData.controllerName;
            clusterObject.timeGenerated = metaData.timeGenerated;
            clusterObject.clusterResourceId = metaData.clusterId;
            clusterObject.resourceType = StringHelpers.equal(metaData.controllerName, DisplayStrings.NoAssociatedController)
                ? PropertyPanelType.Unsupported
                : PropertyPanelType.Controller;
        } else if (metaData instanceof NodeMetaData) {
            if (metaData.isUnscheduledPod) {
                clusterObject.resourceType = PropertyPanelType.Unsupported;
            } else {
                clusterObject.resourceType = PropertyPanelType.Node;
            }
            clusterObject.nodeName = metaData.nodeName;
            clusterObject.timeGenerated = metaData.timeGenerated;
            clusterObject.clusterResourceId = metaData.clusterId;
        }

        return clusterObject;
    }

    /**
    * Creates set of values used as options for dropdown selections to make grid query
    * @param queryProps the current set of props in a component when a query is executed
    */
    public static getGridQueryDropdownSelections(queryProps?: IContainerGridProps): StringMap<string> {
        return {
            workspace_id: queryProps.workspace ? queryProps.workspace.id : '<null>',
            workspace_name: queryProps.workspace ? queryProps.workspace.name : '<null>',
            cluster_name: queryProps.clusterName,
            namespace: queryProps.nameSpace,
            service_name: queryProps.serviceName,
            host_name: queryProps.hostName,
            selected_metric: queryProps.metricName,
            selected_metric_agg: AggregationOption[queryProps.aggregationOption],
            isTimeRelative: queryProps.isTimeRelative ? 'true' : 'false',
            startDateTimeUtc: queryProps.startDateTimeUtc
                ? queryProps.startDateTimeUtc.toISOString()
                : null,
            endDateTimeUtc: queryProps.endDateTimeUtc
                ? queryProps.endDateTimeUtc.toISOString()
                : null,
        }
    }

    private static generateLogAnalyticsOptions(options: any[]): DropdownOption[] {
        return options.map((option) => {
            return new DropdownAction(option.id, option.displayName, option.callback);
        });
    }

    /**
     * Populate query parameters and send navigation message back to monitoring extension
     * @param linkType PropertyPanel link type : excpected value is ContainerEvents or KubeEvents
     * @param resourceName name of the resource to be replaced in the query
     * @param timeIntervalForPP Time interval containing start and end time for the query
     * @param navigateProps navigation properties needed by the query
     * @param objectKind?(optional) objectKind needed for the KubeEvents query
     * @param selectedTab selectedTab when the link is clicked in the property panel
     */

    private static onNavigateToLogAnalyticsForPP(
        linkType: PropertyPanelLinkType,
        resourceName: string,
        timeIntervalForPP: TimeInterval,
        navigateProps: any,
        selectedTab: string,
        objectKind?: ObjectKind
    ) {
        let query: string = '';
        if (linkType === PropertyPanelLinkType.ContainerEventsLogs) {
            query = PropertyPanelQueryTemplates.getContainerLogQuery(
                resourceName,
                navigateProps.clusterResourceId,
                navigateProps.clusterName.toString(),
                timeIntervalForPP.getBestGranularStartDate().toISOString(),
                timeIntervalForPP.getBestGranularEndDate(true).toISOString(),
                navigateProps.hostName.toString()
            );
        } else if (linkType === PropertyPanelLinkType.KubEventsLog) {
            query = PropertyPanelQueryTemplates.getKubeEventsLogQuery(
                navigateProps.clusterResourceId.toString(),
                navigateProps.clusterName.toString(),
                resourceName,
                objectKind,
                timeIntervalForPP.getBestGranularStartDate().toISOString(),
                timeIntervalForPP.getBestGranularEndDate(true).toISOString()
            );
        }
        const message: ILogSearchMessageObject = {
            id: navigateProps.workspaceId,
            query: query,
        }
        const telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
        telemetry.logNavigationEvent('SelectedTab: ' + selectedTab, linkType + '/LogAnalyticsBlade');
        navigateProps.messagingProvider.sendNavigateToLogSearch(message);
    }
    /**
     * Decide if an item should be included in the final grid list (and its children)
     * Note: Child filtering isn't enabled, but i added some thoughts below on how to start to do it but
     * the problem is really hard (imagine a collapsed hierarchy searching for myapp-123) on the node view
     * where only 2 nodes of 3 have been loaded... should we query kusto?? this could get crazy
     * @param rootGridEntry deep cloned copy to the root of a potentially hierarchy of grid items
     * @param gridDataFilter the string filter we would like to do a contains search on
     * @param shouldApplyExactMatch
     * @returns {boolean} true if this parent's name should be considered included (note that child filtering isn't enabled yet)
     */
    private static hierarchyIsMatchingFilter(rootGridEntry: any, gridDataFilter: string = '', shouldApplyExactMatch?: boolean): boolean {
        const nameColumn = rootGridEntry.columnData[0].value;

        if (!nameColumn) { return false; }

        if (typeof nameColumn === 'string') {
            const nameLower: string = ((nameColumn) as string).toLocaleLowerCase();

            if (shouldApplyExactMatch && StringHelpers.equal(nameLower, gridDataFilter.toLocaleLowerCase())) {
                return true;
            } else if (!shouldApplyExactMatch && nameLower.indexOf(gridDataFilter.toLocaleLowerCase()) > -1) {
                return true;
            }
        } else {
            const nameGridLineRow = nameColumn;

            let targetName = nameGridLineRow.name || '';
            targetName = targetName.toLocaleLowerCase();

            if (shouldApplyExactMatch && StringHelpers.equal(targetName, gridDataFilter.toLocaleLowerCase())) {
                return true;
            } else if (!shouldApplyExactMatch && targetName.indexOf(gridDataFilter.toLocaleLowerCase()) > -1) {
                return true;
            }
        }

        // bbax: if you need to filter the children inside the hierarch you can do that here
        // simple implementation would be to recurse back in on yourself here... the root
        // was deep copied using immutability-helper, so you are safe to destroy the children
        // as you see fit!

        return false;
    }

    /**
     * primary logic for deciding how node status works... this is all going to get reworked in my next pr...
     * @param status status of the node right now
     */
    private static getRealStatusOfNode(status: string): JSX.Element[] {
        const safeStatus: string = status || '?';
        const lowerState = safeStatus.toLocaleLowerCase();
        const unscheduled = lowerState.indexOf('unscheduled') >= 0;
        const hasPressure = lowerState.indexOf('pressure') >= 0;
        const outOfDisk = lowerState.indexOf('outofdisk') >= 0;
        const networkOffine = lowerState.indexOf('networkunavailable') >= 0;
        const ready = lowerState.indexOf('ready') >= 0;

        if (networkOffine || outOfDisk) {
            return [<span className='sg-icon' > <FailedSvg /> {DisplayStrings.ContainerNodeStatusErrorAlt}</span>];
        } else if (hasPressure || unscheduled) {
            return [<span className='sg-icon' > <WarnSvg /> {DisplayStrings.ContainerNodeStatusWarningAlt}</span>];
        } else if (ready) {
            return [<span className='sg-icon' > <GreenSvg /> {DisplayStrings.ContainerNodeStatusGreenAlt}</span>];
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
    private static nodeStatusSortNumber(status: string): number {
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
        } else if (unknown || status === '') {
            return 3;
        } else if (ready) {
            return 1;
        } else {
            return 2;
        }
    }

    /**
     * based on the status of a container translate into an icon/text pair for display in the user interface
     * @param status the status of this container (for example 'running')
     */
    private static getRealStatusOfContainer(status: string): JSX.Element[] {
        const safeStatus: string = status || '?';
        const lowerState = safeStatus.toLocaleLowerCase();
        const isTerminated = lowerState.indexOf('terminated') >= 0;
        const isRunning = lowerState.indexOf('running') >= 0;
        const isUnknown = lowerState.indexOf('unknown') >= 0;

        if (isTerminated) {
            // tslint:disable-next-line:max-line-length
            return [<span className='sg-icon'><StoppedSvg color={StoppedSvgColor.Black} /> {DisplayStrings.ContainerStatusTerminalAlt}</span>];
        } else if (isRunning) {
            return [<span className='sg-icon'><GreenSvg /> {DisplayStrings.ContainerNodeStatusGreenAlt}</span>];
        } else if (isUnknown) {
            return [<span className='sg-icon'><UnknownSvg /> {DisplayStrings.ContainerNodeStatusUnknownAlt}</span>];
        } else {
            return [<span className='sg-icon'><WarnSvg /> {DisplayStrings.ContainerNodeStatusWarningAlt}</span>];
        }
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

    /**
     * convert a status into a position number
     * 1 - Running, 2 - Succeeeded, 3 - Warn, 4 - Unknown, 5 - Failed
     * @param status status to convert
     */
    private static containerStatusSortNumber(status: string): number {
        const isleftSucceeded = status.indexOf('succeeded') >= 0;
        const isleftFailed = status.indexOf('failed') >= 0;
        const isleftUnknown = status.indexOf('unknown') >= 0;
        const isleftRunning = status.indexOf('running') >= 0;
        if (isleftSucceeded) {
            return 2;
        } else if (isleftRunning) {
            return 1;
        } else if (isleftFailed) {
            return 5;
        } else if (isleftUnknown) {
            return 4;
        } else {
            return 3;
        }
    }
} 
