/**
 * This file contains contains definitions that emulate existance of the 
 * HealthPaneView react component. These are required to make Containers Main Page
 * component believe that health pane is defined even though it is loaded as a 
 * separate javascript bundle if and only if user clicks "Health" tab. Once 
 * health javascript (container-health.js) is loaded, health pane component is
 * actually defined as real react component.
 * Health javascript is loaded asynchronously by injecting 'script' tag into DOM.
 * See AsyncScriptLoadManager.ts for definition of the class providing that functionality.
 * This is done to lower the size of the javascript file needed to be loaded for initial
 * page visualization.
 * 
 * This file is included at the top of ContainerMainPage.tsx
 */

/**
 * Health pane properties
 */
interface IHealthPaneViewProps {
    parentContext: any;
}

/**
 * Empty health pane component
 */
declare class HealthPaneView extends React.Component<IHealthPaneViewProps> {}


