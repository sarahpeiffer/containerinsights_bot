/** defines monitor health states from our (CI) perspective */
export enum HealthState {
    Critical = 'Critical',
    Error = 'Error',
    Warning = 'Warning',
    None = 'None',
    Healthy = 'Healthy',
    Unknown = 'Unknown'
}

/** defines monitor health states from Kube's perspective */
export enum KubeHealthState {
    Pass = 'pass',
    Fail = 'fail',
    Warn = 'warn',
    Error = 'error',
    Unknown = 'unknown',
    None = 'none'
    // Total = 'Total'
}

/** Maps Kubernetes health signals to Container Insights health signals */
export const KubeToCIHealthStateMap = (kubeHealthState: string): HealthState => {
    let ciState;
    switch (kubeHealthState) {
        case 'pass':
            ciState = HealthState.Healthy;
            break;
        case 'fail':
            ciState = HealthState.Critical;
            break;
        case 'warn':
            ciState = HealthState.Warning;
            break;
        case 'unknown':
            ciState = HealthState.Unknown;
            break;
        case 'error':
            ciState = HealthState.Warning;
            break;
        default:
            throw new Error(`There is no Kubernetes health signal ${kubeHealthState} @KubeCIHealthStateMap`);
    }
    return ciState;
}

/** Maps Container Insights health signals to Kubernetes health signals */
export const CIToKubeHealthStateMap = (ciHealthState: HealthState): KubeHealthState => {
    let kubeState;
    switch (ciHealthState) {
        case HealthState.Healthy: 
            kubeState = KubeHealthState.Pass;
            break;
        case HealthState.Critical:
            kubeState = KubeHealthState.Fail;
            break;
        case HealthState.Warning:
            kubeState = KubeHealthState.Warn;
            break;
        case HealthState.Unknown:
            kubeState = KubeHealthState.Unknown;
            break;
        case HealthState.Error: 
            kubeState = KubeHealthState.Error;
            break;
        default:
            throw new Error(`There is no Kubernetes health signal ${ciHealthState} @CIToKubeHealthStateMap`);
    }
    return kubeState;
}
