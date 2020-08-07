/**
 * Block
 */
import * as moment from 'moment';

/**
 * Shared
 */
import { ITelemetry } from '../Telemetry';
import { ErrorSeverity } from '../data-provider/TelemetryErrorSeverity';
import FunctionGates from './FunctionGates';
import { DisplayStrings } from '../DisplayStrings';
import { MetricValueFormatter } from '../MetricValueFormatter';
import { StringHelpers } from './StringHelpers';

/**
 * Interface for a log item in the live console
 */
export interface ILogItem {
    /** time of the event */
    readonly timeStamp: string;

    /** screen content of the event */
    readonly logData: string;

    /** visibility of event */
    readonly isVisible: boolean;

    /** elapsed time of the event  from when we got the data*/
    elapsedTime?: string;

    /** does this event contain a given string */
    logDataContains: (searchTerm: string, caseSensitive?: boolean) => boolean;
}

/**
 * Log item for an average log entry passed in via merge function
 */
export class LogItem implements ILogItem {

    /** time of the event */
    public readonly timeStamp: string;

    /** screen content of the event */
    public readonly logData: string;

    /** visibility of event */
    public readonly isVisible: boolean;

    /** elapsed time of the event  from when we got the data*/
    public elapsedTime: string;

    /**
     * .ctor()
     * @param timeStamp time of event
     * @param logData screen content of the event
     * @param isVisible visibiliy of the event
     */
    constructor(timeStamp: string, logData: string, isVisible: boolean = true) {
        this.timeStamp = timeStamp;
        this.logData = logData;
        this.isVisible = isVisible;
    }
    /**
     * Returns whether the logData contains the searchTerm
     * @param searchTerm 
     */
    public logDataContains(searchTerm: string, caseSensitive: boolean): boolean {
        if (searchTerm === '' || searchTerm === null || searchTerm === undefined) {
            return false;
        } else if (caseSensitive) {
            return this.logData.indexOf(searchTerm) > -1;
        } else {
            return this.logData.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1;
        }
    }

}

/** Missing data message */
export const MissingDataMessage = new LogItem(null, DisplayStrings.LiveLogsMissedMessages, false);

/** Types of possible log buffers */
export enum BufferType {
    EventBuffer,
    LogBuffer
}

/**
 * Class that stores an array of log items with a maximum byte limit. If that byte limit is exceeded, then
 * the log buffer removes the earliest log items. 
 * 
 * The LogBufferManager virtualizes the list in order to increase the efficiency with large buffers by chunking the list
 * according to the inputted sizes in the constructor. In other words, if you tell the buffer to have a chunk size of 10 (by setting
 * numLogsPerArray = 10), then it will store the list in a 2D array with each inner array being of size 10. When the buffer exceeds
 * the byte limit, it will remove the earliest chunk first, and then continue removing chunks until it is under the byte limit.
 * 
 * There are also search capabilities built into the data-structure. Set the searchTerm via changeSearchTerm. Each time
 * the search term is changed, the log buffer will re-initiate the search through the list. Once it is done, it will execute the
 * 'onNumMatchesChanged' callback.
 */
export class LogBufferManager {
    /** virtual array */
    private logItems: ILogItem[][];

    /** number of items?? */
    private numLogsPerArray: number;

    /** physical size?? */
    private totalSizeOfLogs: number;

    /** how large the overall buffer can get before it rolls over */
    private maxBufferSizeBytes: number;

    /** total count so far */
    private numLogsTotal: number;

    /** telemetry */
    private telemetry: ITelemetry;

    /** The search term that all log items are compared against */
    private searchTerm: string;

    /** list of indexes of log items that match the search */
    private matchingItemSet: Set<number>;

    /** buffer type : log or events */
    private bufferType: BufferType;

    /** Triggered when the number of matches changed */
    private onNumMatchesChanged: (numMatches: number, matchingItemSet: Set<number>, bufferType: BufferType) => void;

    /** Wrapper around searchLogsAndUpdateNumMatches function that limiteds the function calls */
    private readonly limitedSearch: () => void;
    /**
     * Creates a new LogBufferManager object. Sets the logItem array to be empty.
     * @param maxBufferSizeBytes The max size of the buffer you want, in Bytes.
     * @param numLogsPerArray The number of logs you want per chunk.
     * @param telemetry The telemetry object that the LogBufferManager writes to.
     * @param onNumMatchesChanged Optional. callback that is called whenever the number of log items that match the search term changes.
     * @param searchlimitedTimeMS Optional. The amount of time you want between two function calls of the searching of the entire list.
     */
    constructor(maxBufferSizeBytes: number, numLogsPerArray: number, telemetry: ITelemetry, bufferType: BufferType,
        onNumMatchesChanged?: (numMatches: number, matchingItemSet: Set<number>, bufferType: BufferType) => void,
        searchlimitedTimeMS?: number) {
        this.logItems = [];
        //This should change to "bytesPerArray". A little more complex with respect to searching for an element
        this.numLogsPerArray = numLogsPerArray;
        //initial counters
        this.totalSizeOfLogs = 0;
        this.numLogsTotal = 0;
        this.maxBufferSizeBytes = maxBufferSizeBytes;
        this.telemetry = telemetry;
        this.bufferType = bufferType;
        this.onNumMatchesChanged =
            (onNumMatchesChanged)
                ? onNumMatchesChanged
                : (numMatches: number, matchingItemSet: Set<number>, bufferType: BufferType) => { };
        this.searchTerm = '';
        this.matchingItemSet = new Set<number>();
        //if limitedTime is null, undefined, or not zero, there is no need to create a wrapper function.
        if (!searchlimitedTimeMS) {
            this.limitedSearch = this.searchLogsAndUpdateNumMatches;
        } else {
            this.limitedSearch = FunctionGates.CreateLimitedFunction(this.searchLogsAndUpdateNumMatches, searchlimitedTimeMS, this);
        }
    }

    /**
     * Clears the current log items buffer and sets the new items in it.
     * @param newLiveItems the new log items
     * @returns the total number of items set in the buffer when called. -1 if no new live items
     */
    public set(newLiveItems: ILogItem[]): number {
        let numNewItems = -1;
        let currentTime = new Date();
        this.logItems = [];
        this.totalSizeOfLogs = 0;
        this.numLogsTotal = 0;
        this.matchingItemSet.clear();
        if (newLiveItems !== null && newLiveItems !== undefined && newLiveItems.length > 0) {
            newLiveItems = newLiveItems.sort((item1: ILogItem, item2: ILogItem) => {
                const leftTime = moment(item1.timeStamp);
                const rightTime = moment(item2.timeStamp);
                return leftTime.diff(rightTime);
            })
            newLiveItems.forEach((item) => {
                this.totalSizeOfLogs += item.logData.length * 2;
                this.numLogsTotal++;

                item.elapsedTime = StringHelpers.replaceAll(
                    DisplayStrings.NTimeAgo,
                    '{0}',
                    MetricValueFormatter.formatUpTimeValue((moment(currentTime).diff(item.timeStamp)))
                );

                //Do we need to create a new inner array?
                if (this.logItems.length === 0 || this.logItems[this.logItems.length - 1].length === this.numLogsPerArray) {
                    this.logItems.push([item]);
                } else {
                    this.logItems[this.logItems.length - 1].push(item);
                }

                //update total number of matches
                if (item.logDataContains(this.searchTerm)) {
                    //add the index of the last item
                    this.matchingItemSet.add(this.size() - 1);
                }
            });
            
            this.updateNumMatches();
            return this.logItems[0].length;
        }
        return numNewItems;
    }

    /**
     * Merges the new log items into the existing buffer. Prevents duplicate values from being inserted into the buffer.
     * If potential data loss is detected, then this method inserts a MissingDataMessage into the buffer, 
     * and then aborts merge by inserting all of the log items into the buffer.
     * @param newLogItems the new log items
     * @returns The number of new logs that were added to the buffer. -1 if not able to merge buffer.
     */
    public merge(newLogItems: ILogItem[]): number {
        const lastLogItem = this.getLastLogItem();
        //timestamp for the last log of the previous poll
        const lastTimestamp: number = (lastLogItem === undefined)
            ? Number.NEGATIVE_INFINITY
            : Date.parse(lastLogItem.timeStamp);
        const numSeenAtLastTimestamp = this.getNumberOfLogsAtLastTimestamp();
        let numNewLogs = -1;
        if (!this.nextLogItemsAreValidToMerge(newLogItems)) {
            this.telemetry.logException(
                'Log merging failed',
                'LogBufferManager.merge',
                ErrorSeverity.Error,
                {
                    oldListLength: this.size().toString(),
                    newListLength: newLogItems.length.toString(),
                    lastTimestamp: (this.getLastLogItem()) ? this.getLastLogItem().timeStamp : null,
                    nextTimetamp: newLogItems[0].timeStamp
                },
                undefined
            );
            //there is missing data in the new response
            this.add(MissingDataMessage);
            newLogItems.forEach((logItem) => {
                this.add(logItem);
            });
        } else {
            //merge properly
            numNewLogs = 0;
            //timestamp for the latest log so far
            let curTimestamp: number = Number.NEGATIVE_INFINITY;
            //number of times we have seen this current timestamp
            let logsSeenAtCurTimestamp = 0;
            newLogItems.forEach((logItem) => {
                //verify that the logItem is not null / undefined. 
                if (logItem) {
                    const nextTimestamp: number = Date.parse(logItem.timeStamp);
                    //update function counters for timestamps
                    if (curTimestamp === nextTimestamp) {
                        logsSeenAtCurTimestamp++;
                    } else {
                        curTimestamp = nextTimestamp;
                        logsSeenAtCurTimestamp = 1;
                    }
                    if (nextTimestamp > lastTimestamp) {
                        numNewLogs++;
                        this.add(logItem);
                    } else if (nextTimestamp < lastTimestamp) {
                        //do nothing
                    } else if (logsSeenAtCurTimestamp <= numSeenAtLastTimestamp) {
                        // This occurs when the current timestamp is the same as the last timestamp, 
                        // and the number seen at the previous poll is greater than this current poll.
                        //do nothing
                    } else {
                        numNewLogs++;
                        this.add(logItem);
                    }
                }
            });
        }
        //Make sure that the buffer is not beyond the bounds set in the constructor
        this.manageBuffer();
        return numNewLogs;
    }
    /**
     * Resets the log buffer.
     */
    public clearLogs(): void {
        this.logItems = [];
        this.totalSizeOfLogs = 0;
        this.numLogsTotal = 0;
    }
    /**
     * Returns the log item at index i, or undefined.
     * @param i The index of the log item
     */
    public get(i: number): ILogItem | undefined {
        if (this.numLogsTotal <= i || i < 0) {
            return undefined;
        }
        const outerIndex = Math.floor(i / this.numLogsPerArray);
        const innerIndex = i % this.numLogsPerArray;
        return this.logItems[outerIndex][innerIndex];
    }
    /**
     * Returns whether or not the log list is empty
     */
    public isEmpty(): boolean {
        return this.numLogsTotal === 0;
    }
    /**
     * Returns the number of logs in the list
     */
    public size(): number {
        return this.numLogsTotal;
    }

    /**
     * Returns the latest timestamp that is in a previous second to the last timestamp in the buffer, or null if not applicable
     * 
     * Ex1: 
     *      BUFFER
     *      ======
     *      1.2s Hello
     *      1.4s Hi
     *      1.9s Yo!
     *      2.3s Bonjour hi
     * 
     *      OUTPUT
     *      ======
     *      1.9s
     * Ex2: 
     *      BUFFER
     *      ======
     *      1.2s Hello
     *      1.4s Hi
     *      1.9s Yo!
     * 
     *      OUTPUT
     *      ======
     *      null
     */
    public getPreviousSecondTimestamp(): string | null {
        if (this.size() < 2) {
            return null;
        }
        let latestLog = this.get(this.size() - 1);
        let previousLog = this.get(this.size() - 2);
        let i = 2;
        //while previous log is in same second as the latest log
        while (moment(latestLog.timeStamp).isSame(previousLog.timeStamp, 'second')) {
            i++;
            previousLog = this.get(this.size() - i);
            if (previousLog === undefined) {
                return null;
            }
        }
        return previousLog.timeStamp;
    }
    /**
     * Finds the most recent timestamp that is not the same as the timestamp of the last log item
     */
    public getFirstDifferentTimestamp() {
        if (this.size() < 2) {
            return undefined;
        }
        let latestLog = this.get(this.size() - 1);
        let previousLog = this.get(this.size() - 2);
        let i = 2;
        while (Date.parse(latestLog.timeStamp) === Date.parse(previousLog.timeStamp)) {
            i++;
            previousLog = this.get(this.size() - i);
            if (previousLog === undefined) {
                return undefined;
            }
        }
        return previousLog.timeStamp;
    }
    /**
     * Returns the timestamp from which we should get logs after, or null if it doesn't exist.
     */
    public getNextTimestampToQuery(): string | null {
        const lastLogItem = this.getLastLogItem();
        if (lastLogItem !== undefined) {
            const timestampFromPreviousSecond = this.getPreviousSecondTimestamp();
            if (timestampFromPreviousSecond !== null) {
                return timestampFromPreviousSecond;
            } else {
                return lastLogItem.timeStamp;
            }
        }
        return null;
    }

    /**
     * Returns the number of matches to the current search term
     */
    public getNumMatches(): number {
        return this.matchingItemSet.size;
    }

    /**
     * Do complete pass over the log items and count how many match the search term
     * @param newSearchTerm any string.
     */
    public changeSearchTerm(newSearchTerm: string): void {
        this.searchTerm = newSearchTerm;
        this.limitedSearch();
    }

    /**
     * Searches through the entire list of log items and re-computes how many log items there are total.
     */
    private searchLogsAndUpdateNumMatches(): void {
        this.matchingItemSet = new Set<number>();
        for (let i = 0; i < this.size(); i++) {
            const logItem = this.get(i);
            if (logItem && logItem.logDataContains(this.searchTerm)) {
                this.matchingItemSet.add(i);
            }
        }
        this.updateNumMatches();
    }

    /**
     * Checks whether there may be missing data between the logs in the existing buffer and the new log items
     * @param newLogItems The log items that you want to merge into the existing buffer
     */
    private nextLogItemsAreValidToMerge(newLogItems: ILogItem[]) {
        const lastLogItem = this.getLastLogItem();
        //timestamp for the last log of the previous poll, or positive infinity if there was no previous log
        const lastTimestamp: number = (lastLogItem === undefined)
            ? Number.POSITIVE_INFINITY
            : Date.parse(lastLogItem.timeStamp);

        const containsDifferentTimestamps = (this.getFirstDifferentTimestamp()) ? true : false;
        //if existing buffer contains different timestamps: 
        //  the the first new log item must be strictly less than the last timestamp.
        //else:
        //  the first new log item must be less than or equal to the last timestamp.
        //note: if there are no new logs, then it is automatically valid.
        const isTimestampValid = newLogItems.length === 0 ||
            ((containsDifferentTimestamps)
                ? Date.parse(newLogItems[0].timeStamp) < lastTimestamp
                : Date.parse(newLogItems[0].timeStamp) <= lastTimestamp);
        return isTimestampValid;
    }

    /**
     * Sets numMatches to the correct number of matches, and calls onNumMatchesChanged function.
     */
    private updateNumMatches(): void {
        this.onNumMatchesChanged(this.matchingItemSet.size, this.matchingItemSet, this.bufferType);
    }

    /**
     * Add an item into the buffer. Private method, because we want to merge when receiving new logs.
     * @param item the item to add into the buffer
     */
    private add(item: ILogItem): void {
        this.totalSizeOfLogs += item.logData.length * 2;
        this.numLogsTotal++;

        //Do we need to create a new inner array?
        if (this.logItems.length === 0 || this.logItems[this.logItems.length - 1].length === this.numLogsPerArray) {
            this.logItems.push([item]);
        } else {
            this.logItems[this.logItems.length - 1].push(item);
        }

        //update total number of matches
        if (item.logDataContains(this.searchTerm)) {
            //add the index of the last item
            this.matchingItemSet.add(this.size() - 1);
            this.updateNumMatches();
        }
    }

    /**
     * Returns the last log item in the list
     */
    private getLastLogItem(): ILogItem | undefined {
        return this.get(this.size() - 1);
    }

    /**
     * Returns the number of logs at the latest timestamp seen
     */
    private getNumberOfLogsAtLastTimestamp(): number {
        let numAtLastTimestamp = 0;
        if (this.size() > 0) {
            let curLogItem: ILogItem = this.get((this.size() - 1) - numAtLastTimestamp);
            const lastTimestamp = curLogItem.timeStamp;
            //Iterate backwards through the buffer until two consecutive timestamps are not equal.
            while (curLogItem !== undefined && Date.parse(curLogItem.timeStamp) === Date.parse(lastTimestamp)) {
                numAtLastTimestamp++;
                curLogItem = this.get((this.size() - 1) - numAtLastTimestamp);
            }
        }
        return numAtLastTimestamp;
    }

    /**
     * Calculates the size of the log items in the array, in bytes.
     * @param arr The array for which you want to calculate the size
     */
    private sizeOfArray(arr: ILogItem[]): number {
        let size = 0;
        arr.forEach(element => {
            size += element.logData.length * 2;
        });
        return size;
    }

    /**
     * Verifies that the buffer size is below the maximum buffer size, and removes chunks as needed.
     */
    private manageBuffer(): void {
        //implement a more efficient version of shifting here by seeing up to where we need to delete logs
        let numToDelete = 0;
        let sizeOfLogsLeft = this.totalSizeOfLogs;
        // count how many log items to delete. This can be optimized by using Exponential Moving Average
        while (sizeOfLogsLeft > this.maxBufferSizeBytes && numToDelete < this.numLogsTotal) {
            sizeOfLogsLeft -= this.get(numToDelete).logData.length * 2;
            numToDelete++;
        }
        let numDeleted = 0;
        //delete in chunks
        while (numToDelete > numDeleted) {
            const removedLogs = this.logItems.shift();
            //Instead of using "sizeOfArray", this can be optimized using Exponential Moving Average
            this.totalSizeOfLogs -= this.sizeOfArray(removedLogs);
            for (let i = 0; i < removedLogs.length; i++) {
                const indexOfLogItem = i + numDeleted;
                const logItem = removedLogs[i];
                if (logItem.logDataContains(this.searchTerm)) {
                    this.matchingItemSet.delete(indexOfLogItem);
                }
            }
            numDeleted += removedLogs.length;
            this.numLogsTotal -= removedLogs.length;
        }
        this.updateNumMatches();
    }
}
