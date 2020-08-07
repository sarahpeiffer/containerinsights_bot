import { globals } from './globals/globals';

/**
 * Type of the authorization token
 */
export enum AuthorizationTokenType {
    /** auth token suitable for calls to Azure Resource Manager (ARM) service */
    Arm = 'Arm',
    /** auth token suitable for calls to Log Analytics (Draft) service */
    LogAnalytics = 'LogAnalytics',
}

/**
 * Singleton storing iframe initialization info provided by hosting Ibiza blade
 */
export class InitializationInfo {
    /** set of authorization header values for Arm, LogAnalytics, etc */
    private authorizationHeaderValues: any;

    /**
     * ctor
     */
    private constructor() {
        this.authorizationHeaderValues = {};
    }

    /**
     * Gets singleton instance
     * @returns instance of the singleton
     */
    public static getInstance(): InitializationInfo {
        if (!globals.initializationInfo) {
            globals.initializationInfo = new InitializationInfo();
        }

        return globals.initializationInfo;
    }

    /**
     * Gets authorization header value for a given token type
     * @param tokenType token type - Arm, LogAnalytics
     * @returns Authorization header value to use in calls to corresponding service
     */
    public getAuthorizationHeaderValue(tokenType: AuthorizationTokenType): string {
        return this.authorizationHeaderValues[AuthorizationTokenType[tokenType]];
    }

    /**
     * Sets authorization header value for a given token type
     * @param tokenType token type - Arm, LogAnalytics
     * @param authorizationHeaderValue Authorization header value to use in calls to corresponding service
     */
    public setAuthorizationHeaderValue (
        tokenType: AuthorizationTokenType, 
        authorizationHeaderValue: string
    ): void {
        this.authorizationHeaderValues[AuthorizationTokenType[tokenType]] = authorizationHeaderValue;
    }
}
