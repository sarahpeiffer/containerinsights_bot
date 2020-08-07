import * as React from 'react';

/*
* AI Chart Imports
*/
import {
    InteractionsStore, ChartSeriesData
} from '@appinsights/aichartcore';

import { TooltipService, InfoSvg } from 'appinsights-iframe-shared';

/*
* Maps Imports
*/
import { ConnectionMetricCharts } from './ConnectionMetricCharts';
import { ConnectionPanelHeader } from './ConnectionPanelHeader';

/**
 * Shared Imports
 */
import { AutoPropertyPanelChart } from '../../../shared/property-panel/AutoPropertyPanelCharts';
import { MultiSeriesLineChart } from '../../../shared/MultiSeriesLineChart';
import { ITimeInterval } from '../../../shared/data-provider/TimeInterval';
import { StringHelpers } from '../../../shared/Utilities/StringHelpers';
import { hyperlinkSVG } from '../../../shared/svg/hyperlink';
import { DisplayStrings, KustoGrainDetailDisplay } from '../../../shared/DisplayStrings';
import { ITelemetry } from '../../../shared/Telemetry';
import { IWorkspaceInfo } from '../../../shared/IWorkspaceInfo';
import * as msg from '../../../shared/MessagingProvider'
import { WorkbookHelper } from '../../shared/WorkbookHelper';
import { QuickLink } from '../../../shared/property-panel/QuickLink';
import { ExpandableSection2 } from '../../../shared/property-panel/ExpandableSection2';

/*
* Style Imports
*/
import '../../../../styles/compute/ChartPane.less';
import '../../../../styles/shared/ChartPane.less';
import '../../../../scripts/shared/svg/svg.less';
import '../../../../styles/compute/PropertyPanel.less'

/*
* SVG Imports
*/
import { InfoBlueSVG } from '../../../shared/svg/InfoBlue';
import { Utility } from '../../../shared/Utilities/Utility';
import { ChevronRightSvg } from '../../../shared/svg/chevron-right';
import { ChevronDownSvg } from '../../../shared/svg/chevron-down';
import { ConnectionsSVG } from '../../../shared/svg/connections';

export interface IConnectionPanelProps {
    chartData: StringMap<StringMap<ChartSeriesData>>;
    panelHeader: ConnectionPanelHeader;
    timeInterval: ITimeInterval;
    isLoading: boolean;
    isError: boolean;
    informNoConnectiondata: boolean;
    info?: string;
    telemetry?: ITelemetry;
    selectedContext?: DependencyMap.SelectionContext;
    workspace?: IWorkspaceInfo;
    messagingProvider?: msg.MessagingProvider;
    logPrefix: string;
};


/**
 * Gets metrics and renders charts for a given Entity (Connection, AggConnection) in SelectedContext
 * for a given time range: StartTime <-> EndTime
 * @param props properties 
 */
export class ConnectionPanel extends React.Component<IConnectionPanelProps> {
    private interactionStore: InteractionsStore;

    constructor(props) {
        super(props)

        // This is required to link hover action over multiple charts in ConnectionPanel
        this.interactionStore = new InteractionsStore(undefined);
        this.navigateToHelpPage = this.navigateToHelpPage.bind(this);
    }

    public render(): JSX.Element {
        if (this.props.informNoConnectiondata === true) {
            return (
                <div className='connection-panel-root'>
                    {this.connectionPaneHeader(this.props.panelHeader.getTitle(),
                        this.props.panelHeader.getSubtitle())}
                    <div className='property-panel-info'>
                        <div className='property-panel-info-icon'>
                            <InfoBlueSVG />
                        </div>
                        <div className='property-panel-info-title'>
                            {DisplayStrings.ConnectionNoData}
                        </div>
                        <div className='property-panel-info-body'>
                            {DisplayStrings.ConnectionClientGroupNoData}
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div>
                <AutoPropertyPanelChart
                    header={this.generateConnectionPaneHeaderWithInfo(this.props.panelHeader.getTitle(),
                        this.props.panelHeader.getSubtitle(), this.props.info)}
                    charts={this.renderAppropriateCharts()}
                />
                {TooltipService.getRenderer()} {/*
                    Registers the TooltipService renderer at the outermost div
                    so that it can properly position and display Ibiza-style tooltips
                    that block all other UI interaction when toggled open
                */}
            </div>
        );
    }

    private generateConnectionPaneHeaderWithInfo(
        title: string, subtitle: string, info?: string): JSX.Element {
        if (!info) {
            return (
                <div className='connectionpane-header'>
                    {this.connectionPaneHeader(title, subtitle)}
                </div>
            );
        }

        return (
            <div className='connectionpane-header'>
                {this.connectionPaneHeader(title, subtitle)}
                <div className='connectionpane-header-info-container'>
                    <div className='connectionpane-header-info'>
                        {info}
                    </div>
                </div>
            </div>
        )
    }

    private connectionPaneHeader(title: string, subtitle: string): JSX.Element {
        return (
            <div className='connection-property-panel'>
                <div className='property-panel-header'>
                    <div className='property-panel-header-icon-container'>
                        <div className='property-panel-header-icon center'>
                            <ConnectionsSVG />
                        </div>
                    </div>
                    <div className='property-panel-header-content'>
                        <div className='property-panel-header-text'>
                            <div className='property-panel-header-text-title' tabIndex={0}>
                                {title || ''}
                            </div>
                            <div className='property-panel-header-text-subtitle' tabIndex={0}>
                                {subtitle}
                            </div>
                        </div>
                    </div>
                    <a href='https://aka.ms/vminsightsconnectionmetrics' target='_blank' onClick={this.navigateToHelpPage}
                        className='property-panel-header-info-link' tabIndex={0}>
                        {DisplayStrings.ConnectionHelpText}
                        <span className='hyperlink-svg'>{hyperlinkSVG}</span>
                    </a>
                </div>
                <ExpandableSection2
                    title={DisplayStrings.QuickLinks}
                    content={this.generateConnectionWorkbookQuickLink(this.props.selectedContext, this.props.workspace)}
                    expandIcon={<ChevronRightSvg />}
                    collapseIcon={<ChevronDownSvg />}
                    isExpanded={true}
                    key={'quick-links'} />
            </div>);
    }

    /*
    * Header for each chart in the Connection Pane
    * Currently this is also being used to display Connection displayName
    * Styling may change based on inputs
    */
    private connectionsChartHeader(title: string, subtitle: string, ariaId: string, info: string): JSX.Element {
        let tooltipDOMElement = null;
        let tooltipProps = {};
        TooltipService.registerTooltipForElement(
            tooltipProps,
            () => { return tooltipDOMElement; },
            info);

        const tooltip: JSX.Element = <div {...tooltipProps}
            className='grid-tooltip'
            ref={(r) => { tooltipDOMElement = r; return tooltipDOMElement; }}
            tabIndex={0}
            onKeyPress={(e) => {
                Utility.AffirmativeKeyDown(e, () => {
                    tooltipDOMElement.click();
                })
            }}>
            <InfoSvg />
        </div>;

        return (
            <div aria-label={title}
                title={title}
                id={ariaId}
                className='chart-header'>
                <div>
                    <div className='title' tabIndex={0}>
                        {title || ''}
                    </div>
                    {tooltip}
                </div>
                <div className='subtitle' tabIndex={0}>
                    {subtitle}
                </div>
            </div>
        );
    }

    /* 
    * Contructor effectively
    * Based on whether the pane is loading or not, function calls Interpreter()
    *  to make sese of response
    */
    private renderAppropriateCharts(): JSX.Element[] {
        const componentList = new Array<JSX.Element>();

        let chartData = this.props.chartData as StringMap<StringMap<ChartSeriesData>>;
        ConnectionMetricCharts.list().forEach(chart => {
            let grainDisplay: string = '';
            if (this.props.timeInterval) {
                const translatedTime = KustoGrainDetailDisplay[this.props.timeInterval.getGrainKusto()];
                if (translatedTime) {
                    grainDisplay = StringHelpers.replaceAll(DisplayStrings.AggregateGranularitySubtitle, '{0}', translatedTime);
                }
            }
            const chartAriaHeaderID: string = 'chartHeaderAriaLabel' + chart.chartName;
            componentList.push(this.connectionsChartHeader(chart.displayName, grainDisplay, chartAriaHeaderID, chart.info));
            componentList.push(<MultiSeriesLineChart
                timeInterval={this.props.timeInterval}
                isLoading={this.props.isLoading}
                isError={this.props.isError}
                data={chartData[chart.chartName]}
                selectedAggregationOptions={ConnectionMetricCharts.get(chart.chartName)
                    .defaultSelectedAggregationOptions}
                visualization={ConnectionMetricCharts.get(chart.chartName).visualization}
                interactionStore={this.interactionStore}
                ariaLabelledById={chartAriaHeaderID}
            />);

        });

        return componentList;
    }

    private navigateToHelpPage() {
        this.props.telemetry.logEvent('ConnectionPanelNavigateToDocumentPage', null, null);
    }

    private generateConnectionWorkbookQuickLink(selectedContext: DependencyMap.SelectionContext, workspace: IWorkspaceInfo): JSX.Element {
        if (!selectedContext) { return null; }

        const entity = selectedContext.entity;
        if (!entity.id && !((entity as any).computerName as string)) {
            return null;
        }
        const sourceName: string = `${this.props.logPrefix}.ConnectionPanel.onNavigateToConnectionDetailWorkbook`;
        return <QuickLink
            key={'connection-detail'}
            onClick={() => WorkbookHelper.NavigateToConnectionDetailWorkbook({
                sourceName, workspaceId: workspace.id,
                computerName: (entity as any).computerName as string,
                messagingProvider: this.props.messagingProvider,
                telemetry: this.props.telemetry
            })}
            icon={<ConnectionsSVG />}
            label={DisplayStrings.ConnectionDetail}
        />
    }
}
