import { VmInsightsDataProvider } from '../data-provider/VmInsightsDataProvider';
import { TimeInterval } from '../../shared/data-provider/TimeInterval';
import { StringHelpers } from '../../shared/Utilities/StringHelpers';
import { AtScaleUtils } from './AtScaleUtils';
import { RetryARMDataProvider } from '../../shared/data-provider/RetryARMDataProvider';
import { ARMDataProvider } from '../../shared/data-provider/ARMDataProvider';
import { RetryPolicyFactory } from '../../shared/data-provider/RetryPolicyFactory';
import { KustoDataProvider } from '../../shared/data-provider/KustoDataProvider';
import * as GlobalConstants from '../../shared/GlobalConstants';
import { ITelemetry } from '../../shared/Telemetry';
import { IAzureResourceDescriptor } from './ResourceInfo';
import { ResourceDataProvider } from '../data-provider/ResourceDataProvider';
import { IPropertiesPanelQueryParams } from './property-panel/data-models/PropertiesPanelQueryParams';

export interface IOmsAlert {
    AlertSeverity: string | number;
    AlertName: string;
    SourceSystem: string;
    TimeGenerated: string;
    queryExecutionStartTime: string;
    Query: string;
    AlertRuleId: string;
    AlertRuleInstanceId: string;
    ThresholdOperator: string;
    ThresholdValue: string;
    LinkToSearchResults: string;
    ResourceId: string;
    Computer: string;
}

export interface IAlertSummary {
    totalCount: number;
    sev0Count?: number;
    sev1Count?: number;
    sev2Count?: number;
    sev3Count?: number;
    sev4Count?: number;
}

export class AlertsManager {
    private vmInsightsDataProvider: VmInsightsDataProvider;
    private armDataProvider: RetryARMDataProvider;
    private azureResourceProvider: ResourceDataProvider;
    private alertSummaryApiVersion: string = '2018-05-05';
    private getRequestTimeoutInMs: number = 20000;
    private telemetry: ITelemetry;
    private telemetryPrefix: string;
    constructor(azureResourceDataProvider: ResourceDataProvider, telemetry: ITelemetry, telemetryPrefix: string) {
        this.armDataProvider = new RetryARMDataProvider(new ARMDataProvider(), new RetryPolicyFactory());
        this.vmInsightsDataProvider = new VmInsightsDataProvider(
            new KustoDataProvider(
                this.armDataProvider,
                GlobalConstants.VMInsightsApplicationId
            ));
        this.azureResourceProvider = azureResourceDataProvider;
        this.telemetry = telemetry;
        this.telemetryPrefix = telemetryPrefix;
    }

    public getLaAlertsList(alertQueryParams: IPropertiesPanelQueryParams): Promise<IOmsAlert[]> {
        return this.vmInsightsDataProvider.getLaAlertsList(alertQueryParams).then((kustoResponse) => {
            return this.convertKustoResponseToAlertObjects(kustoResponse);
        });
    }

    public getLaAlertSummary(alertQueryParams: IPropertiesPanelQueryParams): Promise<IAlertSummary> {
        return this.vmInsightsDataProvider.getLaAlertsSummary(alertQueryParams).then((response) => {
            return this.convertKustoResponseToAlertSummary(response, alertQueryParams);
        });
    }

    public getResourceCentricAlertSummary(alertQueryParams: IPropertiesPanelQueryParams): Promise<IAlertSummary> {
        if (!alertQueryParams || !alertQueryParams.resourceId) {
            return Promise.resolve(undefined);
        }
        return this.getAzureResourceAlertSummary(alertQueryParams.resourceId,
            alertQueryParams.timeInterval);
    }

    private convertKustoResponseToAlertObjects(kustoResponse: any): IOmsAlert[] {
        if (!this.isValidKustoResponse(kustoResponse)) {
            return null;
        }

        let alerts: IOmsAlert[] = [];
        const kustoTable: any = kustoResponse.Tables[0];
        for (let rowIndex: number = 0; rowIndex < kustoTable.Rows.length; rowIndex++) {
            let value: any = {};
            for (let colIndex: number = 0; colIndex < kustoTable.Columns.length; colIndex++) {
                if (kustoTable.Rows[rowIndex][colIndex]) {
                    value[kustoTable.Columns[colIndex].ColumnName] = kustoTable.Rows[rowIndex][colIndex];
                }
            }
            let valueSize: number = Object.keys(value) && Object.keys(value).length;
            if (!valueSize) {
                continue
            }

            alerts.push(value);
        }
        return alerts;
    }

    private convertKustoResponseToAlertSummary(kustoResponse: any, alertQueryParams: IPropertiesPanelQueryParams): IAlertSummary {
        if (!this.isValidKustoResponse(kustoResponse)
            || kustoResponse.Tables[0].Columns.length !== 2) {
            return null;
        }
        const kustoTable: any = kustoResponse.Tables[0];
        let value: IAlertSummary = {
            totalCount: 0
        };
        // The summary table should have only teo columns. First column in the alert severity
        // and the second column is the alert count.
        const sevColumnIndex: number = 0;
        const alertCountColumnIndex: number = 1;
        for (let rowIndex: number = 0; rowIndex < kustoTable.Rows.length; rowIndex++) {
            switch (kustoTable.Rows[rowIndex][sevColumnIndex]) {
                case '0':
                    value.sev0Count = kustoTable.Rows[rowIndex][alertCountColumnIndex];
                    value.totalCount += value.sev0Count;
                    break;
                case '1':
                    value.sev1Count = kustoTable.Rows[rowIndex][alertCountColumnIndex];
                    value.totalCount += value.sev1Count;
                    break;
                case '2':
                    value.sev2Count = kustoTable.Rows[rowIndex][alertCountColumnIndex];
                    value.totalCount += value.sev2Count;
                    break;
                case '3':
                    value.sev3Count = kustoTable.Rows[rowIndex][alertCountColumnIndex];
                    value.totalCount += value.sev3Count;
                    break;
                case '4':
                    value.sev4Count = kustoTable.Rows[rowIndex][alertCountColumnIndex];
                    value.totalCount += value.sev4Count;
                    break;
                default:
                    this.telemetry.logEvent(`${this.telemetryPrefix}.convertKustoResponseToAlertSummary`,
                        {
                            errorMessage: `Reeceived alertSummary with severity ${kustoTable.Rows[rowIndex][sevColumnIndex]}`,
                            queryParams: JSON.stringify(alertQueryParams)
                        }, undefined);
                    break;
            }
        }
        return value;
    }

    private isValidKustoResponse(kustoResponse: any): boolean {
        if (!kustoResponse || !kustoResponse.Tables || kustoResponse.Tables.length <= 0) {
            return false;
        }

        let kustoTable = kustoResponse.Tables[0];
        if (!kustoTable || !kustoTable.Rows || !kustoTable.Columns) {
            return false;
        }
        return true;
    }

    /**
     * This method queries AlertsManagement RP to get the alert summary of a given resourceId group by severity
     * @param resourceId Azure ResourceId
     * @param timeInterval TimeInterval
     */
    private getAzureResourceAlertSummary(resourceId: string, timeInterval: TimeInterval): Promise<IAlertSummary> {
        if (StringHelpers.isNullOrEmpty(resourceId) || !timeInterval) {
            return Promise.resolve(undefined);
        }

        // We need to get alerts of a VMSS and filter for a given VMSSInstance.
        const resourceDescriptor = AtScaleUtils.getAzureComputeResourceDescriptor(resourceId);
        if (!resourceDescriptor || StringHelpers.isNullOrEmpty(resourceDescriptor.subscription)) {
            return Promise.resolve(undefined);
        }

        // Special case: Need to handle VMSSInstance specially. There is no API to get alert summary for a given VMSSInstance.
        // We get all alerts of a VMSS and filter alerts for a specific VMSSInstance.
        if (resourceDescriptor.type && resourceDescriptor.type.toLowerCase() ===
            'microsoft.compute/virtualmachinescalesets/virtualmachines') {
            return this.getResourceCentricAlertSummaryOfVMSSInstance(resourceDescriptor, timeInterval);
        }

        const startTime: Date = timeInterval.getRealStart();
        const endTime: Date = timeInterval.getRealEnd();
        if (!startTime || !endTime) {
            return Promise.resolve(undefined);
        }
        const customTimeRangeInISO = `${startTime.toISOString()}/${endTime.toISOString()}`;
        let alertSummaryUri: string = `/subscriptions/${resourceDescriptor.subscription}` +
            `/providers/Microsoft.AlertsManagement/alertsSummary?groupby=severity&customTimeRange=${customTimeRangeInISO}`;

        if (resourceDescriptor.resources && resourceDescriptor.resources.length > 0) {
            alertSummaryUri += `&targetResource=${resourceId}`;
        } else if (!StringHelpers.isNullOrEmpty(resourceDescriptor.resourceGroup)) {
            alertSummaryUri += `&targetResourceGroup=${resourceDescriptor.resourceGroup}`;
        }

        alertSummaryUri += `&api-version=${this.alertSummaryApiVersion}`;

        return this.armDataProvider.executeGet(alertSummaryUri, this.getRequestTimeoutInMs).then((response) => {
            let alertsSummary: IAlertSummary = {
                totalCount: 0
            };
            if (response && response.properties && response.properties.total
                && response.properties.values && response.properties.values.length > 0) {
                let alertSummaryResponse: { name: string, count: number }[] = response.properties.values;
                alertsSummary.totalCount = response.properties.total;
                alertSummaryResponse.forEach((item) => {
                    if (item && !StringHelpers.isNullOrEmpty(item.name)) {
                        switch (item.name.toLowerCase()) {
                            case 'sev0':
                                alertsSummary.sev0Count = item.count || 0;
                                break;
                            case 'sev1':
                                alertsSummary.sev1Count = item.count || 0;
                                break;
                            case 'sev2':
                                alertsSummary.sev2Count = item.count || 0;
                                break;
                            case 'sev3':
                                alertsSummary.sev3Count = item.count || 0;
                                break;
                            case 'sev4':
                                alertsSummary.sev4Count = item.count || 0;
                                break;
                            default:
                                this.telemetry.logEvent(`${this.telemetryPrefix}.getAzureResourceAlertSummary`,
                                    {
                                        errorMessage: `Reeceived alertSummary with severity ${item.name.toLowerCase()}`,
                                        resourceId
                                    }, undefined);
                                break;
                        }
                    }
                });
            }
            return alertsSummary;
        });
    }

    /**
     * This method retrieves all alerts of a VMSS and filters the alert list for a given VMSS Instance
     * @param resourceDescriptor VMSS Instance resource descriptor
     * @param timeInterval 
     */
    private getResourceCentricAlertSummaryOfVMSSInstance(resourceDescriptor: IAzureResourceDescriptor,
        timeInterval: TimeInterval): Promise<IAlertSummary> {
        if (!resourceDescriptor || StringHelpers.isNullOrEmpty(resourceDescriptor.resourceId)
            || !timeInterval || StringHelpers.isNullOrEmpty(resourceDescriptor.subscription)
            || StringHelpers.isNullOrEmpty(resourceDescriptor.resourceGroup)) {
            return Promise.resolve(undefined);
        }

        // Make ARM call to get the resourceDetails of the VMSS Instance.
        let resourceDetailsPromise = this.azureResourceProvider.getResourceByResourceId(resourceDescriptor.resourceId);
        const vmssResourceId: string = resourceDescriptor.resourceId?.toLowerCase().split('/virtualmachines/')[0];
        return this.getResourceCentricAlerts(vmssResourceId, timeInterval).then((alerts: any[]) => {
            let alertsSummary: IAlertSummary = {
                totalCount: 0
            };
            return resourceDetailsPromise.then((resource) => {
                let vmssInstanceName: string;
                if (resource && resource.content && resource.content.name) {
                    vmssInstanceName = resource.content.name;
                }
                if (!vmssInstanceName || !alerts || alerts.length === 0) {
                    return alertsSummary;
                }
                // Iterate over alerts list, filter alerts belonging to the VMSSInstance name.
                for (let alert of alerts) {
                    if (alert && alert.properties && alert.properties.context && alert.properties.context.context
                        && alert.properties.context.context.condition && alert.properties.context.context.condition.allOf
                        && alert.properties.context.context.condition.allOf.length > 0) {
                        const dimensions = alert.properties.context.context.condition.allOf[0].dimensions;
                        for (let dimension of dimensions) {
                            if (dimension.name && dimension.name.toLowerCase() === 'vmname'
                                && dimension.value && dimension.value.toLowerCase() === vmssInstanceName.toLowerCase()) {
                                alertsSummary.totalCount++;
                                alertsSummary[`sev${alert.properties.context.context.severity}Count`] =
                                    alertsSummary[`sev${alert.properties.context.context.severity}Count`] ?
                                        alertsSummary[`sev${alert.properties.context.context.severity}Count`] + 1 : 1;
                                break;
                            }
                        }
                    }
                }
                return alertsSummary;
            });
        });
    }

    /**
     * This method retrieves all alerts of a given Azure resource.
     * @param resourceDescriptor 
     * @param timeInterval 
     */
    private getResourceCentricAlerts(resourceId: string, timeInterval: TimeInterval): Promise<any[]> {
        if (!resourceId || !timeInterval) {
            return Promise.resolve(undefined);
        }

        const resourceDescriptor = AtScaleUtils.getAzureComputeResourceDescriptor(resourceId);
        if (!resourceDescriptor || StringHelpers.isNullOrEmpty(resourceDescriptor.subscription)) {
            return Promise.resolve(undefined);
        }

        const startTime: Date = timeInterval.getRealStart();
        const endTime: Date = timeInterval.getRealEnd();
        if (!startTime || !endTime) {
            return Promise.resolve(undefined);
        }

        const customTimeRangeInISO = `${startTime.toISOString()}/${endTime.toISOString()}`;
        let alertListUri: string = `${resourceId}` +
            `/providers/Microsoft.AlertsManagement/alerts?customTimeRange=${customTimeRangeInISO}`;

        alertListUri += `&includeContext=true&api-version=2019-03-01-preview`;
        let alertsList: any[] = [];
        let promise: Promise<any[]> = new Promise((resolve, reject) => {
            function getAlerts(uri) {
                this.armDataProvider.executeGet(uri, this.getRequestTimeoutInMs).then((response) => {
                    if (!response || !response.value) {
                        resolve(alertsList);
                    } else {
                        alertsList.splice(alertsList.length, 0, ...response.value);
                    }
                    if (!response.nextLink) {
                        resolve(alertsList);
                    } else {
                        uri = '/subscriptions' + response.nextLink.split('/subscriptions')[1];
                        getAlerts(uri);
                    }
                }, (error) => { reject(error); });
            };
            getAlerts.bind(this)(alertListUri);
        });

        return promise;
    }
}
