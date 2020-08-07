/** tpl */
import * as React from 'react';

/** local */
import { IActionItem } from './ActionBar';

/** styles */
import '../../../styles/container/ActionBar';

/** props for ActionBarButton */
interface IActionButtonProps {
    actionItem: IActionItem
}

export const ActionBarButton: React.StatelessComponent<IActionButtonProps> = ({actionItem}) => {
    let wrapperClassName = 'item';
    wrapperClassName += actionItem.isDisabled ? ' disabled' : '';
    
    // nib: This button is implemented as a div because the native styles for button 
    // make it difficult to style all the action bar items identically 
    return (
        <div 
        className={wrapperClassName}
        onClick={actionItem.action} 
        onKeyPress={(e) => {
            let keycode = (e.keyCode ? e.keyCode : e.which);
            if (keycode === 13) {
                actionItem.action();
            }
        }}
        aria-label={actionItem.text}
        role='button'
        tabIndex={0}>
            <div className='item-container'>
                <div className='item-icon'>{actionItem.svg}</div>
                <div className='item-text'>{actionItem.text}</div>
            </div>
        </div>
    );
};
