import * as React from 'react';

import { Utility } from '../../../shared/Utilities/Utility';

export interface ChartIconProps {
    title: string;
    icon: JSX.Element;
    action: () => void;
    isDisabled?: boolean;
}

export class ChartIcon extends React.Component<ChartIconProps> {
    constructor(props: ChartIconProps) {
        super(props);
    }

    public render(): JSX.Element {
        return <div
            className={this.props.isDisabled ? 'disabled-icon' : 'icon'}
            title={this.props.title}
            onClick={this.props.action}
            tabIndex={0}
            onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                Utility.AffirmativeKeyDown(e, this.props.action)
            }}
            role='button'
        >
            {this.props.icon}
        </div>
    }
}
