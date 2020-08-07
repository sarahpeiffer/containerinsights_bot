import { assert } from 'chai';

import { ISimpleCache } from '../../src/scripts/container/data-provider/IntervalExpirationCache'
import { IClusterObjectInfo, IPropertyPanelDataProvider } from '../../src/scripts/container/data-provider/PropertyPanelDataProvider'
import { CachingPropertyPanelDataProvider } from '../../src/scripts/container/data-provider/CachingPropertyPanelDataProvider'
import { ITimeInterval, TimeInterval } from  '../../src/scripts/shared/data-provider/TimeInterval';
import { IWorkspaceInfo } from '../../src/scripts/shared/IWorkspaceInfo';
import { PropertyPanelType } from '../../src/scripts/container/data-provider/KustoPropertyPanelResponseInterpreter';

class MockPropertyPanelDataProvider implements IPropertyPanelDataProvider {
    private propsPanelDataItem: any;
    private failNextGet: boolean = false;

    constructor(propsPanelDataItem: any) {
        this.propsPanelDataItem = propsPanelDataItem;
    }

    public getData(clusterObject: IClusterObjectInfo, timeInterval: ITimeInterval, workspace: IWorkspaceInfo): Promise<any> {
        if (this.failNextGet) {
            this.failNextGet = false;
            return Promise.reject('error');
        };

        return Promise.resolve(this.propsPanelDataItem);
    }

    public failNextCall(): void {
        this.failNextGet = true;
    }
}

class MockCache implements ISimpleCache {
    private cache: any = {};
    private cachedItemCount: number = 0;
    private lastCachedKeyAndItem: any = null;

    public getItem(key: string): any {
        return this.cache[key];
    }

    public addItem(key: string, item: any): void {
        this.cache[key] = item;
        this.cachedItemCount++;

        this.lastCachedKeyAndItem = { key, item };
    }

    public getCachedItemCount(): number {
        return this.cachedItemCount;
    }

    public getLastCachedKeyAndItem(): any {
        return this.lastCachedKeyAndItem;
    }
}

const mockClusterObjectInfo: IClusterObjectInfo = {
    resourceType: PropertyPanelType.Controller,
    containerName: null,
    podName: null,
    controllerName: 'controller',
    nodeName: 'node',
    timeGenerated: 'generated-at',
    clusterResourceId: ''
};

const mockTimeInterval: ITimeInterval = new TimeInterval(new Date(), new Date(), 10);

const mockWorkspaceInfo: IWorkspaceInfo = {
    id: 'workspace-id',
    location: 'workspace-region',
    name: 'workspace-name'
};

const mockPropsPanelData = { data: 'props-panel-data' };

suite('unit | CachingPropertyPanelDataProvider', () => {

    test('It should store item in cache upon success', () => {
        const mockCache = new MockCache();

        const cachingProvider = new CachingPropertyPanelDataProvider(
            new MockPropertyPanelDataProvider(mockPropsPanelData), mockCache);

            return new Promise((resolve) => {
                cachingProvider.getData(mockClusterObjectInfo, mockTimeInterval, mockWorkspaceInfo)
                    .then((result) => {
                        assert.equal(1, mockCache.getCachedItemCount());

                        assert.deepEqual(mockPropsPanelData, result);
                        
                        const keyAnditemInCache = mockCache.getLastCachedKeyAndItem();
                        assert.deepEqual(mockPropsPanelData, keyAnditemInCache.item);

                        resolve(null);
                    });
            });
    });

    test('It should NOT store item in cache upon failure', () => {
        const mockCache = new MockCache();
        const mockProvider = new MockPropertyPanelDataProvider(mockPropsPanelData);

        const cachingProvider = new CachingPropertyPanelDataProvider(mockProvider, mockCache);
            return new Promise((resolve, reject) => {
                mockProvider.failNextCall();

                cachingProvider.getData(mockClusterObjectInfo, mockTimeInterval, mockWorkspaceInfo)
                    .then(() => {
                        reject('Caching provider must fail since underlying provider failed');
                    })
                    .catch(() => {
                        assert.equal(0, mockCache.getCachedItemCount());
                        resolve(null);
                    });
            });
    });

    test('It should get item from cache when available', () => {
        const mockCache = new MockCache();
        const mockProvider = new MockPropertyPanelDataProvider(mockPropsPanelData);

        const cachingProvider = new CachingPropertyPanelDataProvider(mockProvider, mockCache);
            return new Promise((resolve, reject) => {
                cachingProvider.getData(mockClusterObjectInfo, mockTimeInterval, mockWorkspaceInfo)
                    .then(() => {
                        // make sure second call to db provider will fail
                        mockProvider.failNextCall();

                        cachingProvider.getData(mockClusterObjectInfo, mockTimeInterval, mockWorkspaceInfo)
                            .then((result) => {
                                assert.deepEqual(mockPropsPanelData, result);
                                resolve(null);
                            });
                        });
            });
    });
});
