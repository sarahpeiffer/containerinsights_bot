/** tpl */
import * as React from 'react';

import { DeploymentsItemView } from './DeploymentsItemView';
import { SortableColumn } from '../models/DeploymentsPaneModel';

import { DeploymentsPaneViewModel } from '../viewmodels/DeploymentsPaneViewModel';
import { IServiceFactory } from '../factories/ServiceFactory';

// svg
import { RawSvg } from '../../../shared/svg/rawIcon';
import { DescribeSvg } from '../../../shared/svg/describeIcon';

// local
import { DeploymentsPropertyRawTabView } from './property-panel/DeploymentsPropertyRawTabView';
import { DeploymentsPropertyPanelHeader } from './property-panel/DeploymentsPropertyPanelHeader';
import { DeploymentsPropertyDescribeTabView } from './property-panel/DeploymentsPropertyDescribeTabView';
import { FailureView } from '../../error-state/FailureView';

// shared
import { LiveConsoleView } from '../../../shared/live-console-v2/views/LiveConsoleView';
import { DetailsPaneView } from '../../../shared/property-panel-v2/View/DetailsPaneView';
import { BaseViewModel } from '../../../shared/BaseViewModel';
import { BlueLoadingDots, BlueLoadingDotsSize } from '../../../shared/blue-loading-dots';
import { ITelemetry, TelemetrySubArea } from '../../../shared/Telemetry';
import { DisplayStrings } from '../../../shared/DisplayStrings';
import * as TelemetryStrings from '../../../shared/TelemetryStrings';

/** prop type */
export interface IDeploymentsPaneViewProps {
    serviceFactory: IServiceFactory;
    parentContext: BaseViewModel;
    telemetry: ITelemetry;
}

/** state type */
interface IDeploymentsPaneViewState {
    /** context (view model) */
    context: DeploymentsPaneViewModel;
}

/**
 * Deployments central UI component.
 */
export class DeploymentsPaneView extends React.Component<IDeploymentsPaneViewProps, IDeploymentsPaneViewState> {
    /**
     * initializes a new instance of the class
     * @param props component properties
     */
    constructor(props: IDeploymentsPaneViewProps) {
        super(props);
        props.telemetry.setContext({ subArea: TelemetrySubArea.ContainerDeploymentList }, false);

        this.state = {
            context: this.createViewModel(props)
        };

        this.state.context.registerPropertyPane({
            tabName: DisplayStrings.containerDeploymentsPropertyPanelTabDescribe, forceRender: true,
            telemetryName: TelemetryStrings.DeploymentsDetailsPaneDescribeTabTitle,
            tabIcon: <DescribeSvg />,
            body: <div className='deployments-panel-body'>
                <DeploymentsPropertyDescribeTabView
                    serviceFactory={props.serviceFactory}
                    parentContext={this.state.context}
                    telemetry={props.telemetry} />
            </div>,
            telemetryPageView: 'DeploymentPropertyPanelDescribe'
        });
        this.state.context.registerPropertyPane({
            tabName: DisplayStrings.containerDeploymentsPropertyPanelTabRaw, forceRender: true,
            telemetryName: TelemetryStrings.DeploymentsDetailsPaneRawTabTitle,
            tabIcon: <RawSvg />,
            body: <div className='deployments-panel-body'>
                <DeploymentsPropertyRawTabView
                    serviceFactory={props.serviceFactory}
                    parentContext={this.state.context}
                    telemetry={props.telemetry} />
            </div>,
            telemetryPageView: 'DeploymentPropertyPanelRaw'
        });

        this.state.context.registerPropertyPanelHeader(<DeploymentsPropertyPanelHeader parentContext={this.state.context}
            servicesFactory={this.props.serviceFactory} />);
    }

    /**
     * react callback invoked just before mounting occurs
     * 
     * TODO: replace with static getDerivedStateFromProps(props, state) when switching react v17+
     */
    public componentWillMount() {
        this.state.context.onLoad();
    }

    /**
     * react callback invoked to render component
     */
    public render(): JSX.Element {

        if (this.state.context.loadingFailed) {
            return <FailureView parentContext={this.state.context} />;
        }

        return (
            <div className='deployments-pane'>
                <div className='deployments-pane-content'>
                    {this.renderSearchBox()}
                    {this.renderGrid()}
                </div>
                <DetailsPaneView
                    parentContext={this.state.context}
                    telemetry={this.props.telemetry} />
            </div>
        );
    }

    private renderLiveConsole() {
        return (
            <LiveConsoleView
                parentContext={this.state.context}
                servicesFactory={this.props.serviceFactory}
                telemetry={this.props.telemetry}
            />);
    }

    private renderSearchBox() {
        let searchBoxCss = 'search-for-name-filter';
        return <div className='pane-control-panel deployments-search-filter'>
            <input type='text' className={searchBoxCss}
                aria-label={DisplayStrings.EnterNameToSearchFor}
                value={this.state.context.filterValue}
                placeholder={DisplayStrings.EnterNameToSearchFor}
                onChange={(e) => {
                    if (e && e.target) {
                        this.state.context.onNameFilterChanged(e.target.value);
                    }
                }} /></div>
    }

    /**
     * render the grid... this i hope to turn into a component of its own soon
     */
    private renderGrid() {
        const tableContents = this.state.context.deployments.map((deployment, index) => {
            return <DeploymentsItemView
                service={this.props.serviceFactory}
                deploymentId={deployment}
                rowIndex={index + 1} // Since first row is column headers
                parentContext={this.state.context}
            />
        });


        let loadingVisual: JSX.Element = null;
        let tableClassName = 'deploymentsTable';
        if (this.state.context.isLoading) {
            tableClassName = tableClassName + ' loading';
            loadingVisual = <tr><td>{this.renderLoading(!!tableContents && tableContents.length > 1)}</td></tr>;
        }

        return <div className='deployments-grid'>
            <div className='deployments-grid-wrapper'>
                <table className={tableClassName} role='grid'>
                    <tr className='deploymentsHeaderRow'
                        role='row'
                    >
                        <th className='deploymentsHeaderCell'
                            role='columnheader'
                            aria-rowindex={0}
                            aria-colindex={0}
                            aria-label={DisplayStrings.containerDeploymentsGridHeaderName}
                            aria-sort={this.state.context.isSelectedColumn(SortableColumn.Name)
                                ? (this.state.context.sortDirection() as 'ascending' | 'descending')
                                : 'none'}
                            aria-selected={this.state.context.isSelectedColumn(SortableColumn.Name)}
                            tabIndex={this.state.context.isSelectedColumn(SortableColumn.Name) ? 0 : -1}
                            onKeyDown={(event) =>
                                this.state.context.gridHeaderAcceesibilityHelperForKeyDown(event, SortableColumn.Name)}
                            onClick={() => this.state.context.sort(SortableColumn.Name)}
                        >
                            {DisplayStrings.ContainerDeploymentsGridHeaderName}
                        </th>
                        <th className='deploymentsHeaderCell'
                            role='columnheader'
                            aria-rowindex={0}
                            aria-colindex={1}
                            aria-label={DisplayStrings.containerDeploymentsGridHeaderNamespace}
                            aria-sort={this.state.context.isSelectedColumn(SortableColumn.Namespace)
                                ? (this.state.context.sortDirection() as 'ascending' | 'descending')
                                : 'none'}
                            aria-selected={this.state.context.isSelectedColumn(SortableColumn.Namespace)}
                            tabIndex={this.state.context.isSelectedColumn(SortableColumn.Namespace) ? 0 : -1}
                            onKeyDown={(event) =>
                                this.state.context.gridHeaderAcceesibilityHelperForKeyDown(event, SortableColumn.Namespace)}
                            onClick={() => this.state.context.sort(SortableColumn.Namespace)}
                        >
                            {DisplayStrings.ContainerDeploymentsGridHeaderNamespace}
                        </th>
                        <th className='deploymentsHeaderCell'
                            role='columnheader'
                            aria-rowindex={0}
                            aria-colindex={2}
                            aria-label={DisplayStrings.containerDeploymentsGridHeaderReady}
                            aria-sort={this.state.context.isSelectedColumn(SortableColumn.Ready)
                                ? (this.state.context.sortDirection() as 'ascending' | 'descending')
                                : 'none'}
                            aria-selected={this.state.context.isSelectedColumn(SortableColumn.Ready)}
                            tabIndex={this.state.context.isSelectedColumn(SortableColumn.Ready) ? 0 : -1}
                            onKeyDown={(event) =>
                                this.state.context.gridHeaderAcceesibilityHelperForKeyDown(event, SortableColumn.Ready)}
                            onClick={() => this.state.context.sort(SortableColumn.Ready)}
                        >
                            {DisplayStrings.ContainerDeploymentsGridHeaderReady}
                        </th>
                        <th className='deploymentsHeaderCell'
                            role='columnheader'
                            aria-rowindex={0}
                            aria-colindex={3}
                            aria-label={DisplayStrings.containerDeploymentsGridHeaderUpToDate}
                            aria-sort={this.state.context.isSelectedColumn(SortableColumn.UpToDate)
                                ? (this.state.context.sortDirection() as 'ascending' | 'descending')
                                : 'none'}
                            aria-selected={this.state.context.isSelectedColumn(SortableColumn.UpToDate)}
                            tabIndex={this.state.context.isSelectedColumn(SortableColumn.UpToDate) ? 0 : -1}
                            onKeyDown={(event) =>
                                this.state.context.gridHeaderAcceesibilityHelperForKeyDown(event, SortableColumn.UpToDate)}
                            onClick={() => this.state.context.sort(SortableColumn.UpToDate)}
                        >
                            {DisplayStrings.ContainerDeploymentsGridHeaderUpToDate}
                        </th>
                        <th className='deploymentsHeaderCell'
                            role='columnheader'
                            aria-rowindex={0}
                            aria-colindex={4}
                            aria-label={DisplayStrings.containerDeploymentsGridHeaderAvailable}
                            aria-sort={this.state.context.isSelectedColumn(SortableColumn.Available)
                                ? (this.state.context.sortDirection() as 'ascending' | 'descending')
                                : 'none'}
                            aria-selected={this.state.context.isSelectedColumn(SortableColumn.Available)}
                            tabIndex={this.state.context.isSelectedColumn(SortableColumn.Available) ? 0 : -1}
                            onKeyDown={(event) =>
                                this.state.context.gridHeaderAcceesibilityHelperForKeyDown(event, SortableColumn.Available)}
                            onClick={() => this.state.context.sort(SortableColumn.Available)}
                        >
                            {DisplayStrings.ContainerDeploymentsGridHeaderAvailable}
                        </th>
                        <th className='deploymentsHeaderCell'
                            role='columnheader'
                            aria-rowindex={0}
                            aria-colindex={5}
                            aria-label={DisplayStrings.containerDeploymentsGridHeaderAge}
                            aria-sort={this.state.context.isSelectedColumn(SortableColumn.Age)
                                ? (this.state.context.sortDirection() as 'ascending' | 'descending')
                                : 'none'}
                            aria-selected={this.state.context.isSelectedColumn(SortableColumn.Age)}
                            tabIndex={this.state.context.isSelectedColumn(SortableColumn.Age) ? 0 : -1}
                            onKeyDown={(event) =>
                                this.state.context.gridHeaderAcceesibilityHelperForKeyDown(event, SortableColumn.Age)}
                            onClick={() => this.state.context.sort(SortableColumn.Age)}
                        >
                            {DisplayStrings.ContainerDeploymentsGridHeaderAge}
                        </th>
                    </tr>
                    {tableContents}
                    {loadingVisual}
                </table>
            </div>
            {this.renderLiveConsole()}
        </div>;
    }

    /**
     * renders 'loading dots' view
     * @returns {JSX.Element} visual element to render
     */
    private renderLoading(withoutBuffer: boolean): JSX.Element {
        let className = 'deployments-load-msg-container';
        if (!withoutBuffer) {
            className = className + ' deployments-load-msg-buffer';
        } else {
            className = className + ' deployments-load-msg-nobuffer';
        }
        return (
            <div className={className}>
                <BlueLoadingDots size={BlueLoadingDotsSize.medium} />
            </div>
        );
    }

    /**
     * creates view model for component based on properties received
     * @param props component properties
     */
    private createViewModel(props: IDeploymentsPaneViewProps): DeploymentsPaneViewModel {
        if (!props) { throw new Error(`@props may not be null at DeploymentsPaneView.createViewModel()`); }

        const telemetry = this.props.telemetry;
        const deploymentsService = this.props.serviceFactory.generateDeploymentsService();
        return new DeploymentsPaneViewModel(
            telemetry,
            deploymentsService,
            this.props.parentContext as any,
            this.forceUpdate.bind(this)
        );
    }
}
