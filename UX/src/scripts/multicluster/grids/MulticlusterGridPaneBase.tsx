/** tpl */
import * as React from 'react';

/** local */
import { GridSortOrder } from './MulticlusterGridBase';
import { MulticlusterGridControlPanel } from './MulticlusterGridControlPanel';

/** shared */
import { TelemetrySubArea, TelemetryMainArea, ITelemetry } from '../../shared/Telemetry';
import { TelemetryFactory } from '../../shared/TelemetryFactory';
import { MessagingProvider } from '../../shared/MessagingProvider';

/** Multicluster grid component properties */
export interface IMulticlusterGridPaneProps {

    /** host blade messaging provider */
    messagingProvider: MessagingProvider;

    /** to track loading state */
    isLoading: boolean,

    /** to track error state */
    isError: boolean,

    /** grid data for multi cluster grid */
    gridData: any[];

    /** the number of subscriptions selected */
    selectedGlobalSubscriptionCount: number;
}

/** Container grid pane state properties */
export interface IMulticlusterGridPaneState {
    /** sort column */
    sortColumnIndex: number;

    /** sort direction */
    sortDirection: GridSortOrder;

    /** name filter value */
    nameSearchFilterValue: string;
}

/** Base class for Multi cluster grids*/
export abstract class MulticlusterGridPaneBase extends React.PureComponent<IMulticlusterGridPaneProps, IMulticlusterGridPaneState> {
    /** Telemetry engine */
    private telemetry: ITelemetry;
    
    /**
     * Instantiates an instance of the class
     * @param props component properties
     * @param telemetrySubArea telemetry subarea for telemetry loggings
     */

    constructor(props: IMulticlusterGridPaneProps, telemetrySubArea: TelemetrySubArea) {
        super(props);

        this.telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
        this.telemetry.setContext({ subArea: telemetrySubArea }, false);

        this.onNameSearchFilterChanged = this.onNameSearchFilterChanged.bind(this);
        this.sortOrderChanged = this.sortOrderChanged.bind(this);
    }

    /** Renders component */
    public render(): JSX.Element {
        return (
            <div className='grid-pane'>
                <div className='grid-sub-pane-cew'>
                    <MulticlusterGridControlPanel
                        nameSearchFilterValue={this.state.nameSearchFilterValue}
                        onNameSearchFilterChanged={this.onNameSearchFilterChanged}
                    />
                </div>
                {this.renderGrid()}
            </div>
        );
    }

    /** When overridden in derived class renders grid visual component */
    abstract renderGrid(): JSX.Element;

    /**
     * Invoked when grid sort order changed
     * @param sortColumnIndex sort column index
     * @param sortDirection sort direction
     */
    protected sortOrderChanged(sortColumnIndex: number, sortDirection: GridSortOrder) {
        this.setState({ sortColumnIndex, sortDirection });
    }

    /**
     * Invoked when name filter value changed
     * @param nameSearchFilterValue name filter value
     */
    private onNameSearchFilterChanged(nameSearchFilterValue: string): void {
        this.setState({ nameSearchFilterValue });
    }
}
