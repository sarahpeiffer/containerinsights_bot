import * as React from 'react';

import { AlertSummaryComponent } from './component/AlertSummaryComponent';
import { AtScaleUtils } from '../AtScaleUtils';
import { GUID } from '@appinsights/aichartcore';
import { IAlertSummary, AlertsManager } from '../AlertsManager';
import { TelemetryUtils } from '../TelemetryUtils';
import { ResourceDataProvider } from '../../data-provider/ResourceDataProvider';
import { InfoBoxComponent, IInfoBoxProps, InfoBoxType } from './component/InfoboxComponent';
import { IPropertiesPanelQueryParams } from './data-models/PropertiesPanelQueryParams';

/**
 * Shared imports
 */
import { PropertyPanelHeaderSection } from '../../../shared/property-panel/PropertyPanelHeaderSection';
import { DisplayStrings } from '../../../shared/DisplayStrings';
import { ITelemetry } from '../../../shared/Telemetry';
import { ComputerGroupType } from '../../../shared/ComputerGroup';
import { IKustoQueryOptions } from '../../../shared/data-provider/KustoDataProvider';
import * as msg from '../../../shared/MessagingProvider';
import { StringHelpers } from '../../../shared/Utilities/StringHelpers';
import { WarnSvg } from '../../../shared/svg/warn';

const gaFaqUri: string = 'https://docs.microsoft.com/en-us/azure/azure-monitor/insights/vminsights-ga-release-faq'

export interface IAlertPanelHeaders {
    panelId: string;
    displayName: string;
    displayIcon: any;
}

export interface IAlertPanelV2Props {
    panelHeaders: IAlertPanelHeaders;
    alertSummaryQueryProps: IPropertiesPanelQueryParams;
    telemetry: ITelemetry;
    telemetryPrefix: string;
    messagingProvider: msg.MessagingProvider;
    onLaAlertSummaryLoaded?: (alertSummary: IAlertSummary) => void;
}

export interface IAlertPanelV2State {
    /**
     * This summary object contains Log analytics alerts count and resource centric alert count
     * grouped by severity.
     */
    alertSummary: IAlertSummary;
    infoBoxContent: IInfoBoxProps;
}

export interface IAlertingResourceInfo {
    workspaceList: string[];
    serviceMapComputerName?: string;
    azureResourceId?: string;
    serviceMapGroupMembers?: string[];
    savedSearchGroupName?: string;
}

export interface IAlertListNavigationContext {
    resourceInfo: IAlertingResourceInfo;
    monitoringService?: string;
    startTimeInUtc: string;
    endTimeInUtc: string;
    errorMessageBanner?: string;
}

/**
 * AlertPanel V2 shows alert summary sections.
 * We will show one section for azure resource centric and another section for workspace centric.
 * Alert Summary section also provides button to navigate to AlertList blade.
 */
export class AlertPanelV2 extends React.Component<IAlertPanelV2Props, IAlertPanelV2State> {
    private alertsManager: AlertsManager;
    private azureResourceDataProvider: ResourceDataProvider;
    private laQuerySessionId: string;
    private resourceCentricAlertsRequestId: string;

    constructor(props: IAlertPanelV2Props) {
        super(props);
        this.azureResourceDataProvider = new ResourceDataProvider();
        this.alertsManager = new AlertsManager(this.azureResourceDataProvider, this.props.telemetry, this.props.telemetryPrefix);
        this.state = {
            alertSummary: undefined,
            infoBoxContent: {
                message: DisplayStrings.AlertSummaryInfo,
                links: [
                    {
                        label: DisplayStrings.GaFaq,
                        href: gaFaqUri
                    }
                ]
            }
        };
        this.navigateToAlertListBlade = this.navigateToAlertListBlade.bind(this);
    }

    public componentDidMount() {
        // Get alerts summary here
        this.retrieveAlertSummary(this.props.alertSummaryQueryProps);
    }

    public componentDidUpdate(prevProps: IAlertPanelV2Props) {
        if (!this.props || !this.props.alertSummaryQueryProps) {
            this.setState({
                alertSummary: undefined
            });
            return;
        }

        if (!prevProps && this.props) {
            this.retrieveAlertSummary(this.props.alertSummaryQueryProps);
        }
        if (!this.compareAlertSummaryQueryProps(prevProps.alertSummaryQueryProps, this.props.alertSummaryQueryProps)
            || (!prevProps.panelHeaders && this.props.panelHeaders)
            || (prevProps.panelHeaders && !this.props.panelHeaders)) {

            this.retrieveAlertSummary(this.props.alertSummaryQueryProps);
        }
    }

    public render(): JSX.Element {
        if (!this.props.panelHeaders
            || !this.props.panelHeaders.panelId
            || !this.props.alertSummaryQueryProps) {
            return null; // TODO: Need to show loading icon
        }

        const resourceCentricAlertSummaryComponent: JSX.Element = <AlertSummaryComponent
            alertSummary={this.state.alertSummary}
            title={DisplayStrings.TotalAlertCount}
            onAlertDetailsButtonClicked={() => {
                if (this.props.alertSummaryQueryProps
                    && this.props.alertSummaryQueryProps.timeInterval) {
                    this.navigateToAlertListBlade({
                        resourceInfo: {
                            workspaceList: this.props.alertSummaryQueryProps.workspace && [this.props.alertSummaryQueryProps.workspace.id],
                            serviceMapComputerName: this.props.alertSummaryQueryProps.computerName,
                            azureResourceId: this.props.alertSummaryQueryProps.resourceId
                        },
                        startTimeInUtc: this.props.alertSummaryQueryProps.timeInterval.getRealStart().toUTCString(),
                        endTimeInUtc: this.props.alertSummaryQueryProps.timeInterval.getRealEnd().toUTCString(),
                        errorMessageBanner: this.state.infoBoxContent
                            && this.state.infoBoxContent.type === InfoBoxType.Error ? this.state.infoBoxContent.message : null
                    });
                }
            }}
        />;
        return <>
            <PropertyPanelHeaderSection
                title={this.props.panelHeaders.displayName}
                icon={this.props.panelHeaders.displayIcon}
                subTitle={DisplayStrings.MachineAlerts}
            />
            {this.state.infoBoxContent && <InfoBoxComponent
                message={this.state.infoBoxContent.message}
                links={this.state.infoBoxContent.links}
                icon={this.state.infoBoxContent.icon}
                type={this.state.infoBoxContent.type}
            />}
            {resourceCentricAlertSummaryComponent}
        </>
    }

    /**
     * This method add alert summary retrieved from AMP APIs and alert summary retrieved from 
     * LA alert table and returns final alert summary object
     */
    private getAggregatedAlertSummary(alertSummaries: IAlertSummary[]): IAlertSummary {
        if (!alertSummaries || alertSummaries.length === 0) {
            return {
                totalCount: 0
            };
        }

        return alertSummaries.reduce((prev: IAlertSummary, current: IAlertSummary) => {
            return {
                totalCount: ((prev && prev.totalCount) || 0) + ((current && current.totalCount) || 0),
                sev0Count: ((prev && prev.sev0Count) || 0) + ((current && current.sev0Count) || 0),
                sev1Count: ((prev && prev.sev1Count) || 0) + ((current && current.sev1Count) || 0),
                sev2Count: ((prev && prev.sev2Count) || 0) + ((current && current.sev2Count) || 0),
                sev3Count: ((prev && prev.sev3Count) || 0) + ((current && current.sev3Count) || 0),
                sev4Count: ((prev && prev.sev4Count) || 0) + ((current && current.sev4Count) || 0),
            }
        });
    }

    /**
     * This method compares two queryProp objects and returns true if both are equal otherwise returns flase 
     * @param props1 
     * @param props2 
     */
    private compareAlertSummaryQueryProps(props1: IPropertiesPanelQueryParams, props2: IPropertiesPanelQueryParams): boolean {
        if ((!props1 && props2) || (props1 && !props2)) {
            return false;
        }
        const timeIntervalUnEqual: boolean = props1.timeInterval && props2.timeInterval && ((props1.timeInterval.getRealStart().toString()
            !== props2.timeInterval.getRealStart().toString())
            || (props1.timeInterval.getRealEnd().toString() !== props2.timeInterval.getRealEnd().toString()));
        const workspaceUnequal: boolean = !AtScaleUtils.areWorkspacesEqual(props1.workspace, props2.workspace);
        const resourceIdUnequal: boolean = props1.resourceId !== props2.resourceId;
        const groupUnequal: boolean = (!props1.computerGroup && !!props2.computerGroup) || (!!props1.computerGroup && !props2.computerGroup)
            || (!!props1.computerGroup && !!props2.computerGroup && props1.computerGroup.id !== props2.computerGroup.id);
        const computerNameUnequal: boolean = props1.computerName !== props2.computerName;

        return !(timeIntervalUnEqual || workspaceUnequal || resourceIdUnequal || groupUnequal || computerNameUnequal);
    }

    private retrieveAlertSummary(queryProps: IPropertiesPanelQueryParams) {
        let laPromiseRejected: boolean = false;
        let rcPromiseRejected: boolean = false;
        const laPromise = this.getLogAnalyticsAlertSummary(queryProps).then((result) => { return result }).catch((err) => {
            laPromiseRejected = true;
            return { totalCount: 0 };
        });

        const rcPromise = this.getAllResourceCentricAlertSummary(queryProps).then((result) => { return result }).catch((err) => {
            rcPromiseRejected = true;
            return { totalCount: 0 };
        });


        Promise.all([laPromise, rcPromise]).then((result: IAlertSummary[]) => {
            if (laPromiseRejected || rcPromiseRejected) {
                const errorMessage: string = laPromiseRejected && rcPromiseRejected ? DisplayStrings.AlertSummaryErrorMessage
                    : (laPromiseRejected ? DisplayStrings.AlertSummaryLogsErrorMessage : DisplayStrings.AlertSummaryResourceErrorMessage);
                this.setState({
                    infoBoxContent: {
                        message: errorMessage,
                        type: InfoBoxType.Error,
                        icon: <WarnSvg />
                    },
                    alertSummary: this.getAggregatedAlertSummary(result)
                });
            } else {
                this.setState({
                    alertSummary: this.getAggregatedAlertSummary(result)
                });
            }
        });
    }

    /**
     * This method retrieves alert summary by querying LA Alerts table.
     * @param queryProps 
     */
    private getLogAnalyticsAlertSummary(queryProps: IPropertiesPanelQueryParams): Promise<IAlertSummary> {
        if (!queryProps || !queryProps.timeInterval) {
            return Promise.resolve(undefined);
        }

        const sessionId: string = GUID().toLowerCase();
        this.laQuerySessionId = sessionId;
        const eventName: string = `${this.props.telemetryPrefix}.GetLogAnalyticsAlertSummary`;
        const properties = this.getTelemetryLogProperties(queryProps, sessionId);
        const telemetryContext = this.props.telemetry.startLogEvent(eventName, properties, undefined);

        const queryOptions: IKustoQueryOptions = { requestInfo: eventName, sessionId, timeInterval: queryProps.timeInterval };
        queryProps.kustoQueryOptions = queryOptions;

        return this.alertsManager.getLaAlertSummary(queryProps).then((alertSummary) => {
            if (TelemetryUtils.completeApiTelemetryEvent(telemetryContext,
                sessionId !== this.laQuerySessionId,
                !alertSummary,
                'Unexpected structure of results array')) {
                if (this.props.onLaAlertSummaryLoaded) {
                    this.props.onLaAlertSummaryLoaded(alertSummary);
                }
                return alertSummary;
            }
            return undefined;
        }).catch((err) => {
            telemetryContext.fail(err, { message: 'Failed to query LogAnalyticsAlertSummary' });
            throw err;
        });
    }

    /**
     * This method retrieves alert summary of a given azure resource across all monitoring services
     * grouped by severity.
     * @param queryProps 
     */
    private getAllResourceCentricAlertSummary(queryProps: IPropertiesPanelQueryParams): Promise<IAlertSummary> {
        if (!queryProps || StringHelpers.isNullOrEmpty(queryProps.resourceId) || !queryProps.timeInterval) {
            return Promise.resolve(undefined);
        }
        const requestId = GUID().toLowerCase();
        this.resourceCentricAlertsRequestId = requestId;
        const eventName: string = `${this.props.telemetryPrefix}.GetResourceCentricAlertSummary`;
        const properties = this.getTelemetryLogProperties(queryProps, requestId);
        const telemetryContext = this.props.telemetry.startLogEvent(eventName, properties, undefined);
        return this.alertsManager.getResourceCentricAlertSummary(queryProps).then((alertSummary) => {
            if (TelemetryUtils.completeApiTelemetryEvent(telemetryContext,
                requestId !== this.resourceCentricAlertsRequestId,
                !alertSummary,
                'Unexpected structure of results array')) {
                return alertSummary;
            }
            return undefined;
        }).catch((err) => {
            telemetryContext.fail(err, { message: 'Failed to query ResourceCentricAlertSummary' });
            throw err;
        });
    }

    private getTelemetryLogProperties(queryProps: IPropertiesPanelQueryParams,
        sessionId: string): StringMap<string> {
        const properties: StringMap<string> = {};
        properties['workspaceId'] = queryProps.workspace && queryProps.workspace.id;
        properties['sessionId'] = sessionId;
        properties['resourceId'] = queryProps.resourceId;
        properties['computerName'] = queryProps.computerName

        if (queryProps.computerGroup) {
            properties['group_type'] = ComputerGroupType[queryProps.computerGroup.groupType];
            properties['group_id'] = queryProps.computerGroup.id;
        }

        return properties;
    }

    private navigateToAlertListBlade(navigationContext: IAlertListNavigationContext) {
        if (!this.props.messagingProvider) {
            return;
        }
        this.props.telemetry.logEvent(`${this.props.telemetryPrefix}.navigateToAlertListBlade`, {
            navigationContext: JSON.stringify(navigationContext)
        }, undefined);
        this.props.messagingProvider.sendNavigateToAlertsManagementBladeCommand(navigationContext);
    }
}
