// CA = Connection Analytics
export interface ICAApiResponse {
    startTime: Date;
    endTime: Date;
    connectionMetrics: ICAApiConnectionMetrics[];
};

export interface ICAApiConnectionMetrics {
    connection: ICAApiConnection;
    metrics: ICAApiMetrics[];
};

export interface ICAApiConnection {
    source: ICAApiConnectionType;
    destination: ICAApiConnectionType;
};

export interface ICAApiMetrics {
    name: ICAApiMetricName;
    startTime: Date;
    endTime: Date;
    metricValues: ICAApiMetricValues[];
};

export interface ICAApiConnectionType {
    id?: string;
    ids?: string[];
};

export interface ICAApiMetricName {
    value: string;
};

export interface ICAApiMetricValues {
    timestamp: string;
    count: number;
    maximum: number;
    minimum: number;
    total: number;
    average: number;
};

export enum CAApiAggregationTypes {
    count = 'count',
    maximum = 'maximum',
    minimum = 'minimum',
    total = 'total',
    average = 'average'
}
