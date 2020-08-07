
import * as React from 'react';

import '../../../../styles/container/LiveConsoleV2/LiveConsoleView.less'

import FunctionGates from '../../Utilities/FunctionGates';
import { LiveConsoleViewModel, ILiveDataService } from '../viewmodels/LiveConsoleViewModel';
import { LiveConsoleHeaderView } from './LiveConsoleHeaderView';
import { LiveConsoletabWrapperView } from './LiveConsoleTabWrapperView';
import { IQueryParameters } from '../models/LiveConsoleModel';
import { BaseViewModel } from '../../BaseViewModel';
import { DropDownOption } from '../../pill-component/TextDropDownPill';
import { OptionValues } from '@appinsights/react-select';
import { ITelemetry } from '../../Telemetry';

export interface ILiveConsoleRefreshViewParentContext extends BaseViewModel {
    // selectedDeployment: string;1
    getSelectedData(): IQueryParameters;
    getDataService(): ILiveDataService;

    isLiveConsoleVisible();
    setLiveConsoleVisibility(state: boolean);

    getPillOptions(): DropDownOption[];
    getSelectedPill(): DropDownOption;
    changePillSelection(value: OptionValues): void;
}

interface ILiveConsoleRefreshViewProps {
    parentContext: ILiveConsoleRefreshViewParentContext;
    servicesFactory: IServiceFactory;
    telemetry: ITelemetry;
}

/**
 * The state of the console view panel
 */
interface ILiveConsoleRefreshViewState {
    /** context (view model) */
    context: LiveConsoleViewModel;
}

/**
 * The container class for the live console
 */
export class LiveConsoleView extends React.Component<ILiveConsoleRefreshViewProps, ILiveConsoleRefreshViewState> {
    private resizing = false;
    private resizeTarget: any = null;
    private limitedResize: any = null;

    /**
     * initializes a new instance of the class
     * @param props component properties
     */
    constructor(props: ILiveConsoleRefreshViewProps) {
        super(props);

        this.state = {
            context: this.createViewModel(props),
        };

        this.limitedResize = FunctionGates.CreateLimitedFunction(this.resizePanel.bind(this), 66);

        window.addEventListener('mouseup', this.stopResizePanel.bind(this));
        window.addEventListener('mousemove', this.limitedResize);
    }

    public componentWillUnmount() {
        this.state.context.onUnLoad();
    }

    /**
   * react callback invoked to render component
   */
    public render(): JSX.Element {

        let finalClass = 'liveconsole-root';

        if (!this.props.parentContext.isLiveConsoleVisible()) {
            finalClass = 'hidden';
        }

        return (
            <div className={finalClass}>
                {this.renderResizeHandle()}

                <LiveConsoleHeaderView parentContext={this.state.context} />

                <LiveConsoletabWrapperView parentContext={this.state.context} />
            </div>
        );
    }

    private renderResizeHandle() {
        return <div className='liveconsole-resize-handle'
            onMouseDown={(event) => {
                this.resizing = true;
                event.stopPropagation();
                event.preventDefault();
                this.resizeTarget = document.querySelector('.liveconsole-root');
            }}>
                <div className='resize-dots'></div>
            </div>
    }

    private stopResizePanel(event: MouseEvent) {
        if (this.resizing) {
            this.changePanelHeight(event);
            event.stopPropagation();
            event.preventDefault();
            this.resizing = false;
            this.props.telemetry.logEvent('LiveConsoleResizeStopped', null, null);
        }
    }

    /**
      * triggered during mouse move and up to resize the panel width
      * @param event mouse event details
      */
    private changePanelHeight(event: MouseEvent) {
        // bbax; we have to size within whatever space we are given by the control placing us
        const parentElement = document.body;

        const mouseY = event.pageY;
        let targetHeight = parentElement.clientHeight - mouseY;

        if (targetHeight > (parentElement.clientHeight)) {
            targetHeight = parentElement.clientHeight;
        }

        if (targetHeight < 170) {
            targetHeight = 170;
        }

        this.resizeTarget.style.height = `${targetHeight}px`;
    }

    private resizePanel(event: MouseEvent) {
        if (!this.resizing) {
            return;
        }

        event.stopPropagation();
        event.preventDefault();
        this.changePanelHeight(event);
    }

    /**
     * creates view model for component based on properties received
     * @param props component properties
     */
    private createViewModel(props: ILiveConsoleRefreshViewProps): LiveConsoleViewModel {
        if (!props) { throw new Error(`@props may not be null at ConsoleViewPanelView.createViewModel()`); }

        return new LiveConsoleViewModel(this.props.telemetry, this.forceUpdate.bind(this), this.props.parentContext as any);
    }

}
