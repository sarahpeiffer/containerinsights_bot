/** tpl */
import * as React from 'react';
/** local */
import { ITelemetry } from './Telemetry';
/** styles */
import '../../styles/shared/DocumentationLink';
/** svg */
import { hyperlinkSVG } from './svg/hyperlink';

interface ILearnAboutCILinkProps {
    telemetry: ITelemetry;
    telemetryOrigin: string;
    telemetryDestination: string;
    url: string;
    displayString: string;
}
export const DocumentationLink: React.StatelessComponent<ILearnAboutCILinkProps> = ({ 
    telemetry, 
    telemetryOrigin, 
    telemetryDestination, 
    url,
    displayString
}) => {
    return (
        <a className='documentation-link' href={url} target='_blank'
        onClick={() => telemetry.logNavigationEvent(telemetryOrigin, telemetryDestination)}>
            {displayString}    
            <span className='hyperlink-svg'>{hyperlinkSVG}</span>
        </a>
    );
}
