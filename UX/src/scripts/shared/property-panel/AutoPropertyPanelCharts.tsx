import * as React from 'react';

/** 
 * property representation for our stateless react component below
*/
export interface IAutoPropertyPanelChartRowProps {
    charts: JSX.Element[];
    header?: JSX.Element;
}

/**
 * A single row to be created as part of a multi-row AutoPropertyPanel rect component
 * @param props information requried to generate this row
 */
export const AutoPropertyPanelChart: React.StatelessComponent<IAutoPropertyPanelChartRowProps> = (props) => {
    
    /**
     * setup the row... the "info" (data under a title) may be an array which means
     * we may need to enumerate the data...
     */
    function generateRowCharts(): JSX.Element {
        const componentList = new Array<JSX.Element>();

        props.charts.forEach((chart: JSX.Element) => {
            componentList.push(
                <div className='connectionpane-chart'>
                    {chart}
                </div>
            );
        });
        
        return (
            <div className='connectionpane-override'>
                {componentList}
            </div>
        );
    }

    return (
            <div className='connectionpane-chart-root'>
                {props.header}
                {generateRowCharts()}              
            </div>
    );
}
