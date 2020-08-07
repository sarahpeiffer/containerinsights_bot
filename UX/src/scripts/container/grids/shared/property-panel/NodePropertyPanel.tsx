/**
 * tpl
 */
import * as React from 'react';

/**
 * local
 */
import {
    PropertyPanelType,
    IPropertyPanelNodeInterpretedResponse,
    NodePropertyPanelKustoResponseColumnNamesToPropertyPanelPropertyTitleNamesMap,
    NodePropertyPanelInterpretedResponseKeyMap,
    VirtualKubletNamesMap,
} from '../../../data-provider/KustoPropertyPanelResponseInterpreter';
import { IPropertyPanelNavigationProps, SingleClusterTab } from '../../../ContainerMainPage';
import { ContainerGridBase, PropertyPanelLinkType } from '../ContainerGridBase';

/**
 * shared
 */
import { ExpandableSection, ExpandableSectionId } from '../../../../shared/property-panel/ExpandableSection';
import { DisplayStrings } from '../../../../shared/DisplayStrings';
import { ISimplePropertyProps } from '../../../../shared/property-panel/SimpleProperty';
import { SimplePropertyCollection } from '../../../../shared/property-panel/SimplePropertyCollection';
import { PropertyPanelSelector, ObjectKind } from '../../../../shared/property-panel/PropertyPanelSelector';
import { MetricValueFormatter } from '../../../../shared/MetricValueFormatter';
import { StringHelpers } from '../../../../shared/Utilities/StringHelpers';

/**
 * svg
 */
import { NestingIndicatorCollapsedSVG } from '../../../../shared/svg/nesting-indicator-collapsed';
import { NestingIndicatorExpandedSVG } from '../../../../shared/svg/nesting-indicator-expanded';
import { IGridLineObject } from '../../../../shared/GridLineObject';
import { NodeMetaData } from '../../../shared/metadata/NodeMetaData';
import { ITelemetry } from '../../../../shared/Telemetry';
import { ErrorSeverity } from '../../../../shared/data-provider/TelemetryErrorSeverity';
import { IMessagingProvider } from '../../../../shared/MessagingProvider';
import { TabularProperty } from '../../../../shared/property-panel/TabularProperty';
import { NodeDiskMetrics, DiskMetricsInterpreter } from '../../../data-provider/DiskMetricsInterpreter';
import { WarnSvg } from '../../../../shared/svg/warn';
import { ErrorStatus } from '../../../../shared/ErrorStatus';
import { RequiredLoggingInfo } from '../../../../shared/RequiredLoggingInfo';

/**
 * props and state interfaces
 */
interface INodePropertyPanelProps {
    propertyPanelData: IPropertyPanelNodeInterpretedResponse;
    navigationProps: IPropertyPanelNavigationProps;
    showLiveLogs: boolean;
    onConsoleOpen: (information: RequiredLoggingInfo) => void;
    selectedRow: IGridLineObject<NodeMetaData>;
    messageProvider: IMessagingProvider;
    selectedTab: SingleClusterTab;
    telemetry: ITelemetry;
}

export enum OperatingSystem {
    Windows = 'windows',
    Linux = 'linux'
}

/**
 * Constructs the node property panel
 * @param propertyPanelData data used to populate the various fields of the property panel
 * @param navigationProps data used to make the links present in the property panel functional
 */
export class NodePropertyPanel extends React.Component<INodePropertyPanelProps, any> {

    public shouldComponentUpdate(nextProps: INodePropertyPanelProps, nextState: any): boolean {
        if (this.props.propertyPanelData !== nextProps.propertyPanelData) {
            return true;
        }

        return !PropertyPanelSelector.navigationAreEqual(this.props.navigationProps, nextProps.navigationProps);
    }

    public render(): JSX.Element {
        try {
            const { propertyPanelData, navigationProps, showLiveLogs, onConsoleOpen } = this.props;

            // Make simple properties
            let simpleProperties: ISimplePropertyProps[] = [];

            let labels: StringMap<string> = propertyPanelData[NodePropertyPanelInterpretedResponseKeyMap.Labels];
            if (!labels || (typeof (labels) !== 'object')) { labels = {}; }
            const os: string = labels.hasOwnProperty('beta.kubernetes.io/os') ? labels['beta.kubernetes.io/os'] : '';
            const lowerOS: string = os.toLocaleLowerCase();

            for (let property in propertyPanelData) {
                if (propertyPanelData.hasOwnProperty(property)
                    && property !== NodePropertyPanelInterpretedResponseKeyMap.Labels
                    && property !== NodePropertyPanelInterpretedResponseKeyMap.DiskData
                ) {
                    let propertyValue: any = propertyPanelData[property];

                    // format multi value strings to look prettier
                    if (typeof propertyValue === 'string') {
                        propertyValue = this.formatMultiValueString(propertyValue);
                    }

                    // wrap field in array if it isn't in one already
                    propertyValue = PropertyPanelSelector.arrayWrapper(propertyValue);

                    if (property === NodePropertyPanelInterpretedResponseKeyMap.Status) { // merge node status with disk status
                        const nodeStatus: string = propertyValue[0];
                        const diskData: any = propertyPanelData[NodePropertyPanelInterpretedResponseKeyMap.DiskData];
                        const diskStatus: string[] =
                            DiskMetricsInterpreter.getNodeDiskStatusFromDiskData(diskData);
                        propertyValue = PropertyPanelSelector.arrayWrapper(
                            DiskMetricsInterpreter.mergeNodeStatusWithDiskStatus(nodeStatus, diskStatus)
                        );
                    }

                    let formattedPropertyName: string = '';

                    if (this.props.selectedRow.metaData.isVirtual) {

                        // bbax: because virtual kublet is a subset of (that giant name) we can get away with this cheat for now
                        if (!VirtualKubletNamesMap.hasOwnProperty(property)) {
                            continue;
                        } else {
                            formattedPropertyName = VirtualKubletNamesMap[property];
                        }

                    } else {
                        formattedPropertyName = NodePropertyPanelKustoResponseColumnNamesToPropertyPanelPropertyTitleNamesMap[property];
                    }

                    if (formattedPropertyName) {
                        simpleProperties.push(
                            {
                                propertyName: formattedPropertyName,
                                propertyValues: propertyValue
                            }
                        );
                    }
                }
            }

            if (this.props.selectedRow.metaData.lastReported > 0) {
                simpleProperties.push(
                    {
                        propertyName: DisplayStrings.LastReported,
                        propertyValues: [
                            StringHelpers.replaceAll(
                                DisplayStrings.NTimeAgo,
                                '{0}',
                                MetricValueFormatter.formatUpTimeValue(this.props.selectedRow.metaData.lastReported))
                        ]
                    }
                )
            }

            const simplePropertyCollection = <SimplePropertyCollection properties={simpleProperties} />

            // Process labels separately due to format
            let labelSimpleProperties: ISimplePropertyProps[] = [];
            if (propertyPanelData.hasOwnProperty(NodePropertyPanelInterpretedResponseKeyMap.Labels)) {
                const labels: StringMap<string> = propertyPanelData[NodePropertyPanelInterpretedResponseKeyMap.Labels];
                for (let label in labels) {
                    if (labels.hasOwnProperty(label)) {
                        let labelValue: string[] = PropertyPanelSelector.arrayWrapper(labels[label]);

                        labelSimpleProperties.push(
                            {
                                propertyName: label,
                                propertyValues: labelValue
                            }
                        );
                    }
                }
            }
            const labelSimplePropertyCollection = <SimplePropertyCollection properties={labelSimpleProperties} />

            // create viewKubEventsLog link
            const nodeName = propertyPanelData[NodePropertyPanelInterpretedResponseKeyMap.NodeName];
            const viewKubEventsLink = ContainerGridBase.getLink(
                PropertyPanelLinkType.KubEventsLog,
                nodeName,
                navigationProps,
                this.props.messageProvider,
                this.props.selectedTab.toString(),
                ObjectKind.Node
            );

            const metaData = propertyPanelData[NodePropertyPanelInterpretedResponseKeyMap.metaData];
            const viewContainerLiveEventsLogsLink = ContainerGridBase.getContainerLiveLogsLink(
                metaData,
                showLiveLogs,
                onConsoleOpen,
                this.props.selectedTab.toString(),
                'NodePropertyPanel'
            );

            // Windows nodes don't have the agent to collect this information
            let diskTable: JSX.Element;
            let showDiskStatusIcon: boolean = false;
            if (lowerOS !== OperatingSystem.Windows && lowerOS === OperatingSystem.Linux) {
                const diskData: any = propertyPanelData[NodePropertyPanelInterpretedResponseKeyMap.DiskData];
                if (Object.keys(diskData).length > 0) {
                    diskTable = this.createDiskDataTable(diskData);
                } else {
                    diskTable =
                        <ErrorStatus
                            message={DisplayStrings.NoData}
                            isVisible={true}
                        />
                }

                const diskStatus: string[] =
                    DiskMetricsInterpreter.getNodeDiskStatusFromDiskData(
                        propertyPanelData[NodePropertyPanelInterpretedResponseKeyMap.DiskData]
                    );
                // Untouched response for node status from Kusto
                const nodeStatus: string = propertyPanelData[NodePropertyPanelInterpretedResponseKeyMap.Status];
                const nodeStatusHasDiskProblems: boolean = DiskMetricsInterpreter.nodeStatusHasDiskProblems(nodeStatus);
                showDiskStatusIcon = (diskStatus.length > 0 || nodeStatusHasDiskProblems);
            }

            const displayDiskExpandableSection: boolean =
                (lowerOS !== OperatingSystem.Windows && lowerOS === OperatingSystem.Linux) && (diskTable != null);

            return (
                <div>
                    {PropertyPanelSelector.generatePropertyPanelHeader(
                        PropertyPanelType.Node,
                        nodeName,
                        DisplayStrings.NodePropertyPanelHeaderSubtitle, this.props.selectedRow
                    )}
                    <div className='links'>
                        {viewContainerLiveEventsLogsLink}
                        {viewKubEventsLink}
                    </div>
                    {simplePropertyCollection}
                    {displayDiskExpandableSection ?
                        <ExpandableSection // DISK
                            title={DisplayStrings.NodePropertyPanelDiskMetricsExpandableSectionTitle}
                            statusIcon={showDiskStatusIcon ? <WarnSvg /> : null}
                            content={diskTable}
                            expandIcon={<NestingIndicatorCollapsedSVG />}
                            collapseIcon={<NestingIndicatorExpandedSVG />}
                            telemetry={this.props.telemetry}
                            id={{
                                propertyPanelId: PropertyPanelType.Container,
                                expandableSectionId: ExpandableSectionId.LocalDiskCapacity
                            }}
                        /> : <div></div>
                    }
                    <ExpandableSection // LABELS
                        title={DisplayStrings.NodePropertyPanelLabelsExpandableSectionTitle}
                        content={labelSimplePropertyCollection}
                        expandIcon={<NestingIndicatorCollapsedSVG />}
                        collapseIcon={<NestingIndicatorExpandedSVG />}
                        telemetry={this.props.telemetry}
                        id={{
                            propertyPanelId: PropertyPanelType.Container,
                            expandableSectionId: ExpandableSectionId.Labels
                        }}
                    />
                </div>
            );

        } catch (exc) {
            this.props.telemetry.logException(exc, 'NodePropertyPanel', ErrorSeverity.Error, null, null);
            return null;
        }
    }

    private createDiskDataTable(diskData: any): JSX.Element {
        // Make table out of disk data
        const diskTableData: JSX.Element[][] = [];
        const emptyCell = PropertyPanelSelector.getTextGridCell('');

        for (let device in diskData) {
            if (diskData.hasOwnProperty(device)) {
                let row: JSX.Element[] = [emptyCell, emptyCell, emptyCell, emptyCell];
                row[0] = PropertyPanelSelector.getTextGridCell(device);
                for (let path in diskData[device]) {
                    if (diskData[device].hasOwnProperty(path)) {
                        row[1] = PropertyPanelSelector.getTextGridCell(path);
                        for (let diskMetricName in diskData[device][path]) {
                            if (diskData[device][path].hasOwnProperty(diskMetricName)) {
                                let diskMetricValue: number = diskData[device][path][diskMetricName];
                                if (diskMetricName === NodeDiskMetrics.DiskStatus) {
                                    continue;
                                } else if (diskMetricName === NodeDiskMetrics.UsedPercent) {
                                    let formattedUsedPercentString = MetricValueFormatter.formatPercentageValue(diskMetricValue);
                                    row[2] = PropertyPanelSelector.getTextGridCell('' + formattedUsedPercentString);
                                } else if (diskMetricName === NodeDiskMetrics.Used) {
                                    continue;
                                } else if (diskMetricName === NodeDiskMetrics.Free) {
                                    let formattedFreeString = MetricValueFormatter.formatBytesValue(diskMetricValue);
                                    row[3] = PropertyPanelSelector.getTextGridCell('' + formattedFreeString);
                                } else {
                                    throw new Error('Invalid disk metric name: ' + diskMetricName);
                                }
                            }
                        }
                    }
                }
                diskTableData.push(row);
            }
        }

        let diskTable: JSX.Element =
            <div className='node-disk-tabular-property'>
                <TabularProperty
                    propertyName={DisplayStrings.NodePropertyPanelDiskTableTitle}
                    columnNames={[
                        DisplayStrings.NodePropertyPanelDiskTableDeviceColHeader,
                        DisplayStrings.NodePropertyPanelDiskTablePathColHeader,
                        DisplayStrings.NodePropertyPanelDiskTableUsedPercentColHeader,
                        DisplayStrings.NodePropertyPanelDiskTableFreeColHeader
                    ]}
                    tabularValues={diskTableData}
                    onRowSelected={() => { }}
                />
            </div>

        return diskTable;
    }

    /**
     * If the string contains multiple values seperated by a comma, introduce a space after the comma for better formatting
     * @param string
     */
    private formatMultiValueString(string: string) {
        const splitString: string[] = string.split(',');
        return splitString.join(', ');
    }
}
