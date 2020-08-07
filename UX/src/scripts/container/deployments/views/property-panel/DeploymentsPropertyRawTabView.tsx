import * as React from 'react';
import ReactJson from 'react-json-view';

import { DeploymentsPropertyRawTabViewModel } from '../../viewmodels/property-panel/DeploymentsPropertyRawTabViewModel';
import { DeploymentsPaneViewModel } from '../../viewmodels/DeploymentsPaneViewModel';

import { PortalMessagingProvider } from '../../../../shared/messaging/v2/PortalMessagingProvider';
import { BlueLoadingDots, BlueLoadingDotsSize } from '../../../../shared/blue-loading-dots';
import { ITelemetry } from '../../../../shared/Telemetry';

/**
 * props type
 */
export interface IDeploymentsPropertyRawTabViewProps {
    serviceFactory: IServiceFactory;
    parentContext: DeploymentsPaneViewModel;
    telemetry: ITelemetry;
}

/**
 * state type
 */
interface IDeploymentsPropertyRawTabViewState {
    /** context (view model) */
    context: DeploymentsPropertyRawTabViewModel;
}

/**
 * Deployments property panel raw data tab/pane
 */
export class DeploymentsPropertyRawTabView extends
    React.PureComponent<IDeploymentsPropertyRawTabViewProps, IDeploymentsPropertyRawTabViewState> {

    /**
     * initializes a new instance of the class
     * @param props component properties
     */
    constructor(props: IDeploymentsPropertyRawTabViewProps) {
        super(props);

        this.handleThemeEvent = this.handleThemeEvent.bind(this);
        PortalMessagingProvider.Instance().registerProcessor('theme', this.handleThemeEvent);

        this.state = {
            context: this.createViewModel(props),
        };

        this.state.context.switchTheme(DeploymentsPropertyRawTabView.isBodyDarkThemed());
    }

    /**
     * gets a value indicating whether dark scheme is used on the portal
     * TODO: it seems very likely all views may want this, perhaps i can work this off
     * into the BaseViewModel somehow?  that would be weird though right...
     */
    private static isBodyDarkThemed(): boolean {
        const currentBodyClassName = document.body.className;
        if (!currentBodyClassName) { return false; }

        const classes = currentBodyClassName.split(' ');
        if (!classes) { return false; }

        return (classes.indexOf('dark') > -1);
    }

    /**
     * react callback invoked to render component
     */
    public render(): JSX.Element {
        if (this.state.context.visible && this.state.context.loading) {
            return this.renderLoading();
        }

        let panelClassName = 'deploymentsPropertyPane';

        if (!this.state.context.visible) {
            panelClassName = panelClassName + ' hidden';
        }

        let body = undefined;

        if (!this.state.context.data) {
            body = this.renderNoData();
        } else {
            body = this.renderJson();
        }

        return (
            <div className={panelClassName}>
                {body}
            </div>
        );
    }

    /** render table property panel with no data */
    private renderNoData() {
        return <span>No Data</span>;
    }

    /** render the third party json visualizer control */
    private renderJson() {
        const itemStyle = {
            fontSize: '12px',
            fontFamily: '"Segoe UI", "Segoe UI", "Segoe", Tahoma, Helvetica, Arial, sans-serif',
        };

        const textColor = this.state.context.textColor;
        const backgroundColor = this.state.context.backgroundColor;

        const theme = {
            base00: backgroundColor,
            base01: textColor,
            base02: backgroundColor,
            base03: backgroundColor,
            base04: textColor,
            base05: textColor,
            base06: textColor,
            base07: textColor,
            base08: textColor,
            base09: textColor,
            base0A: textColor,
            base0B: textColor,
            base0C: textColor,
            base0D: textColor,
            base0E: textColor,
            base0F: textColor
        };

        console.log(this.state.context.data);

        return <ReactJson
            src={this.state.context.data}
            name={null}
            collapsed={false}
            displayObjectSize={false}
            displayDataTypes={false}
            iconStyle={'triangle'}
            enableClipboard={false}
            style={itemStyle}
            theme={theme}
        />;
    }

    /**
      * callback invoked to handle theme event received from the hosting blade
      */
    private handleThemeEvent(event: any): void {
        const themeName = this.getThemeName(event);
        this.state.context.switchTheme(themeName === 'dark');
    }

    /**
     * gets theme name out of hosting blade 'theme' event
     * @param event hosting blade event
     * @returns theme name of the portal (dark/light)
     */
    private getThemeName(event: any): string {
        if (!event || !event.detail || !event.detail.rawData) {
            return null;
        }

        const messageData = JSON.parse(event.detail.rawData);

        if (!messageData || !messageData.theme || !messageData.theme.name) {
            return null;
        }

        return messageData.theme.name;
    }

    /**
      * renders 'loading dots' view
      * @returns {JSX.Element} visual element to render
      */
    private renderLoading(): JSX.Element {
        return (
            <div className='deploymentsPropertyPane loading'>
                <BlueLoadingDots size={BlueLoadingDotsSize.medium} />
            </div>
        );
    }

    /**
     * creates view model for component based on properties received
     * @param props component properties
     */
    private createViewModel(props: IDeploymentsPropertyRawTabViewProps): DeploymentsPropertyRawTabViewModel {
        if (!props) { throw new Error(`@props may not be null at DeploymentsPaneView.createViewModel()`); }

        const telemetry = this.props.telemetry;
        const deploymentsService = this.props.serviceFactory.generateDeploymentsService();
        return new DeploymentsPropertyRawTabViewModel(
            telemetry,
            deploymentsService,
            this.props.parentContext,
            this.forceUpdate.bind(this)
        );
    }
}
