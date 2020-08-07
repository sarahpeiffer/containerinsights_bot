
/**
 * tpl
 */
import * as React from 'react';

/**
 * shared
 */
import { DisplayStrings } from '../DisplayStrings';

/**
 * styles
 */
import '../../../styles/shared/PropertyPanel.less';

/**
 * svg
 */
import { VmSvg } from '../svg/vm';
import { ContainerSVG } from '../svg/container';
import { PodSVG } from '../svg/pod';
import { ControllerResourceSVG } from '../svg/controller-resource';
import { IPropertyPanelNavigationProps, SingleClusterTab } from '../../container/ContainerMainPage';
import { VirtualKubeSvg } from '../svg/virtualKube';
import { VirtualPodSvg } from '../svg/virtualPod';
import { VirtualContainerSvg } from '../svg/virtualContainer';

/**
 * local?
 */
import { ContainerPropertyPanel } from '../../container/grids/shared/property-panel/ContainerPropertyPanel';
import { PodPropertyPanel } from '../../container/grids/shared/property-panel/PodPropertyPanel';
import { ControllerPropertyPanel } from '../../container/grids/shared/property-panel/ControllerPropertyPanel';
import { NodePropertyPanel, OperatingSystem } from '../../container/grids/shared/property-panel/NodePropertyPanel';
import { PropertyPanelType } from '../../container/data-provider/KustoPropertyPanelResponseInterpreter';
import { PropertyPanelHeaderSection } from './PropertyPanelHeaderSection';
import { RequiredLoggingInfo } from '../RequiredLoggingInfo';
import { IGridLineObject } from '../GridLineObject';
import { NodeMetaData } from '../../container/shared/metadata/NodeMetaData';
import { IMetaDataBase } from '../../container/shared/metadata/Shared';
import { ContainerMetaData } from '../../container/shared/metadata/ContainerMetaData';
import { PodMetaData } from '../../container/shared/metadata/PodMetaData';
import { ITelemetry } from '../Telemetry';
import { IMessagingProvider } from '../MessagingProvider';
import { WindowsVMSVG } from '../svg/windows-vm';
import { LinuxVMSVG } from '../svg/linux-vm';


/**
 * enums
 */
export enum ObjectKind {
    Pod = 'Pod',
    ReplicaSet = 'ReplicaSet',
    Deployments = 'Deployments',
    Endpoints = 'Endpoints',
    DaemonSet = 'DaemonSet',
    Node = 'Node'
}


/**
 * This class is borrowed from compute where selectionContext roughly corresponds to propertyPanelData.
 * However, selctionContext is not interpreted a priori like propertyPanelData.
 * So, in compute, the selectionContext is interpreted here: the type of the entity in the selectionContext
 * is determined and from it this class determines which property panel needs to be constructed and rendered.
 * Because the form of the response for propertyPanelData can vary quite widely (at least for now),
 * I thought it would be prudent to interpret the response in the then block of the request and make the responses uniform,
 * and thus predicatable.
 * Just for now, this class is expecting to take propertyPanelData for a resource type and it will do the necessary work to 
 * transform and return it as a UX component, ready to be rendered.
 */
export class PropertyPanelSelector {
    /**
     * Gets the property panel depending on type of propertyPanelInterpretedResponse { type: -, data: - }
     * @param propertyPanelInterpretedResponse Interpreted response for the query for property panel data
     * @param navigationProps navigation filter selections
     * @param messagingProvider the messaging provider for our application to message back to monext
     * @param showLiveLogs boolean deciding if we're showing the live logs link (hidden for AKS-engiene clusters)
     * @param rowData gridline object containing metadata information about the particular row
     * @param selectedTab current selected tab (Node/Controller...)
     * @param telemetry telemetry provider so that we can log it
     * @param onConsoleOpen opens the console when the view live data button is clicked
     */
    public static getPropertyPanelforSelection(
        propertyPanelInterpretedResponse: any, // nib: This has to remain any for now because Typescript comiler complains otherwise...
        navigationProps: IPropertyPanelNavigationProps,
        messagingProvider: IMessagingProvider,
        showLiveLogs: boolean,
        rowData: IGridLineObject<IMetaDataBase>,
        selectedTab: SingleClusterTab,
        telemetry: ITelemetry,
        onConsoleOpen: (information: RequiredLoggingInfo) => void
    ): JSX.Element {
        if (propertyPanelInterpretedResponse === null) { // Error state
            return (
                <div className='center-flex column-flex'>
                    <div>
                        <h2>{DisplayStrings.DataRetrievalError}</h2>
                    </div>
                </div>
            )
        }
        if (propertyPanelInterpretedResponse.type === PropertyPanelType.Unsupported) { // Unsupported state
            return (
                <div className='property-panel-unsupported-msg center-flex column-flex center-text'>
                    <div>
                        <h2>{DisplayStrings.PropertyPanelRowUnsupportedMessage}</h2>
                    </div>
                </div>
            )
        } else if (propertyPanelInterpretedResponse.type === undefined) { // Default state, i.e. no row has been selected
            return <div className='property-panel-default-msg'></div>;
        }
        let propertyPanelType: PropertyPanelType = propertyPanelInterpretedResponse.type;
        let propertyPanel: JSX.Element;
        switch (propertyPanelType) {
            case PropertyPanelType.Container:
                const castedContainerRow = rowData as IGridLineObject<ContainerMetaData>;
                propertyPanel =
                    <ContainerPropertyPanel
                        propertyPanelData={propertyPanelInterpretedResponse.data}
                        navigationProps={navigationProps}
                        messageProvider={messagingProvider}
                        showLiveLogs={showLiveLogs}
                        onConsoleOpen={onConsoleOpen}
                        selectedRow={castedContainerRow}
                        selectedTab={selectedTab}
                        telemetry={telemetry}
                    />
                break;
            case PropertyPanelType.Pod:
                const castedPodRow = rowData as IGridLineObject<PodMetaData>;
                propertyPanel =
                    <PodPropertyPanel
                        propertyPanelData={propertyPanelInterpretedResponse.data}
                        navigationProps={navigationProps}
                        messageProvider={messagingProvider}
                        showLiveLogs={showLiveLogs}
                        onConsoleOpen={onConsoleOpen}
                        selectedRow={castedPodRow}
                        selectedTab={selectedTab}
                        telemetry={telemetry}
                    />
                break;
            case PropertyPanelType.Controller:
                propertyPanel =
                    <ControllerPropertyPanel
                        propertyPanelData={propertyPanelInterpretedResponse.data}
                        navigationProps={navigationProps}
                        messageProvider={messagingProvider}
                        showLiveLogs={showLiveLogs}
                        onConsoleOpen={onConsoleOpen}
                        selectedTab={selectedTab}
                        telemetry={telemetry}
                    />
                break;
            case PropertyPanelType.Node:
                const castedNodeRow = rowData as IGridLineObject<NodeMetaData>;
                propertyPanel =
                    <NodePropertyPanel
                        propertyPanelData={propertyPanelInterpretedResponse.data}
                        navigationProps={navigationProps}
                        messageProvider={messagingProvider}
                        showLiveLogs={showLiveLogs}
                        onConsoleOpen={onConsoleOpen}
                        selectedRow={castedNodeRow}
                        selectedTab={selectedTab}
                        telemetry={telemetry}
                    />
                break;
            default:
                throw new Error('Property panel type is unknown');
        }

        return propertyPanel;
    }

    // TODO: Taken from MapUtility
    public static getTextGridCell(text: string) {
        return <span title={text}>{text}</span>;
    }

    public static generatePropertyPanelHeader(
        propertyPanelType: PropertyPanelType,
        title: string,
        subtitle: string,
        rowData: IGridLineObject<IMetaDataBase>
    ): JSX.Element {
        let svg: JSX.Element;
        switch (propertyPanelType) {
            case PropertyPanelType.Container:
                const castedContainerRow = rowData as IGridLineObject<ContainerMetaData>;
                if (castedContainerRow.metaData.isVirtual) {
                    svg = <VirtualContainerSvg />;
                } else {
                    svg = <ContainerSVG />;
                }
                break;
            case PropertyPanelType.Pod:
                const castedPodRow = rowData as IGridLineObject<PodMetaData>;
                if (castedPodRow.metaData.isVirtual) {
                    svg = <VirtualPodSvg />;
                } else {
                    svg = <PodSVG />;
                }
                break;
            case PropertyPanelType.Controller:
                svg = <ControllerResourceSVG />
                break;
            case PropertyPanelType.Node:
                const castedNodeRow = rowData as IGridLineObject<NodeMetaData>;
                let labels: StringMap<string> = castedNodeRow.metaData.labels;
                if (!labels || (typeof(labels) !== 'object')) { labels = {}; } 
                const os: string = labels.hasOwnProperty('beta.kubernetes.io/os') ? labels['beta.kubernetes.io/os'] : '';
                const lowerOS: string = os.toLocaleLowerCase();
                if (castedNodeRow.metaData.isVirtual) {
                    svg = <VirtualKubeSvg />;
                } else if (lowerOS === OperatingSystem.Windows) {
                    svg = <WindowsVMSVG/>
                } else if (lowerOS === OperatingSystem.Linux) {                
                    svg = <LinuxVMSVG/>
                } else {
                    svg = <VmSvg />;
                }
                break;
            default:
                svg = <div></div>;
        }
        return (
            <PropertyPanelHeaderSection
                title={title}
                subTitle={subtitle}
                icon={svg}
            />
        );
    }

    public static arrayWrapper(item) {
        if (!Array.isArray(item)) {
            return [item];
        } else {
            return item;
        }
    }

    /**
     * Temporary hack workaround because INavigationProps are being created during render time
     * meaning there is no way to prevent React from re-rendering and closing menu options (each render will
     * result in a new navigation prop) but navigation props can change too... temporarily shim this until the
     * design can be reworked.
     * @param left left side of comparison
     * @param right right side of comparison
     */
    public static navigationAreEqual(left: IPropertyPanelNavigationProps, right: IPropertyPanelNavigationProps) {
        if (left.clusterResourceId !== right.clusterResourceId) {
            return false;
        }

        if (left.endDateTimeUtc !== right.endDateTimeUtc) {
            return false;
        }

        if (left.hostName !== right.hostName) {
            return false;
        }

        if (left.messagingProvider !== right.messagingProvider) {
            return false;
        }

        if (left.startDateTimeUtc !== right.startDateTimeUtc) {
            return false;
        }

        if (left.workspaceId !== right.workspaceId) {
            return false;
        }
        return true;
    }
}
