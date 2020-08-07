export enum VmInsightsAlertRulesSignalType {
    Metric = 'Metric',
    Log = 'Log'
}

export interface VmInsightsCreateAlertRuleParams {
    resourceId: string;
    metricId: string;
    signalType: VmInsightsAlertRulesSignalType;
}
