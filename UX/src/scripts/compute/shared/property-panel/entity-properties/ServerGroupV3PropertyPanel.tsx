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
 * Adaptor used to translate the DependencyMap.ServerGroupViewModelV3
 */
class ServerGroupV3PropertyPanelAdaptor {
    serverGroup: DependencyMap.ServerGroupViewModelV3;
    constructor(mapServerGroup: DependencyMap.ServerGroupViewModelV3) {
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

        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.Description, [DisplayStrings.ServerGroupDescriptionV3]));

        if (this.serverGroup.getDiscoveredMemberCount && this.serverGroup.getMonitoredMemberCount) {
            mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.Totals, [
                this.serverGroup.getMonitoredMemberCount() + ' ' + DisplayStrings.monitoredServer,
                this.serverGroup.getDiscoveredMemberCount() + ' ' + DisplayStrings.unmonitoredIP
            ]));
        }

        return bodyList;
    }
}

/** 
 * Properties of the component below
*/
interface IServerGroupV3PropertyPanelProps {
    serverGroupV3: DependencyMap.ServerGroupViewModelV3;
}

export class ServerGroupV3PropertyPanel extends React.Component<IServerGroupV3PropertyPanelProps> {

    constructor(props?: IServerGroupV3PropertyPanelProps) {
        super(props);
    }

    public render() {
        let serverGroupV3 = new ServerGroupV3PropertyPanelAdaptor(this.props.serverGroupV3);

        return (<>
            <PropertyPanelHeaderSection
                icon={serverGroupV3.getIcon()}
                title={serverGroupV3.getTitle()}
                subTitle={serverGroupV3.getSubTitle()} />
            <SimplePropertyCollection properties={serverGroupV3.getProperties()} />
        </>);
    }
}
