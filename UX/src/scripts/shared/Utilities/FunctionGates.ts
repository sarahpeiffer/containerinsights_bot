/**
 * This class contains function modifiers such as limited functions, throttled functions, and debounced functions.
 */
export default class FunctionGates {
    /**
     * Function that limits the inputted function by updating the function arguments to be the latest arguments provided.
     * NOTE: If there are three function calls within the delay, only two will be triggered: 
     * the first one, and the last one. The second one is destroyed. 
     * In other words, this deletes intermediate function calls.
     * @param fn The function that you want limited
     * @param delay The time in MS that you want to throttle two function calls for
     * @param scope Which context you want fn's .this to be on.
     */
    public static CreateLimitedFunction(fn: (...args: any[]) => void, delay: number, scope?: any): (...args: any[]) => void {
        let timeoutId: any = -1;
        let _args: any[];
        return function (...args: any[]) {
            const context = scope || this;
            //Update the next function call to be the most recent arguments
            _args = args;
            //Trigger the timeout only if there does not exist a timeout already
            if (timeoutId === -1) {
                //Call the function immediately, since there is no timer at the moment.
                fn.apply(context, _args);
                timeoutId = setTimeout(() => {
                    timeoutId = -1;
                    //Call function if the arguments were updated since the last timeout
                    if (_args !== args) {
                        fn.apply(context, _args);
                    }
                }, delay + 1);
            }
        }
    }
    /**
     * Function that throttles the inputted function by queuing the function arguments.
     * NOTE: If there are three function calls within the delay, all three will be triggered, with <delay> MS in between each call.
     * @param fn The function that you want throttled
     * @param delay The time in MS that you want to throttle two function calls for
     * @param scope Which context you want fn's .this to be on.
     */
    public static CreateThrottledFunction(fn: (...args: any[]) => void, delay: number, scope?: any): (...args: any[]) => void {
        let timeoutId: any = -1;
        const _args: any[][] = [];
        return function (...args: any[]) {
            const context = scope || this;
            //Update the next function call to be the most recent arguments
            _args.push(args);
            //Trigger the timeout only if there does not exist a timeout already
            if (timeoutId === -1) {
                timeoutCallback(context);
            }
        }
        function timeoutCallback(context: any) {
            if (_args.length > 0) {
                fn.apply(context, _args.shift());
                timeoutId = setTimeout(() => {
                    timeoutCallback(context);
                }, delay + 1);
            } else {
                timeoutId = -1;
            }
        }
    }
    /**
     * Function that debouncing the inputted function by calling the inputted function only after there has been <delay> MS since 
     * the final function call.
     * NOTE: If there are three function calls with less than <delay> MS between two consecutive calls, only the last function call
     * will execute.
     * @param fn The function that you want debounced
     * @param delay The time in MS that you want to debounce for.
     * @param scope Which context you want fn's .this to be on.
     */
    public static CreateDebouncedFunction(fn: (...args: any[]) => void, delay: number, scope?: any): (...args: any[]) => void {
        let timeoutId: any = -1;
        let _args: any[];
        return function (...args: any[]) {
            const context = scope || this;
            //Update the next function call to be the most recent arguments
            _args = args;
            if (timeoutId !== -1) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(() => {
                timeoutId = -1;
                fn.apply(context, _args);
            }, delay + 1);
        }
    }
}
