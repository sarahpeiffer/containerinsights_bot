import { DisplayStrings } from '../../src/scripts/shared/DisplayStrings';

import { assert } from 'chai';

import { MachinePropertyPanelAdaptor } from
    '../../src/scripts/compute/shared/property-panel/entity-properties/map-entity-adaptor/MachinePropertyPanelAdaptor';
    
import { StringHelpers } from '../../src/scripts/shared/Utilities/StringHelpers';

suite('unit | PropertiesPanelMachine', () => {

    suite('function | getProperties', () => {
        test('it should be sane when presented with null', () => {
            const result = new MachinePropertyPanelAdaptor(null, null).getProperties();
            assert.isDefined(result);
            assert.isNotNull(result);
            assert.isDefined(result.length);
            assert.equal(result.length, 0);
        });

        test('it should be sane when presented with empty entity object', () => {
            const result = new MachinePropertyPanelAdaptor(null, ({ entity: {} } as any)).getProperties();
            assert.isDefined(result);
            assert.isNotNull(result);
            assert.isDefined(result.length);
            assert.equal(result.length, 0);
        });

        test('it should be sane when presented with empty object', () => {
            const result = new MachinePropertyPanelAdaptor(null, ({ entity: {} } as any)).getProperties();
            assert.isDefined(result);
            assert.isNotNull(result);
            assert.isDefined(result.length);
            assert.equal(result.length, 0);
        });

        test('it should be sane when presented with fqdn', () => {
            const testObject = ({ fullyQualifiedDomainName: 'test' } as any);
            const result = new MachinePropertyPanelAdaptor(null, testObject).getProperties();
            assert.isDefined(result);
            assert.isNotNull(result);
            assert.isDefined(result.length);
            assert.equal(result.length, 1);
            assert.equal(result[0].propertyValues[0], 'test');
        });

        test('it should be sane when presented with networking.dnsNames', () => {
            const testObject = ({ networking: { dnsNames: ['test'] } } as any);
            const result = new MachinePropertyPanelAdaptor(null, testObject).getProperties();
            assert.isDefined(result);
            assert.isNotNull(result);
            assert.isDefined(result.length);
            assert.equal(result.length, 1);
            assert.equal(result[0].propertyValues[0], 'test');
        });

        test('it should be sane when presented with operatingSystem.fullName', () => {
            const testObject = ({ operatingSystem: { fullName: 'test' } } as any);
            const result = new MachinePropertyPanelAdaptor(null, testObject).getProperties();
            assert.isDefined(result);
            assert.isNotNull(result);
            assert.isDefined(result.length);
            assert.equal(result.length, 1);
            assert.equal(result[0].propertyValues[0], 'test');
        });

        test('it should be sane when presented with networking.ipv4Interfaces', () => {
            const ipv4Array = [{ cidrNotation: 'test' }];
            const testObject = ({ networking: { ipv4Interfaces: ipv4Array } } as any);
            const result = new MachinePropertyPanelAdaptor(null, testObject).getProperties();
            assert.isDefined(result);
            assert.isNotNull(result);
            assert.isDefined(result.length);
            assert.equal(result.length, 1);
            assert.equal(result[0].propertyValues[0], 'test');
        });

        test('it should be sane when presented with networking.ipv6Interfaces', () => {
            const ipv4Array = [{ ipAddress: 'test' }];
            const testObject = ({ networking: { ipv6Interfaces: ipv4Array } } as any);
            const result = new MachinePropertyPanelAdaptor(null, testObject).getProperties();
            assert.isDefined(result);
            assert.isNotNull(result);
            assert.isDefined(result.length);
            assert.equal(result.length, 1);
            assert.equal(result[0].propertyValues[0], 'test');
        });

        test('it should be sane when presented with networking.macAddresses', () => {
            const ipv4Array = ['test'];
            const testObject = ({ networking: { macAddresses: ipv4Array } } as any);
            const result = new MachinePropertyPanelAdaptor(null, testObject).getProperties();
            assert.isDefined(result);
            assert.isNotNull(result);
            assert.isDefined(result.length);
            assert.equal(result.length, 1);
            assert.equal(result[0].propertyValues[0], 'test');
        });

        test('it should be sane when presented with clientNodes & serverNodes', () => {
            const testObject = ({
                getConnectedServerCount: () => { return 1 },
                getConnectedClientCount: () => { return 2 }
            } as any);
            const result = new MachinePropertyPanelAdaptor(null, testObject).getMachineDependency();
            assert.isDefined(result);
            assert.isNotNull(result);
            assert.isDefined(result.length);
            assert.equal(result.length, 2);
            assert.equal(result[0].value, 1);
            assert.equal(result[1].value, 2);
        });

        test('it should be sane when presented with resources.cpudetails completely', () => {
            const testObject = ({ resources: { cpus: 'test', cpuSpeed: 'test2' } } as any);
            const cpuBody = StringHelpers.replaceAll(
                StringHelpers.replaceAll(DisplayStrings.CPUBody, '{0}', 'test'),
                '{1}', 'test2');
            const result = new MachinePropertyPanelAdaptor(null, testObject).getProperties();
            assert.isDefined(result);
            assert.isNotNull(result);
            assert.isDefined(result.length);
            assert.equal(result.length, 1);
            assert.equal(result[0].propertyValues[0], cpuBody);
        });

        test('it should be sane when presented with resources.cpudetails partially', () => {
            const testObject = ({ resources: { cpus: 'test' } } as any);
            const result = new MachinePropertyPanelAdaptor(null, testObject).getProperties();
            assert.isDefined(result);
            assert.isNotNull(result);
            assert.isDefined(result.length);
            assert.equal(result.length, 0);
        });

        test('it should be sane when presented with resources.cpudetails partially', () => {
            const testObject = ({ resources: { cpuSpeed: 'test' } } as any);
            const result = new MachinePropertyPanelAdaptor(null, testObject).getProperties();
            assert.isDefined(result);
            assert.isNotNull(result);
            assert.isDefined(result.length);
            assert.equal(result.length, 0);
        });

        test('it should be sane when presented with resources.physicalMemory', () => {
            const testObject = ({ resources: { physicalMemory: 'test' } } as any);
            const memoryBody = StringHelpers.replaceAll(DisplayStrings.MemoryBody, '{0}', 'test');
            const result = new MachinePropertyPanelAdaptor(null, testObject).getProperties();
            assert.isDefined(result);
            assert.isNotNull(result);
            assert.isDefined(result.length);
            assert.equal(result.length, 1);
            assert.equal(result[0].propertyValues[0], memoryBody);
        });

        test('it should be sane when presented with virtualizationState', () => {
            const testObject = ({ virtualizationState: 'test' } as any);
            const result = new MachinePropertyPanelAdaptor(null, testObject).getProperties();
            assert.isDefined(result);
            assert.isNotNull(result);
            assert.isDefined(result.length);
            assert.equal(result.length, 1);
            assert.equal(result[0].propertyValues[0], 'test');
        });

        test('it should be sane when presented with virtualMachine.virtualMachineType', () => {
            const testObject = ({ virtualMachine: { virtualMachineType: 'test' } } as any);
            const result = new MachinePropertyPanelAdaptor(null, testObject).getProperties();
            assert.isDefined(result);
            assert.isNotNull(result);
            assert.isDefined(result.length);
            assert.equal(result.length, 1);
            assert.equal(result[0].propertyValues[0], 'test');
        });

        test('it should be sane when presented with agent.agentId', () => {
            const testObject = ({ agent: { agentId: 'test' } } as any);
            const result = new MachinePropertyPanelAdaptor(null, testObject).getProperties();
            assert.isDefined(result);
            assert.isNotNull(result);
            assert.isDefined(result.length);
            assert.equal(result.length, 1);
            assert.equal(result[0].propertyValues[0], 'test');
        });

        test('it should be sane when presented with agent.dependencyAgentVersion', () => {
            const testObject = ({ agent: { dependencyAgentVersion: 'test' } } as any);
            const result = new MachinePropertyPanelAdaptor(null, testObject).getProperties();
            assert.isDefined(result);
            assert.isNotNull(result);
            assert.isDefined(result.length);
            assert.equal(result.length, 1);
            assert.equal(result[0].propertyValues[0], 'test');
        });
    });
});
