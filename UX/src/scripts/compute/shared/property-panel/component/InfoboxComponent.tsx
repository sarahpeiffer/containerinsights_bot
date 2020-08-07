import * as React from 'react';
import { LinkText, ILink } from './LinkText';
import { InfoBlueSVG } from '../../../../shared/svg/InfoBlue';

export enum InfoBoxType {
    Info = 1,
    Error = 2,
    Warning = 3
}
export interface IInfoBoxProps {
    message: string;
    links?: ILink[];
    type?: InfoBoxType,
    icon?: JSX.Element,
}

/**
 * This class is responsible to create Infobox. This infobox can embedded links in the body of the text.
 * It currently supports two states: Info and Error. There is a default icon for the InfoBox, however user can
 * provide a different icon based on their need as wel.
 *
 * @export
 * @class InfoBoxComponent
 * @extends {React.Component<IInfoBoxProps>}
 */
export class InfoBoxComponent extends React.Component<IInfoBoxProps> {
    constructor(props: IInfoBoxProps) {
        super(props);
    }

    public render(): JSX.Element {
        const infoBodyClassName: string = this.props.type && this.props.type === InfoBoxType.Error ? ' error-state' : '';
        return (
            <div className='info-box-component'>
                <div className={'info-box-body' + infoBodyClassName}>
                    <span className='info-box-icon'>
                        {this.props.icon || <InfoBlueSVG />}
                    </span>
                    <span className='info-box-content'>
                        <LinkText
                            message={this.props.message}
                            links={this.props.links}
                        />
                    </span>
                </div>
            </div>
        )
    }
}
