/** styles */
import '../../../../styles/container/HealthPane.less';

/** svgs */
import { NestingIndicatorExpandedSVG } from '../../../shared/svg/nesting-indicator-expanded';
import { NestingIndicatorCollapsedSVG } from '../../../shared/svg/nesting-indicator-collapsed';

/** tpl */
import * as React from 'react';

/** local */
import { HealthMonitorIconProvider } from './HealthMonitorIconProvider';
import { HealthServicesFactory } from '../factories/HealthServicesFactory';
import { HealthTreeNodeViewModel } from '../viewmodels/HealthTreeNodeViewModel';
import { HealthTreeViewModel } from '../viewmodels/HealthTreeViewModel';
import { DisplayStrings } from '../../../shared/DisplayStrings';

/**
 * Health monitor tree node view component props
 */
interface IHealthTreeNodeViewProps {
    /** parent context (view model) */
    parentContext: HealthTreeViewModel;

    /** monitor (instance) id */
    monitorIdentifier: string;
}

/** 
 * interface for Health Tree Node View State
 */
interface IHealthTreeNodeViewState {
    /** health monitor tree node view model */
    context: HealthTreeNodeViewModel;
}

/**
 * Health monitor tree node view component
 */
export class HealthTreeNodeView extends React.PureComponent<IHealthTreeNodeViewProps, IHealthTreeNodeViewState> {
    focusedTreeNode: HTMLElement;

    /**
     * initializes an instance of the class
     * @param props component properties
     */
    public constructor(props: IHealthTreeNodeViewProps) {
        super(props);

        const viewModel = new HealthTreeNodeViewModel(
            HealthServicesFactory.instance,
            props.parentContext as HealthTreeViewModel,
            this.forceUpdate.bind(this));

        this.state = { context: viewModel };

        this.onSelect = this.onSelect.bind(this);
        this.onToggleExpand = this.onToggleExpand.bind(this);
        this.setFocusedTreeNode = this.setFocusedTreeNode.bind(this);
    }

    /**
     * react callback invoked just before mounting occurs
     * 
     * TODO: replace with static getDerivedStateFromProps(props, state) when switching react v17+
     */
    public componentWillMount(): void {
        this.state.context.initialize(this.props.monitorIdentifier);
    }

    /**
     * react callback invoked just before rendering when new props or state are being received
     * @param nextProps updated (target) component properties
     * 
     * TODO: replace with static getDerivedStateFromProps(props, state) when switching react v17+
     */
    public componentWillUpdate(nextProps: IHealthTreeNodeViewProps): void {
        if (this.props.monitorIdentifier !== nextProps.monitorIdentifier) {
            this.state.context.initialize(nextProps.monitorIdentifier);
        }
    }

    /**
     * react callback invoked to render component
     */
    public render(): JSX.Element {
        const context = this.state.context;

        const monitorDivClass = 'health-tree-row-span' + (context.isSelected ? ' selected' : '');

        return (
            <>
                <div
                    className={monitorDivClass}
                    onClick={this.onSelect}
                    tabIndex={0}
                    onKeyUp={event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            this.onSelect(event);
                            setTimeout(() => document.getElementById('property-panel2').focus(), 1);
                            event.stopPropagation();
                        }
                    }}
                    role='button'
                    aria-haspopup={context.isExpandable ? 'tree' : 'false'}
                    aria-label={`${DisplayStrings.HealthTreePaneTreeNodeAriaLabel} ${context.inTreeDisplayName}`}
                    aria-selected={context.isSelected ? true : false}
                >
                    {this.renderExpandCollapseControl()}
                    <div className='health-monitor-icon'>{HealthMonitorIconProvider.getIcon(context.state)}</div>
                    <div className='health-monitor-display-name'>
                        <span title={context.inTreeDisplayName}>{context.inTreeDisplayName}</span>
                    </div>
                </div>
                {this.renderChildren()}
            </>
        );
    }

    /**
     * renders expand/collapse control for tree node
     */
    private renderExpandCollapseControl(): JSX.Element {
        const context = this.state.context;

        if (context.isExpandable) {
            return (
                <div
                    className='health-monitor-expand-collapse-button'
                    onClick={this.onToggleExpand}
                    tabIndex={0}
                    onKeyUp={event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            this.onToggleExpand(event);
                        }
                    }}
                    aria-label={context.isExpanded ? DisplayStrings.ExpandHealthTreeNode : DisplayStrings.CollapseHealthTreeNode}
                >
                    {context.isExpanded
                        ? <NestingIndicatorExpandedSVG className='size-nesting-indicators' />
                        : <NestingIndicatorCollapsedSVG className='size-nesting-indicators' />}
                </div>
            );
        }

        return (
            <div className='health-monitor-expand-collapse-button'></div>
        );
    }

    /**
     * renders member monitors if any
     */
    private renderChildren(): JSX.Element {
        const context = this.state.context;
        if (!context.isExpanded) { return null; }

        const childMonitorIdentifiers = context.children;
        const childElements = new Array<JSX.Element>();

        for (const childMonitorIdentifier of childMonitorIdentifiers) {
            const childElement: JSX.Element =
                <HealthTreeNodeView
                    parentContext={this.props.parentContext}
                    monitorIdentifier={childMonitorIdentifier}
                />;

            childElements.push(childElement);
        }

        return <div className='child-row-container'>{childElements}</div>;
    }

    /**
     * makes access to this.state property of the component possible in 'random' callback
     * @returns promise of operation completion - use of state is safe in .then() of returned value
     */
    private getSafeComponentState(): Promise<void> {
        return new Promise((resolve) => {
            this.setState({}, () => {
                resolve();
            });
        });
    }
    /**
     * callback invoked when expand/collapse control is clicked
     * @param evt click event
     */
    private onToggleExpand(evt): void {
        evt.stopPropagation();

        this.getSafeComponentState().then(() => {
            this.state.context.onToggleExpand();
        });
    }

    /**
     * callback invoked when tree node is selected
     * @param evt click event
     */
    private onSelect(evt): void {
        evt.stopPropagation();

        this.getSafeComponentState().then(() => {
            this.state.context.onSelect(this.props.monitorIdentifier);
        });
    }

    private setFocusedTreeNode(treeNode: HTMLElement) {
        this.focusedTreeNode = treeNode;
    }
}
