/** styles */
import '../../../../styles/container/HealthPane.less';

/** tpl */
import * as React from 'react';
import ReactJson from 'react-json-view';

/** shared */
import { PortalMessagingProvider } from '../../../shared/messaging/v2/PortalMessagingProvider';

/**
 * Json object view props
 */
export interface IHealthMonitorJsonInfoProps {
    /** the object to visualize */
    info?: any;
}

/**
 * Json object view state
 * 
 * NOTE: this version of react component we use inside this component does not
 *       support styling in the right way and therefore we need to handle theme
 *       switching with custom code. The component we use today will be replaced
 *       before public preview
 */
export interface IHealthMonitorJsonInfoState {
    /** text color to use */
    textColor: string;

    /** background color to use */
    backgroundColor: string;
}

/**
 * Json object visualization component
 */
export class HealthMonitorJsonInfo 
    extends React.PureComponent<IHealthMonitorJsonInfoProps, IHealthMonitorJsonInfoState> {
    /**
     * initializes an instance of the class
     * @param props component properties
     */
    public constructor(props: IHealthMonitorJsonInfoProps) {
        super(props);

        // TODO-STORY-4652585: We won't need this one we replace json visualizer 
        //       with version that produces classes on elements, no direct styles
        this.handleThemeEvent = this.handleThemeEvent.bind(this);
        PortalMessagingProvider.Instance().registerProcessor('theme', this.handleThemeEvent);
 
        this.state = HealthMonitorJsonInfo.constructState(HealthMonitorJsonInfo.isBodyDarkThemed());
    }

    /**
     * gets a value indicating whether dark scheme is used on the portal
     */
    private static isBodyDarkThemed(): boolean {
        const currentBodyClassName = document.body.className;
        if (!currentBodyClassName) { return false; } 

        const classes = currentBodyClassName.split(' ');
        if (!classes) { return false; }

        return (classes.indexOf('dark') > -1);
    }

    /**
     * builds state of the component specific to color scheme of the portal
     * @param isInDarkTheme color scheme
     * @returns {IHealthMonitorJsonInfoState} state to set fot the component
     */
    private static constructState(isInDarkTheme: boolean): IHealthMonitorJsonInfoState {
        return {
            textColor: isInDarkTheme ? '#e0e0e0' : '#000',
            backgroundColor: isInDarkTheme ? '#111111' : '#fff'
        };
    }

    /**
     * react callback invoked just before unmounting occurs
     */
    public componentWillUnmount(): void {
        PortalMessagingProvider.Instance().unregisterProcessor('theme', this.handleThemeEvent);
    }

    /**
     * react callback invoked to render component
     */
    public render(): JSX.Element {
        const itemStyle = {
            fontSize: '12px',
            fontFamily: '"Segoe UI", "Segoe UI", "Segoe", Tahoma, Helvetica, Arial, sans-serif',
        };

        const textColor = this.state.textColor;
        const backgroundColor = this.state.backgroundColor;

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

        return <ReactJson
                    src={this.props.info}
                    name={null}
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
        this.setState(
            HealthMonitorJsonInfo.constructState(themeName === 'dark'));
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
}
