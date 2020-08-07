/** tpl */
import * as React from 'react';

/** shared */
import { DetailsPaneView } from '../../../shared/property-panel-v2/view/DetailsPaneView';
import { IDetailsPanelTab } from '../../../shared/property-panel-v2/IDetailsPaneTab';
import * as TelemetryStrings from '../../../shared/TelemetryStrings';

/** local */
import { HealthServicesFactory } from '../factories/HealthServicesFactory';
import { HealthTreeViewModel } from '../viewmodels/HealthTreeViewModel';
import { HealthAspectsViewModel } from '../viewmodels/HealthAspectsViewModel';
import { HealthTreeNodeView } from './HealthTreeNodeView';
import { HealthMonitorPropertyPanelHeaderView } from './HealthMonitorPropertyPanelHeaderView';
import { HealthMonitorHowItWorksView } from './HealthMonitorHowItWorksView';
import { HealthMonitorDetailsContainerView } from './monitorDetails/HealthMonitorDetailsContainerView';
import { HealthMonitorConfigView } from './HealthMonitorConfigView';
import { DisplayStrings } from '../../../shared/DisplayStrings';
import { TelemetryFactory } from '../../../shared/TelemetryFactory';
import { TelemetryMainArea } from '../../../shared/Telemetry';
import { InfoPageSvg } from '../../../shared/svg/info-page';
import { DetailsPageSvg } from '../../../shared/svg/details-page';
import { GearSvg } from '../../../shared/svg/gear';

/**
 * react component props
 */
export interface IHealthTreeViewProps {
    /** parent context (view model) */
    parentContext: HealthAspectsViewModel;
}

/**
 * react component state
 */
interface IHealthTreeViewState {
    /** component context (view model) */
    context: HealthTreeViewModel;
}

/**
 * monitor tree view react component
 */
export class HealthTreeView extends React.PureComponent<IHealthTreeViewProps, IHealthTreeViewState> {
    healthTreeNodeFocus: HTMLElement = null;

    /**
     * initializes an instance of the class
     * @param props component properties
     */
    public constructor(props: IHealthTreeViewProps) {
        super(props);

        const viewModel = new HealthTreeViewModel(
            HealthServicesFactory.instance,
            props.parentContext as HealthAspectsViewModel,
            this.forceUpdate.bind(this));

        this.registerPropertyPanel(viewModel);

        this.state = { context: viewModel };
    }

    /**
     * react callback invoked just before mounting occurs
     * 
     * TODO: replace with static getDerivedStateFromProps(props, state) when switching react v17+
     */
    public componentWillMount(): void {
        this.state.context.initialize();
    }

    /**
     * react callback invoked to render component
     */
    public render(): JSX.Element {
        const context = this.state.context;

        return (
            <>
                <div
                    role='region'
                    aria-labelledby='health-tree'
                    className='health-tree'
                    id='health-tree'
                    tabIndex={0}
                    aria-label='health-tree'
                    onKeyUp={event => {
                        if (event.key === 'ArrowRight') {
                            document.getElementById('property-panel2').focus();
                            event.stopPropagation();
                        }
                        if (event.key === 'ArrowLeft') {
                            document.getElementById('aspects-panel').focus();
                            event.stopPropagation();
                        }
                    }}
                >
                    <HealthTreeNodeView
                        parentContext={context}
                        monitorIdentifier={context.rootMonitorIdentifier}
                    />
                </div>
                <DetailsPaneView
                    parentContext={context}
                    arrowLeftFocusElement={document.getElementById('health-tree')}
                    shiftTabFocusElement={this.healthTreeNodeFocus}
                    telemetry={TelemetryFactory.get(TelemetryMainArea.Containers)}
                />
            </>
        );
    }

    /**
     * creates and registers property panel
     * @param parentContext parent view model
     */
    private registerPropertyPanel(parentContext: HealthTreeViewModel): void {
        const propertyPanelHeaderView: JSX.Element = <HealthMonitorPropertyPanelHeaderView parentContext={parentContext} />;

        const overviewTab: IDetailsPanelTab = {
            tabName: DisplayStrings.HealthDetailsPaneOverviewTabTitle,
            telemetryName: TelemetryStrings.HealthDetailsPaneOverviewTabTitle,
            body: <HealthMonitorDetailsContainerView parentContext={parentContext} />,
            tabIcon: <DetailsPageSvg />
        };

        const configTab: IDetailsPanelTab = {
            tabName: DisplayStrings.HealthDetailsPaneConfigTabTitle,
            telemetryName: TelemetryStrings.HealthDetailsPaneConfigTabTitle,
            body: <HealthMonitorConfigView parentContext={parentContext} />,
            tabIcon: <GearSvg />
        };

        const howItWorksTab: IDetailsPanelTab = {
            tabName: DisplayStrings.HealthDetailsPaneKnowledgeTabTitle,
            telemetryName: TelemetryStrings.HealthDetailsPaneKnowledgeTabTitle,
            body: <HealthMonitorHowItWorksView parentContext={parentContext} />,
            tabIcon: <InfoPageSvg />
        };

        parentContext.registerPropertyPanel(
            propertyPanelHeaderView,
            [overviewTab, configTab, howItWorksTab]);
    }
}
