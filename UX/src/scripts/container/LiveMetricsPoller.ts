import { LiveDataProvider } from '../shared/data-provider/LiveDataProvider';
import { ILiveDataPoint } from '../shared/data-provider/KubernetesResponseInterpreter';
import { TimeInterval } from '../shared/data-provider/TimeInterval';
import * as moment from 'moment';

/**
 * Interface for LiveMetrics Poller.
 * Polls live metrics from Kubernetes data provider and caches data points
 * into a buffer to be interpreted and displayed in charts.
 */
export interface ILiveMetricsPoller {
    start: (liveMetricsGranularity: LiveMetricsGranularity) => void;
    stop: (error: any) => void;
    restart: (liveMetricsGranularity: LiveMetricsGranularity) => void;
}

export enum LiveMetricsGranularity {
    OneSecond = 1,
    FiveSeconds = 5,
    FifteenSeconds = 15,
    ThirtySeconds = 30,
    SixtySeconds = 60
}

export const LiveMetricsGranularityStrings = {
    [LiveMetricsGranularity.OneSecond]: '1s',
    [LiveMetricsGranularity.FiveSeconds]: '5s',
    [LiveMetricsGranularity.FifteenSeconds]: '15s',
    [LiveMetricsGranularity.ThirtySeconds]: '30s',
}

export const LiveMetricsRangeSeconds: number = 5 * 60;

/**
 * Polls live metrics from Kubernetes data provider and caches data points
 * into a buffer to be interpreted and displayed in charts.
 */
export class LiveMetricsPoller implements ILiveMetricsPoller {
    /** update live data */
    private updateLiveData: (err: any, buffer: Array<ILiveDataPoint>, timeInterval: TimeInterval) => void;

    /** load data timer id */
    private loadDataTimerId: any;

    /** data getting from data provider */
    private data: Array<ILiveDataPoint>;

    /** query freqency */
    private queryFreqency: number;

    /** polling start or stop */
    private polling: boolean;

    /** namespace that the container is in */
    private nameSpace: string;

    /** name of the pod that the container is in */
    private podName: string;

    constructor(
        updateLiveData: (
            err: any,
            data: Array<ILiveDataPoint> | undefined,
            timeInterval: TimeInterval | undefined
        ) => void,
        private dataProvider: LiveDataProvider,
        nameSpace?: string,
        podName?: string,
    ) {
        this.loadDataTimerId = -1;
        this.updateLiveData = updateLiveData;
        this.data = [null];
        this.polling = false;
        this.nameSpace = nameSpace;
        this.podName = podName;

        this.loadData = this.loadData.bind(this);
    }

    /**
     * start timer to fetch data in 
     * @param refreshIntervalSeconds 
     */
    public start(queryFreqency: LiveMetricsGranularity): void {
        if (this.polling) {
            return;
        }
        this.polling = true;
        this.queryFreqency = queryFreqency;
        this.data = [null];
        this.updateLiveData(undefined, this.data, this.getRange(LiveMetricsRangeSeconds));
        this.loadData();
    }

    /**
     * stop timer to fetch data in 
     */
    public stop(error: any): void {
        if (!this.polling) {
            return;
        }
        this.polling = false;
        this.data = [null];
        this.updateLiveData(error, this.data, this.getRange(LiveMetricsRangeSeconds));
        clearInterval(this.loadDataTimerId);
    }

    /**
     * restart timer to fetch data in 
     * @param refreshIntervalSeconds 
     */
    public restart(queryFreqency: LiveMetricsGranularity): void {
        this.stop(undefined);
        this.start(queryFreqency);
    }

    /**
     * load data through data provider
     */
    private loadData(): void {
        const queryStart = new Date();
        this.dataProvider
            .getLiveMetrics(this.nameSpace, this.podName)
            .then((value) => {
                const queryEnd = new Date();

                const totalQueryMillis: number = queryEnd.getTime() - queryStart.getTime();
                const refreshIntervalMillis = this.queryFreqency * 1000;
                const missingPointsGaps: number = Math.floor(totalQueryMillis / refreshIntervalMillis);
                const numofEmptyPoints: number = missingPointsGaps * this.queryFreqency;
                for (let i = 0; i < numofEmptyPoints; i++) {
                    this.data.push(null);
                }
                for (let i = 0; i < this.queryFreqency; i++) {
                    this.data.push({
                        cpu: value.cpu,
                        memory: value.memory,
                        nodeCount: value.nodeCount,
                        podCount: value.podCount,
                        timestamp: value.timestamp
                    });
                }
                if (this.data.length > LiveMetricsRangeSeconds) {
                    this.data.shift();
                }
                // polling data
                if (this.polling) {
                    this.updateLiveData(undefined, this.data, this.getRange(LiveMetricsRangeSeconds));

                    const timeToPrevSecond = totalQueryMillis % refreshIntervalMillis;
                    const timeToNextSecond = refreshIntervalMillis - timeToPrevSecond;
                    const timeToWait: number = timeToNextSecond % refreshIntervalMillis;
                    this.loadDataTimerId = setTimeout(() => { this.loadData(); }, timeToWait);
                    
                    console.log(`reset timer [${this.loadDataTimerId}] timeToWait [${timeToWait}]`);
                }
            })
            .catch((reason) => {
                console.log('live metrics poller crash', reason);
                this.stop(reason);
                this.updateLiveData(reason, undefined, undefined);
            });
    }

    /**
     * Returns a time interval for the live metrics window.
     * @param seconds Number of seconds for the width of the interval
     */
    private getRange(seconds: number): TimeInterval {
        const end = moment().set({ millisecond: 0 }).toDate();
        const start = moment(end).subtract(seconds, 'seconds').toDate();
        return new TimeInterval(start, end, 100, 1);
    }
}
