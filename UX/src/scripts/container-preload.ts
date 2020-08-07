/**
 * this script is loaded on the ui thread as a micro script.  it may or may not launch a web worker
 * depending on browser support.  
 */
import { ContainerPreloadManager } from './container/ContainerPreloadManager';
import { ContainerGlobals } from './container/ContainerGlobals';

const preloadManager = new ContainerPreloadManager();
ContainerGlobals.performanceMeasures['pre_startPreLoad'] = Date.now();
preloadManager.startPreload();
