import * as chai from 'chai';
import { HealthCalculator, HealthStatus } from '../../src/scripts/multicluster/metadata/HealthCalculator';

const assert = chai.assert;

suite('unit | HealthCalculator', () => {

    suite('getClusterHealth', () => {
        test('Between node, user pods, and system pods, if just one status is unknown, then cluster health should be unknown', () => {
            const nodeOverallHealth: HealthStatus = HealthStatus.Unknown;
            const userPodOverallHealth: HealthStatus = HealthStatus.Healthy;
            const systemPodOverallHealth: HealthStatus = 
                HealthStatus.Healthy;
            const clusterHealth: HealthStatus = HealthCalculator.getClusterHealth(
                nodeOverallHealth, 
                userPodOverallHealth, 
                systemPodOverallHealth
            );

            assert.equal(clusterHealth, HealthStatus.Unknown, 'Cluster health should be unknown');
        });
        test('Cluster Health should be calculated as the worst status among node, user pod, and system pod health', () => {
            const nodeOverallHealth: HealthStatus = HealthStatus.Critical;
            const userPodOverallHealth: HealthStatus = HealthStatus.Healthy;
            const systemPodOverallHealth: HealthStatus = 
                HealthStatus.Warning;
            const clusterHealth: HealthStatus = HealthCalculator.getClusterHealth(
                nodeOverallHealth, 
                userPodOverallHealth, 
                systemPodOverallHealth
            ); 

            assert.equal(clusterHealth, HealthStatus.Critical, 'Cluster health should be critical');
        });
    });

    suite('getNodeOverallHealth', () => {
        test('If node health ratio is greater than 0.85, it should return HealthStatus.Healthy', () => {
            const nodeHealthRatio = 0.99;
            const nodeOverallHealth = HealthCalculator.getNodeOverallHealth(nodeHealthRatio);

            assert.equal(nodeOverallHealth, HealthStatus.Healthy, 'It should return HealthStatus.Healthy');
        });
        test('If node health ratio is equal to 0.85, it should return HealthStatus.Warning', () => {
            const nodeHealthRatio = 0.85;
            const nodeOverallHealth = HealthCalculator.getNodeOverallHealth(nodeHealthRatio);

            assert.equal(nodeOverallHealth, HealthStatus.Warning, 'It should return HealthStatus.Warning');
        });
        test('If node health ratio is less than or equal to 0.85, but greater than 0.6,\
            it should return HealthStatus.Warning', () => {
            const nodeHealthRatio = 0.73;
            const nodeOverallHealth = HealthCalculator.getNodeOverallHealth(nodeHealthRatio);

            assert.equal(nodeOverallHealth, HealthStatus.Warning, 'It should return HealthStatus.Warning');
        });
        test('If node health ratio is less than 0.6, it should return HealthStatus.Critical', () => {
            const nodeHealthRatio = 0.73;
            const nodeOverallHealth = HealthCalculator.getNodeOverallHealth(nodeHealthRatio);

            assert.equal(nodeOverallHealth, HealthStatus.Warning, 'It should return HealthStatus.Warning');
        });
        test('If node health ratio greater than 1, it should throw an error', () => {
            const nodeHealthRatio = 1.1;
            assert.throws(
                () => HealthCalculator.getNodeOverallHealth(nodeHealthRatio), 
                Error, 
                'nodeOverallHealthRatio cannot be greater than 1 or less than 0'
            );
        });
        test('If node health ratio is less than 0, it should throw an error', () => {
            const nodeHealthRatio = -0.1;
            assert.throws(
                () => HealthCalculator.getNodeOverallHealth(nodeHealthRatio), 
                Error, 
                'nodeOverallHealthRatio cannot be greater than 1 or less than 0'
            );
        });
    });

    suite('getUserPodOverallHealth', () => {
        test('If user pod health ratio is equal to 1, it should return HealthStatus.Healthy', () => {
            const userPodHealthRatio = 1;
            const userPodOverallHealth = HealthCalculator.getUserPodOverallHealth(userPodHealthRatio);

            assert.equal(userPodOverallHealth, HealthStatus.Healthy, 'It should return HealthStatus.Healthy');
        });
        test('If user pod health ratio is less than 1, but greater than or equal to to 0.9,\
            it should return HealthStatus.Warning', () => {
            const userPodHealthRatio = 0.95;
            const userPodOverallHealth = HealthCalculator.getUserPodOverallHealth(userPodHealthRatio);

            assert.equal(userPodOverallHealth, HealthStatus.Warning, 'It should return HealthStatus.Warning');
        });
        test('If user pod health ratio is equal to 0.9, it should return HealthStatus.Warning', () => {
            const userPodHealthRatio = 0.9;
            const userPodOverallHealth = HealthCalculator.getUserPodOverallHealth(userPodHealthRatio);

            assert.equal(userPodOverallHealth, HealthStatus.Warning, 'It should return HealthStatus.Warning');
        });
        test('If user pod health ratio is less than 0.9, it should return HealthStatus.Critical', () => {
            const userPodHealthRatio = 0.8;
            const userPodOverallHealth = HealthCalculator.getUserPodOverallHealth(userPodHealthRatio);

            assert.equal(userPodOverallHealth, HealthStatus.Critical, 'It should return HealthStatus.Critical');
        });
        test('If user pod health ratio greater than 1, it should throw an error', () => {
            const userPodHealthRatio = 1.1;
            assert.throws(
                () => HealthCalculator.getUserPodOverallHealth(userPodHealthRatio), 
                Error, 
                'userPodHealthRatio cannot be greater than 1 or less than 0'
            );
        });
        test('If user pod health ratio is less than 0, it should throw an error', () => {
            const userPodHealthRatio = -0.1;
            assert.throws(
                () => HealthCalculator.getUserPodOverallHealth(userPodHealthRatio), 
                Error, 
                'userPodHealthRatio cannot be greater than 1 or less than 0'
            );
        });
    });

    suite('getSystemPodOverallHealth', () => {
        test('If system pod health ratio is equal to 1, it should return HealthStatus.Healthy', () => {
            const systemPodHealthRatio = 1;
            const systemPodOverallHealth = HealthCalculator.getSystemPodOverallHealth(systemPodHealthRatio);

            assert.equal(systemPodOverallHealth, HealthStatus.Healthy, 'It should return HealthStatus.Healthy');
        });
        test('If system pod health ratio is less than 1, it should return HealthStatus.Critical', () => {
            const systemPodHealthRatio = 0.99;
            const systemPodOverallHealth = HealthCalculator.getSystemPodOverallHealth(systemPodHealthRatio);

            assert.equal(systemPodOverallHealth, HealthStatus.Critical, 'It should return HealthStatus.Critical');
        });
        test('If system pod health ratio greater than 1, it should throw an error', () => {
            const systemPodHealthRatio = 1.1;
            assert.throws(
                () => HealthCalculator.getSystemPodOverallHealth(systemPodHealthRatio), 
                Error, 
                'systemPodHealthRatio cannot be greater than 1 or less than 0'
            );
        });
        test('If system pod health ratio is less than 0, it should throw an error', () => {
            const systemPodHealthRatio = -0.1;
            assert.throws(
                () => HealthCalculator.getSystemPodOverallHealth(systemPodHealthRatio), 
                Error, 
                'systemPodHealthRatio cannot be greater than 1 or less than 0'
            );
        });
    });
});
