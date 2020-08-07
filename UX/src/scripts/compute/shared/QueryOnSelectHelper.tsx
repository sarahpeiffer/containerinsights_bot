/**
 * Helper for components that will only query once selected
 */
export class QueryOnSelectHelper {
    // indicates a requery is needed once selected, which is initially the case
    private requeryOnceSelected: boolean = true;

    constructor() {
    }

    public needsRequeryNow(isSelected: boolean, needsRequery: () => boolean): boolean {
        if (this.requeryOnceSelected) {
            // If we already set this.requeryOnceSelected it will remain set
            // untill this component is selected 

            if (isSelected) {
                // If this component is selected and requeryOnceSelected is true
                // we are going to reset requeryOnceSelected and return true to requery
                this.requeryOnceSelected = false;
                return true;
            } else {
                // We are unselected and requeryOnceSelected is set.
                // Return false to indicate we should not requery now
                return false;
            }
        }

        if (isSelected) {
            // If this component selected shouldRequery is what we return
            return needsRequery();
        } else {
            // If we are not selected, we return false so we don't equery now
            // but we set this.requeryWhileUnselected to the result of shouldRequery
            // for a possible requery as soon as we are selected.
            this.requeryOnceSelected = needsRequery();
            return false;
        }
    }

    /**
     * This method makes requeryOnceSelected to false.
     * This method is needed if we get initial query data from blade.
     * We will set this flag to false to avoid further requery on blade.
     */
    public forceReset(): void {
        this.requeryOnceSelected = false;
    }
}
