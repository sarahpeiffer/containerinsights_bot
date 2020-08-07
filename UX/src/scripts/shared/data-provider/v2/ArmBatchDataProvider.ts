import { IArmDataProvider } from './ArmDataProvider';
import { HttpVerb } from './HttpDataProvider';
import { ITimeInterval } from '../TimeInterval';

interface IBatchRequest {
    relativeUrl: string;
    httpMethod: HttpVerb;
}

/**
 * Storage facility for a single entry of a batch call containing the ability to convert
 * itself into the format required to be added to the batch call
 */
export class MdmBatchEntry {

    /**
     * .ctor()
     * @param metric mdm metric being queries 
     * @param metricNamespace namespace the metric is contained in
     * @param aggregation aggregation type of the query
     * @param interval timeinterval the request should be done over
     * @param subscriptionId subscription being queried
     * @param resourceGroup resource group the ARM resource is in
     * @param clusterName cluster name
     * @param filter [optional] any filters to add to the mdm query
     */
    constructor(
        private metric: string,
        private metricNamespace: string,
        private aggregation: string,
        private interval: ITimeInterval,
        private subscriptionId: string,
        private resourceGroup: string,
        private clusterName: string,
        private filter?: string) {

    }

    /**
     * convert to a string entry to be added to the batch query call
     */
    public toRequest(): string {
        console.log(`${this.metric}: agg: ${this.aggregation}, interval: `, this.interval);

        const grain = 'PT1M';
        const startTime = this.interval.getBestGranularStartDate().toISOString();
        const endTime = this.interval.getBestGranularEndDate(true).toISOString();

        if (this.filter) {
            // tslint:disable-next-line:max-line-length
            return `/subscriptions/${this.subscriptionId}/resourceGroups/${this.resourceGroup}/providers/Microsoft.ContainerService/managedClusters/${this.clusterName}/providers/microsoft.Insights/metrics?timespan=${startTime}/${endTime}&interval=${grain}&metricnames=${this.metric}&aggregation=${this.aggregation}&metricNamespace=${this.metricNamespace}&top=10&orderby=${this.aggregation} desc&\$filter=${this.filter}&autoadjusttimegrain=false&api-version=2018-01-01`;
        } else {
            // tslint:disable-next-line:max-line-length
            return `/subscriptions/${this.subscriptionId}/resourceGroups/${this.resourceGroup}/providers/Microsoft.ContainerService/managedClusters/${this.clusterName}/providers/microsoft.Insights/metrics?timespan=${startTime}/${endTime}&interval=${grain}&metricnames=${this.metric}&aggregation=${this.aggregation}&metricNamespace=${this.metricNamespace}&autoadjusttimegrain=false&api-version=2018-01-01`;
        }
    }
}

/**
 * Batch together ARM calls into the batch service
 */
export class ArmBatchDataProvider {

    /**
     * list of batches to be sent
     */
    private _batches: IBatchRequest[] = [];

    /**
     * arm provider to use to access the batch api
     */
    private armDataProvider: IArmDataProvider;

    /**
     * .ctor()
     * @param armDataProvider arm provider to access the batch api with
     */
    constructor(armDataProvider: IArmDataProvider) {
        if (!armDataProvider) { throw new Error('Parameter @armDataProvider may not be null or undefined'); }
        this.armDataProvider = armDataProvider;
    }

    /**
     * begin to piece together a batch request... calls to add will be added to this request,
     * the request will be sent finally with complete()
     * @param armDataProvider provider we ultimately will use to access the batch api with
     */
    public static createRequest(armDataProvider: IArmDataProvider): ArmBatchDataProvider {
        return new ArmBatchDataProvider(armDataProvider);
    }

    /**
     * add a request to this batch call (prequisite is begin())
     * @param metric mdm metric being queries 
     * @param metricNamespace namespace the metric is contained in
     * @param aggregation aggregation type of the query
     * @param interval timeinterval the request should be done over
     * @param subscriptionId subscription being queried
     * @param resourceGroup resource group the ARM resource is in
     * @param clusterName cluster name
     * @param filter [optional] any filters to add to the mdm query
     */
    public addMDMQuery(
        httpMethod: HttpVerb,
        metric: string,
        metricNamespace: string,
        aggregation: string,
        interval: ITimeInterval,
        subscriptionId: string,
        resourceGroup: string,
        clusterName: string,
        filter?: string,
    ): ArmBatchDataProvider {

        const mdmEntry = new MdmBatchEntry(
            metric,
            metricNamespace,
            aggregation,
            interval,
            subscriptionId,
            resourceGroup,
            clusterName,
            filter
        );

        this._batches.push({ relativeUrl: mdmEntry.toRequest(), httpMethod });
        return this;
    }

    /**
     * Adds a query to the batch
     * @param query 
     */
    public addQuery( relativeUrl: string, httpMethod: HttpVerb): ArmBatchDataProvider {
        this._batches.push({ relativeUrl, httpMethod });
        return this;
    }

    /**
     * call when batches are all added, this will begin the rest request
     * @param timeoutMs timeout for the rest request to finish
     */
    public execute(timeoutMs: number, armRequestHeaders?: StringMap<string>): Promise<any> {
        if (timeoutMs <= 0) { throw new Error('Parameter @timeoutMs must be > 0'); }

        return this.armDataProvider.executeRequest(
            HttpVerb.Post,
            '/batch?api-version=2017-03-01',
            timeoutMs,
            armRequestHeaders,
            this.generateBody()
        );
    }

    /**
     * append all batches to the post body for the batch api
     */
    private generateBody(): Object {
        const requests: any[] = [];

        this._batches.forEach((batchReq: IBatchRequest) => {
            const { relativeUrl, httpMethod } = batchReq;
            requests.push({
                httpMethod,
                relativeUrl
            });
        });

        return {
            requests
        };
    }
}
