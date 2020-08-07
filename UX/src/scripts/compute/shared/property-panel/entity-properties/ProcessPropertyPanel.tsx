/** block / third party */
import * as React from 'react';

/** shared */
import { DisplayStrings } from '../../../../shared/DisplayStrings';
import { ProcessLogoSVG } from '../../../../shared/svg/process-logo';
import { SimplePropertyCollection } from '../../../../shared/property-panel/SimplePropertyCollection';
import { PropertyPanelHeaderSection } from '../../../../shared/property-panel/PropertyPanelHeaderSection';
import { ISimplePropertyProps } from '../../../../shared/property-panel/SimpleProperty';

/** compute */
import { MapEntityUtility as mapUtility } from './MapEntityUtility';

/**
 * Adaptor used to translate the DependencyMap.Process
 */
class ProcessPropertyPanelAdaptor {
    process: DependencyMap.Process;
    constructor(mapProcess: DependencyMap.Process) {
        this.process = mapProcess || {} as any;
    }
    public getIcon(): JSX.Element {
        return <ProcessLogoSVG />
    }
    public getTitle(): string {
        return this.process.displayName || DisplayStrings.undefine;
    }
    public getSubTitle(): string {
        return DisplayStrings.ProcessSubTitle;
    }

    public getProperties(): ISimplePropertyProps[] {
        let process = this.process;
        const bodyList: ISimplePropertyProps[] = [];

        const details = mapUtility.get(process.details);
        const user = mapUtility.get(process.user);

        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.DisplayName, [process.displayName]));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.ExecutableName, [process.executableName]));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.Description, [details.description]));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.Username, [user.userName]));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.CompanyName, [details.companyName]));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.ProductName, [details.productName]));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.ProductVersion, [details.productVersion]));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.StartTime, [process.startTime]));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.WorkingDirectory, [details.workingDirectory]));
        mapUtility.push(bodyList, mapUtility.entityProp(DisplayStrings.UserDomain, [user.userDomain]));

        return bodyList;
    }
}

/** 
 * Properties of the component below
*/
interface IProcessPropertiesPanelProps {
    process: DependencyMap.Process;
}

/**
 * A component to visualize the properties of a a Process
 * @param props Visualization properties
 */
export class ProcessPropertyPanel extends React.Component<IProcessPropertiesPanelProps> {
    constructor(props?: IProcessPropertiesPanelProps) {
        super(props);
    }
    public render() {
        const process = new ProcessPropertyPanelAdaptor(this.props.process);
        const content: JSX.Element[] = [];
        if (this.props.process && this.props.process.details && this.props.process.details.commandLine) {
            content.push(<>
                <div className='simple-property' tabIndex={0}>{DisplayStrings.CommandLine}</div>
                <input type='text' read-only='readonly' value={this.props.process.details.commandLine} role='presentation' />
            </>);
        }

        return (<>
            <PropertyPanelHeaderSection
                icon={process.getIcon()}
                title={process.getTitle()}
                subTitle={process.getSubTitle()} />
            <SimplePropertyCollection properties={process.getProperties()} />
            {content}
        </>);
    }
}
