import * as React from 'react';

/**
 * shared
 */
import { MachineLogoSVG } from '../../../../shared/svg/machine-log';
import { ChevronDownSvg } from '../../../../shared/svg/chevron-down';
import { ChevronRightSvg } from '../../../../shared/svg/chevron-right';
import { DisplayStrings } from '../../../../shared/DisplayStrings';
import { PropertyPanelHeaderSection } from '../../../../shared/property-panel/PropertyPanelHeaderSection';
import { SimpleProperty } from '../../../../shared/property-panel/SimpleProperty';
import { ExpandableSection2 } from '../../../../shared/property-panel/ExpandableSection2';

/**
 * local component
 */
import { ConnectionTable } from '../component/ConnectionTable';
import { HyperLink } from '../component/HyperLink';

/**
 * local
 */
import { ServerMemberMachinePropertyPanelAdaptor } from './map-entity-adaptor/ServerMemberMachinePropertyPanelAdaptor'


/** 
 * Properties of the component below
*/
interface IServerMemberMachineProps {
    memberMachine: DependencyMap.ClientGroupMemberMachine;
    onMemberMachineConnectionSelected: (selectedConnection: DependencyMap.Connection) => void;
}

/**
 * A component to visualize the properties of a a ClientGroupMemberMachine
 * @param props Visualization properties
 */
export class UnmonitoredServerMemberMachinePropertyPanel extends React.Component<IServerMemberMachineProps> {
    constructor(props?: IServerMemberMachineProps) {
        super(props);
    }

    public render() {
        let panelContent = [];
        const memberMachine = new ServerMemberMachinePropertyPanelAdaptor(this.props.memberMachine);
        const connectionTableData = memberMachine.getConnectionInfos();
        if (connectionTableData) {
            panelContent.push(<ExpandableSection2
                title={DisplayStrings.TCPInbounds}
                content={<>
                    <SimpleProperty
                        propertyName={DisplayStrings.destinationPort}
                        propertyValues={[memberMachine.getDestinationName()]}
                    />
                    <SimpleProperty
                        propertyName={DisplayStrings.IPv4}
                        propertyValues={memberMachine.getIpv4Address()}
                    />
                    <ConnectionTable
                        columnNames={[DisplayStrings.sourceMachineName, DisplayStrings.sourceProcess, DisplayStrings.status]}
                        tableData={connectionTableData}
                        onMemberMachineConnectionSelected={this.props.onMemberMachineConnectionSelected} />
                </>}
                expandIcon={<ChevronRightSvg />}
                collapseIcon={<ChevronDownSvg />}
                isExpanded={true}
            />)
        }
        return (<>
            <PropertyPanelHeaderSection
                icon={<MachineLogoSVG />}
                title={this.props.memberMachine.displayName || DisplayStrings.undefine}
                subTitle={DisplayStrings.MachineSubTitle} />

            <SimpleProperty propertyName={DisplayStrings.MachineNotMonitored}
                propertyValues={[DisplayStrings.UnmonitoredMachineMessage]} />

            <HyperLink linkUrl={'https://aka.ms/vminsightsinstall'} displayString={DisplayStrings.LearnMoreInstall} />

            {panelContent}
        </>);
    }
}
