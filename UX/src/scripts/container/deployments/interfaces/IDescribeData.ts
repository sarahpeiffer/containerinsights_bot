/**
 * the "pretty" version of the describe panel... the supported attributes will change from K8S version to version
 */
export interface IDescribeData {
    Name?: string[];
    Namespace?: string[];
    CreationTimestamp?: string[];
    Labels?: string[];
    Annotations?: string[];
    Selector?: string[];
    Replicas?: string[];
    StrategyType?: string[];
    Containers?: string[];
};
