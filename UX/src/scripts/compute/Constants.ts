import { TimeValues } from '@appinsights/pillscontrol-es5';

export const IdealAggregateChartDataPoints: number = 100;
export const IdealGridTrendDataPoints: number = 25;

export const SupportedPerfTimes: TimeValues[] = [
    TimeValues.Last30Minutes,
    TimeValues.LastHour,
    TimeValues.LastDay,
    TimeValues.Last7Days,
    TimeValues.Last30Days,
    TimeValues.Custom
];

export const SupportedMapTimes: TimeValues[] = [
    TimeValues.Last30Minutes,
    TimeValues.LastHour,
    TimeValues.Custom
];

export const MemoryUnits = {
    KiloBytes: 1024,
    MegaBytes: 1024 * 1024,
    GigaBytes: 1024 * 1024 * 1024,
    TeraBytes: 1024 * 1024 * 1024 * 1024,
    PetaBytes: 1024 * 1024 * 1024 * 1024 * 1024,
    ExaBytes: 1024 * 1024 * 1024 * 1024 * 1024 * 1024
}

export const MetricUnits = {
    Deka: 10,
    Hecto: 100,
    Kilo: 1000,
    Mega: 1000 * 1000,
    Giga: 1000 * 1000 * 1000,
    Tera: 1000 * 1000 * 1000 * 1000,
    Peta: 1000 * 1000 * 1000 * 1000 * 1000,
    Exa: 1000 * 1000 * 1000 * 1000 * 1000 * 1000
}

export const DefaultTime: TimeValues = TimeValues.LastDay;

export const PropertyPaneSelectedTelemetryEventName = 'PropertyPaneSelected';
export const PropertyPaneToggled = 'PropertyPaneToggled';

export const ComputePerfOnOpenTableForMetric = 'ComputePerrfOnOpenTableForMetric';

export const FeatureMap = {
    vmInsightsAlerts: 'vmInsightsAlerts',
    propertyPanel: 'propertyPanel',
    enableInsightsMetricsOnboarding: 'enableInsightsMetricsOnboarding',
    enableInsightsMetricsQuery: 'enableInsightsMetricsQuery',
    vmhealth: 'vmhealth'
}

// TODO bb: Put all API formats in this section
// tslint:disable:max-line-length
export const api: any = {
        listResourceGroupsApiVersion: '2015-01-01',
        listVmsApiVersion: '2019-03-01',
        listVmsssApiVersion: '2019-03-01',
        listVmssInstancesApiVersion: '2018-06-01',
        urls: {
            listVmsOfResourceGroup: '/subscriptions/{0}/resourcegroups/{1}/providers/Microsoft.Compute/virtualMachines?api-version={2}',
            listVmsssOfResourceGroup: '/subscriptions/{0}/resourcegroups/{1}/providers/Microsoft.Compute/virtualMachineScaleSets?api-version={2}',
            listVmsOfSubscription: '/subscriptions/{0}/providers/Microsoft.Compute/virtualMachines?api-version={1}',
            listVmsssOfSubscription: '/subscriptions/{0}/providers/Microsoft.Compute/virtualMachineScaleSets?api-version={1}',
            listResourceGroups: '/subscriptions/{0}/resourcegroups?api-version={1}'
        }
}
