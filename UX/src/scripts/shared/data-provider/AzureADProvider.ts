/** tpl */
import * as AADContext from 'adal-angular';
/** shim */
import { Promise } from 'es6-promise';
import { EnvironmentConfig } from '../EnvironmentConfig';
import { ErrorCodes } from '../ErrorCodes';
import { globals } from '../globals/globals';

/**
 * Azure Active Directory clientid connect provider... allows you to
 * provide tenant, client and setup the adal engine to do pop-up
 * based oAuth/clientid auth
 */
export interface IADProvider {
    /**
     * attach a tenantId to this provider
     * @param tenantId tenantid from azure ad
    */
    asTenant(tenantId: string): IADProvider;

    /**
     * attach an app registration client id
     * @param clientId clientid of app registration
     */
    forClient(clientId: string): IADProvider;

    /**
     * called after attaching resources to this provider to setup
     * the ADAL provider... can be run more then once if required:
     * eg: one day a function could be added requireLogin() which would
     * specify prompt= hints differently
     */
    configure(): IADProvider;

    /** 
     * called when you would like to login, will cause a pop-up window to
     * request user login against AAD
     */
    login(): Promise<string>;

    logout(): void;

    /**
     * query if the user is already logged in
     */
    isLoggedIn(): boolean;

    /**
     * if the user is already logged in this will make their token available
     */
    getToken(): Promise<string>;

    /**
     * As you may have noticed there really isn't a token invalidation engine; this
     * is NOT it.  In the event that the proxy returns 500 (it returns 500 if the wind
     * is too strong in england today... basically for ANY problem) the default behavior
     * is to invoke this.  This will clear out all login / auth tokens / cached anything
     * and make the system call login() again which will re-auth... token expiry will
     * definitely cause the proxy to 500...
     */
    invalidate(): void;
}

/** 
 * in lieue of deferred promises a functional callback that allows us to ensure multiple
 * login attempts all receive a response..
 * Deferred promises here would be better but would require a redesign
 */
type LoginHandlerCallback = (error, token) => void;

/**
 * Azure Active Directory clientid connect provider... allows you to
 * provide tenant, client and setup the adal engine to do pop-up
 * based oAuth/clientid auth
 */
export class ADProvider implements IADProvider {
    /**
     * track our login state
     */
    private loggedIn: boolean;

    /**
     * cached copy of the token if required
     */
    private token: string;

    /**
     * while ADAL uses a singleton, the reference we require is to an instance
     * of the singleton through their own class wrapper
     */
    private aad_context: AADContext;

    /**
     * populated by forClient()
     */
    private clientId: string;

    /**
     * populated by asTenant()
     */
    private tenantId: string;

    /**
     * callback handler for the context... we will hoist some information
     * into this wrapper for each login attempt
     */
    private loginResultHandler: LoginHandlerCallback[];

    /**
     * .ctor()... clear out the state of our instance on setup... best to be safe
     * with all the singletons running amuck
     */
    constructor() {
        this.invalidate();
    }

    /**
     * Singleton instance... used to access the class
     */
    public static Instance(): ADProvider {
        if (!globals.adProvider) {
            globals.adProvider = new ADProvider();
        }
        return globals.adProvider;
    }

    /**
     * clear the cache, used during any kind of proxy failure to force the system
     * to login again next time login() is called...
     */
    public invalidate(): void {
        this.loginResultHandler = null;
        this.loggedIn = false;
        this.token = null;
        this.aad_context = null;
        this.clientId = null;
        this.tenantId = null;
        this.loginResultHandler = [];
    }

    /**
     * called once tenant and client are established to setup
     * our ADAL context
     */
    public configure(): IADProvider {
        this.aad_context = new AADContext({
            clientId: this.clientId,
            tenant: this.tenantId,
            redirectUri: EnvironmentConfig.Instance().getAuthRedirectUrl(),
            cacheLocation: 'localStorage',
            extraQueryParameter: 'prompt=select_account',
            popUp: true,
            callback: this.aadContextCallback.bind(this)
        });
        return this;
    }

    /**
     * called to establish the azure tenant the AAD exists inside of
     * @param tenantId tenant id the azure ad exists in
     */
    public asTenant(tenantId: string): IADProvider {
        this.tenantId = tenantId;
        return this;
    }

    /**
     * used to establish the clientid we are logging into (app registration)
     * @param clientId client id for the application registration
     */
    public forClient(clientId: string): IADProvider {
        this.clientId = clientId;
        return this;
    }

    /**
     * If there is a cached token, this can be used to retrieve it...
     * Possible extension option here would be fetching one if it doesn't exist
     */
    public getToken(): Promise<string> {
        return new Promise((resolve, reject) => {
            resolve(this.token);
        });
    }

    /**
     * Login using the ADAL token and retrieve the token through the ADAL callback
     */
    public login(): Promise<string> {

        return new Promise((resolve, reject) => {
            this.loginResultHandler.push((error, token) => {
                if (error) {
                    reject({ error, responseJSON: { code: ErrorCodes.PopupFailedLogin }, isFatal: true });
                } else {
                    this.loggedIn = true;
                    this.token = token;
                    resolve(token);
                }
            });

            this.aad_context.login();
        });
    }

    public logout(): void {
        this.invalidate();
    }

    /**
     * current state of log in... if true there is a cached token available for consumption
     */
    public isLoggedIn(): boolean {
        return this.loggedIn;
    }

    /**
     * private ADAL context callback... we will shim into this through the private function
     * pointer loginResultHandler who will contain some information we require on this callback
     * @param errorDesc description of the error (if any)
     * @param token token (if any)
     * @param error error itself (if any)
     */
    private aadContextCallback(errorDesc: string, token: string, error: any): void {
        if (this.loginResultHandler) {
            this.loginResultHandler.forEach((handler) => {
                handler(errorDesc, token);
            })
            this.loginResultHandler = [];
        }
    }
}
