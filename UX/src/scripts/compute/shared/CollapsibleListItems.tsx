import * as React from 'react';

import { ChevronRightSvg } from '../../shared/svg/chevron-right';
import { ChevronDownSvg } from '../../shared/svg/chevron-down';
import { ITelemetry } from '../../shared/Telemetry';
import { Utility } from '../../shared/Utilities/Utility';

import '../../../styles/shared/CollapsibleList.less';

export interface CollapsibleListItemsProps {
    topLabel: string;
    telemetry: ITelemetry;
    topIcon?: JSX.Element;
    topClick?: (event: React.MouseEvent<HTMLAnchorElement>, label: string) => void;
    listLabels: string[];
    listIcons?: JSX.Element[];
    listClick?: (event: React.MouseEvent<HTMLAnchorElement>, label: string) => void;
    subList?: JSX.Element;
    collapsed?: boolean;
    logPrefix?: string;
}

export interface CollapsibleListItemsState {
    collapsed: boolean;
}

/**
 * Used within an existing `<ul>` (or `<ol>`, but not tested). The `topLabel` refers to the
 * top-level `<li>` while the `listLabels` refers to the nested `<ul>` which is collapsible
 * depending on the top-level `<li>`. Icons can also be passed in which are prepended to the
 * respective labels. For the time being, icons are expected to be SVGs.
 *
 * @export
 * @class CollapsibleListItems
 * @extends {React.Component<CollapsibleListItemsProps, CollapsibleListItemsState>}
 */
export class CollapsibleListItems extends React.Component<CollapsibleListItemsProps, CollapsibleListItemsState> {
    constructor(props: CollapsibleListItemsProps) {
        super(props);

        this.state = {
            collapsed: this.props.collapsed === undefined ? true : this.props.collapsed
        };

        this.toggleCollapsed = this.toggleCollapsed.bind(this);
        this.renderListItems = this.renderListItems.bind(this);
    }

    public render(): JSX.Element {
        const collapsedClassName: string = this.state.collapsed ? 'collapsed' : '';
        const chevronIcon: JSX.Element = this.state.collapsed ? <ChevronRightSvg /> : <ChevronDownSvg />;
        let topLabelElement: JSX.Element = <>{this.props.topLabel}</>;
        if (!!this.props.topClick) {
            topLabelElement = <a href='#'
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    this.props.topClick(e, this.props.topLabel);
                }}
                onKeyDown={(e) => {Utility.AffirmativeKeyDown(e, () => {
                    this.props.topClick(e as any, this.props.topLabel);
                })}}
                tabIndex={0}
            >{this.props.topLabel}</a>;
        }
        return <>
            <li className={'collapsible-list-item ' + collapsedClassName}>
                <span
                    className='chevron'
                    onClick={this.toggleCollapsed}
                    onKeyDown={(e) => {Utility.AffirmativeKeyDown(e, this.toggleCollapsed)}}
                    tabIndex={0}
                >{chevronIcon}</span>{this.props.topIcon} {topLabelElement}
            </li>
            {this.renderListItems()}
        </>
    }

    private toggleCollapsed(): void {
        this.props.telemetry.logEvent(`${this.props.logPrefix}.ToggleCollapsed.${this.props.topLabel}`,
            {currentState: this.state.collapsed + ''}, undefined);
        this.setState({
            collapsed: !this.state.collapsed
        });
    }

    private renderListItems(): JSX.Element {
        if (!this.props.listLabels) {
            return null;
        }

        const listItems: JSX.Element[] = [];
        for (let i = 0; i < this.props.listLabels.length; ++i) {
            const listLabel: string = this.props.listLabels[i];
            let listIcon: JSX.Element = null;
            if (!!this.props.listIcons) {
                listIcon = this.props.listIcons[i];
            }
            let listLabelElement: JSX.Element = <>{listLabel}</>;
            if (!!this.props.listClick) {
                listLabelElement = <a
                    href='#'
                    onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                        this.props.listClick(e, listLabel);
                    }}
                    onKeyDown={(e) => {Utility.AffirmativeKeyDown(e, () => {
                        this.props.listClick(e as any, listLabel);
                    })}}
                    tabIndex={0}
                >{listLabel}</a>;
            }
            const listItem: JSX.Element = <li key={listLabel}><span className='spaceball'></span>{listIcon} {listLabelElement}</li>;
            listItems.push(listItem);
        }

        if (this.props.subList) {
            listItems.push(this.props.subList);
        }

        const collapsedClassName: string = this.state.collapsed ? 'collapsed' : '';
        return <ul className={'collapsible-list ' + collapsedClassName}>{listItems}</ul>;
    }
}
