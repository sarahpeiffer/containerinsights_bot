import * as React from 'react';
import { DisplayStrings } from './DisplayStrings';

import '../../styles/shared/Grid.less';

export class ErrorStatusProps {
    isVisible: boolean;
    isTroubleShootingMsgVisible?: boolean;
    message: string;
}

export const ErrorStatus: React.StatelessComponent<ErrorStatusProps> = ({message, isVisible, isTroubleShootingMsgVisible}) => {

    const troubleShootingLink = isTroubleShootingMsgVisible ?
                    <a className='troubleshooting-link ' href='https://aka.ms/containerhealthtroubleshoot' target='_blank'>
                        {DisplayStrings.ContainerTroubleshootingLinkText}
                    </a>
                : <div></div>

    return isVisible 
    ?   <div className='center-wrapper'>
            <div className='error-banner'>
                <span className='error-banner-text'>{message}</span>
                {troubleShootingLink}
            </div>
        </div>
    : <div></div>;
};
