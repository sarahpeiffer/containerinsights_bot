import * as React from 'react';

import '../../../styles/shared/SwitchToggle.less';

export interface SwitchToggleProps {
    labelTrue: string;
    labelFalse: string;
    // False (left), True (right)
    toggleState: boolean;
    onClick: () => void;
    tooltipTrue?: string;
    tooltipFalse?: string;
}

/**
 * Has two options, default state should be `false` which is on the left side while
 * `true` option is on the right side.
 */
export class SwitchToggle extends React.Component<SwitchToggleProps> {
    constructor(props: SwitchToggleProps) {
        super(props);
    }

    public render(): JSX.Element {
        const switchToggleState: string = `toggle-switch-state ${this.props.toggleState}`;
        return (
            <div className='toggle-switch' onClick={this.props.onClick}>
                <span className='toggle-switch-label' title={this.props.tooltipFalse}>{this.props.labelFalse}</span>
                <div className='toggle-switch-button'>
                    <div className={switchToggleState}></div>
                </div>
                <span className='toggle-switch-label' title={this.props.tooltipTrue}>{this.props.labelTrue}</span>
            </div>
        );
    }
}
