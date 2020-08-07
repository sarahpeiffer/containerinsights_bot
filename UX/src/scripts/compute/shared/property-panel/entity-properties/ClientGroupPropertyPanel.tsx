/** block / third party */
import * as React from 'react';
/**
 * shared
 */
import { DisplayStrings } from '../../../../shared/DisplayStrings';
import { ClientServerGroupLogoSVG } from '../../../../shared/svg/client-server-group-logo';
import { SimplePropertyCollection } from '../../../../shared/property-panel/SimplePropertyCollection';
import { PropertyPanelHeaderSection } from '../../../../shared/property-panel/PropertyPanelHeaderSection';
import { ISimplePropertyProps } from '../../../../shared/property-panel/SimpleProperty';

/**
 * compute imports
 */
import { MapEntityUtility as mapUtility } from './MapEntityUtility';

/**
 * adaptor to translate DependencyMap Entity's properties
 */
class ClientGroupPropertyPanelAdaptor {
    clientGroup: DependencyMap.ClientGroup;
    constructor(mapClientGroup: DependencyMap.ClientGroup) {
        this.clientGroup = mapClientGroup || {} as any;
    }
    getIcon(): JSX.Element {
        return <ClientServerGroupLogoSVG />
    }
    getTitle(): string {
        return this.clientGroup.displayName || DisplayStrings.undefine;
    }
    getSubTitle(): string {
        return DisplayStrings.ClientGroupSubTitle;
    }
    getProperties(): ISimplePropertyProps[] {
        const bodyList: ISimplePropertyProps[] = [];
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.Description, [DisplayStrings.ClientGroupExplanation]));
        const machines = mapUtility.get(this.clientGroup.members);

        let results = [];
        if (machines && machines.length > 0) {
            for (let machine of machines) {
                if (!machine) {
                    continue;
                }
                let str = machine.ipAddress || DisplayStrings.undefine;
                if (machine.portNumber) {
                    str += ' (' + machine.portNumber + ')';
                }

                results.push(str);
            }
        }
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.IPAddressAndPortNumber, results));

        return bodyList;
    }
}

/** 
 * Properties of the component below
*/
interface IClientGroupPropertyPanelProps {
    clientGroup: DependencyMap.ClientGroup;
}

/**
 * A component to visualize the properties of a a ClientGroup
 * @param props Visualization properties
 */
export class ClientGroupPropertyPanel extends React.Component<IClientGroupPropertyPanelProps> {

    constructor(props?: IClientGroupPropertyPanelProps) {
        super(props);
    }

    public render() {
        let clientGroup = new ClientGroupPropertyPanelAdaptor(this.props.clientGroup);
        return (<>
            <PropertyPanelHeaderSection
                icon={clientGroup.getIcon()}
                title={clientGroup.getTitle()}
                subTitle={clientGroup.getSubTitle()} />
            <SimplePropertyCollection properties={clientGroup.getProperties()} />
        </>);
    }
}
