import * as React from 'react';
/**
 * shared
 */
import { ChevronDownSvg } from '../../../../shared/svg/chevron-down';
import { ChevronRightSvg } from '../../../../shared/svg/chevron-right';
import { DisplayStrings } from '../../../../shared/DisplayStrings';
import { SimplePropertyCollection } from '../../../../shared/property-panel/SimplePropertyCollection';
import { SimpleProperty } from '../../../../shared/property-panel/SimpleProperty';
import { PropertyPanelHeaderSection } from '../../../../shared/property-panel/PropertyPanelHeaderSection';
import { ExpandableSection2 } from '../../../../shared/property-panel/ExpandableSection2';
import { ITelemetry } from '../../../../shared/Telemetry';
import { MessagingProvider } from '../../../../shared/MessagingProvider';

/**
 * local component
 */
import { ConnectionTable } from '../component/ConnectionTable';
import { FoldoutSimplePropertyCollection } from '../component/FoldoutSimplePropertyCollection';

/**
 * local
 */
import { MachinePropertyPanelAdaptor } from './map-entity-adaptor/MachinePropertyPanelAdaptor'
import { ServerMemberMachinePropertyPanelAdaptor } from './map-entity-adaptor/ServerMemberMachinePropertyPanelAdaptor'

/**
 * compute imports
 */
import { MapEntityUtility as mapUtility } from './MapEntityUtility';



/** 
 * Properties of the component below
*/
interface IServerMemberMachineMachineProps {
    memberMachine: DependencyMap.ServerGroupMemberMachine;
    onMemberMachineConnectionSelected: (selectedConnection: DependencyMap.Connection) => void;
    logPrefix?: string;
    telemetry?: ITelemetry;
    messagingProvider?: MessagingProvider;
}

/**
 * A component to visualize the properties of a a ServerGroupMemberMachine
 * @param props Visualization properties
 */
export class ServerMemberMachineMachinePropertyPanel extends React.Component<IServerMemberMachineMachineProps> {
    constructor(props?: IServerMemberMachineMachineProps) {
        super(props);
    }

    public render() {
        const machine = new MachinePropertyPanelAdaptor(this.props.telemetry, this.props.memberMachine.machine, 
            this.props.messagingProvider);
        const memberMachine = new ServerMemberMachinePropertyPanelAdaptor(this.props.memberMachine);
        const panelContent: JSX.Element[] = [];
        panelContent.push(<FoldoutSimplePropertyCollection
            properties={machine.getProperties()}
            propertiesShownInitiallyCount={mapUtility.defaultPropertiesShowingNumber}
            telemetry={this.props.telemetry} 
            enableCopyToClipboard={true}
            logPrefix={`${this.props.logPrefix}.ServerMemberMachinePropertyPanel`} />);
        const azureVMProperties = machine.getAzureVMProperties();
        if (azureVMProperties) {
            panelContent.push(<ExpandableSection2
                title={DisplayStrings.AzureVmProperty}
                content={<SimplePropertyCollection 
                    properties={azureVMProperties} 
                    enableCopyToClipboard={true}
                    telemetry={this.props.telemetry}
                    logPrefix={`${this.props.logPrefix}.ServerMemberMachinePropertyPanel`} />}
                expandIcon={<ChevronRightSvg />}
                collapseIcon={<ChevronDownSvg />}
            />);
        }
        const scaleSetProperties = machine.getVMScaleSetProperties();
        if (scaleSetProperties) {
            panelContent.push(<ExpandableSection2
                title={DisplayStrings.AzureScaleSetProperties}
                content={<SimplePropertyCollection 
                    properties={scaleSetProperties} 
                    enableCopyToClipboard={true}
                    telemetry={this.props.telemetry}
                    logPrefix={`${this.props.logPrefix}.ServerMemberMachinePropertyPanel`} />}
                expandIcon={<ChevronRightSvg />}
                collapseIcon={<ChevronDownSvg />}
            />);
        }

        const connectionTableData = memberMachine.getConnectionInfos();
        if (connectionTableData) {
            panelContent.push(<ExpandableSection2
                title={DisplayStrings.TCPInbounds}
                content={<>
                    <SimpleProperty
                        propertyName={DisplayStrings.destinationProcess}
                        propertyValues={[memberMachine.getDestinationName()]}
                    />
                    <ConnectionTable
                        columnNames={[DisplayStrings.sourceMachineName, DisplayStrings.sourceProcess, DisplayStrings.status]}
                        tableData={connectionTableData}
                        onMemberMachineConnectionSelected={this.props.onMemberMachineConnectionSelected} />
                </>}
                expandIcon={<ChevronRightSvg />}
                collapseIcon={<ChevronDownSvg />}
            />)
        }

        return (<>
            <PropertyPanelHeaderSection
                icon={machine.getIcon()}
                title={machine.getTitle()}
                subTitle={machine.getSubTitle()}
            />
            {panelContent}
        </>);
    }
}
