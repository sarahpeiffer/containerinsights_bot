import { LogBufferManager, BufferType } from '../../Utilities/LogBufferManager';
import { TelemetryFactory } from '../../TelemetryFactory';
import { TelemetryMainArea } from '../../Telemetry';
import { RefreshRegistration } from '../../RefreshService';
import { CellMeasurerCache } from 'react-virtualized';

//number of bytes we are agreeing to store (200MB)
const maxBufferSizeBytes: number = 200000000;
//number of logs to have in a chunk
const chunkSize: number = 10000;

export enum BufferTypes {
    Events = 'Events'
};

export interface IQueryParameters {
    refreshRegistration?: RefreshRegistration;
    data?: any;
    consoleKind: BufferTypes;
}

export type onNumMatchChangedHandler = (newNumMatches: number, matchingIndexes: Set<number>) => void;

/**
 * Model dicatting the variables needed for the live console to function
 */
export class LiveConsoleModel {

    public title: string;
    public subtitle: string;

    public eventsBuffer: LogBufferManager;
    public selectedQueryDetails: IQueryParameters;
    public numMatches: number;
    public matchingIndexes: number[];
    public searchTerm: string;
    public currentSelectedIndex: number = -1;

    public logItemCount: number = 0;

    public paused: boolean = false;
    public liveDataQuerySuccess: boolean = false;

    // bbax: hack hack
    public eventsCache: CellMeasurerCache;

    constructor(onNumMatchesChanged: onNumMatchChangedHandler) {
        this.numMatches = 0;
        this.currentSelectedIndex = -1;
        this.matchingIndexes = [];
        this.searchTerm = null;

        this.title = '[title]';
        this.subtitle = '[subtitle]';

        this.resetCache();

        this.eventsBuffer = new LogBufferManager(
            maxBufferSizeBytes,
            chunkSize,
            TelemetryFactory.get(TelemetryMainArea.Containers),
            BufferType.EventBuffer,
            onNumMatchesChanged,
            250
        );
    }

    public resetCache() {
        this.eventsCache = new CellMeasurerCache({
            defaultHeight: 18,
            fixedWidth: true,
        });
    }
}
