import * as React from 'react';
import { Utility } from '../Utilities/Utility';

/**
 * `onClick()` a defined action that takes the end-user to some destination be it
 * a blade or perform some action expected from a quick link.
 * `icon` typically an SVG element
 * `label` text string that is appended to the `icon`
 *
 * @export
 * @interface IQuickLinkProps
 */
export interface IQuickLinkProps {
    onClick: (e?: any) => void;
    icon: JSX.Element;
    label: String;
    key: string;
}

/**
 * An element for quick links section where it will invoke the `onClick()` handler
 * which will take you to some destination. The `icon` is prepended to the `label`
 * string.
 *
 * @export
 */
export const QuickLink: React.StatelessComponent<IQuickLinkProps> = (props) => {
    return <div
            key={props.key}
            className='quick-link-row'
            onClick={props.onClick}
            onKeyDown={(e) => {Utility.AffirmativeKeyDown(e, props.onClick)}}
            tabIndex={0}
            role='link'
            aria-label={props.label.toString()}
        >
        {props.icon}
        <span>{props.label}</span>
    </div>
}
