/**
 * Defines properties of single chart series selection option
 */
export interface ISeriesSelectorOption {
    /** option id */
    id: string;

    /** option display name */
    displayName: string;

    /** true if options is currently selected */
    isSelected: boolean;
}
