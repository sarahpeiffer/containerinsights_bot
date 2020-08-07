import { OnboardingComponentState } from './OnboardingUtil';

import { MapApiResponse } from '../maps/compute-map/BasicMapComponent';

import { IWorkspaceInfo } from '../../shared/IWorkspaceInfo';

export interface IVmInsightsSingleVmServiceMapInitMessage {
    serviceMapOnboardingState: OnboardingComponentState;
    computerId: string;
    resourceId: string;
    workspace: IWorkspaceInfo;
    mapApiResponse: MapApiResponse;
    correlationId: string;
}

export interface IVmInsightsSingleVmHealthInitMessage {
    healthOnboardingState: OnboardingComponentState;
    guestState?: string | undefined;
    platformState?: string | undefined;
    correlationId: string;
}
