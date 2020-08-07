import * as React from 'react';
import update = require('immutability-helper');

import { ChevronRightSvg } from '../svg/chevron-right';
import { ChevronDownSvg } from '../svg/chevron-down';
import { Utility } from '../Utilities/Utility';
import { DisplayStrings } from '../DisplayStrings';

import '../../../styles/compute/PropertyPanel.less';

export interface IExpandableSection2Props {
    title: string;
    content: JSX.Element;
    titleIcon?: JSX.Element;
    statusIcon?: JSX.Element;
    subTitle?: string;
    expandIcon?: JSX.Element;
    collapseIcon?: JSX.Element;
    // default false
    isExpanded?: boolean;
    button?: JSX.Element;
    initialExpandAction?: () => void;
}

export interface IExpandableSection2State {
    isExpanded: boolean;
    initialExpand: boolean;
}

export class ExpandableSection2 extends React.Component<IExpandableSection2Props, IExpandableSection2State> {
    private expandIcon: JSX.Element = <ChevronRightSvg />;
    private collapseIcon: JSX.Element = <ChevronDownSvg />;

    constructor(props?: IExpandableSection2Props) {
        super(props);

        // section is collapsed by default
        this.state = {
            isExpanded: this.props.isExpanded,
            initialExpand: true
        };

        if (this.props.expandIcon) {
            this.expandIcon = this.props.expandIcon;
        }

        if (this.props.collapseIcon) {
            this.collapseIcon = this.props.collapseIcon;
        }

        this.onExpandCollapseAction = this.onExpandCollapseAction.bind(this);
    }

    public render(): JSX.Element {
        if (!this.props || !this.props.title) {
            return (null);
        }

        const icon: JSX.Element = this.state.isExpanded ? this.collapseIcon : this.expandIcon;
        const content: JSX.Element = this.state.isExpanded ? <>{this.props.content}</> : null;
        const subTitle: JSX.Element = this.props.subTitle ? <div className='expandable-section-subtitle'>{this.props.subTitle}</div> : null;
        const title: JSX.Element = <div className='expandable-section-maintitle'>
            {this.props.titleIcon}
            <span className='expandable-section-maintitle-span'>{this.props.title}</span>
            {this.props.statusIcon}
        </div>;
        const button: JSX.Element = this.state.isExpanded ? <>{this.props.button}</> : null;
        const expandableSectionBodyClassName: string = this.state.isExpanded ? 
            (this.props.title === DisplayStrings.QuickLinks ? 'expandable-section-body quick-link' : 'expandable-section-body') 
                : 'expandable-section-body';

        return (
            <div className={'expandable-section-2'}>
                <div className={'expandable-section-header'}
                    onClick={() => this.onExpandCollapseAction(null)}
                    onKeyDown={(e) => {Utility.AffirmativeKeyDown(e, () => {
                        this.onExpandCollapseAction(e as any);
                    })}}
                    aria-label={this.props.title}
                    aria-expanded={this.state.isExpanded ? true : false} // if state variable is not defined we set it to false
                    role='button'
                    tabIndex={0}
                >
                    <div className='expandable-section-icon'>{icon}</div>
                    <div className='expandable-section-title'>
                        {title}
                        {subTitle}
                    </div>
                </div>
                <div className={expandableSectionBodyClassName}>{content}</div>
                {button}
            </div>
        );
    }

    private onExpandCollapseAction(event?: any) {
        let keycode = (event === null)
                        ? -1
                        : (event.keyCode
                            ? event.keyCode
                            : event.which);
        if (event === null || keycode === 13 || keycode === 32) {
            let initialExpand = this.state.initialExpand;
            if (this.state.initialExpand && this.props.initialExpandAction) {
                initialExpand = false;
                this.props.initialExpandAction();
            }
            this.setState(
                (prevState) => {
                    let newState = update(prevState, {
                        isExpanded: { $set: !this.state.isExpanded },
                        initialExpand: { $set: initialExpand }
                    });

                    return newState;
                }
            );
        }
    }
}
