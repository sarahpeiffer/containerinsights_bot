import * as React from 'react';
import { QuickLink } from '../../shared/property-panel/QuickLink';
import { ITelemetry } from '../../shared/Telemetry';
import { MapBlackAndWhiteSvg } from '../../shared/svg/map-black-white';
import { DisplayStrings } from '../../shared/DisplayStrings';
import { WorkbookHelper } from './WorkbookHelper';
import * as msg from '../../shared/MessagingProvider';
import { VMBlackAndWhiteSvg } from '../../shared/svg/vm-black-white';
import { PerformanceBlackAndWhiteSvg } from '../../shared/svg/performance-black-white';
import { TimeData } from '@appinsights/pillscontrol-es5';
import { ConnectionsSVG } from '../../shared/svg/connections';
import { IMapsNavigationMessage } from '../../shared/MessagingProvider';
import { IWorkspaceInfo } from '../../shared/IWorkspaceInfo';

/* Required for IE11... this will enable most of the Object.assign functionality on that browser */
import { polyfillObjectAssign } from '../../shared/ObjectAssignShim';
import { ErrorSeverity } from '../../shared/data-provider/TelemetryErrorSeverity';
polyfillObjectAssign();

import '../../../styles/shared/MainPage.less';

export enum NodeType {
    StandAloneNode = 'StandAloneNode',
    AzureScaleSetNode = 'AzureScaleSetNode'
}

export interface IQuicklinksDisplaySettings {
    showMapLink: boolean;
    showConnectionWorkbookLink: boolean;
    showResourceLink: boolean;
    showPerfViewLink: boolean;
    isSingleVm?: boolean;
}

export interface IQuicklinksProps {
    serviceMapResourceId: string;
    telemetryProvider: ITelemetry;
    messagingProvider: msg.MessagingProvider
    workspace: IWorkspaceInfo;
    azureResourceId: string;
    computerName: string;
    telemetryEventPrefix: string;
    type: NodeType;
    dateTime: TimeData;
    vmssInstanceId?: string;
    vmScaleSetResourceId?: string;
    displaySettings: IQuicklinksDisplaySettings;
}

export interface IQuicklinksState { }

const ServiceMapFeatureName: string = '/features/serviceMap/';
export class VmInsightsQuicklinks extends React.Component<IQuicklinksProps, IQuicklinksState> {

    constructor(props: IQuicklinksProps) {
        super(props);
    }

    public render(): JSX.Element {
        const linkList: JSX.Element[] = [];
        if (!this.props.displaySettings || !this.props.workspace) {
            return undefined;
        }
        if (this.props.serviceMapResourceId) {
            if (this.props.displaySettings.showMapLink) {
                const computeMapsQuickLink: JSX.Element = <QuickLink
                    onClick={() => this.onNavigateToComputeMapsAction()}
                    icon={<MapBlackAndWhiteSvg />}
                    label={DisplayStrings.Map}
                    key={'map'}
                />
                linkList.push(computeMapsQuickLink);
            }

            if (this.props.displaySettings.showConnectionWorkbookLink && this.props.computerName) {
                const sourceName: string = `${this.props.telemetryEventPrefix}.VmInsightsQuicklinks.onNavigateToConnectionDetailWorkbook`;
                const connectionDetailQuickLink: JSX.Element = <QuickLink
                    onClick={() => {
                        if (this.props.displaySettings.isSingleVm) {
                            WorkbookHelper.NavigateToSingleVmConnectionDetailWorkbook({
                                sourceName,
                                computerId: this.props.azureResourceId,
                                computerName: this.props.computerName,
                                workspaceId: this.props.workspace.id,
                                messagingProvider: this.props.messagingProvider,
                                telemetry: this.props.telemetryProvider
                            });
                        } else {
                            WorkbookHelper.NavigateToConnectionDetailWorkbook({
                                sourceName,
                                workspaceId: this.props.workspace.id,
                                computerName: this.props.computerName,
                                messagingProvider: this.props.messagingProvider,
                                telemetry: this.props.telemetryProvider
                            })
                        }
                    }
                    }
                    icon={<ConnectionsSVG />}
                    label={DisplayStrings.ConnectionDetail}
                    key={'connection-detail'}
                />
                linkList.push(connectionDetailQuickLink);
            }
        }

        if (this.props.displaySettings.showPerfViewLink && this.props.computerName) {
            const singleMachinePerfViewQuickLink: JSX.Element = <QuickLink
                onClick={() => this.onNavigateToSingleMachinePerfView()}
                icon={<PerformanceBlackAndWhiteSvg />}
                label={DisplayStrings.PerformanceDetail}
                key={'performance-view'}
            />
            linkList.push(singleMachinePerfViewQuickLink);
        }

        if (!this.props.vmScaleSetResourceId && this.props.type) {
            let resourceId: string = null;
            if (this.props.type === NodeType.StandAloneNode) {
                resourceId = this.props.azureResourceId;
            } else if (this.props.type === NodeType.AzureScaleSetNode) {
                resourceId = this.props.vmScaleSetResourceId;
            }

            if (this.props.displaySettings.showResourceLink && resourceId) {
                const azureResourceActionQuickLink: JSX.Element = <QuickLink
                    onClick={() => this.onNavigateToAzureResourceAction(resourceId)}
                    icon={<VMBlackAndWhiteSvg />}
                    label={DisplayStrings.ResourceDetail}
                    key={'resource-detail'}
                />
                linkList.push(azureResourceActionQuickLink);
            }
        }

        return (<div className='quick-link-section'>
            {linkList}
        </div>);
    }

    private onNavigateToComputeMapsAction(): void {
        if (this.props.serviceMapResourceId && this.props.workspace && this.props.workspace.id) {
            const machineId = this.getServiceMapComputerId();
            const messageData: IMapsNavigationMessage = {
                workspace: {
                    id: this.props.workspace.id
                },
                computer: {
                    name: this.props.computerName,
                    id: machineId,
                    resourceId: this.props.azureResourceId
                }
            };
            this.props.telemetryProvider.logEvent(`${this.props.telemetryEventPrefix}.NavigateToComputeMaps`,
                { workspaceId: this.props.workspace.id, computerName: this.props.computerName, computerId: machineId },
                undefined);
            this.props.messagingProvider.sendNavigateToMapsMessage(messageData);
        }
    }

    private onNavigateToSingleMachinePerfView(): void {
        let displayName: string = this.props.computerName;
        if (this.props.type === NodeType.AzureScaleSetNode) {
            displayName = this.props.vmssInstanceId;
        }

        const messageData = {
            computerName: this.props.computerName,
            displayName: displayName,
            workspaceId: this.props.workspace && this.props.workspace.id,
            workspaceLocation: this.props.workspace && this.props.workspace.location,
            computerId: this.getServiceMapComputerId(),
            dateTime: this.props.dateTime,
            virtualMachineResourceId: this.props.azureResourceId
        };

        const logMessageData: any = Object.assign({
            dateTime: JSON.stringify(this.props.dateTime)
        }, messageData);
        const message: any = Object.assign({
            dateTime: this.props.dateTime
        }, messageData);

        this.props.telemetryProvider.logEvent(`${this.props.telemetryEventPrefix}.NavigateToSingleVMPerf`, logMessageData, undefined);
        this.props.messagingProvider.sendNavigateToSingleComputePerfMessage(message);
    }

    private onNavigateToAzureResourceAction(resourceId: string): void {
        let telemetryPayload = { resourceId: resourceId };
        if (resourceId) {
            this.props.telemetryProvider.logEvent(`${this.props.telemetryEventPrefix}.NavigateToAzureResourceAction`,
                telemetryPayload, undefined);
            this.props.messagingProvider.sendNavigateToAzureResourceMessage(resourceId);
        } else {
            this.props.telemetryProvider.logException(`Fail to Navigate to AzureResource`,
                `${this.props.telemetryEventPrefix}.NavigateToAzureResourceAction`, ErrorSeverity.Error, telemetryPayload, undefined);
        }
    }

    // If props.serviceMapResourceId contains workspaceId then return serviceMapResourceId directly.
    // Otherwise construct serviceMap resourceId.
    private getServiceMapComputerId(): string {
        if (this.props.serviceMapResourceId && this.props.workspace && this.props.workspace.id
            && this.props.serviceMapResourceId?.toLowerCase().indexOf(this.props.workspace?.id?.toLowerCase()) !== -1) {
            return this.props.serviceMapResourceId
        }
        return this.props.serviceMapResourceId && this.props.workspace ?
            this.props.workspace.id + ServiceMapFeatureName + this.props.serviceMapResourceId : null;
    }
}
