/** tpl */
import * as React from 'react';
import { Tabs, TabList, TabPanel, Tab } from 'react-tabs';

/** property panel */
import { IDetailsPanel } from './IDetailsPanel';

/** svg */
import { ExpandSVG } from '../svg/expand';
import { CollapseSVG } from '../svg/collapse';
import { BlueLoadingDots, BlueLoadingDotsSize } from '../blue-loading-dots';

/** styles */
import '../../../styles/shared/PropertyPanel.less';
import '../../../styles/compute/PropertyPanel.less';

/** shared */
import { Utility } from '../Utilities/Utility';
import { DisplayStrings } from '../DisplayStrings';

/** 
 * representation of the properties for react.  used to collapse, make invisible, define
 * the panel itself, and define when the panel is "loading"
*/
export interface IDetailsPaneProps {
    isVisible?: boolean; // The PP should always be visible. This is just a flag for hiding the PP, before
    // we are ready to incorporate its functionality
    isCollapsed: boolean;

    isLoading: boolean;

    /**
     * will include all details including tabs, tab panel contents, etc for this property panel
     */
    contents?: IDetailsPanel[];

    /**
     * Callback to execute when collapse/expand props panel action is taken
     * @param isUserAction indicates whether toggling of the property panel was done by user
     */
    onTogglePanelCollapse?: (isUserAction?: boolean) => void;

    /**
    * Callback to execute when a property pane is selected
    * @param index index of the selected pane
    */
    onPaneSelected?: (index: number) => void;

    /**
     * Index of the panel to be displayed when the panel is opened.
     * This index should be the array index of 'contents'
     */
    selectedPanelIndex?: number;

    /**
     * if true, use wide collapsed panel
     */
    useWideCollapsedPane?: boolean;
    /**
     * Can be used to trigger component update in order to focus on the property panel
     *
     * @type {*}
     * @memberof IDetailsPaneProps
     */
    selectedContext?: any;
    /**
     * Used in SingleVM to refit the DependencyMap upon initial load of the map page or else in some
     * cases the map will be partially obfuscated by the property panel
     *
     * @memberof IDetailsPaneProps
     */
    mapRefocus?: () => void;
}

interface IDetailsPaneState {
    selectedIndex: number;
}

/**
 * base implementation of the property panel itself; contains all the styles and generation and toggle
 * code required to show a panel on MainPage, have it in a "loading" state, hide it, self-toggle, etc
 */
export class DetailsPane extends React.Component<IDetailsPaneProps, IDetailsPaneState> {
    private panel: HTMLElement;
    private panelBar: HTMLElement;

    /**
     * .ctor()
     * @param props props react properties
     */
    constructor(props: IDetailsPaneProps) {
        super(props);
        this.state = { selectedIndex: this.props.selectedPanelIndex || 0 }; // By default select first panel
        this.onTabSelected = this.onTabSelected.bind(this);
        this.togglePanel = this.togglePanel.bind(this);
    }

    /**
     * Update the selected tab index passed by the parent component
     * @param nextProps new properties
     */
    public componentWillReceiveProps(nextProps: IDetailsPaneProps) {
        const changedSelection: boolean = (nextProps.selectedPanelIndex !== undefined) &&
            (nextProps.selectedPanelIndex !== this.state.selectedIndex);
        let selectedIndex: number = this.state.selectedIndex;

        if (changedSelection) {
            this.setState({
                selectedIndex: nextProps.selectedPanelIndex
            });
            selectedIndex = nextProps.selectedPanelIndex
        }

        const nextDetailsPanel: IDetailsPanel = nextProps.contents && nextProps.contents[selectedIndex];
        const resetSelection: boolean = nextDetailsPanel && nextDetailsPanel.disabled;
        if (resetSelection) {
            this.setState({
                selectedIndex: 0
            });
        }
    }

    public render(): JSX.Element {
        let finalClass = 'property-panel';
        if (this.props.isVisible !== undefined && !this.props.isVisible) {
            finalClass += ' property-panel-hidden';
        }
        if (this.props.isCollapsed) {
            finalClass += ' property-panel-collapsed';
            if (this.props.useWideCollapsedPane) {
                finalClass += ' customized-collapsed';
            }
        }

        return (
            <section className={finalClass}
                aria-label={DisplayStrings.PropertyPanel}
                tabIndex={0}
                aria-expanded={!this.props.isCollapsed}
                ref={panel => { this.panel = panel; }}
                onKeyDown={e => {
                    if (this.props.isCollapsed) {
                        e.stopPropagation();
                        Utility.AffirmativeKeyDown(e, () => {
                            this.props.onTogglePanelCollapse(true);
                        })
                    } else {
                        Utility.KeyDown({
                            e,
                            callback: () => {
                                this.props.onTogglePanelCollapse(true);
                            },
                            keys: [Utility.KEY_ESCAPE]
                        });
                    }
                }}
            >
                {this.renderCollapseIcon()}
                <div className={this.props.isCollapsed ? 'property-panel-body property-panel-hidden' : 'property-panel-body'}>
                    <div className='property-content'>
                        {this.renderMainPanelBody()}
                    </div>
                </div>
            </section>
        );
    }

    public componentDidMount(): void {
        if (this.props.mapRefocus) {
            this.props.mapRefocus();
        }
    }

    public componentDidUpdate(prevProps: IDetailsPaneProps): void {
        if ((prevProps.isVisible !== this.props.isVisible)
            || (prevProps.isCollapsed !== this.props.isCollapsed)
            || (this.props.selectedContext
                && (JSON.stringify(prevProps.selectedContext) !== JSON.stringify(this.props.selectedContext)))
        ) {
            if (!this.props.isCollapsed) {
                if (this.panelBar && this.props.isCollapsed) {
                    this.panelBar.focus();
                } else if (this.panel) {
                    this.panel.focus();
                }
            }
        }
    }

    /**
     * used to render the clickable part of the collapse bar...
     * this is seperated because future mocks call for this to move from a bar
     * up to a top corner.
     * @returns {JSX.Element} the clickable icon for collapsing
     */
    private renderCollapseIcon(): JSX.Element {
        if (this.props.isCollapsed && this.props.useWideCollapsedPane) {
            return this.getWideCollapsedPane();
        }

        return (
            <div className='expandCollapseActionBar'>
                <button
                    aria-label={this.props.isCollapsed ? DisplayStrings.ExpandPropertyPanel : DisplayStrings.CollapsePropertyPanel}
                    tabIndex={0}
                    onClick={() => { if (this.props.onTogglePanelCollapse) { this.props.onTogglePanelCollapse(true); } }}
                    ref={panelBar => { this.panelBar = panelBar; }}
                >
                    {this.props.isCollapsed ? <CollapseSVG /> : <ExpandSVG />}
                </button>
            </div>
        );
    }

    /**
     * customized collasped property panel icon strip
     * click on icon, open that panel.
     * if no icon, return null, so that use default cheven collapse panel.
     * @param detailPaneContents 
     */
    private getWideCollapsedPane(): JSX.Element {
        const detailPaneContents: IDetailsPanel[] = this.props.contents;
        const customIconsStrip: JSX.Element[] = [];
        for (let selectedIndex = 0; selectedIndex < detailPaneContents.length; selectedIndex++) {
            const panel = detailPaneContents[selectedIndex];
            if (!panel.tabIcon) {
                continue;
            }
            customIconsStrip.push(
                // ak: ensure react-tabs library is utilized or else style won't apply
                <li key={panel.tabName}
                        className='react-tabs__tab'
                        tabIndex={0}
                        onKeyDown={e => { Utility.AffirmativeKeyDown(e, () => { this.togglePanel(selectedIndex); }) }}
                        onClick={() => { this.togglePanel(selectedIndex); }}>
                    <div key={selectedIndex}
                        className= {panel.disabled ? 'property-panel-tab-icon disabled' : 'property-panel-tab-icon'}>
                        {panel.tabIcon}
                    </div>
                    <div className='property-panel-tab-text'>{panel.tabName}</div>
                </li>
            );
        }

        // ak: extra divs were introduced in order to match up with
        // existing styling of expanded property panel
        return <div className='property-panel-body'>
            <div className='property-content'>
                <div className='property-panel-tabs'>
                    <ul className='property-panel-tab-headers'>
                        {customIconsStrip}
                    </ul>
                </div>
            </div>
        </div>;
    }

    private togglePanel(selectedIndex: number): void {
        if (this.props.onTogglePanelCollapse) {
            this.setState({ selectedIndex }, () => {
                this.onPaneSelected(selectedIndex);
            });
            this.props.onTogglePanelCollapse();
        }
    }

    private onPaneSelected(index: number) {
        if (this.props.onPaneSelected) {
            this.props.onPaneSelected(index);
            if (this.props.contents[index].onAfterSelection) {
                this.props.contents[index].onAfterSelection();
            }
        }
    }

    /**
     * render the body of the panel itself (tabs, or single page view) or the loading
     * icon if required
     * @returns {JSX.Element}
     */
    private renderMainPanelBody(): JSX.Element {
        if (this.props.isLoading) {
            return (
                <div className='center-flex'>
                    <BlueLoadingDots size={BlueLoadingDotsSize.medium} />
                </div>
            );
        }

        if (!this.props.contents || this.props.contents.length < 1) {
            return null;
        }

        if (!this.props.contents.length || this.props.contents.length < 2) {
            return this.props.contents[0].body as JSX.Element;
        } else {
            return (
                <Tabs
                    className='property-panel-tabs'
                    onSelect={this.onTabSelected}
                    selectedIndex={this.state.selectedIndex}
                    selectedTabClassName='property-panel-pane'
                    selectedTabPanelClassName='property-panel-pane'
                >
                    <TabList className='property-panel-tab-headers'>
                        {this.generateTabs()}
                    </TabList>

                    {this.generateTabPanels()}
                </Tabs>
            );
        }
    }


    /**
     * enumerate the tabs and create the tabpanels (each "body" for the tab)
     * @returns {JSX.Element}
     */
    private generateTabPanels(): JSX.Element[] {
        if (!this.props.contents) {
            return [];
        }

        const tabList: JSX.Element[] = [];

        this.props.contents.forEach((item: IDetailsPanel, index: number) => {
            tabList.push(<TabPanel key={item.tabName || index} forceRender={item.forceRender || false}>{item.body}</TabPanel>);
        });

        return tabList;
    }

    /**
     * enumerate the tabs and generate the actual Tab entry (tells react-tabs a tab exists
     * and a TabPanel later will define it's body)
     * @returns {JSX.Element}
     */
    private generateTabs(): JSX.Element[] {
        if (!this.props.contents) {
            return [];
        }

        const tabList: JSX.Element[] = [];
        this.props.contents.forEach((item) => {
            tabList.push(
                <Tab key={item.tabName} disabled={item.disabled}>
                    <div className='property-panel-tab-icon'>{item.tabIcon}</div>
                    <div className='property-panel-tab-text'>{item.tabName}</div>
                </Tab>
            );
        });

        return tabList;
    }

    /**
     * This method is called whenever user selects new tab.
     * Change the 'SelectedIndex' state property to select new tab.
     * @param index New tab index
     * @param last Previous tab index
     * @param event Tab selected event
     */
    private onTabSelected(index: number, last: number, event: Event): void {
        this.setState({
            selectedIndex: index
        });

        if (this.props.onPaneSelected) {
            this.props.onPaneSelected(index);
        }

    }
}
