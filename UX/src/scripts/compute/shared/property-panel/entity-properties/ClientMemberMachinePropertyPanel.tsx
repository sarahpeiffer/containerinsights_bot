/** block / third party */
import * as React from 'react';
/**
 * shared
 */
import { ChevronDownSvg } from '../../../../shared/svg/chevron-down';
import { ChevronRightSvg } from '../../../../shared/svg/chevron-right';
import { DisplayStrings } from '../../../../shared/DisplayStrings';
import { SimplePropertyCollection } from '../../../../shared/property-panel/SimplePropertyCollection';
import { PropertyPanelHeaderSection } from '../../../../shared/property-panel/PropertyPanelHeaderSection';
import { ExpandableSection2 } from '../../../../shared/property-panel/ExpandableSection2';
import { MessagingProvider } from '../../../../shared/MessagingProvider';

/**
 * local component
 */
import { ConnectionTable } from '../component/ConnectionTable';
import { FoldoutSimplePropertyCollection } from '../component/FoldoutSimplePropertyCollection';

/**
 * compute imports
 */
import { MapEntityUtility as mapUtility } from './MapEntityUtility';

/**
 * local
 */
import { MachinePropertyPanelAdaptor } from './map-entity-adaptor/MachinePropertyPanelAdaptor';
import { ClientMemberMachinePropertyPanelAdaptor } from './map-entity-adaptor/ClientMemberMachinePropertyPanelAdaptor'
import { ITelemetry } from '../../../../shared/Telemetry';


/** 
 * Properties of the component below
*/
interface IClientMemberMachineProps {
    memberMachine: DependencyMap.ClientGroupMemberMachine;
    onMemberMachineConnectionSelected: (selectedConnection: DependencyMap.Connection) => void;
    logPrefix?: string;
    telemetry?: ITelemetry;
    messagingProvider?: MessagingProvider;
}

/**
 * A component to visualize the properties of a a ClientGroupMemberMachine
 * @param props Visualization properties
 */
export class ClientMemberMachinePropertyPanel extends React.Component<IClientMemberMachineProps> {
    constructor(props?: IClientMemberMachineProps) {
        super(props);
    }

    public render() {
        let machine = new MachinePropertyPanelAdaptor(this.props.telemetry, this.props.memberMachine.machine, this.props.messagingProvider);
        const memberMachine = new ClientMemberMachinePropertyPanelAdaptor(this.props.memberMachine);

        let panelContent: JSX.Element[] = [];
        panelContent.push(<FoldoutSimplePropertyCollection
            properties={machine.getProperties()}
            propertiesShownInitiallyCount={mapUtility.defaultPropertiesShowingNumber}
            telemetry={this.props.telemetry}
            enableCopyToClipboard={true}
            logPrefix={`${this.props.logPrefix}.ClientMemberMachinePropertyPanel`} />);
        let azureVMProperties = machine.getAzureVMProperties();
        if (azureVMProperties) {
            panelContent.push(<ExpandableSection2
                title={DisplayStrings.AzureVmProperty}
                content={<SimplePropertyCollection 
                    properties={azureVMProperties}
                    enableCopyToClipboard={true}
                    telemetry={this.props.telemetry}
                    logPrefix={`${this.props.logPrefix}.ClientMemberMachinePropertyPanel`} />}
                expandIcon={<ChevronRightSvg />}
                collapseIcon={<ChevronDownSvg />}
            />);
        }
        let scaleSetProperties = machine.getVMScaleSetProperties();
        if (scaleSetProperties) {
            panelContent.push(<ExpandableSection2
                title={DisplayStrings.AzureScaleSetProperties}
                content={<SimplePropertyCollection 
                    properties={scaleSetProperties}
                    enableCopyToClipboard={true}
                    telemetry={this.props.telemetry}
                    logPrefix={`${this.props.logPrefix}.ClientMemberMachinePropertyPanel`} />}
                expandIcon={<ChevronRightSvg />}
                collapseIcon={<ChevronDownSvg />}
            />);
        }

        const connectionTableData = memberMachine.getConnectionInfos();
        if (connectionTableData) {
            panelContent.push(<ExpandableSection2
                title={DisplayStrings.TCPOutbounds}
                content={<ConnectionTable
                    columnNames={[DisplayStrings.source, DisplayStrings.destination, DisplayStrings.status]}
                    tableData={connectionTableData}
                    onMemberMachineConnectionSelected={this.props.onMemberMachineConnectionSelected} />}
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
