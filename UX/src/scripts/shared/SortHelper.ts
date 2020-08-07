
export class SortHelper {
    private static __instance: SortHelper;

    public static Instance() {
        if (!SortHelper.__instance) {
            SortHelper.__instance = new SortHelper();
        }
        return SortHelper.__instance;
    }

    /**
      * sort a text string using a hybrid of alphabetical sorting and numeric sorting... example:
      * Node1, Node2, Node10, Node11 (what this attempts to do)
      * vs
      * Node1, Node10, Node11, Node2 (the broken version we are trying to fix)
      * @param left left hand side for comparison
      * @param right right hand side for comparison
      */
    public sortByNameAlphaNumeric(left: string, right: string): number {
        const leftLower = this.getString((left || '').toLowerCase());
        const rightLower = this.getString((right || '').toLowerCase());

        const compare = leftLower.localeCompare(rightLower);
        if (compare !== 0) {
            return compare;
        }

        const leftNumberic = this.getNumerics(left || '0');
        const rightNumberic = this.getNumerics(right || '0');
        return leftNumberic - rightNumberic;
    }

    /**
      * Establish a string as a baseline for the alpha-numeric sorting
      * @param str complete string containing both numeric and character series
      */
    private getString(str: string): string {
        let accum = '0';
        for (let i = 0; i < str.length; i++) {
            const targetChar = str.charAt(i);
            if (isNaN(parseInt(targetChar, 10))) {
                accum += targetChar;
            }
        }
        return accum;
    }

    /**
     * Establish a numeric value to be used for sorting
     * @param str complete string containing both numeric and character series
     */
    private getNumerics(str: string): number {
        let accum = '0';
        for (let i = 0; i < str.length; i++) {
            const targetChar = str.charAt(i);
            if (!isNaN(parseInt(targetChar, 10))) {
                accum += targetChar;
            }
        }
        return parseInt(accum, 10);
    }
}
