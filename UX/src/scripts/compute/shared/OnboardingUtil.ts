export interface OnboardingState {
    servicemap?: OnboardingComponentState;
    health?: OnboardingComponentState;
    atscale?: OnboardingComponentState;
}

export interface OnboardingComponentState {
    isOnboarded: boolean | undefined;
    isOnboardingSupported?: boolean;
    knowMoreText?: string;
    info?: string;
}
