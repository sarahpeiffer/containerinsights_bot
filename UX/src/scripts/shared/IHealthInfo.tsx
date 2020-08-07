import * as React from 'react';

import { GreenSvg } from './svg/green';
import { WarnSvg } from './svg/warn';
import { UnknownSvg } from './svg/unknown';
import { LoadingSvg } from './svg/loading';
import { InfoBlueSVG } from './svg/InfoBlue';
import { FailedSvg } from './svg/failed';

/**
 * For VM health information
 * e.g. Health Model, Platform Health
 */
export enum OverallHealth {
    CRITICAL = 5,
    WARNING = 4,
    SUCCESS = 3,
    UNKNOWN = 1,
    LOADING = 0
}

export enum GuestHealth {
    ERROR = 5,
    CRITICAL = 5,
    WARNING = 4,
    SUCCESS = 3,
    UNKNOWN = 1,
    LOADING = 0
}

// TODO ak: change to ResourceHealth once firm decision is made
export enum PlatformHealth {
    UNAVAILABLE = 5,
    DEGRADED = 4,
    AVAILABLE = 3,
    USERINITIATED = 2,
    UNKNOWN = 1,
    LOADING = 0
}

export enum OverallGuestHealth {
    CRITICAL = 5,
    WARNING = 4,
    HEALTHY = 3,
    UNKNOWN = 1,
    LOADING = 0
}

export class DefaultHealthInfo {
    public static readonly GUEST_LOADING_STATE: GuestHealth = GuestHealth.LOADING;
    public static readonly PLATFORM_LOADING_STATE: PlatformHealth = PlatformHealth.LOADING;
}

export class HealthUtility {
    public static HealthStateToSvg(guestHealth: GuestHealth): JSX.Element {
        switch (guestHealth) {
            case GuestHealth.SUCCESS: return <GreenSvg />;
            case GuestHealth.WARNING: return <WarnSvg />;
            case GuestHealth.CRITICAL: return <FailedSvg />;
            case GuestHealth.UNKNOWN: return <UnknownSvg />;
            case GuestHealth.LOADING: return <LoadingSvg />;
        }
        return <UnknownSvg />;
    }

    public static ResourceHealthSvg(platformHealth: PlatformHealth): JSX.Element {
        switch (platformHealth) {
            case PlatformHealth.AVAILABLE: return <GreenSvg />;
            case PlatformHealth.LOADING: return <LoadingSvg />;
            case PlatformHealth.DEGRADED: return <WarnSvg />;
            case PlatformHealth.UNAVAILABLE:  return <FailedSvg />;
            case PlatformHealth.UNKNOWN: return <UnknownSvg />;
            case PlatformHealth.USERINITIATED: return <InfoBlueSVG />;
        }
        return <UnknownSvg />;
    }

    public static OverallHealthSvg(overallHealth: OverallHealth): JSX.Element {
        switch (overallHealth) {
            case OverallHealth.SUCCESS: return <GreenSvg />;
            case OverallHealth.WARNING: return <WarnSvg />;
            case OverallHealth.CRITICAL: return <FailedSvg />;
            case OverallHealth.UNKNOWN: return <UnknownSvg />;
            case OverallHealth.LOADING: return <LoadingSvg />;
        }
        return <UnknownSvg />;
    }

    public static PlatformHealthTextToEnum(platformHealthText: string) {
        switch (platformHealthText.toUpperCase()) {
            case 'AVAILABLE': return PlatformHealth.AVAILABLE;
            case 'USERINITIATED': return PlatformHealth.USERINITIATED;
            case 'DEGRADED': return PlatformHealth.DEGRADED;
            case 'UNAVAILABLE': return PlatformHealth.UNAVAILABLE;
        }
        return PlatformHealth.UNKNOWN;
    }

    public static CalculateOverallHealth(guestHealth: GuestHealth, platformHealth: PlatformHealth): OverallHealth {
        let overallHealth: OverallHealth = OverallHealth.UNKNOWN;
        if ((guestHealth && guestHealth.valueOf()) > (platformHealth && platformHealth.valueOf())) {
            overallHealth = ((guestHealth as any) as OverallHealth);
        } else {
            overallHealth = ((platformHealth as any) as OverallHealth);
        }
        return overallHealth;
    }
}
