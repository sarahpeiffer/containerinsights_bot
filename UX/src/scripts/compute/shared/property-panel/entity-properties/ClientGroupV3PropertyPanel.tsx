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
 * Adaptor to translate DependencyMap.ClientGroupViewModelV3's properties
 */
export class ClientGroupV3PropertyPanelAdaptor {
    clientGroup: DependencyMap.ClientGroupViewModelV3;
    constructor(mapClientGroup: DependencyMap.ClientGroupViewModelV3) {
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

        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.Description, [DisplayStrings.ClientGroupExplanationV3]));

        if (this.clientGroup.getDiscoveredMemberCount && this.clientGroup.getMonitoredMemberCount) {
            mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.Totals, [
                this.clientGroup.getMonitoredMemberCount() + ' ' + DisplayStrings.monitoredClient,
                this.clientGroup.getDiscoveredMemberCount() + ' ' + DisplayStrings.unmonitoredIP
            ]));
        }

        return bodyList;
    }
}

/** 
 * Properties of the component below
*/
interface IClientGroupV3PropertyPanelProps {
    clientGroupV3: DependencyMap.ClientGroupViewModelV3;
}

/**
 * A component to visualize the properties of a a ClientGroupViewModelV3
 * @param props Visualization properties
 */
export class ClientGroupV3PropertyPanel extends React.Component<IClientGroupV3PropertyPanelProps> {

    constructor(props?: IClientGroupV3PropertyPanelProps) {
        super(props);
    }

    public render() {
        let clientGroupV3 = new ClientGroupV3PropertyPanelAdaptor(this.props.clientGroupV3);

        return (<>
            <PropertyPanelHeaderSection
                icon={clientGroupV3.getIcon()}
                title={clientGroupV3.getTitle()}
                subTitle={clientGroupV3.getSubTitle()} />
            <SimplePropertyCollection properties={clientGroupV3.getProperties()} />
        </>);
    }
}
