import { IKustoQueryOptions } from '../../shared/data-provider/KustoDataProvider';
import { ITimeInterval, TimeInterval } from '../../shared/data-provider/TimeInterval';
import { GUID } from '@appinsights/aichartcore';
import { ApiClientRequestInfo, IApiClientRequestInfoParams } from '../../shared/data-provider/ApiClientRequestInfo';

const idealNumberOfDataPointsPlaceHold: number = 1;

export class ComputeKustoQueryOptions implements IKustoQueryOptions {
    public requestInfoV2: ApiClientRequestInfo;
    public requestId: string;
    public timeInterval: ITimeInterval;

    public constructor(requestInfoV2: IApiClientRequestInfoParams, startTime: Date, endTime: Date, idealNumberOfDataPoints?: number) {
        this.requestInfoV2 = new ApiClientRequestInfo(requestInfoV2);
        this.requestId = GUID().toLowerCase();
        this.timeInterval = new TimeInterval(startTime, endTime, idealNumberOfDataPoints || idealNumberOfDataPointsPlaceHold);
    }
}
