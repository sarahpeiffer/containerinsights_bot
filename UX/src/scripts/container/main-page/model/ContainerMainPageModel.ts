export interface ContainerMainPageError {
    loadFailedReason: any;
    loadPathForFailure: string;
}

export class ContainerMainPageModel {
    errorDetails: ContainerMainPageError;
}
