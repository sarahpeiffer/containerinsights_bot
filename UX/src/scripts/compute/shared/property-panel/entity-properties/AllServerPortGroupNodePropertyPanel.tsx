/** block / third party */
import * as React from 'react';
import update = require('immutability-helper');
/**
 * shared
 */
import { DisplayStrings } from '../../../../shared/DisplayStrings';
import { ClientServerGroupLogoSVG } from '../../../../shared/svg/client-server-group-logo';
import { PropertyPanelHeaderSection } from '../../../../shared/property-panel/PropertyPanelHeaderSection';

/**
 * compute imports
 */
import { IPortDetails, CheckboxPropertiesTable } from '../../../../shared/property-panel/CheckboxProperty';
import { StringHelpers } from '../../../../shared/Utilities/StringHelpers';

/**
 * Styles
 */
import '../../../../../styles/shared/PropertyPanel.less';

/** 
 * Properties of the component below
*/
interface IAllServerPortsPropertyPanelProps {
    allPortsNode: DependencyMap.IAllServerPortGroupsVirtualNodeViewModel;
    onPortVisibilitySelectionChanged: (visiblePortIds: string[]) => void;
}

interface IAllServerPortsPropertyPanelState {
    searchFilter: string;
    allPortsSelectionStatus: StringMap<IPortDetails>;
}

/**
 * A component to visualize the properties of a a VirtulGroupNodeViewModel
 * @param props Visualization properties
 */
export class AllServerPortsPropertyPanel extends React.Component<IAllServerPortsPropertyPanelProps, IAllServerPortsPropertyPanelState> {

    constructor(props?: IAllServerPortsPropertyPanelProps) {
        super(props);
        this.onPortSelectionChanged = this.onPortSelectionChanged.bind(this);
        this.onApplyConfigButtonClicked = this.onApplyConfigButtonClicked.bind(this);
        let allPortsSelectionStatus: StringMap<IPortDetails> = {};
        for (let serverPortGroup of this.props.allPortsNode.allServerPortGroups) {
            // Below cache update is needed to populate all ports with its visibility status initially.
            let portValue: IPortDetails = {
                displayName: serverPortGroup.portNumber.toString(),
                checked: serverPortGroup.getGraphNodeVisibility(),
                onChange: this.onPortSelectionChanged,
                id: serverPortGroup.id,
                dependenciesCount: serverPortGroup.getTotalMemberCount()
            };
            allPortsSelectionStatus[serverPortGroup.id] = portValue;
        }
        this.state = {
            searchFilter: undefined,
            allPortsSelectionStatus: allPortsSelectionStatus
        };
    }

    public render() {
        let tableHeaders = [
            DisplayStrings.AllServerPortsPropertyName,
            'Dependencies'
        ];
        return (<>
            <PropertyPanelHeaderSection
                icon={this.getIcon()}
                title={this.getTitle()}
                subTitle={this.getSubTitle()} />

            <div className='search-bar'>
                <input id={'viewAllPortsSearchBar'} type='text'
                    className='search-bar-input'
                    aria-label={DisplayStrings.EnterPortToSearchFor}
                    placeholder={DisplayStrings.EnterPortToSearchFor}
                    value={this.state.searchFilter}
                    onChange={(e) => {
                        if (e && e.target) {
                            this.setState({ searchFilter: e.target.value });
                        }
                    }}
                />
            </div>
            <CheckboxPropertiesTable tableHeaders={tableHeaders}
                tableData={this.getAllPortDetails()} />

            <div className='apply-config'>
                <button id='ApplyServerPortConfig' className='text-button' onClick={this.onApplyConfigButtonClicked}>
                    {DisplayStrings.ApplyConfigButton}
                </button>
            </div>
        </>);
    }

    private getAllPortDetails(): IPortDetails[] {
        let checkboxPropertyValues: IPortDetails[] = [];
        // Sort all ports based on port number.
        let allServerPorts = this.props.allPortsNode.allServerPortGroups.sort((a, b) => { return a.portNumber - b.portNumber });
        for (let serverPortGroup of allServerPorts) {
            // Apply search filter
            if (!StringHelpers.isNullOrEmpty(this.state.searchFilter)
                && serverPortGroup.portNumber.toString().indexOf(this.state.searchFilter) === -1) {
                continue;
            }

            checkboxPropertyValues.push(this.state.allPortsSelectionStatus[serverPortGroup.id]);
        }

        return checkboxPropertyValues;
    }

    private getIcon(): JSX.Element {
        return <ClientServerGroupLogoSVG />
    }

    private getTitle(): string {
        return DisplayStrings.ConfigServerPorts;
    }

    private getSubTitle(): string {
        return DisplayStrings.undefined;
    }

    private onPortSelectionChanged(portId: string, visible: boolean): void {
        this.setState((prevState: IAllServerPortsPropertyPanelState) => {
            if (!prevState.allPortsSelectionStatus || !prevState.allPortsSelectionStatus.hasOwnProperty(portId)) {
                // appinsights should pick up and log
                throw 'Chart id doesn\'t exist on all ports property panel ' + portId;
            }

            const portSelections = update(prevState.allPortsSelectionStatus, {
                [portId]: {
                    $set: {
                        displayName: prevState.allPortsSelectionStatus[portId].displayName,
                        checked: visible,
                        onChange: this.onPortSelectionChanged,
                        id: portId,
                        dependenciesCount: prevState.allPortsSelectionStatus[portId].dependenciesCount
                    }
                }
            });

            return {
                allPortsSelectionStatus: portSelections
            };
        });
    }

    private onApplyConfigButtonClicked() {
        let selectedPortIds: string[] = [];
        for (let portId in this.state.allPortsSelectionStatus) {
            if (this.state.allPortsSelectionStatus[portId].checked) {
                selectedPortIds.push(portId);
            }
        }

        if (this.props.onPortVisibilitySelectionChanged) {
            this.props.onPortVisibilitySelectionChanged(selectedPortIds);
        }
    }
}
