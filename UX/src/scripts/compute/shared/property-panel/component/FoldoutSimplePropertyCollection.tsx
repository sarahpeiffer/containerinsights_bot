import * as React from 'react';

import { HealthList } from './HealthList';
import { OnboardingState } from '../../OnboardingUtil';
import { IVmResourceDescriptor } from '../../VirtualMachineBase';

import { ISimplePropertyProps } from '../../../../shared/property-panel/SimpleProperty';
import { SimplePropertyCollection } from '../../../../shared/property-panel/SimplePropertyCollection';
import { ExpandableSection2 } from '../../../../shared/property-panel/ExpandableSection2';
import { DisplayStrings } from '../../../../shared/DisplayStrings';
import { PlatformHealth, GuestHealth } from '../../../../shared/IHealthInfo';
import { MessagingProvider } from '../../../../shared/MessagingProvider';
import { ITelemetry } from '../../../../shared/Telemetry';

export interface IFoldoutSimplePropertyCollectionProps {
    properties: ISimplePropertyProps[];
    telemetry: ITelemetry;
    enableCopyToClipboard?: boolean;

    /**
     * Number of properties shown initially. == All if not provided
     */
    propertiesShownInitiallyCount?: number;

    /**
     * Health data for current machine
     */
    guestHealth?: GuestHealth;
    platformHealth?: PlatformHealth;
    messagingProvider?: MessagingProvider;
    logPrefix?: string;
    onboardingState?: OnboardingState;
    vm?: IVmResourceDescriptor;
    featureFlags?: StringMap<boolean>;
}

/**
 * Visualization component representing a set of simple properties displayed on the property panel
 */
export class FoldoutSimplePropertyCollection extends React.Component<IFoldoutSimplePropertyCollectionProps> {
    constructor(props: IFoldoutSimplePropertyCollectionProps) {
        super(props);

        this.getSplitedProperties = this.getSplitedProperties.bind(this);
        this.navigateToHealthDiagnosticsBlade = this.navigateToHealthDiagnosticsBlade.bind(this);
        this.isVmss = this.isVmss.bind(this);
    }

    /** 
     * public render method (react)
     * @returns {JSX.Element}
    */
    public render(): JSX.Element {
        const result = this.getSplitedProperties();
        const content: JSX.Element[] = [];
        if (result && result.initialProperties && result.initialProperties.length > 0) {
            content.push(<SimplePropertyCollection
                key={'initial-properties'}
                properties={result.initialProperties}
                enableCopyToClipboard={this.props.enableCopyToClipboard}
                telemetry={this.props.telemetry}
            />);
        }
        // health data
        if (this.props.onboardingState?.servicemap && !this.isVmss()) {
            const healthList: JSX.Element = <HealthList
                guestHealth={this.props.guestHealth}
                platformHealth={this.props.platformHealth}
                messagingProvider={this.props.messagingProvider}
                telemetry={this.props.telemetry}
                logPrefix={this.props.logPrefix}
                onboardingState={this.props.onboardingState}
                vm={this.props.vm}
                featureFlags={this.props.featureFlags}
            />
            content.push(<ExpandableSection2
                title={DisplayStrings.VmHealth}
                content={healthList}
                isExpanded={false}
                key={'vm-health'}
                initialExpandAction={() => {
                    this.props.messagingProvider.sendRetrieveHealth();
                }}
            />);
        }
        if (result && result.foldoutProperties && result.foldoutProperties.length > 0) {
            content.push(<ExpandableSection2
                title={DisplayStrings.MachineProperties}
                content={<SimplePropertyCollection properties={result.foldoutProperties}
                    enableCopyToClipboard={this.props.enableCopyToClipboard}
                    telemetry={this.props.telemetry} />}
                key={'more-properties'}
            />);
        }

        return <>{content}</>;
    }

    /**
     * split the properties into two array based on the propertiesShownInitiallyCount. 
     */
    private getSplitedProperties() {
        if (!this.props || !this.props.properties || this.props.properties.length === 0) {
            return null;
        }

        const initialProperties: ISimplePropertyProps[] = [];
        const foldoutProperties: ISimplePropertyProps[] = [];

        const displayedPropertyCount = this.props.propertiesShownInitiallyCount || this.props.properties.length;

        for (let i = 0; i < this.props.properties.length; i++) {
            let property = this.props.properties[i];
            if (i < displayedPropertyCount) {
                initialProperties.push(property);
            } else {
                foldoutProperties.push(property);
            }
        }

        return { initialProperties, foldoutProperties };
    }

    private navigateToHealthDiagnosticsBlade(): void {
        this.props.telemetry.logEvent(`${this.props.logPrefix}.NavigateToHealthDiagnosticsBlade`, {}, {});
        this.props.messagingProvider.sendNavigateToHealthDiagnosticsBlade();
    }

    private isVmss(): boolean {
        return this.props.vm
            && this.props.vm.resourceId
            && this.props.vm.resourceId.toUpperCase().indexOf('/providers/Microsoft.Compute/virtualMachineScaleSets'.toUpperCase()) > 0;
    }
}
