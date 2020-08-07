/**
 * @param e: the keyboard event
 * @param callback: the user-defined custom callback to invoke upon key press
 * @param keys: the list of keys, use those defined in @see Utility
 */
export interface IKeyDown {
    e: React.KeyboardEvent<HTMLElement>,
    callback: () => void;
    keys: number[]
};

export interface IKeyUp extends IKeyDown {};

export class Utility {
    public static readonly KEY_ENTER: number = 13;
    public static readonly KEY_ESCAPE: number = 27;
    public static readonly KEY_SPACE: number = 32;
    public static readonly AFFIRMATIVE_KEYS: number[] = [Utility.KEY_ENTER, Utility.KEY_SPACE];

    /**
     * Execute user-defined custom function when user presses enter or spacebar.
     * This is useful when defining a button-like element using divs and you need
     * to define your own onKeyDown handler.
     *
     * @param e from onKeyDown
     * @param callback the custom function to execute
     */
    public static AffirmativeKeyDown(e: React.KeyboardEvent<HTMLElement>, callback: () => void): void {
        Utility.KeyDown({e, callback, keys: Utility.AFFIRMATIVE_KEYS});
    }

      /**
     * Execute user-defined custom function when user presses enter or spacebar.
     * This is useful when defining a button-like element using divs and you need
     * to define your own onKeyUp handler.
     *
     * @param e from onKeyDown
     * @param callback the custom function to execute
     */
    public static AffirmativeKeyUp(e: React.KeyboardEvent<HTMLElement>, callback: () => void): void {
        Utility.KeyUp({e, callback, keys: Utility.AFFIRMATIVE_KEYS});
    }

    /**
     * Generic callback upon key down event
     *
     * @param params @see IKeyDown
     */
    public static KeyDown(params: IKeyDown): void {
        if (!params.keys || !params.keys.length) {
            return;
        }

        const fireEvent: boolean = params.keys.some(key => key === params.e.which);
        if (fireEvent) {
            params.e.stopPropagation();
            params.e.preventDefault();
            params.callback();
        }
    }

    /**
     * Generic callback upon key down event
     *
     * @param params @see IKeyDown
     */
    public static KeyUp(params: IKeyUp): void {
        if (!params.keys || !params.keys.length) {
            return;
        }

        const fireEvent: boolean = params.keys.some(key => key === params.e.which);
        if (fireEvent) {
            params.e.stopPropagation();
            params.e.preventDefault();
            params.callback();
        }
    }
}
