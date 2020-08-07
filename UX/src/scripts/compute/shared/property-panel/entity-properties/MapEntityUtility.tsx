/** block / third party */
import * as React from 'react';

/**
 * Computer Shared imports
 */
import { ISimplePropertyProps } from '../../../../shared/property-panel/SimpleProperty';

/**
 * Shared imports
 */
import { DisplayStrings } from '../../../../shared/DisplayStrings';
import { GreenSvg } from '../../../../shared/svg/green';
import { ErrorSvg } from '../../../../shared/svg/error';
import { WarnSvg } from '../../../../shared/svg/warn';
import { InfoTooltipProps } from '../../InfoTooltip';
import { ILinkToNavigate } from './LinkToNavigateAdaptor';

/** 
 * Takes a given SelectionContext (an ADM Maps object wrapped in our own interface) and converts
 * that into something the AutoPropertyPanel can understand and visualize specifically for
 * machine selections only...
*/
export class MapEntityUtility {
    public static readonly defaultPropertiesShowingNumber = 3;
    public static readonly donutChartInnerRadius = 45;
    public static readonly donutChartOuterRadius = 75;

    /**
     * check count, if 0 or 1, use singular, greater than 1, use plural
     * @param count 
     * @param singular 
     * @param plural 
     */
    public static getCorrectPluralForm(count, singular, plural): string {
        if (count === 0 || count === 1) {
            return singular;
        } else {
            return plural;
        }
    }

    /**
     * Given a title and one or more values create a row item entry the auto prop panel will render
     * these in series one after the other in the order the array is created in
     * Note: extra care is taken here to ensure if there are no values (null or empty list) that the
     * header will never exist either... if you do not return null (instead return a field with empty
     * info the auto prop panel engine would render headers with no content under)
     * @param title Title of this row item
     * @param targetValues values for this row item
     * @returns {IFieldInfoComponentProps} row entry for auto prop panel
     */
    public static entityProp(title: string,
        targetValues: string[],
        customClassName?: string,
        propertyIcon?: JSX.Element,
        linkToNavigate?: ILinkToNavigate,
        infoTooltipProps?: InfoTooltipProps): ISimplePropertyProps {
        if (!targetValues) {
            return null;
        }

        const translatedValues = [];
        targetValues.forEach((item) => {
            if (item) {
                translatedValues.push(item);
            }
        });

        // bbax: note if you want to add headers with empty values, change the logic here
        // to not push null into the list, but insert the header with null info array...
        if (translatedValues.length < 1) {
            return null;
        }
        return { propertyName: title, propertyValues: translatedValues, customClassName, propertyIcon, linkToNavigate, infoTooltipProps};
    }

    /**
     * get something... anything at all... the autopanel system will reject nulls outright already
     * so this makes things easier in the generator above
     * @param operand some object, null or undefined
     * @returns {T} something, anything, just not null or undefined
     */
    public static get<T>(operand: T): T {
        return operand || ({} as any);
    }

    /**
     * small length wrapper so we dont need this code on every line above
     * @param operand array we want the length of in string form
     * @returns {string} the number as a string
     */
    public static opLength<T>(operand: T[]): string {
        if (!operand || !operand.length) {
            return '0';
        }
        return operand.length.toString();
    }

    public static hasMap(operand): boolean {
        return operand && operand.map;
    }

    /**
     * wrapper to tell us how many keys are in a given object
     * @param operand operand we want the number of keys contained within
     * @returns {string} the string representation of the count of keys
     */
    public static keyLength<T>(operand: T): string {
        if (!operand) {
            return '0';
        }

        const keys = Object.keys(operand as unknown as object);
        return this.opLength(keys);
    }

    public static push<T>(collection: Array<T>, item: T) {
        if (!item) {
            return;
        }

        collection.push(item);
    }

    /**
    * @param text cell text
    * @returns plain text UI for a cell in the table for and ClienrMemberMachinePropertyPanel
    */
    public static getTextGridCell(text: string) {
        return <span title={text}>{text}</span>;
    }

    /**
     * @param connectionState connection state for a cell
     * @returns icon and text UI for a cell in the table for ServerMemberMachinePropertyPanel and ClientMemberMachinePropertyPanel
     */
    public static getConnectionStateGridCell(connectionState: DependencyMap.ConnectionFailureState): JSX.Element {
        switch (connectionState) {
            case DependencyMap.ConnectionFailureState.Failed:
                return MapEntityUtility.getConnectionStateGridCellHelper(DisplayStrings.failed, <ErrorSvg />);
            case DependencyMap.ConnectionFailureState.Ok:
                return MapEntityUtility.getConnectionStateGridCellHelper(DisplayStrings.OK, <GreenSvg />);
            case DependencyMap.ConnectionFailureState.Mixed:
                return MapEntityUtility.getConnectionStateGridCellHelper(DisplayStrings.mixed, <WarnSvg />);
            default:
                return <span>{DisplayStrings.undefine}</span>;
        }
    }

    /**
     * @param text connection state text
     * @param icon connection state icon
     * @returns icon and text UI for a the given text and icon used for a cell in the 
     * table for ServerMemberMachinePropertyPanel and ClientMemberMachinePropertyPanel
     */
    private static getConnectionStateGridCellHelper(text: string, icon: JSX.Element) {
        return <div title={text} className='imageAndText'>{icon} <span>{text}</span></div>
    }
}
