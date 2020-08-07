export interface IFailureViewParentContext {
    loadFailedReason: any;
    loadFailedK8sPath: string;

    onLoad(): Promise<void>;
    forceLogoutAd(): void;
}
