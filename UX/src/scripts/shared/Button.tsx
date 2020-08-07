import * as React from 'react';
import { Utility } from './Utilities/Utility';

export interface IButtonProps {
    label: string;
    action?: () => void;
    className?: string;
}

/**
 * Generic button, styling provided elsewhere (Ibiza?)
 *
 * @export
 * @class Button
 * @extends {React.Component<IButtonProps>}
 */
export class Button extends React.Component<IButtonProps> {
    constructor(props: IButtonProps) {
        super(props);
    }

    public render(): JSX.Element {
        return <button className={'button ' + (this.props.className || '')}
            onClick={() => {
                if (this.props.action) {
                    this.props.action();
                }
            }}
            onKeyDown={(e) => { Utility.AffirmativeKeyDown(e, () => {
                if (this.props.action) {
                    this.props.action();
                }
            })}}
        >
            {this.props.label}
        </button>;
    }
}
