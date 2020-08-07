/** local */ 
import { IKustoBatchDataProvider, IKustoQuery, IKustoResponse } from './KustoDataProvider';
import { IRetryPolicy } from '../ExponentialBackoffRetryPolicy';
import { IRetryPolicyFactory } from '../RetryPolicyFactory';

/**
 * Provides retry functionality for Kusto batch requests
 */
export class RetryKustoBatchDataProvider implements IKustoBatchDataProvider {
    /** underlying Kusto batch request provider */
    private dataProvider: IKustoBatchDataProvider;
    /** retry policy factory */
    private retryPolicyFactory: IRetryPolicyFactory;

    /**
     * Initializes instance of the class
     * @param dataProvider Kusto batch data provider
     * @param retryPolicyFactory retry policy factory
     */
    constructor(dataProvider: IKustoBatchDataProvider, retryPolicyFactory: IRetryPolicyFactory) {
        if (!dataProvider) { throw new Error('Parameter @dataProvider may not be null or undefined'); }
        if (!retryPolicyFactory) { throw new Error('Parameter @retryPolicyFactory may not be null or undefined'); }

        this.dataProvider = dataProvider;
        this.retryPolicyFactory = retryPolicyFactory;
    }

    /**
     * Executes batch of Kusto queries
     * @param queries set of queries to execute
     * @param timeoutMs batch timeout
     * @returns promise of async operation with set or responses as a result
     */
    public executeBatch(queries: IKustoQuery[], timeoutMs: number): Promise<StringMap<IKustoResponse>> {
        if (!queries || (queries.length <= 0)) { throw new Error('Parameter @queries may not be null or empty'); }
        if (timeoutMs <= 0) { throw new Error('Parameter @timeoutMs must be > 0'); }

        const retryPolicy = this.retryPolicyFactory.getRetryPolicy();

        if (!retryPolicy) {
            throw new Error('this.retryPolicyFactory.getRetryPolicy() returned an null or undefined value');
        }

        return new Promise((resolve, reject) => {
            retryPolicy.execute(() => this.executeOperation(resolve, reject, retryPolicy, queries, [], timeoutMs));
        });
    }

    /**
     * Executes quero query batch under outer promise
     * @param resolve resolve delegate of the outer promise
     * @param reject reject delegate of the outer promise
     * @param retryPolicy retry policy
     * @param queries Kusto queries
     * @param responses responses collected
     * @param timeoutMs query timeout
     */
    private executeOperation(
        resolve: (value?: any) => void, 
        reject: (error?: any) => void,
        retryPolicy: IRetryPolicy,
        queries: IKustoQuery[],
        responses: IKustoResponse[],
        timeoutMs: number,
    ): void {
        if (!resolve) { throw new Error('Parameter @resolve may not be null or undefined'); }
        if (!reject) { throw new Error('Parameter @reject may not be null or undefined'); }
        if (!retryPolicy) { throw new Error('Parameter @retryPolicy may not be null or undefined'); }
        if (!queries || (queries.length <= 0)) { throw new Error('Parameter @queries may not be null or empty'); }
        if (!responses) { throw new Error('Parameter @responses may not be null or undefined'); }
        if (timeoutMs <= 0) { throw new Error('Parameter @timeoutMs must be > 0'); }

        this.dataProvider.executeBatch(queries, timeoutMs)
            .then((thisIterationResponses) => {
                const nextIterationQueries: IKustoQuery[] = [];

                for (const query of queries) {
                    const response = thisIterationResponses[query.queryId];

                    if (!response) {
                        throw Error('Batch query individual query with id "' + query.queryId + '" missing response');
                    }

                    if (!response.error || !retryPolicy.canRetry(response.error)) {
                        responses.push(response);
                    } else {
                        nextIterationQueries.push(query);
                    }
                }

                if (nextIterationQueries.length === 0) {
                    resolve(responses);
                }

                retryPolicy.execute(
                    () => this.executeOperation(resolve, reject, retryPolicy, queries, responses, timeoutMs));
            })
            .catch((error) => {
                // failure to execute batch itself means we already retried the request 
                // and failed anyways - fail the whole operation
                reject(error);
            });
    }
}
