import * as React from 'react';

import { DeploymentsPropertyDescribeTabViewModel } from '../../viewmodels/property-panel/DeploymentsPropertyDescribeTabViewModel';
import { DeploymentsPaneViewModel } from '../../viewmodels/DeploymentsPaneViewModel';
import { DescribeResponseInterpretor } from '../../response-interpretors/DescribeResponseInterpretor';

import { BlueLoadingDots, BlueLoadingDotsSize } from '../../../../shared/blue-loading-dots';
import { ITelemetry } from '../../../../shared/Telemetry';

/**
 * prop type
 */
export interface IDeploymentsPropertyDescribeTabViewProps {
    serviceFactory: IServiceFactory;
    parentContext: DeploymentsPaneViewModel;
    telemetry: ITelemetry;
}

/**
 * state type
 */
interface IDeploymentsPropertyDescribeTabViewState {
    context: DeploymentsPropertyDescribeTabViewModel;
}

/**
 * Describe Pane/Tab on the property panel
 */
export class DeploymentsPropertyDescribeTabView extends
    React.PureComponent<IDeploymentsPropertyDescribeTabViewProps, IDeploymentsPropertyDescribeTabViewState> {
    /**
     * initializes a new instance of the class
     * @param props component properties
     */
    constructor(props: IDeploymentsPropertyDescribeTabViewProps) {
        super(props);

        this.state = {
            context: this.createViewModel(props),
        };
    }

    /**
     * react callback invoked to render component
     */
    public render(): JSX.Element {
        if (this.state.context.visible && this.state.context.loading) {
            return this.renderLoading();
        }

        let panelClassName = 'deploymentsPropertyPane';

        if (!this.state.context.visible) {
            panelClassName = panelClassName + ' hidden';
        }

        const keys = this.state.context.rootKeys;
        const body = keys.map((key) => {
            return this.renderProperty(key, this.state.context.getDataAtKey(key));
        })

        return (
            <div className={panelClassName}>
                {body}
            </div>
        );
    }

    /**
     * given a key and a value(s) render an html component for this (key as a header, values below)
     * @param key key of the item we want to render
     * @param values value of the key to render
     */
    private renderProperty(key: string, values: string[]) {
        const properties: JSX.Element[] = [];
        values.forEach((value) => {
            properties.push(
                <div className='deploymentsPropertyValue' tabIndex={0}>
                    <p className='deploymentsPropertyValueParagraph'>{value}</p>
                </div>
            );
        });

        return (
            <div className='deploymentsPropertyWrapper'>
                <div className='deploymentsPropertyKey' tabIndex={0}>{key}</div>
                {properties}
            </div>
        );
    }

    /**
      * renders 'loading dots' view
      * @returns {JSX.Element} visual element to render
    */
    private renderLoading(): JSX.Element {
        return (
            <div className='deploymentsPropertyPane loading'>
                <BlueLoadingDots size={BlueLoadingDotsSize.medium} />
            </div>
        );
    }

    /**
     * creates view model for component based on properties received
     * @param props component properties
     */
    private createViewModel(props: IDeploymentsPropertyDescribeTabViewProps): DeploymentsPropertyDescribeTabViewModel {
        if (!props) { throw new Error(`@props may not be null at DeploymentsPaneView.createViewModel()`); }

        const telemetry = this.props.telemetry;
        const deploymentsService = this.props.serviceFactory.generateDeploymentsService();
        return new DeploymentsPropertyDescribeTabViewModel(
            telemetry,
            deploymentsService,
            new DescribeResponseInterpretor(),
            this.props.parentContext,
            this.forceUpdate.bind(this)
        );
    }
}
