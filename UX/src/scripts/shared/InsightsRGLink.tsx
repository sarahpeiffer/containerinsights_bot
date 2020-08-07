import * as React from 'react';
import { DisplayStrings } from './DisplayStrings';
import * as TelemetryStrings from './TelemetryStrings';

import { IMessagingProvider } from './MessagingProvider';
import '../../styles/shared/InsightsRGButton';
import { TelemetryFactory } from './TelemetryFactory';
import { TelemetryMainArea, ITelemetry } from './Telemetry';
import { ResourceGroupSVG } from './svg/resource-group';

/** React properties for the IInsightsRGButtonProperties */
export interface IInsightsRGLinkProps {
    messageProvider: IMessagingProvider;
    telemetrySource: string;
   /** mechanism for overwriting the wrapper div's class name */
   wrapperClassName?: string;
   /** mechanism for overwriting the svg wrapper div's class name */
   svgClassName?: string;
   /** mechanism for overwriting the text wrapper div's class name */
   textClassName?: string;
}

/** Main react component for the InsightsRGButton */
export class InsightsRGLink extends React.Component<IInsightsRGLinkProps> {
    telemetry: ITelemetry;
    constructor(props) {
        super(props);

        this.telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
        this.openResourceGroupInsights = this.openResourceGroupInsights.bind(this);
    }

    /**
     * Component.render() primary react render implementation
     * @returns {JSX.Element}
     */
    public render(): JSX.Element {
        let wrapperClassName = this.props.wrapperClassName ? this.props.wrapperClassName : 'default-insights-rg-button';
        let svgClassName = this.props.svgClassName ? this.props.svgClassName : 'svg';
        let textClassName = this.props.textClassName ? this.props.textClassName : 'text';
        
        return (
            <a className={wrapperClassName} 
            onClick={() => {
                this.telemetry.logNavigationEvent(this.props.telemetrySource, TelemetryStrings.ResourceGroupInsights);
                this.openResourceGroupInsights(); 
            }}
            onKeyPress={(e) => {
                let keycode = (e.keyCode ? e.keyCode : e.which);
                if (keycode === 13) {
                    this.telemetry.logNavigationEvent(this.props.telemetrySource, TelemetryStrings.ResourceGroupInsights);
                    this.openResourceGroupInsights();
                }
            }}
            tabIndex={0}
            aria-label={DisplayStrings.ContainerGoToResourceGroupInsights}>
                <div className={svgClassName}><ResourceGroupSVG /></div>
                <div className={textClassName}>{DisplayStrings.ContainerGoToResourceGroupInsights}</div>
            </a>
        );
    }

    /** Sends a message to ME that navigates to rseource group insights page */
    private openResourceGroupInsights(): void {
        this.props.messageProvider.sendNavigateToResourceGroupInsights();
    }
}
