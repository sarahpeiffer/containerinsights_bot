/** block / third party */
import * as React from 'react';
import update = require('immutability-helper');

import { ChevronRightSvg } from '../svg/chevron-right';
import { ChevronDownSvg } from '../svg/chevron-down';

/**
 * Styles
 */
import '../../../styles/shared/PropertyPanel.less';
import { ITelemetry } from '../Telemetry';
import { PropertyPanelType } from '../../container/data-provider/KustoPropertyPanelResponseInterpreter';

export enum ExpandableSectionId {
    EnvironmentVariables = 'Environment Variables',
    LocalDiskCapacity= 'Local Disk Capacity',
    ContainerLimitsAndRequests = 'Container Limits and Requests',
    Labels = 'Labels'
}

export interface ExpandableSectionIdObject {
    propertyPanelId: PropertyPanelType;
    expandableSectionId: ExpandableSectionId;
}

/**
 * this component need expand/collasp icon, title, and content to expand/collasp
 */
export interface IExpandableSectionProps {
    title: string;
    content: JSX.Element;
    telemetry: ITelemetry;
    titleIcon?: JSX.Element;
    statusIcon?: JSX.Element;
    subTitle?: string;
    expandIcon?: JSX.Element;
    collapseIcon?: JSX.Element;
    // default false
    isExpanded?: boolean;
    button?: JSX.Element;
    // identifies the content of the expandable section
    id?: ExpandableSectionIdProp;
}

export interface ExpandableSectionIdProp {
    propertyPanelId: PropertyPanelType,
    expandableSectionId: ExpandableSectionId
}

/**
 * used to check if the component is expand or not 
 */
export interface IExpandableSectionState {
    /**
     * True if content is visible in the section 
     */
    isExpanded: boolean;
}

/**
 * Expandable/Collapsable section of the property panel
 */
export class ExpandableSection extends React.Component<IExpandableSectionProps, IExpandableSectionState> {
    private expandIcon: JSX.Element = <ChevronRightSvg />;
    private collapseIcon: JSX.Element = <ChevronDownSvg />;

    constructor(props?: IExpandableSectionProps) {
        super(props);

        // section is collapsed by default
        this.state = { isExpanded: this.props.isExpanded || false };

        if (this.props.expandIcon) {
            this.expandIcon = this.props.expandIcon;
        }

        if (this.props.collapseIcon) {
            this.collapseIcon = this.props.collapseIcon;
        }

        this.onExpandCollapseAction = this.onExpandCollapseAction.bind(this);
    }

    /**
     * Update compnent when new property set is received
     * @param nextProps New property set
     */
    public componentWillReceiveProps(nextProps: IExpandableSectionProps) {
        this.setState({ isExpanded: nextProps.isExpanded });
    }

    /** 
     * public render method (react)
     * @returns {JSX.Element} Component visualization
    */
    public render(): JSX.Element {
        if (!this.props || !this.props.title) {
            return (<div></div>);
        }

        const icon: JSX.Element = this.state.isExpanded ? this.collapseIcon : this.expandIcon;
        const content: JSX.Element = this.state.isExpanded
            ? <div className='expandable-section-body'>{this.props.content}</div>
            : <div></div>;
        const subTitle: JSX.Element = this.props.subTitle
            ? <div className='expandable-section-subtitle'>{this.props.subTitle}</div>
            : <div></div>;
        let title: JSX.Element; 
        if (this.props.titleIcon && this.props.statusIcon) {
            title = <div>{this.props.titleIcon} {this.props.title} {this.props.statusIcon}</div>;
        } else if (this.props.titleIcon) {
            title = <div>{this.props.titleIcon} {this.props.title}</div>;
        } else if (this.props.statusIcon) {
            title = <div>{this.props.title} {this.props.statusIcon}</div>;
        } else {
            title = <div>{this.props.title}</div>;
        }
        const button: JSX.Element = this.state.isExpanded
            ? <>{this.props.button}</>
            : null;

        return (
            <div className={'expandable-section'}>
                <div className={'expandable-section-header'}
                    onClick={() => this.onExpandCollapseAction(null)}
                    onKeyPress={(e) => this.onExpandCollapseAction(e)}
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
                {content}
                {button}
            </div>
        );
    }

    /**
     * Executed when section header is clicked to expand/collapse
     */
    private onExpandCollapseAction(event?: any) {
        let keycode = (event === null)
                        ? -1
                        : (event.keyCode
                            ? event.keyCode
                            : event.which);
        if (event === null || keycode === 13 || keycode === 32) {
            this.setState(
                (prevState) => {
                    
                    let newState = update(prevState, {
                        isExpanded: { $set: !this.state.isExpanded }
                    });
                    
                    if (prevState.isExpanded === false && newState.isExpanded === true) {
                        let telemetryIds = this.props.id;
                        this.props.telemetry.logEvent(
                            `PropertyPanel::ExpandableSection::Opened`, 
                            { 
                                propertyPanelId: telemetryIds ? telemetryIds.propertyPanelId : '<null>',  
                                expandableSectionId: telemetryIds ? telemetryIds.expandableSectionId : '<null>'
                            },
                            null
                        );
                    }

                    return newState;
                }
            );
        }
    }
}
