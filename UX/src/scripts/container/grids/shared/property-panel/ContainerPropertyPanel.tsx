/** tpl */
import * as React from 'react';
import { DisplayStrings } from '../../../../shared/DisplayStrings';

/** local */
import {
    IPropertyPanelContainerInterpretedResponse,
    ContainerPropertyPanelInterpretedResponseKeyMap,
    ContainerPropertyPanelKustoResponseColumnNamesToPropertyPanelPropertyTitleNamesMap,
    PropertyPanelType
} from '../../../data-provider/KustoPropertyPanelResponseInterpreter';
import { IPropertyPanelNavigationProps, SingleClusterTab } from '../../../ContainerMainPage';
import { ContainerGridBase, PropertyPanelLinkType } from '../ContainerGridBase';

/** shared */
import { PropertyPanelSelector } from '../../../../shared/property-panel/PropertyPanelSelector';
import { ISimplePropertyProps } from '../../../../shared/property-panel/SimpleProperty';
import { SimplePropertyCollection } from '../../../../shared/property-panel/SimplePropertyCollection';
import { TabularProperty } from '../../../../shared/property-panel/TabularProperty';
import { ExpandableSection, ExpandableSectionId } from '../../../../shared/property-panel/ExpandableSection';
import { RequiredLoggingInfo } from '../../../../shared/RequiredLoggingInfo';
import { IGridLineObject } from '../../../../shared/GridLineObject';
import { ContainerMetaData } from '../../../shared/metadata/ContainerMetaData';
import { StringHelpers } from '../../../../shared/Utilities/StringHelpers';
import { MetricValueFormatter } from '../../../../shared/MetricValueFormatter';

/** svgs */
import { NestingIndicatorCollapsedSVG } from '../../../../shared/svg/nesting-indicator-collapsed';
import { NestingIndicatorExpandedSVG } from '../../../../shared/svg/nesting-indicator-expanded';
import { ITelemetry } from '../../../../shared/Telemetry';
import { ErrorSeverity } from '../../../../shared/data-provider/TelemetryErrorSeverity';
import { IMessagingProvider } from '../../../../shared/MessagingProvider';

/** props and state interfaces */
interface IContainerPropertyPanelProps {
    propertyPanelData: IPropertyPanelContainerInterpretedResponse;
    navigationProps: IPropertyPanelNavigationProps;
    messageProvider: IMessagingProvider;
    showLiveLogs: boolean;
    selectedRow: IGridLineObject<ContainerMetaData>;
    onConsoleOpen: (information: RequiredLoggingInfo) => void;
    selectedTab?: SingleClusterTab;

    telemetry: ITelemetry;
}

/** Constructs the container property panel */
export class ContainerPropertyPanel extends React.Component<IContainerPropertyPanelProps, any> {

    public shouldComponentUpdate(nextProps: IContainerPropertyPanelProps, nextState: any): boolean {
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
                if (propertyPanelData.hasOwnProperty(field)) {
                    if (field === ContainerPropertyPanelInterpretedResponseKeyMap.EnvironmentVar) {
                        continue;
                    }

                    // wrap field in array if it isn't in one already
                    propertyPanelData[field] = PropertyPanelSelector.arrayWrapper(propertyPanelData[field]);

                    const finalField = ContainerPropertyPanelKustoResponseColumnNamesToPropertyPanelPropertyTitleNamesMap[field];

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


            const simplePropertyCollection = <SimplePropertyCollection properties={simpleProperties} />;

            // Make table out of environment variables
            const envVars: StringMap<string> = propertyPanelData[ContainerPropertyPanelInterpretedResponseKeyMap.EnvironmentVar];
            const envVarsTableData: JSX.Element[][] = [];
            for (let envVarKey in envVars) {
                if (envVars.hasOwnProperty(envVarKey)) {
                    let envVarValue: string = envVars[envVarKey];
                    let emptyCell: JSX.Element = PropertyPanelSelector.getTextGridCell('');
                    let envVarRow: JSX.Element[] = [emptyCell, emptyCell];
                    if (envVarKey) {
                        envVarRow[0] = PropertyPanelSelector.getTextGridCell(envVarKey);
                    }
                    if (envVarValue) {
                        envVarRow[1] = PropertyPanelSelector.getTextGridCell(envVarValue);
                    }
                    envVarsTableData.push(envVarRow);
                }
            }

            let envVarTable: JSX.Element =
                <div className='env-var-tabular-property'>
                    <TabularProperty
                        propertyName={''}
                        columnNames={[
                            DisplayStrings.ContainerPropertyPanelEnvVarTableEnvVarColHeader,
                            DisplayStrings.ContainerPropertyPanelEnvVarTableValueColHeader
                        ]}
                        tabularValues={envVarsTableData}
                        onRowSelected={() => { }}
                    />
                </div>;

            // Create viewContainerEventsLogs link
            const containerInstance = propertyPanelData[ContainerPropertyPanelInterpretedResponseKeyMap.containerNameWithPodUID];
            const viewContainerEventsLogsLink = ContainerGridBase.getLink(
                PropertyPanelLinkType.ContainerEventsLogs,
                containerInstance,
                navigationProps,
                this.props.messageProvider,
                this.props.selectedTab.toString()
            );

            // Create viewContainerLiveEventsLogs link
            const metaData = propertyPanelData[ContainerPropertyPanelInterpretedResponseKeyMap.metaData];
            const viewContainerLiveEventsLogsLink = ContainerGridBase.getContainerLiveLogsLink(
                metaData,
                showLiveLogs,
                onConsoleOpen,
                this.props.selectedTab.toString(),
                'ContainerPropertyPanel'
            );

            return (
                <div>
                    {PropertyPanelSelector.generatePropertyPanelHeader(
                        PropertyPanelType.Container,
                        propertyPanelData[ContainerPropertyPanelInterpretedResponseKeyMap.ContainerName],
                        DisplayStrings.ContainerPropertyPanelHeaderSubtitle, this.props.selectedRow)}
                    <div className='links'>
                        {viewContainerLiveEventsLogsLink}
                        {viewContainerEventsLogsLink}
                    </div>
                    {simplePropertyCollection}
                    <ExpandableSection
                        title={DisplayStrings.ContainerPropertyPanelEnviromentVarExpandableSectionTitle}
                        content={envVarTable}
                        expandIcon={<NestingIndicatorCollapsedSVG />}
                        collapseIcon={<NestingIndicatorExpandedSVG />}
                        telemetry={this.props.telemetry}
                        id={{ propertyPanelId: PropertyPanelType.Container, 
                            expandableSectionId: ExpandableSectionId.EnvironmentVariables }}
                    />
                </div>
            );

        } catch (exc) {
            this.props.telemetry.logException(exc, 'ContainerPropertyPanel', ErrorSeverity.Error, null, null);
            return null;
        }
    }
}
