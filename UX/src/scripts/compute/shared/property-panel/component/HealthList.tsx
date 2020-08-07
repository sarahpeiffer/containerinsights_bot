import * as React from 'react';

import { OnboardingState } from '../../OnboardingUtil';
import { IVmResourceDescriptor } from '../../VirtualMachineBase';
import * as Constants from '../../../Constants';

import { GuestHealth, HealthUtility, PlatformHealth } from '../../../../shared/IHealthInfo';
import { DisplayStrings } from '../../../../shared/DisplayStrings';
import { MessagingProvider } from '../../../../shared/MessagingProvider';
import { ITelemetry } from '../../../../shared/Telemetry';
import { Utility } from '../../../../shared/Utilities/Utility';
import { InfoBlueSVG } from '../../../../shared/svg/InfoBlue';

import '../../../../../styles/shared/HealthList.less';

/* required for ie11... this will enable most of the Object.assign functionality on that browser */
import { polyfillObjectAssign } from '../../../../shared/ObjectAssignShim';
polyfillObjectAssign();

export interface IHealthListProps {
    guestHealth: GuestHealth;
    platformHealth: PlatformHealth;
    telemetry: ITelemetry;
    messagingProvider?: MessagingProvider;
    logPrefix?: string;
    onboardingState?: OnboardingState;
    vm?: IVmResourceDescriptor;
    featureFlags?: StringMap<boolean>;
}

/**
 * Create a multi-level health list that combines both
 * Platform and Guest health along with all of its
 * components
 *
 * @export
 * @class HealthList
 * @extends {React.Component<IHealthListProps>}
 */
export class HealthList extends React.Component<IHealthListProps> {
    private logPrefix: string;
    constructor(props: IHealthListProps) {
        super(props);

        this.logPrefix = `${this.props.logPrefix}.HealthList`

        this.guestHealthList = this.guestHealthList.bind(this);
    }

    public render(): JSX.Element {
        const health: any = {
            guestHealth: this.props.guestHealth,
            platformHealth: this.props.platformHealth
        };
        const resourceLabel: JSX.Element = <a
            href='#'
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                this.props.telemetry.logNavigationEvent(`${this.logPrefix}.ResourceHealthListTop`,
                    'ResourceHealthBlade',
                    JSON.stringify(Object.assign({}, health, { method: 'mouse' })));
                if (this.props.messagingProvider) {
                    this.props.messagingProvider.sendNavigateToResourceHealth();
                }
            }}
            onKeyDown={(e) => {Utility.AffirmativeKeyDown(e, () => {
                this.props.telemetry.logNavigationEvent(`${this.logPrefix}.ResourceHealthListTop`,
                    'ResourceHealthBlade',
                    JSON.stringify(Object.assign({}, health, { method: 'key' })));
                this.props.messagingProvider.sendNavigateToResourceHealth();
            })}}
            tabIndex={0}
        >{DisplayStrings.Resource}</a>;
        return <ul className='vm-health'>
            <li>
                <span className='spaceball'></span>
                {HealthUtility.ResourceHealthSvg(this.props.platformHealth)}
                {resourceLabel}
            </li>
            {this.props.guestHealth !== undefined 
                && this.props.featureFlags[Constants.FeatureMap.vmhealth] && this.guestHealthList()}
        </ul>
    }

    private guestHealthList(): JSX.Element {
        const health: any = {
            guestHealth: this.props.guestHealth,
            platformHealth: this.props.platformHealth
        };
        if (this.props.onboardingState !== undefined && this.props.onboardingState.health !== undefined
            && !this.props.onboardingState.health.isOnboarded) {
            if (this.props.onboardingState.health === undefined || this.props.onboardingState.health.isOnboarded === undefined) {
                return <li>
                    <span className='spaceball'></span>
                    {HealthUtility.HealthStateToSvg(GuestHealth.LOADING)}
                    <span
                        className='disabled-text'
                        tabIndex={0}
                    >{DisplayStrings.Guest}</span>
                </li>;
            } else { // not onboarded
                if (this.props.onboardingState && this.props.onboardingState.health.isOnboardingSupported) {
                    return <li>
                        <span className='spaceball'></span>
                        <span className='spaceball' title={this.props.onboardingState && this.props.onboardingState.health.info}>
                            <InfoBlueSVG />
                        </span>
                        <a
                            href='#'
                            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                                this.props.messagingProvider.sendOpenOnboardingPane(this.props.vm && this.props.vm.resourceId);
                            }}
                            onKeyDown={(e) => {Utility.AffirmativeKeyDown(e, () => {
                                this.props.messagingProvider.sendOpenOnboardingPane(this.props.vm && this.props.vm.resourceId);
                            })}}
                            tabIndex={0}
                            title={this.props.onboardingState && this.props.onboardingState.health.info}
                        >{DisplayStrings.OnboardHealth}</a>
                    </li>
                } else {
                    return <li>
                        <span className='spaceball'></span>
                        <span className='spaceball' title={this.props.onboardingState && this.props.onboardingState.health.knowMoreText}>
                            <InfoBlueSVG />
                        </span>
                        <span
                            className='disabled-text'
                            title={this.props.onboardingState && this.props.onboardingState.health.knowMoreText}
                            tabIndex={0}
                        >{DisplayStrings.Guest}</span>
                    </li>
                }
            }
        } else {
            const guestHealthIcon: JSX.Element = HealthUtility.HealthStateToSvg(this.props.guestHealth);
            const guestHealthLabel: JSX.Element = <a
                href='#'
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    this.props.telemetry.logNavigationEvent(`${this.logPrefix}.GuestHealthListTop`,
                        'HealthDiagnosticsBlade',
                        JSON.stringify(Object.assign({}, health, { method: 'mouse' })));
                    if (this.props.messagingProvider) {
                        this.props.messagingProvider.sendNavigateToHealthDiagnosticsBlade();
                    }
                }}
                onKeyDown={(e) => {Utility.AffirmativeKeyDown(e, () => {
                    this.props.telemetry.logNavigationEvent(`${this.logPrefix}.GuestHealthListTop`,
                        'HealthDiagnosticsBlade',
                        JSON.stringify(Object.assign({}, health, { method: 'key' })));
                    this.props.messagingProvider.sendNavigateToHealthDiagnosticsBlade();
                })}}
                tabIndex={0}
            >{DisplayStrings.Guest}</a>;
            return <li>
                <span className='spaceball'></span>
                {guestHealthIcon}
                {guestHealthLabel}
            </li>
        }
    }
}
