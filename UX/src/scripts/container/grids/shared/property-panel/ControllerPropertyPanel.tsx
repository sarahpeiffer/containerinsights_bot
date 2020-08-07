/**
 * tpl
 */
import * as React from 'react';

/**
 * local
 */
import {
    PropertyPanelType,
    IPropertyPanelControllerInterpretedResponse,
    ControllerPropertyPanelKustoResponseColumnNamesToPropertyPanelPropertyTitleNamesMap,
    ControllerPropertyPanelInterpretedResponseKeyMap
} from '../../../data-provider/KustoPropertyPanelResponseInterpreter';
import { IPropertyPanelNavigationProps, SingleClusterTab } from '../../../ContainerMainPage';
import { ContainerGridBase, PropertyPanelLinkType } from '../ContainerGridBase';

/**
 * shared
 */
import { DisplayStrings } from '../../../../shared/DisplayStrings';
import { ISimplePropertyProps } from '../../../../shared/property-panel/SimpleProperty';
import { SimplePropertyCollection } from '../../../../shared/property-panel/SimplePropertyCollection';
import { PropertyPanelSelector, ObjectKind } from '../../../../shared/property-panel/PropertyPanelSelector';
import { ITelemetry } from '../../../../shared/Telemetry';
import { ErrorSeverity } from '../../../../shared/data-provider/TelemetryErrorSeverity';
import { IMessagingProvider } from '../../../../shared/MessagingProvider';
import { RequiredLoggingInfo } from '../../../../shared/RequiredLoggingInfo';

/**
 * props and state interfaces
 */
interface IControllerPropertyPanelProps {
    propertyPanelData: IPropertyPanelControllerInterpretedResponse;
    navigationProps: IPropertyPanelNavigationProps;
    messageProvider: IMessagingProvider;
    
    showLiveLogs: boolean;
    onConsoleOpen: (information: RequiredLoggingInfo) => void;
    selectedTab: SingleClusterTab;
    telemetry: ITelemetry;
}

/**
 * Constructs the controllerdone property panel
 * @param propertyPanelData data used to populate the various fields of the property panel
 * @param navigationProps data used to make the links present in the property panel functional
 */
export class ControllerPropertyPanel extends React.Component<IControllerPropertyPanelProps, any> {

    public shouldComponentUpdate(nextProps: IControllerPropertyPanelProps, nextState: any): boolean {
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
                    // wrap field in array if it isn't in one already
                    propertyPanelData[field] = PropertyPanelSelector.arrayWrapper(propertyPanelData[field]);

                    const finalField = ControllerPropertyPanelKustoResponseColumnNamesToPropertyPanelPropertyTitleNamesMap[field];

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
            const simplePropertyCollection = <SimplePropertyCollection properties={simpleProperties} />

            // Create viewKubEvents link
            const controllerName = propertyPanelData[ControllerPropertyPanelInterpretedResponseKeyMap.ControllerName];
            let controllerKind: string = propertyPanelData[ControllerPropertyPanelInterpretedResponseKeyMap.ControllerKind];
            let objectKind: ObjectKind = ObjectKind[controllerKind];

            const viewKubEventsLink = ContainerGridBase.getLink(
                PropertyPanelLinkType.KubEventsLog,
                controllerName,
                navigationProps,
                this.props.messageProvider,
                this.props.selectedTab.toString(),
                objectKind
            );

            const metaData = propertyPanelData[ControllerPropertyPanelInterpretedResponseKeyMap.metaData];
            const viewContainerLiveEventsLogsLink = ContainerGridBase.getContainerLiveLogsLink(
                metaData,
                showLiveLogs,
                onConsoleOpen,
                this.props.selectedTab.toString(),
                'ControllerPropertyPanel'
            );

            return (
                <div>
                    {PropertyPanelSelector.generatePropertyPanelHeader(
                        PropertyPanelType.Controller,
                        propertyPanelData[ControllerPropertyPanelInterpretedResponseKeyMap.ControllerName],
                        DisplayStrings.ControllerPropertyPanelHeaderSubtitle, null
                    )}
                    <div className='links'>
                        {viewContainerLiveEventsLogsLink}
                        {viewKubEventsLink}
                    </div>
                    {simplePropertyCollection}
                </div>
            );

        } catch (exc) {
            this.props.telemetry.logException(exc, 'ControllerPropertyPanel', ErrorSeverity.Error, null, null);
            return null;
        }
    }
}
