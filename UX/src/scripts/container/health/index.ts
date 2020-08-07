/**
 * This file contains all things required for health blade
 * and serves as basis for bundle generation (in webpack.common.js)
 */
import { HealthPaneView } from './views/HealthPaneView';

// sets HealthPaneView class as property on window object
// such that when health javascript bundle is loaded main
// bundle would be able to instantiate the health pane (tab).
// Before this line, the main bundle will use 'dummy' HealthPaneView
// provided to it as 'emulation' so that we don't load javascript
// used only on health tab during initial page load.
// 
// see also ../index.emulator.d.ts for more explanation

(window as any).HealthPaneView = HealthPaneView;
