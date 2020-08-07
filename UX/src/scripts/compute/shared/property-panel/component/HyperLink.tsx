/** block / third party */
import * as React from 'react';
import { hyperlinkSVG } from '../../../../shared/svg/hyperlink';

/** 
 * Properties of the HyperLink component
*/
export interface IHyperLinkProps {
    /**
     * going linkUrl 
     */ 
    linkUrl: string;
    /**
     * display string
     */
    displayString: string;
}

/**
 * Hyper Link 
 */
export class HyperLink extends React.Component<IHyperLinkProps> {
    constructor(props?: IHyperLinkProps) {
        super(props);
    }

    public render() {
        return (<div className='hyper-link-statement'>
            <a href={this.props.linkUrl} target='_blank'>
                {this.props.displayString}
                <span className='hyperlink-svg'>{hyperlinkSVG}</span>
            </a>
        </div>);
    }
}

