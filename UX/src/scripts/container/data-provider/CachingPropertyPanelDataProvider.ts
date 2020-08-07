/**
 * tpl
 */
import { Promise } from 'es6-promise'

/**
 * shared
 */
import { ITimeInterval } from '../../shared/data-provider/TimeInterval';
import { IWorkspaceInfo } from '../../shared/IWorkspaceInfo';

/**
 * local
 */
import { IClusterObjectInfo, IPropertyPanelDataProvider } from './PropertyPanelDataProvider';
import { ISimpleCache } from './IntervalExpirationCache';
import { PropertyPanelType } from './KustoPropertyPanelResponseInterpreter';

/**
 * Provides caching layer on top of property panel data provider
 */
export class CachingPropertyPanelDataProvider implements IPropertyPanelDataProvider {
    /** underlying data provider */
    private dataProvider: IPropertyPanelDataProvider;

    /** cache implementation */
    private cache: ISimpleCache;

    /**
     * .ctor
     * @param IPropertyPanelDataProvider underlying data provider 
     */
    constructor(dataProvider: IPropertyPanelDataProvider, cache: ISimpleCache) {
        if (!dataProvider) { throw new Error('Parameter @dataProvider may not be null or empty'); }
        if (!cache) { throw new Error('Parameter @cache may not be null or empty'); }

        this.dataProvider = dataProvider;
        this.cache = cache;
    }

    /**
     * Gets the data for the property panel corresponding to row
     * @param clusterObject object for which property panel is generated
     * @param timeInterval the time interval that the user has selected for examining his AKS resources
     * @param workspace the user's currently selected workspace
     */
    public getData(
        clusterObject: IClusterObjectInfo, 
        timeInterval: ITimeInterval, 
        workspace: IWorkspaceInfo,
        requestId?: string
    ): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const key = this.createCacheKey(clusterObject, timeInterval, workspace);
            const cachedData = this.cache.getItem(key);
            
            if (cachedData !== undefined) {
                resolve(cachedData);
                return;
            }

            this.dataProvider.getData(clusterObject, timeInterval, workspace, requestId)
                .then((result) => {
                    if (result !== PropertyPanelType.Unsupported) {
                        // add result to cache
                        const key = this.createCacheKey(clusterObject, timeInterval, workspace);
                        this.cache.addItem(key, result);

                        // add a flag to the item indicating it was obtained from the cache
                        result.isFromCache = true;
                    }

                    resolve(result); 
                })
                .catch((error) => { reject(error); });
        });
    }

    /**
     * Generates cache key
     * @param clusterObject object for which property panel is generated
     * @param timeInterval the time interval that the user has selected for examining his AKS resources
     * @param workspace the user's currently selected workspace
     * @returns cached data item of 'undefined' if not found in cache
     */
    private createCacheKey(
        clusterObject: IClusterObjectInfo, 
        timeInterval: ITimeInterval, 
        workspace: IWorkspaceInfo
    ): any {
        if (!clusterObject) { throw new Error('Parameter @clusterObject may not be null or empty'); }
        if (!timeInterval) { throw new Error('Parameter @timeInterval may not be null or empty'); }
        if (!workspace) { throw new Error('Parameter @workspace may not be null or empty'); }

        return (
            (workspace.id || '') + '|' +
            (timeInterval.getRealStart() || '') + '|' +
            (timeInterval.getRealEnd() || '') + '|' +
            (clusterObject.resourceType || '') + '|' +
            (clusterObject.clusterResourceId || '') + '|' +
            (clusterObject.nodeName || '') + '|' +
            (clusterObject.controllerName || '') + '|' +
            (clusterObject.podName || '') + '|' +
            (clusterObject.containerName || '') + '|' +
            (clusterObject.timeGenerated || '')
        );
    }
}
