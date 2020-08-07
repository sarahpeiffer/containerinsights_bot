import * as Moment from 'moment';

/**
 * Use to manage locale operations (like modifying the dom for locale settings based on ibiza)
 */
export class LocaleManager {
    private static __instance: LocaleManager;

    /**
     * Get the single instance of the locale manager
     */
    public static Instance() {
        if (!LocaleManager.__instance) {
            LocaleManager.__instance = new LocaleManager();
        }

        return LocaleManager.__instance;
    }

    /**
     * Setup the dom <html lang={env_lang}> for the appropriate locale
     */
    public setupLocale() {
        document.documentElement.lang = this.getLocaleFromPath();
        this.setupLocaleForPills();
    }

    /**
     * Attempt to retrieve the locale as specified
     * if none is available in the expected format then return en-us as default
     */
    public getLocaleFromPathForNews(): string {
        try {
            const locale = this.getPathParam('l');
            return locale[1].split('.')[1];
        } catch {
            return 'en-us';
        }
    }

    /**
     * Retrieve a given key from the query string.  if not present will return null
     * @param key key value from the query string we are searching for eg: &key=val&key2=val2
     */
    private getPathParam(key: string): string[] {

        if (window.location.search[0] !== '?') {
            throw 'unexpected path query string';
        }

        const searchString = window.location.search.substring(1);
        const queryParams = searchString.split('&');
        let targetSplitPair: string[] = null;

        queryParams.forEach((pair) => {
            const splitPair = pair.split('=');
            if (splitPair[0] === key) {
                targetSplitPair = splitPair;
            }
        });
        return targetSplitPair;
    }

    /**
     * Attempt to retrieve the locale as specified by ibiza from the query string
     * provided to this page... if none is available in the expected format then return en
     */
    private getLocaleFromPath(): string {
        try {
            const locale = this.getPathParam('l') || ['l', 'en.en'];
            return locale[1].split('.')[0];
        } catch {
            return 'en';
        }
    }

    /**
     * Pills requires windows global variables and Moment be initialized to the correct lang and locale
     */
    private setupLocaleForPills() {
        let locale = 'en-us';
        let lang = 'en';
        try {
            const langValue = this.getPathParam('l')[1].toLowerCase();
            const langCandidate = langValue.split('.')[0];
            const localeCandidate = langValue.substring(langCandidate.length + 1);

            // If it is set to a supported language, accept the lang values
            if (['cs', 'de', 'en', 'es', 'fr', 'hu', 'it', 'ja', 'ko', 'nl', 'pl', 'pt-br', 'pt-pt',
                'qps-ploc', 'ru', 'sv', 'tr', 'zh-hans', 'zh-hant'].indexOf(lang) !== -1) {
                lang = langCandidate;
                locale = localeCandidate;
            }
        } catch { }

        window['locale'] = locale;
        window['lang'] = lang;
        Moment.locale(locale);

        require(`@appinsights/pillscontrol-es5/dist/Resources/Resources.${lang}.js`);
    }
}
