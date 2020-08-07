
/**
 * Ease-of-use string extensions and helpers
 */
export class StringHelpers {
    // TODO: replace with es6 shim
    public static startsWith(str: string, searchString: string): boolean {
        if (!str) { return false; }

        return str.substr(0, searchString.length).localeCompare(searchString) === 0;
    };

    /**
     * 
     * @param str1 source string
     * @param str2 string to compare with source string (str1)
     * @param locales A locale string or array of locale strings that contain one or more language or locale tags. 
     * If you include more than one locale string, list them in descending order of priority so that the first entry 
     * is the preferred locale. If you omit this parameter, the default locale of the JavaScript runtime is used.
     * This parameter must conform to BCP 47 standards; see the Intl.Collator object for details.
     */
    public static equal(str1: string, str2: string, locales?: string | string[] ): boolean {
        if (!str1 && !str2) { return true; }
        if (!str1 || !str2) { return false; }

        return str1.localeCompare(str2, locales) === 0;
    }

    /**
     * Replaces all occurrences of a substring in a given string
     * @param str input string
     * @param searchValue substring to be replaced
     * @param newValue value with which to replace found substrings
     * @returns input string with all occurrences of a substring replaced with given value
     */
    public static replaceAll(str: string, searchValue: string, newValue: string): string {
        if (str == null) { return str; }
        if (searchValue == null) { return str; }

        // matching interesting replace() behavior - if search string is empty
        // replace string is injected once in front of original string
        if (searchValue === '') { return newValue + str; }

        return str.replace(new RegExp(StringHelpers.escapeRegExp(searchValue), 'g'), newValue);
    }

    public static contains(strArray: string[], searchValue: string): boolean {
        const targetArray = strArray.filter((str) => {
            return StringHelpers.equal(str, searchValue);
        });

        return targetArray.length > 0;
    }

    /**
     * Safely and fully encode a parameter for use on a url path when dealing with JSON data
     * @param string input string to be url encoded
     * @returns {string} fully encoded string
     */
    public static encode(string: string): string {
        return encodeURIComponent(string).replace(/'/g, '%27').replace(/"/g, '%22');
    }

    /**
     * Check if a string is null or empty
     * @param str string to check
     * @returns {boolean} true if the string is null, undefined, or empty
     */
    public static isNullOrEmpty(str: string): boolean {
        return (!str || str.length === 0);
    }

    /**
     * Escapes special characters in a string to be used as a regular expression
     * @param str input string
     * @returns input string with all special RegExp characters escaped
     */
    private static escapeRegExp(str: string): string {
        if (!str) { return str; }

        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }
}
