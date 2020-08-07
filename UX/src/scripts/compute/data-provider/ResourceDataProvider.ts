import { ARMDataProvider } from '../../shared/data-provider/ARMDataProvider';
import { LimitedCache } from '../shared/LimitedDataCacheUtil';

export enum GetResourceResponseStatus {
    Unknown,
    Success,
    Warning,
    Failed
}

export interface IGetResourceResponse {
    responseStatus: GetResourceResponseStatus;
    message?: string;
    content: any;
    error?: any;
}

export class ResourceDataProvider {
    private armDataProvider: ARMDataProvider = new ARMDataProvider();
    private apiVersion: string = '2018-06-01';
    private cache: LimitedCache<IGetResourceResponse> = new LimitedCache(50);

    public getResourceByResourceId(resourceId: string): Promise<IGetResourceResponse> {
        if (resourceId && this.cache.get(resourceId)) {
            return Promise.resolve(this.cache.get(resourceId));
        }

        const uri: any = resourceId + '?api-version=' + this.apiVersion;

        return this.armDataProvider.executeGet(uri, 30000).then((response: any) => {
            let responseStatus: GetResourceResponseStatus = GetResourceResponseStatus.Unknown;
            let message: string = undefined;
            let content: any = undefined;
            if (response) {
                responseStatus = GetResourceResponseStatus.Success;
                content = response;
                this.cache.insert(resourceId, { responseStatus, content });
            } else {
                message = 'Failed to get resource details of resourceId: ' + resourceId;
            }
            return {
                responseStatus,
                message,
                content
            }
        },
            (error: any) => {
                let responseStatus: GetResourceResponseStatus = GetResourceResponseStatus.Failed;
                let message: string = 'Failed to get resource details of resourceId: ' + resourceId;

                return {
                    responseStatus,
                    message,
                    content: undefined,
                    error
                }
            });
    }
}
