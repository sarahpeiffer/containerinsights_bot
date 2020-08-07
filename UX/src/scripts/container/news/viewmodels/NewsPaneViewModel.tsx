/**
 * block
 */
import * as $ from 'jquery';
import { Promise } from 'es6-promise';

import { NewsPaneModel } from '../models/NewsPaneModel';
import { BaseViewModel } from '../../../shared/BaseViewModel';
import { ContainerMainPageViewModel } from '../../main-page/viewmodels/ContainerMainPageViewModel';
// import { LocaleManager } from '../../../../scripts/shared/LocaleManager';

import { ITelemetry } from '../../../shared/Telemetry';
/**
 * view model in mvvm chain for deployments (main pane)
 */
const RSSEndpointURL = 'https://azurecomcdn.azureedge.net/en-us/updates-api/feed/?product=monitor';

export class NewsPaneViewModel extends BaseViewModel {
    /** news model */
    private newsPaneModel: NewsPaneModel;
    /** telemetry used for recording the event status */
    private telemetry: ITelemetry;

    constructor(telemetry: ITelemetry,
                parentContext: ContainerMainPageViewModel, 
                forceUpdate: reactForceUpdateHandler) {
        super(forceUpdate, parentContext);
        
        this.telemetry = telemetry;
        this.newsPaneModel = new NewsPaneModel(new Array<any>());

        parentContext.handleEventTrigger('TabSelected', this.onLoad.bind(this));
    }

    /**
     * mvvm hook into react lifecycle
     */
    public onLoad() {        
        const telemetryContext = this.telemetry.startLogEvent('getNewsPane', null, null);
        // TODO: will use the locale until then the translation work-around 
        // const locale = LocaleManager.Instance().getLocaleFromPathForNews();
        Promise.all([$.ajax(RSSEndpointURL)]).then((responses) => {
            const azureMonitorUpdate: any = responses[0].Items;
            let result = new Array<any>();
            for (let i = 0; i < azureMonitorUpdate.length; i++) {
                if (!azureMonitorUpdate[i].Link ||
                    !azureMonitorUpdate[i].Title ||
                    !azureMonitorUpdate[i].PublishDate ||
                    !azureMonitorUpdate[i].Description ||
                    !azureMonitorUpdate[i].Categories) {
                    continue;
                }
                const title: string = azureMonitorUpdate[i].Title.toLocaleLowerCase();
                const description: string = azureMonitorUpdate[i].Description.toLocaleLowerCase();
                // filter the RSS contents based on the tilte with the key words:
                // Azure Monitor for Containers, AKS, AKS-Engine, Kubernetes, Containers
                // TODO: check tag for azure monitor for containers once this is inplace and until then this is work-around
                if (description.indexOf('azure monitor for containers') > -1 ||
                    title.indexOf('azure monitor for containers') > -1
                ) {
                    result.push({
                        url: azureMonitorUpdate[i].Link,
                        title: azureMonitorUpdate[i].Title,
                        publishDate: azureMonitorUpdate[i].PublishDate.slice(0, 10),
                        description: azureMonitorUpdate[i].Description,
                        categories: azureMonitorUpdate[i].Categories
                    });
                }                
            }
            telemetryContext.complete();
            this.newsPaneModel.recentBlogPost = result;            
            this.propertyChanged('NewsPaneUpdate');
        }).catch((error: any) => {
            telemetryContext.fail(error, { message: 'Error retrieving data at What\'s new Tab page' });
        });
    }

    /**
     * get the recentBlogPost value
     */
    public get recentBlogPost():  Array<any> {
        return this.newsPaneModel.recentBlogPost;
    }
}
