/** block / third party */
import * as React from 'react';
/**
 * shared
 */
import { DisplayStrings } from '../../../../shared/DisplayStrings';
import { ProcessLogoSVG } from '../../../../shared/svg/process-logo';
import { SimplePropertyCollection } from '../../../../shared/property-panel/SimplePropertyCollection';
import { PropertyPanelHeaderSection } from '../../../../shared/property-panel/PropertyPanelHeaderSection';
import { ISimplePropertyProps } from '../../../../shared/property-panel/SimpleProperty';

/**
 * compute imports
 */
import { MapEntityUtility as mapUtility } from './MapEntityUtility';
/** 
 * Properties of the component below
*/
interface IProcessGroupPropertyPanelProps {
    processGroup: DependencyMap.ProcessGroup;
}

/**
 * adaptor used to translate DependencyMap.ProcessGroup
 */
class ProcessGroupPropertyPanelAdaptor {
    processGroup: DependencyMap.ProcessGroup;
    constructor(mapProcessGroup: DependencyMap.ProcessGroup) {
        this.processGroup = mapProcessGroup || {} as any;
    }
    getIcon(): JSX.Element {
        return <ProcessLogoSVG />
    }
    getTitle(): string {
        return this.processGroup.displayName || DisplayStrings.undefine;
    }
    getSubTitle(): string {
        return DisplayStrings.ProcessGroupSubTitle;
    }
    getProperties(): ISimplePropertyProps[] {
        const bodyList: ISimplePropertyProps[] = [];

        const processes = mapUtility.get(this.processGroup.processes);

        if (mapUtility.hasMap(processes)) {
            mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.Processes, processes.map((obj) => { return obj.displayName; })));
        }

        return bodyList;
    }

}

/**
 * A component to visualize the properties of a a ProcessGroup
 * @param props Visualization properties
 */
export class ProcessGroupPropertyPanel extends React.Component<IProcessGroupPropertyPanelProps> {
    constructor(props?: IProcessGroupPropertyPanelProps) {
        super(props);
    }

    public render() {
        let processGroup = new ProcessGroupPropertyPanelAdaptor(this.props.processGroup);
        return (<>
            <PropertyPanelHeaderSection
                icon={processGroup.getIcon()}
                title={processGroup.getTitle()}
                subTitle={processGroup.getSubTitle()} />
            <SimplePropertyCollection properties={processGroup.getProperties()} />
        </>);
    }
}
