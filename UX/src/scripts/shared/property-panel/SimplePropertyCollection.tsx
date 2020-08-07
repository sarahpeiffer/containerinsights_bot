/** block / third party */
import * as React from 'react';

/**
 * Local
 */
import { ISimplePropertyProps, SimpleProperty } from './SimpleProperty';
import { ITelemetry } from '../Telemetry';

/**
 * Simple property collection component properties
 */
export interface ISimplePropertyCollectionProps {
    /**
     * Collection of properties in the set
     */
    properties: ISimplePropertyProps[];
    enableCopyToClipboard?: boolean;
    telemetry?: ITelemetry;
    logPrefix?: string;
}

/**
 * Visualization component representing a set of simple properties displayed on the property panel
 */
export class SimplePropertyCollection extends React.Component<ISimplePropertyCollectionProps> {
    /**
     * Component ctor
     * @param props Properties of the component
     */
    constructor(props: ISimplePropertyCollectionProps) {
        super(props);
    }

    /** 
     * public render method (react)
     * @returns {JSX.Element}
    */
    public render(): JSX.Element {
        return <>{this.renderProperties()}</>;
    }

    /** 
     * Renders all individual properties
     * @returns {JSX.Element} the rows which make up the body
    */
    private renderProperties(): JSX.Element[] {
        if (!this.props || !this.props.properties || (this.props.properties.length <= 0)) {
            return null;
        }

        const result = new Array<JSX.Element>();
        for (let property of this.props.properties) {
            if (!property) {
                continue;
            }

            result.push(
                <SimpleProperty 
                    propertyName={property.propertyName} 
                    propertyValues={property.propertyValues} 
                    customClassName={property.customClassName}
                    linkToNavigate={property.linkToNavigate}
                    key={property.propertyName}
                    propertyIcon={property.propertyIcon}
                    enableCopyToClipboard ={this.props.enableCopyToClipboard}
                    telemetry={this.props.telemetry}
                    logPrefix={`${this.props.logPrefix}.SimplePropertyCollection`}
                    infoTooltipProps={property.infoTooltipProps}
                />
            );
        }

        return result;
    }
}

