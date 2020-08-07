/** tpl */
import * as React from 'react';
import { Tabs, TabList, TabPanel, Tab } from 'react-tabs';

/** property panel */
import { IDetailsPanelTab } from '../IDetailsPaneTab';
import { DetailsPaneViewModel } from '../ViewModel/DetailsPaneViewModel';

/** svg */
import { ExpandSVG } from '../../svg/expand';
import { CollapseSVG } from '../../svg/collapse';

/** styles */
import '../../../../styles/shared/PropertyPanel2.less';

/** shared */
import { Utility } from '../../Utilities/Utility';
import { DisplayStrings } from '../../DisplayStrings';
import { IDetailsPaneParentViewModel } from '../IDetailsPaneParentViewModel';
import FunctionGates from '../../Utilities/FunctionGates';
import { TooltipService } from 'appinsights-iframe-shared';
import { ITelemetry } from '../../Telemetry';

/** 
 * representation of the properties for react.  used to collapse, make invisible, define
 * the panel itself, and define when the panel is "loading"
*/
export interface IDetailsPanePropsV2 {
    parentContext: IDetailsPaneParentViewModel;
    arrowLeftFocusElement?: HTMLElement;
    shiftTabFocusElement?: HTMLElement;
    telemetry: ITelemetry;
}

/** state type */
interface IDetailsPaneStateV2 {
    context: DetailsPaneViewModel;
}

/**
 * base implementation of the property panel itself; contains all the styles and generation and toggle
 * code required to show a panel on MainPage, have it in a "loading" state, hide it, self-toggle, etc
 */
export class DetailsPaneView extends React.Component<IDetailsPanePropsV2, IDetailsPaneStateV2> {
    private resizing: boolean = false;
    private resizeTarget: any = null;
    private limitedResize: any;

    /**
     * .ctor()
     * @param props props react properties
     */
    constructor(props: IDetailsPanePropsV2) {
        super(props);

        this.state = {
            context: new DetailsPaneViewModel(props.parentContext, this.forceUpdate.bind(this), props.telemetry)
        };

        this.limitedResize = FunctionGates.CreateLimitedFunction(this.resizePanel.bind(this), 66);

        window.addEventListener('mouseup', this.stopResizePanel.bind(this));
        window.addEventListener('mousemove', this.limitedResize);
    }

    /**
     * React overload (render)
     */
    public render(): JSX.Element {
        let finalClass = 'property-panel2';
        if (this.state.context.isCollapsed) {
            finalClass += ' property-panel2-collapsed';
        }

        if (!this.props.parentContext.propertyPanelVisible) {
            finalClass += ' hidden-no-hack';
        }

        let header = null;
        if (this.props.parentContext.propertyPanelHeader) {
            header = <div className='panelHeaderWrapper'>
                <div className='panelHeaderCollapseButton' aria-expanded={!this.state.context.isCollapsed}>{this.renderCollapseIcon()}</div>
                {this.props.parentContext.propertyPanelHeader}
            </div>;
        }

        return (
            <section 
                role='region'
                id='property-panel2'
                className={finalClass}
                aria-label={DisplayStrings.PropertyPanel}
                tabIndex={0}
                aria-expanded={!this.state.context.isCollapsed}
                // ref={panel => { this.panel = panel; }}
                onKeyDown={event => {
                    if (this.state.context.isCollapsed) {
                        event.stopPropagation();
                        Utility.AffirmativeKeyDown(event, () => {
                            this.state.context.toggleCollapse();
                        })
                    } else if (event.key === 'ArrowLeft') {
                        this.props.arrowLeftFocusElement.focus();
                        event.stopPropagation();
                    } else {
                        Utility.KeyDown({
                            e: event,
                            callback: () => {
                                this.state.context.toggleCollapse();
                            },
                            keys: [Utility.KEY_ESCAPE]
                        });
                    }
                }}>
                <div className='resize-handle'
                    onMouseDown={(event) => {
                        this.resizing = true;
                        event.stopPropagation();
                        event.preventDefault();
                        this.resizeTarget = document.querySelector('.property-panel2');
                    }}>
                    <i className='resize-dots'></i>
                </div>
                <div className='panelFullContentWrapper'>
                    {header}
                    <div className='panelMainBodyWrapper'>
                        {/* {this.renderCollapseIcon()} */}
                        <div className={this.state.context.isCollapsed ?
                            'property-panel2-body property-panel2-hidden' : 'property-panel2-body'}>
                            <div className='property-content2'>
                                {this.renderMainPanelBody()}
                            </div>
                        </div>
                    </div>
                </div>
                {TooltipService.getRenderer()} {/*
                        /*
                        Registers the TooltipService renderer at the outermost div
                        so that it can properly position and display Ibiza-style tooltips
                        that block all other UI interaction when toggled open
                        */
                }
            </section>
        );
    }

    // TODO: restore this focus hack... accessibility requirement for our accessibility story
    public componentDidUpdate(prevProps: IDetailsPanePropsV2): void {
        // if ((prevProps.isVisible !== this.props.isVisible) || (prevProps.isCollapsed !== this.props.isCollapsed)) {
        //     //if (this.props.isVisible) {
        //         if (this.panelBar && this.props.isCollapsed) {
        //             this.panelBar.focus();
        //         } else if (this.panel) {
        //             this.panel.focus();
        //         }
        //     //}
        // }
    }

    private stopResizePanel(event: MouseEvent) {
        if (this.resizing) {
            this.changePanelWidth(event);
            event.stopPropagation();
            event.preventDefault();
            this.resizing = false;
            this.props.telemetry.logEvent('DetailsPaneResizeStopped', null, null);
        }
    }

    /**
     * triggered during mouse move and up to resize the panel width
     * @param event mouse event details
     */
    private changePanelWidth(event: MouseEvent) {
        // bbax; we have to size within whatever space we are given by the control placing us
        const parentElement = document.body;

        const mouseX = event.pageX;
        let targetWidth = parentElement.clientWidth - mouseX;

        if (targetWidth > (parentElement.clientWidth - 10)) {
            targetWidth = parentElement.clientWidth - 10;
        }

        if (targetWidth < 10) {
            targetWidth = 10;
        }

        this.resizeTarget.style.width = `${targetWidth}px`;
    }

    private resizePanel(event: MouseEvent) {
        if (!this.resizing) {
            return;
        }

        event.stopPropagation();
        event.preventDefault();
        this.changePanelWidth(event);
    }

    /**
     * render the collapse button
     */
    private renderCollapseIcon(): JSX.Element {
        return (
            <button
                aria-label={this.state.context.isCollapsed ? DisplayStrings.ExpandPropertyPanel :
                    DisplayStrings.CollapsePropertyPanel}
                tabIndex={0}
                onClick={this.state.context.toggleCollapse}
            // ref={panelBar => { this.panelBar = panelBar; }}
            >
                {this.state.context.isCollapsed ? <CollapseSVG /> : <ExpandSVG />}
            </button>
        );
    }

    /**
     * render the body of the panel itself (tabs, or single page view) or the loading
     * icon if required
     * @returns {JSX.Element}
     */
    private renderMainPanelBody(): JSX.Element {

        if (!this.state.context.contents || this.state.context.contents.length < 1) {
            return null;
        }

        if (!this.state.context.contents.length || this.state.context.contents.length < 2) {
            return this.state.context.contents[0].body as JSX.Element;
        } else {
            return (
                <Tabs
                    className='propertyPanel2Tabs'
                    onSelect={this.state.context.setSelectedIndex}
                    selectedIndex={this.state.context.selectedTabIndex}
                    selectedTabClassName='propertyPanel2Pane'
                    selectedTabPanelClassName='propertyPanel2Pane'
                >
                    <TabList className='propertyPanel2TabHeaders'>
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
        const panelContents = this.props.parentContext.propertyPanes;
        if (!this.state.context.contents) {
            return [];
        }

        const tabList: JSX.Element[] = [];

        panelContents.forEach((item: IDetailsPanelTab, index: number) => {
            tabList.push( // the tabIndex div around item.body is a hack because there is an a11y bug with react-tabs
                <TabPanel key={item.tabName || index} forceRender={item.forceRender || false}>
                    <div tabIndex={0}>{item.body}</div>
                </TabPanel>
            );
        });

        return tabList;
    }

    /**
     * enumerate the tabs and generate the actual Tab entry (tells react-tabs a tab exists
     * and a TabPanel later will define it's body)
     * @returns {JSX.Element}
     */
    private generateTabs(): JSX.Element[] {
        if (!this.state.context.contents) {
            return [];
        }

        const tabList: JSX.Element[] = [];
        this.state.context.contents.forEach((item) => {
            tabList.push(
                // React tabs is using the same ID as the one's for the Main tab's
                // https://msazure.visualstudio.com/InfrastructureInsights/_workitems/edit/5463425
                <Tab key={item.tabName}>
                    <div className='property-panel2-tab-icon'>{item.tabIcon}</div>
                    <div className='property-panel2-tab-text'>{item.tabName}</div>
                </Tab>
            );
        });

        return tabList;
    }
}
