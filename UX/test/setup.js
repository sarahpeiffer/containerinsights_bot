/**
 * shim used for mocha so we have a window object... so anyone referencing window for display strings,
 * telemetry, etc in a unit test wont crash
 */
global.window = {};

D3 = {};