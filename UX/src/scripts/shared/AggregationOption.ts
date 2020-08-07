import update = require('immutability-helper');
import { StringMap } from './StringMap';

export enum AggregationOption {
    Min = 'Min',
    Avg = 'Avg',
    Max = 'Max',
    P05 = 'P05',
    P10 = 'P10',
    P50 = 'P50',
    P90 = 'P90',
    P95 = 'P95',
    Client = 'Client',
    ClientNoOther = 'ClientNoOther',
    Network = 'Network',
    Server = 'Server',


    // Naga TODO: Create a StackedMetricOption class
    // Create MultiMetricLineChart and pass options to it
    // Task188539 (https://msecg.visualstudio.com/DefaultCollection/OMS/_workitems/edit/188539)
    Usage = 'Usage',
    Count = 'Count',
    Requests = 'Requests',
    Limits = 'Limits',
    BytesSent = 'BytesSent',
    BytesReceived = 'BytesReceived',
    LinksLive = 'LinksLive',
    LinksEstablished = 'LinksEstablished',
    LinksFailed = 'LinksFailed',
    LinksTerminated = 'LinksTerminated'
}

export class SelectableAggregationOptionSet {
    private optionStateSet: StringMap<boolean>;

    constructor(availableOptions: AggregationOption[], selectedOptions?: AggregationOption[]) {
        this.optionStateSet = {};

        if (availableOptions && (availableOptions.length > 0)) {
            availableOptions.forEach((option) => {
                this.optionStateSet[option] = false;
            });
        }

        if (selectedOptions && (selectedOptions.length > 0)) {
            selectedOptions.forEach((option) => {
                this.optionStateSet[option] = true;
            });
        }
    }

    public getSelectedOptions(): AggregationOption[] {
        const selectedOptions = new Array<AggregationOption>();

        for (const option in this.optionStateSet) {
            if (this.optionStateSet.hasOwnProperty(option) && this.isSelected(AggregationOption[option])) {
                selectedOptions.push(AggregationOption[option]);
            }
        }

        return selectedOptions;
    }

    public isSelected(option: AggregationOption): boolean {
        return this.optionStateSet[option];
    }

    public toggle(option: AggregationOption): SelectableAggregationOptionSet {

        if (!this.optionStateSet || !this.optionStateSet.hasOwnProperty(option)) {
            // appinsights telemetry should pick this up and log it
            throw 'Toggle option doesnt exist ' + option;
        }

        const setMap = update(this, {
            optionStateSet: {
                [option]: { $apply: function (state: boolean) { return !state; } }
            }
        });
        return setMap;
    }
}



