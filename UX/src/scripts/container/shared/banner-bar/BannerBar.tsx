/** tpl */
import * as React from 'react';

/** local */

/** styles */
import '../../../../styles/shared/BannerBar';

/** svg */
import { CloseSvg } from '../../../shared/svg/close';

/** shared */
import { ITelemetry, TelemetryMainArea } from '../../../shared/Telemetry';
import * as TelemetryStrings from '../../../shared/TelemetryStrings';
import { DisplayStrings } from '../../../shared/DisplayStrings';
import { KeyCodes } from '../../../shared/KeyCodes';
import { TelemetryFactory } from '../../../shared/TelemetryFactory';

/** BannerBar props */
export interface IBannerBarProps {
    svg: JSX.Element;
    text: string;
    linkText: string;
    documentationUrl: string;
    buttonText?: string;
    /** 
     * onClickHandler if there is a button associated with the banner. 
     * If the banner is purely informational (health banner), 
     * then there won't be a button to click, just a close button 
     */
    onClickHandler?: () => void;
    closeOnClickHandler: () => void;
}

/** BannerBar state */
interface IBannerBarState {
    isVisible: boolean;
}

/** Houses the Banner bar (svg, color, action button...) for the CI page */
export class BannerBar extends React.Component<IBannerBarProps, IBannerBarState> {
    telemetry: ITelemetry;
    constructor(props) {
        super(props);

        this.telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
    }

    public render() {


        return (
            <div className='banner-bar'>
                <div className='banner-icon'>
                    {this.props.svg}
                </div>
                <div className='banner-text' aria-label={this.props.text}>
                    {this.generateBannerText()}
                </div>
                {this.props.onClickHandler != null ? 
                    <div className='banner-button' role='button' aria-label={this.props.buttonText} tabIndex={0}
                        onKeyPress={(event) => {
                            let keycode = (event.keyCode ? event.keyCode : event.which);
                            if (keycode === KeyCodes.ENTER) { this.props.onClickHandler(); }
                        }}
                        onClick={this.props.onClickHandler}
                    >
                        {this.props.buttonText}
                    </div> : <></>
                }
                <div className='banner-close' role='button' aria-label={DisplayStrings.Close} tabIndex={0}
                    onKeyPress={(event) => {
                        let keycode = (event.keyCode ? event.keyCode : event.which);
                        if (keycode === KeyCodes.ENTER) { this.props.closeOnClickHandler(); }
                    }}
                    onClick={this.props.closeOnClickHandler}
                >
                    <CloseSvg />
                </div>
            </div>
        );
    }

    /**
     * Generates HTML from the banner and link text
     * Dynamically replaces the {0} string in bannerText with <a>linkText</a>
     * Only one hyperlink is expected to be in the bannerText
     */
    private generateBannerText() {
        let bannerTextPieces = this.props.text.split('{0}');
        let bannerTextJSXPieces: JSX.Element[] = bannerTextPieces.map(text => <span>{text}</span>);
        let hyperLinkJSX = 
            <a href={this.props.documentationUrl} target='_blank'
                onClick={() => {
                    this.telemetry.logNavigationEvent(TelemetryStrings.ContainerMainPage, this.props.documentationUrl)
                }}
            >
                {this.props.linkText}
            </a>;
        if (bannerTextJSXPieces.length === 2) { 
            bannerTextJSXPieces = [bannerTextJSXPieces[0], hyperLinkJSX, bannerTextJSXPieces[1]];
        } 
        return bannerTextJSXPieces;
    }
}
