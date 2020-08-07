import * as React from 'react';
import { GettingStartedTabViewModel } from './GettingStartedTabViewModel';
import { ITelemetry, TelemetrySubArea } from '../../../shared/Telemetry';
import { GettingStartedHeader } from './components/GettingStartedHeader';
import './GettingStartedTab.less';
import { IGettingStartedCardProps, GettingStartedCard, IGettingStartedCardLinkProps, GettingStartedCardLink } from './components/GettingStartedCard';
import { ViewInsightsSvg } from '../../../shared/svg/view-insights';
import { OnboardSvg } from '../../../shared/svg/onboard';
import { AlertsSvg } from '../../../shared/svg/alerts';
import { DisplayStrings } from '../../MulticlusterDisplayStrings';
import * as TelemetryStrings from '../../../shared/TelemetryStrings';

export interface IGettingStartedViewProps {
    telemetry: ITelemetry;
    viewMonitoredClustersOnClickHandler: (e) => void;
    onboardUnmonitoredClustersOnClickHandler: (e) => void;
}
export interface IGettingStartedViewState {
    context: GettingStartedTabViewModel;
}

export class GettingStartedTabView extends React.Component<IGettingStartedViewProps, IGettingStartedViewState> {
    private _telemetry: ITelemetry;

    /**
     * ctor()
     * creates the view model
     * @param props 
     */
    constructor(props) {
        super(props);
        this._telemetry = props.telemetry;

        this.state = {
            context: this.createViewModel(props)
        };
    }

    /** react callback invoked to render component */
    public render(): JSX.Element {
        return (
            <div className='getting-started-tab-content'>
                <div className='getting-started-header-positioner'>
                    <GettingStartedHeader />
                </div>
                <div className='cards-container'>
                    {this.renderCards()}
                </div>
            </div>
        );
    }
    public componentDidUpdate(prevProps) {  
        if (this._telemetry) {
            this._telemetry = this.props.telemetry;
            this._telemetry.setContext({ subArea: TelemetrySubArea.MulticlusterGetStartedTab }, false);
        }
    }

    /** Maps the card objects that are specified in this view into JSX cards that can be fed into the render function */
    private renderCards(): JSX.Element[] {
        return this.getCardsObjects().map(card => {
            return ('onClickHandler' in card) ? <GettingStartedCard {...card}/> : <GettingStartedCardLink {...card}/>
        });
    }

    /**
     * Returns the data for each card that should be rendered 
     */
    private getCardsObjects(): (IGettingStartedCardProps|IGettingStartedCardLinkProps)[] {
        const cards: (IGettingStartedCardProps|IGettingStartedCardLinkProps)[] = [];
        const viewMonitoredClustersCard = {
            image: <ViewInsightsSvg />,
            title: DisplayStrings.ViewMonitoredClustersCardTitle,
            text: DisplayStrings.ViewMonitoredClustersCardText,
            onClickHandler: this.props.viewMonitoredClustersOnClickHandler,
            buttonText: DisplayStrings.ViewMonitoredClustersCardButtonText,
            telemetry: this._telemetry,
            telemetryString: TelemetryStrings.ViewMonitoredClustersCardButton
        };  
        const onboardUnmonitoredClustersCard = {
            image: <OnboardSvg />,
            title: DisplayStrings.OnboardUnmonitoredClustersCardTitle,
            text: DisplayStrings.OnboardUnmonitoredClustersCardText,
            onClickHandler: this.props.onboardUnmonitoredClustersOnClickHandler,
            buttonText: DisplayStrings.OnboardUnmonitoredClustersCardButtonText,
            telemetry: this._telemetry,
            telemetryString: TelemetryStrings.OnboardUnmonitoredClustersCardButton
        }
        const createAlertsCard = {
            image: <AlertsSvg />,
            title: DisplayStrings.CreateAlertsCardTitle,
            text: DisplayStrings.CreateAlertsCardText,
            href: 'https://aka.ms/ci-alerts',
            buttonText: DisplayStrings.CreateAlertsCardButtonText,
            telemetry: this._telemetry,
            telemetryString: TelemetryStrings.CreateAlertsCardButton
        }

        cards.push(viewMonitoredClustersCard);
        cards.push(onboardUnmonitoredClustersCard);
        cards.push(createAlertsCard);

        return cards;
    }

    /**
     * creates view model for component based on properties received
     * @param props component properties
     */
    private createViewModel(props: IDeploymentsPaneViewProps): GettingStartedTabViewModel {
        if (!props) { throw new Error(`@props may not be null at GettingStartedTab.createViewModel()`); }

        return new GettingStartedTabViewModel(
            this._telemetry,
            null,
            this.forceUpdate.bind(this)
        );
    }
}
