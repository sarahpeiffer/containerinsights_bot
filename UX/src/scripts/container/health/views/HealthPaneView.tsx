/** styles */
import '../../../../styles/container/HealthPane.less';
import '../../../../styles/container/Deployments.less';

/** tpl */
import * as React from 'react';

/** shared */
import { BaseViewModel } from '../../../shared/BaseViewModel';
import { ContainerMainPageViewModel } from '../../main-page/viewmodels/ContainerMainPageViewModel';
import { BlueLoadingDots, BlueLoadingDotsSize } from '../../../shared/blue-loading-dots';
import { DisplayStrings } from '../../../shared/DisplayStrings';

/** local */
import { HealthPaneViewModel } from '../viewmodels/HealthPaneViewModel';
import { HealthServicesFactory } from '../factories/HealthServicesFactory';
import { HealthAspectsView } from './HealthAspectsView';
import { FailureView } from '../../error-state/FailureView';
import { ErrorStatus } from '../../../shared/ErrorStatus';
import { BladeContext } from '../../BladeContext';
import { ClusterType } from '../../../multicluster/metadata/IManagedCluster';

/**
 * health pane component properties
 */
export interface IHealthPaneViewProps {
    /**
     * parent view model
     */
    parentContext: BaseViewModel;
}

/**
 * health pane component sate
 */
interface IHealthPaneViewState {
    /** context (view model) */
    context: HealthPaneViewModel;
}

/**
 * health pane component
 */
export class HealthPaneView extends React.PureComponent<IHealthPaneViewProps, IHealthPaneViewState> {
    /**
     * initializes a new instance of the class
     * @param props component properties
     */
    constructor(props: IHealthPaneViewProps) {
        super(props);

        const viewModel = new HealthPaneViewModel(
            HealthServicesFactory.instance,
            this.props.parentContext, 
            this.forceUpdate.bind(this));

        this.state = { context: viewModel };
    }

    /**
     * react callback invoked just before mounting occurs
     * 
     * TODO: replace with static getDerivedStateFromProps(props, state) when switching react v17+
     */
    public componentWillMount() {
        this.state.context.initialize(true);
    }

    /**
     * react callback invoked to render component
     */
    public render(): JSX.Element {
        const context = this.state.context;

        try {
            if (!context.isLoadCompleted) {
                this.updateRefreshStatus(true); 
                return this.renderLoading(); 
            }
            if (!context.isLoadSucceeded) { 
                this.updateRefreshStatus(false);
                return this.renderError(); 
            }

            // TODO:
            // bbax: Nick and I ran through this... this code can never execute right now.  See HealthServicesFactory, 
            // if HealthModel is null it will crash and cause the error to shift from "no data" to a full exception
            if (!context.hasData) { 
                this.updateRefreshStatus(false);
                return this.renderNoData(); 
            }

            this.updateRefreshStatus(false);
            return (
                <div 
                className='health-pane-2'
                role='region'
                aria-label={DisplayStrings.HealthPaneAriaLabel}>
                    <HealthAspectsView parentContext={this.state.context} />
                </div>
            );
        } catch (ex) {
            context.onRenderException(ex);
            throw ex;
        }
    }

    /**
     * update the refresh button status
     * @param isLoading 
     */
    private updateRefreshStatus(isLoading: boolean): void {
        (this.props.parentContext as ContainerMainPageViewModel).setLoadStatus(isLoading);
    }

    /**
     * renders 'loading dots' view
     * @returns {JSX.Element} visual element to render
     */
    private renderLoading(): JSX.Element {
        return (
            <div className='health-model-load-msg-container'>
                <BlueLoadingDots size={BlueLoadingDotsSize.medium}/>
            </div>
        );
    }

    /**
     * renders 'error retrieving data' view state
     * @returns {JSX.Element} visual element to render
     */
    private renderError(): JSX.Element {
        const clusterType = BladeContext.instance().cluster.clusterType;
        if (clusterType === ClusterType.AKS || clusterType === ClusterType.ARO) {
            return (
                <div className='health-model-load-msg-container'>
                    <ErrorStatus    
                        isVisible={true}
                        isTroubleShootingMsgVisible={true}
                        message={DisplayStrings.DataRetrievalError} />
                </div>
            );
        } else { 
            return <FailureView parentContext={this.state.context} />
        }
    }

    /**
     * renders 'no data' view state
     * @returns {JSX.Element} visual element to render
     */
    private renderNoData(): JSX.Element {
        return (
            <div className='health-model-load-msg-container'>
                <div id='no-data-msg'>
                    {DisplayStrings.NoDataMsg}
                    <a className='troubleshooting-link'
                        href='https://aka.ms/containerhealthtroubleshoot' target='_blank'>
                        {DisplayStrings.ContainerTroubleshootingLinkText}
                    </a>
                </div>        
            </div>
        );
    }
}
