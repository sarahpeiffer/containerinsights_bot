/// <referencepath="./ext/defs/d3.d.ts"/>

import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { PageStartup } from './shared/PageStartup';
import { MultiClusterMessageHandler } from './multicluster/MultiClusterMessageHandler';

(window as any).containerInsightsAtScale.performanceMeasures.reactBootstrap = Date.now();

/**
 * Entry for the Multicluster main page
 */
PageStartup.startupOnceDomLoaded(
    () => {
        return document.getElementById('root') as HTMLElement;
    },
    (rootElement) => {
        ReactDOM.render(
            <MultiClusterMessageHandler />,
            rootElement
        );
    }
);
