/**
 * Simple numeric helpers and formatters
 * @class NumberHelpers
 */
export class NumberHelpers {
    
    /**
     * Rounds a number at the two decimal point mark
     * @static
     * @param  {number} n 
     * @return number rounded at the two decimal point mark
     * @memberof NumberHelpers
     */
    public static twoDecimalRound(n: number): number {
        return Math.round(n * 100) / 100;
    }
}
