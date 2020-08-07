import * as React from 'react';
/**
 * shared
 */
import { DisplayStrings } from '../../../../shared/DisplayStrings';
import { ClientServerGroupLogoSVG } from '../../../../shared/svg/client-server-group-logo';
import { StringHelpers } from '../../../../shared/Utilities/StringHelpers';
import { SimplePropertyCollection } from '../../../../shared/property-panel/SimplePropertyCollection';
import { PropertyPanelHeaderSection } from '../../../../shared/property-panel/PropertyPanelHeaderSection';
import { ISimplePropertyProps } from '../../../../shared/property-panel/SimpleProperty';

/**
 * compute imports
 */
import { MapEntityUtility as mapUtility } from './MapEntityUtility';

/**
 * adaptor used to translate DependencyMap.ServerGroup
 */
class ServerGroupPropertyPanelAdaptor {
    serverGroup: DependencyMap.ServerGroup;
    constructor(mapServerGroup: DependencyMap.ServerGroup) {
        this.serverGroup = mapServerGroup || {} as any;
    }
    getIcon(): JSX.Element {
        return <ClientServerGroupLogoSVG />
    }
    getTitle(): string {
        return this.serverGroup.displayName || DisplayStrings.undefine;
    }
    getSubTitle(): string {
        return DisplayStrings.ServerGroupSubTitle;
    }
    getProperties(): ISimplePropertyProps[] {
        const bodyList: ISimplePropertyProps[] = [];

        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.Description, [DisplayStrings.ServerGroupDescription]));

        const machines = mapUtility.get(this.serverGroup.memberViewModels);

        let results = [];
        if (machines && machines.length > 0) {
            for (let machine of machines) {
                if (!machine || !machine.networking) {
                    continue;
                }

                let ipadress = DisplayStrings.undefine;
                if (machine.networking.ipv4Interfaces && machine.networking.ipv4Interfaces[0]) {
                    ipadress = machine.networking.ipv4Interfaces[0].ipAddress;
                }

                if (!machine.networking.dnsNames || !machine.networking.dnsNames[0]) {
                    results.push(ipadress);
                    continue;
                }

                const dnsName = machine.networking.dnsNames[0];

                results.push(StringHelpers.replaceAll(
                    StringHelpers.replaceAll(DisplayStrings.IPAddressDNSName, '{0}', ipadress),
                    '{1}', dnsName));
            }
        }
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.IPAddress, results));

        return bodyList;
    }

}

/** 
 * Properties of the component below
*/
interface IServerGroupPropertyPanelProps {
    serverGroup: DependencyMap.ServerGroup;
}

/**
 * A component to visualize the properties of a a ServerGroup
 * @param props Visualization properties
 */
export class ServerGroupPropertyPanel extends React.Component<IServerGroupPropertyPanelProps> {

    constructor(props?: IServerGroupPropertyPanelProps) {
        super(props);
    }

    public render() {
        let serverGroup = new ServerGroupPropertyPanelAdaptor(this.props.serverGroup);

        return (<>
            <PropertyPanelHeaderSection
                icon={serverGroup.getIcon()}
                title={serverGroup.getTitle()}
                subTitle={serverGroup.getSubTitle()} />
            <SimplePropertyCollection properties={serverGroup.getProperties()} />
        </>);
    }
}
