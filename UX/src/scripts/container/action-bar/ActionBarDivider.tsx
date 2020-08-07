/** tpl */
import * as React from 'react';

/** styles */
import '../../../styles/container/ActionBar';

/** svg */
import { DividerLineSvg } from '../../shared/svg/divider-line';

export const ActionBarDivider: React.StatelessComponent = () => {    
    return (
        <div className='item item-seperator' aria-label={'divider-svg'}>
            <div className='item-container'>
                <div className='item-icon'><DividerLineSvg/></div>
            </div>
        </div>
    );
};
