/// <referencepath="./ext/defs/d3.d.ts"/>

import * as React from 'react';
import * as ReactDOM from 'react-dom';

//import { ContainerMainPage } from './container/ContainerMainPage'
import { SFMeshMainPage } from './sfmesh/SFMeshMainPage'
import { PageStartup } from './shared/PageStartup';

(window as any).containerInsights.performanceMeasures.reactBootstrap = Date.now();

PageStartup.startupOnceDomLoaded(
    () => { 
        return document.getElementById('root') as HTMLElement; 
    },
    (rootElement) => {

        ReactDOM.render(
            <SFMeshMainPage />,
            rootElement);
    }
);
