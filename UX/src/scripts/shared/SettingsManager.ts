import { StringMap } from './StringMap'

interface IInternalSettings {
    isLocalHost?: boolean;
}

/**
 * Loaded from navigationContext parameter provided to us from the MenuBlade
 * a JSON object is provided to that, we deserialize it and enumerate the entire
 * set of keys (one level down) and load all of those keys into the settings internal
 * bits here.  applications can use Get and GetObject to retrieve the simple and
 * somewhat complex objects stored within.
 */
export class SettingsManager {

    public static $app: IInternalSettings = {};

    private static settings: StringMap<string> = {};
    private static loaded: boolean = false;

    /**
     * get a single (simple, string) entry from our settings hash
     * @param key key to access a setting for
     * @returns {string} the valu of the setting or null if not present
     */
    public static Get(key: string): string {
        if (this.settings.hasOwnProperty(key)) {
            return this.settings[key];
        }
        return null;
    }

    /**
     * retreive a complex object... these are also stored as strings until they
     * are accessed, so they will be deep-deserialized when accessed (JSON.Parse and
     * Object.assign to shell)
     * @param key key to access a complex setting for
     * @returns {T} a potentially complex object to Object.assign the data to
     */
    public static GetObject<T>(key: string, shell: Object): T {
        const item = this.Get(key);
        if (!item) {
            return null;
        }
        try {
            return Object.assign(shell, JSON.parse(item));
        } catch {
            return null;
        }
    }

    /**
     * Clear the state of the SettingsManager if required (say for reload purposes if the url
     * is changing)
     * @returns {void}
     */
    public static ClearSettings() {
        this.settings = {};
        this.loaded = false;
    }

    /**
     * Utilizing a StringMap<string> format of settings load the settings and prepare for services to utilize
     * Get and GetObject to retrieve these settings; optionally append or create new based on the boolean
     * @param settingsObj shallow deserialized list of settings
     * @param resetAutomatically if LoadSettings is called twice, set this to true to create new otherwise we will append
     * @returns {void}
     */
    public static LoadSettings(settingsObj: any, resetAutomatically: boolean = false) {

        if (resetAutomatically) {
            SettingsManager.ClearSettings();
        }

        if (!settingsObj || this.loaded) {
            return;
        }

        const keys: string[] = Object.keys(settingsObj);
        keys.forEach((key) => {
            const item: any = settingsObj[key];
            if (typeof item === 'string') {
                this.settings[key] = item;
            } else {
                this.settings[key] = JSON.stringify(item);
            }
        });
        this.loaded = true;
    }
}
