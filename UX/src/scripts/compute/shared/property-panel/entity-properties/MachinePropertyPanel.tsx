import * as React from 'react';

import { DisplayStrings } from '../../../../shared/DisplayStrings';
import { ChevronDownSvg } from '../../../../shared/svg/chevron-down';
import { ChevronRightSvg } from '../../../../shared/svg/chevron-right';
import { SimplePropertyCollection } from '../../../../shared/property-panel/SimplePropertyCollection';
import { ExpandableSection2 } from '../../../../shared/property-panel/ExpandableSection2';
import { PropertyPanelHeaderSection } from '../../../../shared/property-panel/PropertyPanelHeaderSection';
import { ITelemetry } from '../../../../shared/Telemetry';
import { GuestHealth, PlatformHealth } from '../../../../shared/IHealthInfo';
import { MessagingProvider } from '../../../../shared/MessagingProvider';

import { FoldoutSimplePropertyCollection } from '../component/FoldoutSimplePropertyCollection';

import { MachinePropertyPanelAdaptor } from './map-entity-adaptor/MachinePropertyPanelAdaptor'
import { MapEntityUtility as mapUtility } from './MapEntityUtility';
import { OnboardingState } from '../../OnboardingUtil';
import { IVmResourceDescriptor } from '../../VirtualMachineBase';
import { LinkToNavigateAdaptor, ILinkToNavigate, NavigationDestination } from './LinkToNavigateAdaptor';

export interface IMachinePropertiesPanelProps {
    machine: DependencyMap.Machine;
    telemetry: ITelemetry;
    linkProperties?: JSX.Element;
    messagingProvider?: MessagingProvider;
    logPrefix?: string;
    vm?: IVmResourceDescriptor;
    onboardingState?: OnboardingState;
    guestHealth?: GuestHealth;
    platformHealth?: PlatformHealth;
    featureFlags?: StringMap<boolean>;
}

export class MachinePropertiesPanel extends React.Component<IMachinePropertiesPanelProps> {
    constructor(props: IMachinePropertiesPanelProps) {
        super(props);
    }

    public render() {
        const machine = new MachinePropertyPanelAdaptor(this.props.telemetry, this.props.machine, this.props.messagingProvider);
        const isArcVm: boolean = machine?.getResourceId()?.toLowerCase().indexOf('/microsoft.hybridcompute/') !== -1;
        const panelContent: JSX.Element[] = [];

        // linkProperties is from grid entity.
        if (this.props.linkProperties) {
            panelContent.push(<ExpandableSection2
                title={DisplayStrings.QuickLinks}
                content={this.props.linkProperties}
                expandIcon={<ChevronRightSvg />}
                collapseIcon={<ChevronDownSvg />}
                isExpanded={true}
                key={'quick-links'}
            />)
        }

        panelContent.push(<FoldoutSimplePropertyCollection
            properties={machine.getProperties()}
            propertiesShownInitiallyCount={mapUtility.defaultPropertiesShowingNumber}
            guestHealth={!isArcVm && this.props.guestHealth}
            platformHealth={!isArcVm && this.props.platformHealth}
            messagingProvider={this.props.messagingProvider}
            telemetry={this.props.telemetry}
            logPrefix={this.props.logPrefix}
            vm={this.props.vm}
            onboardingState={this.props.onboardingState}
            key={'machine-propreties'}
            enableCopyToClipboard={true}
            featureFlags={this.props.featureFlags}
        />);

        let azureVMProperties = machine.getAzureVMProperties();
        if (!isArcVm && azureVMProperties) {
            panelContent.push(<ExpandableSection2
                title={DisplayStrings.AzureVmProperty}
                content={<SimplePropertyCollection properties={azureVMProperties}
                    enableCopyToClipboard={true}
                    telemetry={this.props.telemetry}
                    logPrefix={`${this.props.logPrefix}.MachinePropertiesPanel`} />}
                expandIcon={<ChevronRightSvg />}
                collapseIcon={<ChevronDownSvg />}
                key={'azure-vm-property'}
            />);
        }
        let scaleSetProperties = machine.getVMScaleSetProperties();
        if (!isArcVm && scaleSetProperties) {
            panelContent.push(<ExpandableSection2
                title={DisplayStrings.AzureScaleSetProperties}
                content={<SimplePropertyCollection properties={scaleSetProperties}
                    enableCopyToClipboard={true}
                    telemetry={this.props.telemetry}
                    logPrefix={`${this.props.logPrefix}.MachinePropertiesPanel`} />}
                expandIcon={<ChevronRightSvg />}
                collapseIcon={<ChevronDownSvg />}
                key={'azure-scale-set-properties'}
            />);
        }
        const cloudServiceProperties = machine.getCloudServiceProperties();
        if (!isArcVm && cloudServiceProperties) {
            panelContent.push(<ExpandableSection2
                title={DisplayStrings.CloudServiceProperties}
                content={<SimplePropertyCollection properties={cloudServiceProperties}
                    enableCopyToClipboard={true}
                    telemetry={this.props.telemetry}
                    logPrefix={`${this.props.logPrefix}.MachinePropertiesPanel`} />}
                expandIcon={<ChevronRightSvg />}
                collapseIcon={<ChevronDownSvg />}
                key={'cloud-service-properties'}
            />);
        }
        const arcVmProperties = machine.getArcVmProperties();
        if (isArcVm && arcVmProperties) {
            panelContent.push(<ExpandableSection2
                title={DisplayStrings.ArcVmProperties}
                content={<SimplePropertyCollection properties={arcVmProperties}
                    enableCopyToClipboard={true}
                    telemetry={this.props.telemetry}
                    logPrefix={`${this.props.logPrefix}.MachinePropertiesPanel`} />}
                expandIcon={<ChevronRightSvg />}
                collapseIcon={<ChevronDownSvg />}
                key={'azure-arc-properties'}
            />);
        }
        const linkToNavigate: ILinkToNavigate =
            LinkToNavigateAdaptor.navigationParams(NavigationDestination.resourceOverview,
                { linkUri: machine.getResourceId(), linkText: DisplayStrings.Name }, this.props.messagingProvider);
        return (<>
            <PropertyPanelHeaderSection
                icon={machine.getIcon()}
                title={machine.getTitle()}
                subTitle={machine.getSubTitle()}
                linkToNavigate={linkToNavigate}
                telemetry={this.props.telemetry}
                logPrefix={this.props.logPrefix}
            />
            {panelContent}
        </>);
    }
}

