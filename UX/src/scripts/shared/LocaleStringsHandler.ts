import { globals } from './globals/globals';

/**
 * types of strings; each area should get it's own string
 * type and eventually the Shared area should reduce considerably
 * on that day the blades should be made "smart" and only send
 * shared + {your area} (not the entire resx like today)
 */
export enum StringType {
    Shared = 'Shared',
    MultiCluster = 'MultiCluster'
}

/**
 * Required interface for the typed localestringshandler (break circular dependency and define a clear contract)
 */
interface ILocaleStringsHandlerInstance {

    /**
     * Append unique and manage the unique restrictions of the behaviors of resx translation
     * so no mistakes are made on this side.
     * 
     * NOTE: Please ensure your strings also make it into the Monitoring Extension for containers
     * so translation can occur
     * @param arrayKey who does this belong to (see note on underscores below)
     * @param key the key for the string (MyString)
     * @param value the value of the string ('this is my string')
     */
    _appendUnique(stringType: StringType, key: string, value: string);

    /**
     * Get the displaystrings object required by the rest of the application
     * @param arrayKey type of string you want (shared, multicluster, etc)
     */
    getStringsForKey(arrayKey: StringType);
}

/**
 * String type wrapper.  This helps make the displaystrings.ts esque files
 * more managable since they only need to reference the type of string they reprent once
 * and is wrapper contains that information throughout.
 */
export class TypedLocaleStringsHandlerInstance {

    /**
     * .ctor()
     * @param stringType type of string we want a wrapper for
     * @param localeStringsHandler a copy of the locale singleton (both to break circular dependency and define a clear contract)
     */
    constructor(private stringType: StringType, private localeStringsHandler: ILocaleStringsHandlerInstance) { }

    /**
     * get a copy of the object containing (eventually) all translated strings
     */
    public getStrings(): StringMap<string> {
        return this.localeStringsHandler.getStringsForKey(this.stringType);
    }

    /**
     * append a new string to the map.. remap if a translated string is already present
     * @param key key for our string (MyString)
     * @param value value for our string ('my string to be translated')
     */
    public _appendUnique(key: string, value: string) {
        this.localeStringsHandler._appendUnique(this.stringType, key, value);
    }
}

/** used by the main scripts of our frames to connect the ibiza message with the display strings class
 * stripped from LocaleManager to avoid the preload script requiring an import of display strings
 */
export class LocaleStringsHandler implements ILocaleStringsHandlerInstance {
    private _translated: boolean = false;
    private _displayStringsRoot: StringMap<StringMap<string>> = {};
    private _insensitiveMaps: StringMap<StringMap<string>> = {};
    private _translationListener: () => void;

    /**
     * .ctor()
     * establish the localeevent handler as bound on behalf of the custom even system
     */
    constructor() {
        this.handleLocaleEvent = this.handleLocaleEvent.bind(this);
    }

    /**
     * Get the single instance of the locale manager
     */
    public static Instance() {
        if (!globals.localeStringsHandlerInstance) {
            globals.localeStringsHandlerInstance = new LocaleStringsHandler();
        }

        return globals.localeStringsHandlerInstance;
    }

    public onTranslation(translated: () => void): void {
        this._translationListener = translated;
    }

    /**
     * return true if translation is complete
     */
    public translated(): boolean {
        return this._translated;
    }

    /**
     * Get a wrapper object which understands the type of string being interacted with
     * to make DisplayStrings.ts / MultiClusterDisplayStrings.ts much more readable
     * @param stringType the type of string you want a wrapper for
     */
    public forStringType(stringType: StringType): TypedLocaleStringsHandlerInstance {
        this.setupKeyIfRequired(stringType);

        return new TypedLocaleStringsHandlerInstance(stringType, this);
    }


    /**
      * Handle the locale message as sent from the extension (hopefully)
      * NOTE: This can be invoked by both PortalMessageProvider and the old provider...
      * @param event (any by design due to old message provider) custom event re-routed from ibiza
      */
    public handleLocaleEvent(event: any) {
        try {
            if (!event.detail) {
                console.error(`LOCALE::Message missing detail, page will not be translated`);
                return;
            }

            // bbax: you can thank ie11 for the json and the existence of rawData
            if (event.detail.rawData) {
                this.translate(StringType.Shared, JSON.parse(event.detail.rawData));
            }
        } catch (exc) {
            console.error('LOCALE::Error page will not be translated ', exc);
        }
    }

    /**
     * Derivative of `handleLocaleEvent` except we directly pass in the raw data
     * since VM Insights passes locale data along with other init message
     *
     * @param {*} localeData
     * @memberof LocaleStringsHandler
     */
    public translateRawLocale(localeData: any) {
        try {
            this.translate(StringType.Shared, JSON.parse(localeData));
        } catch (exc) {
            console.error('LOCALE::Error page will not be translated ', exc);
        }
    }

    /**
     * Append unique and manage the unique restrictions of the behaviors of resx translation
     * so no mistakes are made on this side.
     * 
     * NOTE: Please ensure your strings also make it into the Monitoring Extension for containers
     * so translation can occur
     * @param arrayKey who does this belong to (see note on underscores below)
     * @param key the key for the string (MyString)
     * @param value the value of the string ('this is my string')
     */
    public _appendUnique(arrayKey: StringType, key: string, value: string) {
        this.setupKeyIfRequired(arrayKey);

        const targetkey = key.toLocaleLowerCase();
        const insensitiveMapping = this._insensitiveMaps[arrayKey];
        const displayStrings = this._displayStringsRoot[arrayKey];

        /**
         * bbax; if you insert an underscore into the string, it will be converted into a subobject
         * in the resx engine... eg (note the case as well):
         * MyString_BaseString = 'hello'
         * Will result in:
         * MyString: { baseString: 'hello' }
         * 
         * Therefore we prevent an underderscore for a specific area like MulitCluster for example.
         * We want:
         * MyString = 'hello'
         * MultiCluster_MyString = 'hello'
         * Conntainers_MyString = 'hello'
         * 
         * Where no prepended entry will be placed into "Shared", everything else will land
         * in its own specific 'StringType' Area
         */
        if (key.indexOf('_') !== -1) {
            console.error('LOCALE::Subsection strings can not contain underscore, resx limitation')
            throw new Error('LOCALE::Subsection strings can not contain underscore, resx limitation');
        }

        // bbax: if we recieve the language translations before the strings are defined, they may
        // not have the correct keys (by case)... but they may also though.
        if (insensitiveMapping.hasOwnProperty(targetkey)) {
            this.remapIfRequired(key, targetkey, displayStrings, insensitiveMapping);
            return;
        }

        displayStrings[key] = value;
        insensitiveMapping[targetkey] = key;
    }

    /**
     * Get the displaystrings object required by the rest of the application
     * @param arrayKey type of string you want (shared, multicluster, etc)
     */
    public getStringsForKey(arrayKey: StringType) {
        this.setupKeyIfRequired(arrayKey);
        return this._displayStringsRoot[arrayKey];
    }

    /**
     * Provided with a resx translation set (that is an object containing shared and nested
     * subobjects) populate a translation set
     * @param arrayKey what type of translation is this (starts as Shared / root, subobjects parse as their key value)
     * @param translatedStrings the actual translated strings
     */
    public translate(arrayKey: StringType, translatedStrings: StringMap<any>) {
        this.setupKeyIfRequired(arrayKey);

        console.log(`LOCALE::Found key [${arrayKey}]`);

        const insensitiveMapping = this._insensitiveMaps[arrayKey];
        const displayStrings = this._displayStringsRoot[arrayKey];

        const keys = Object.keys(translatedStrings);

        if (keys.length !== Object.keys(displayStrings).length) {
            console.warn(`LOCALE::translation key mismatch for total[${keys.length}] translated[${Object.keys(displayStrings).length}]`)
        }


        keys.forEach((key) => {
            if (typeof translatedStrings[key] === 'object') {
                this.translate(key as any, translatedStrings[key]);
                return;
            } else if (typeof translatedStrings[key] === 'string') {
                const targetKey = key.toLocaleLowerCase();

                /**
                 * bbax: this can be pretty common now if Ibiza sends the message first then
                 * we'll set the translations before the strings themselves are loaded which
                 * then may or may need remapping (handled by _appendUnique)
                 */
                if (!insensitiveMapping.hasOwnProperty(targetKey)) {
                    insensitiveMapping[targetKey] = key;
                }

                const mappedKey = insensitiveMapping[targetKey];

                displayStrings[mappedKey] = translatedStrings[key];
            } else {
                console.error(`LOCALE::unexpected data type encountered [${translatedStrings[key]}] [${key}]`, translatedStrings);
                throw new Error('LOCALE::unexpected data type encountered by localization engine')
            }
        });

        this._translated = true;
        if (this._translationListener) {
            this._translationListener();
        }
    }

    /**
     * if ibiza translation message arrives before the strings are setup, some strings may have a different key in
     * our application then the resx provided... remap these entries if required
     * @param key real key as requested by our application
     * @param targetkey key as observed present inside the displayStrings currently 
     * @param displayStrings the displayStrings area we are working in
     * @param insensitiveMapping the insenitive mapping list for this string area
     */
    private remapIfRequired(key: string, targetkey: string, displayStrings: StringMap<string>, insensitiveMapping: StringMap<string>) {
        if (key !== insensitiveMapping[targetkey]) {
            const remapKey = insensitiveMapping[targetkey];
            displayStrings[key] = displayStrings[remapKey];
        }
    }

    /**
     * initialize a string area if it hasn't been utilized yet (as empty)
     * @param arrayKey string area we are working on
     */
    private setupKeyIfRequired(arrayKey: StringType) {
        if (!this._insensitiveMaps.hasOwnProperty(arrayKey)) {
            this._insensitiveMaps[arrayKey] = {}
        }

        if (!this._displayStringsRoot.hasOwnProperty(arrayKey)) {
            this._displayStringsRoot[arrayKey] = {};
        }
    }
}
