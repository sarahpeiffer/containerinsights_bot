/**
 * tpl
 */
import * as React from 'react';

/**
 * local
 */
import {
    PropertyPanelType,
    PodPropertyPanelInterpretedResponseKeyMap,
    PodPropertyPanelKustoResponseColumnNamesToPropertyPanelPropertyTitleNamesMap,
    IPropertyPanelPodInterpretedResponse
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
import { TabularProperty } from '../../../../shared/property-panel/TabularProperty';
import { PropertyPanelSelector, ObjectKind } from '../../../../shared/property-panel/PropertyPanelSelector';
import { IGridLineObject } from '../../../../shared/GridLineObject';
import { PodMetaData } from '../../../shared/metadata/PodMetaData';
import { StringHelpers } from '../../../../shared/Utilities/StringHelpers';
import { MetricValueFormatter } from '../../../../shared/MetricValueFormatter';

/**
 * svg
 */
import { NestingIndicatorCollapsedSVG } from '../../../../shared/svg/nesting-indicator-collapsed';
import { NestingIndicatorExpandedSVG } from '../../../../shared/svg/nesting-indicator-expanded';
import { ITelemetry } from '../../../../shared/Telemetry';
import { ErrorSeverity } from '../../../../shared/data-provider/TelemetryErrorSeverity';
import { IMessagingProvider } from '../../../../shared/MessagingProvider';
import { RequiredLoggingInfo } from '../../../../shared/RequiredLoggingInfo';

/**
 * props and state interfaces
 */
interface IPodPropertyPanelProps {
    propertyPanelData: IPropertyPanelPodInterpretedResponse;
    navigationProps: IPropertyPanelNavigationProps;
    selectedRow: IGridLineObject<PodMetaData>;
    showLiveLogs: boolean;
    onConsoleOpen: (information: RequiredLoggingInfo) => void;
    messageProvider: IMessagingProvider;
    selectedTab: SingleClusterTab;
    telemetry: ITelemetry;
}

/**
 * Constructs the pod property panel
 * @param propertyPanelData data used to populate the various fields of the property panel
 * @param navigationProps data used to make the links present in the property panel functional
 */
export class PodPropertyPanel extends React.Component<IPodPropertyPanelProps, any> {

    public shouldComponentUpdate(nextProps: IPodPropertyPanelProps, nextState: any): boolean {
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

            for (let field in propertyPanelData) {
                if (propertyPanelData.hasOwnProperty(field)
                    && field !== PodPropertyPanelInterpretedResponseKeyMap.containers
                    && field !== PodPropertyPanelInterpretedResponseKeyMap.PodLabel
                ) {
                    // wrap field in array if it isn't in one already
                    propertyPanelData[field] = PropertyPanelSelector.arrayWrapper(propertyPanelData[field]);

                    const finalField: string = PodPropertyPanelKustoResponseColumnNamesToPropertyPanelPropertyTitleNamesMap[field];

                    if (finalField) {
                        simpleProperties.push(
                            {
                                propertyName: finalField,
                                propertyValues: propertyPanelData[field]
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

            const simplePropertyCollection: JSX.Element = <SimplePropertyCollection properties={simpleProperties} />

            // Process labels separately due to format
            let labelSimpleProperties: ISimplePropertyProps[] = [];
            if (propertyPanelData.hasOwnProperty(PodPropertyPanelInterpretedResponseKeyMap.PodLabel)) {
                const labels: StringMap<string> = propertyPanelData[PodPropertyPanelInterpretedResponseKeyMap.PodLabel];
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
            const labelSimplePropertyCollection: JSX.Element = <SimplePropertyCollection properties={labelSimpleProperties} />

            // Make table out of container perf data
            const containers = propertyPanelData[PodPropertyPanelInterpretedResponseKeyMap.containers];
            const containerCPUTableData: JSX.Element[][] = [];
            const containerMemTableData: JSX.Element[][] = [];
            for (let containerName in containers) {
                if (containers.hasOwnProperty(containerName)) {
                    const emptyCell = PropertyPanelSelector.getTextGridCell('');
                    let cpuRow: JSX.Element[] = [emptyCell, emptyCell, emptyCell];
                    let memRow: JSX.Element[] = [emptyCell, emptyCell, emptyCell];
                    cpuRow[0] = PropertyPanelSelector.getTextGridCell(containerName);
                    memRow[0] = PropertyPanelSelector.getTextGridCell(containerName);
                    let container = containers[containerName];
                    if (container.CPULimit !== undefined) {
                        cpuRow[1] = PropertyPanelSelector.getTextGridCell('' + container.CPULimit);
                    }
                    if (container.CPURequest !== undefined) {
                        cpuRow[2] = PropertyPanelSelector.getTextGridCell('' + container.CPURequest);
                    }
                    if (container.MemoryLimit !== undefined) {
                        memRow[1] = PropertyPanelSelector.getTextGridCell('' + container.MemoryLimit);
                    }
                    if (container.MemoryLimit !== undefined) {
                        memRow[2] = PropertyPanelSelector.getTextGridCell('' + container.MemoryRequest);
                    }
                    containerCPUTableData.push(cpuRow);
                    containerMemTableData.push(memRow);
                }
            }
            let containerCPUTable: JSX.Element = <div className='container-cpu-tabular-property'>
                <TabularProperty
                    propertyName={DisplayStrings.PodPropertyPanelContainerCPUTableTitle}
                    columnNames={[
                        DisplayStrings.PodPropertyPanelContainerCPUTableNameColHeader,
                        DisplayStrings.PodPropertyPanelContainerCPUTableLimitColHeader,
                        DisplayStrings.PodPropertyPanelContainerCPUTableRequestColHeader
                    ]}
                    tabularValues={containerCPUTableData}
                    onRowSelected={() => { }}
                />
            </div>

            let containerMemTable: JSX.Element = <div className='container-memory-tabular-property'>
                <TabularProperty
                    propertyName={DisplayStrings.PodPropertyPanelContainerMemoryTableTitle}
                    columnNames={[
                        DisplayStrings.PodPropertyPanelContainerMemoryTableNameColHeader,
                        DisplayStrings.PodPropertyPanelContainerMemoryTableLimitColHeader,
                        DisplayStrings.PodPropertyPanelContainerMemoryTableRequestColHeader
                    ]}
                    tabularValues={containerMemTableData}
                    onRowSelected={() => { }}
                />
            </div>

            const containerPerfTables: JSX.Element = <div>{containerCPUTable}{containerMemTable}</div>;

            // Create viewKubEvents link
            const podName = propertyPanelData[PodPropertyPanelInterpretedResponseKeyMap.PodName];

            const viewKubEventsLink = ContainerGridBase.getLink(
                PropertyPanelLinkType.KubEventsLog,
                podName,
                navigationProps,
                this.props.messageProvider,
                this.props.selectedTab.toString(),
                ObjectKind.Pod
            );

            const metaData = propertyPanelData[PodPropertyPanelInterpretedResponseKeyMap.metaData];
            const viewContainerLiveEventsLogsLink = ContainerGridBase.getContainerLiveLogsLink(
                metaData,
                showLiveLogs,
                onConsoleOpen,
                this.props.selectedTab.toString(),
                'PodPropertyPanel'
            );

            return (
                <div>
                    {PropertyPanelSelector.generatePropertyPanelHeader(
                        PropertyPanelType.Pod,
                        propertyPanelData[PodPropertyPanelInterpretedResponseKeyMap.PodName],
                        DisplayStrings.PodPropertyPanelHeaderSubtitle, this.props.selectedRow
                    )}
                    <div className='links'>
                        {viewContainerLiveEventsLogsLink}
                        {viewKubEventsLink}
                    </div>
                    {simplePropertyCollection}
                    <ExpandableSection
                        title={DisplayStrings.PodPropertyPanelLabelsExpandableSectionTitle}
                        content={labelSimplePropertyCollection}
                        expandIcon={<NestingIndicatorCollapsedSVG />}
                        collapseIcon={<NestingIndicatorExpandedSVG />}
                        telemetry={this.props.telemetry}
                        id={{ propertyPanelId: PropertyPanelType.Container, 
                            expandableSectionId: ExpandableSectionId.Labels }}
                    />
                    <ExpandableSection
                        title={DisplayStrings.PodPropertyPanelConatinerPerfExpandableSectionTitle}
                        content={containerPerfTables}
                        expandIcon={<NestingIndicatorCollapsedSVG />}
                        collapseIcon={<NestingIndicatorExpandedSVG />}
                        telemetry={this.props.telemetry}
                        id={{ propertyPanelId: PropertyPanelType.Container, 
                            expandableSectionId: ExpandableSectionId.ContainerLimitsAndRequests }}
                    />
                </div>
            );

        } catch (exc) {
            this.props.telemetry.logException(exc, 'PodPropertyPanel', ErrorSeverity.Error, null, null);
            return null;
        }
    }
}
