import { IDescribeData } from '../interfaces/IDescribeData';

/**
 * response interpretor for deployment describe data
 */
export class DescribeResponseInterpretor {

    /**
     * convert the raw response from the k8s api into a managable object
     * for the "pretty" UIs
     * @param rawDescribeResponse raw data from describe end point(s)
     */
    public processDescribe(rawDescribeResponse: any): IDescribeData {

        const data: IDescribeData = {};

        data.Name = [rawDescribeResponse.metadata.name];
        data.Namespace = [rawDescribeResponse.metadata.namespace];
        data.CreationTimestamp = [rawDescribeResponse.metadata.creationTimestamp];
        data.Selector = this.selectors(rawDescribeResponse);
        data.Replicas = this.replicas(rawDescribeResponse);
        data.StrategyType = this.strategy(rawDescribeResponse);
        data.Containers = this.containers(rawDescribeResponse);
        data.Labels = this.labels(rawDescribeResponse);
        data.Annotations = this.annotations(rawDescribeResponse);

        return data;
    }

    /**
     * replica detials (see kubectl describe deployment xxx)
     * @param rawDescribeResponse raw data from describe end point(s)
     */
    private replicas(rawDescribeResponse: any): string[] {
        const replicas = rawDescribeResponse.status.replicas || 0;
        const updatedReplicas = rawDescribeResponse.status.updatedReplicas || 0;
        const readyReplicas = rawDescribeResponse.status.readyReplicas || 0;
        const availableReplicas = rawDescribeResponse.status.availableReplicas || 0;
        const unavailableReplicas = rawDescribeResponse.status.unavailableReplicas || 0;

        // tslint:disable-next-line:max-line-length
        return [`${replicas} desired | ${updatedReplicas} updated | ${readyReplicas} total | ${availableReplicas} available | ${unavailableReplicas} unavailable`];
    }
    
    /**
     * container specific details (see kubectl describe deployment xxx)
     * @param rawDescribeResponse raw data from describe end point(s)
     */
    private containers(rawDescribeResponse: any): string[] {
        if (!rawDescribeResponse.spec ||
            !rawDescribeResponse.spec.template ||
            !rawDescribeResponse.spec.template.spec ||
            !rawDescribeResponse.spec.template.spec.containers) {
            return [];
        }

        return rawDescribeResponse.spec.template.spec.containers.map((container) => {
            return `${container.name} (${container.image})`;
        });
    }

    /**
     * strategy (see kubectl describe deployment xxx)
     * @param rawDescribeResponse raw data from describe end point(s)
     */
    private strategy(rawDescribeResponse: any): string[] {
        if (!rawDescribeResponse.spec.strategy ||
            !rawDescribeResponse.spec.strategy.type) {
            return [];
        }

        return [rawDescribeResponse.spec.strategy.type];
    }

    /**
     * selectors (see kubectl describe deployment xxx)
     * @param rawDescribeResponse raw data from describe end point(s)
     */
    private selectors(rawDescribeResponse: any): string[] {
        if (!rawDescribeResponse.spec.selector ||
            !rawDescribeResponse.spec.selector.matchLabels) {
            return [];
        }

        const matchLabels = Object.keys(rawDescribeResponse.spec.selector.matchLabels);
        return matchLabels.map((matchLabel) => {
            return `${matchLabel}=${rawDescribeResponse.spec.selector.matchLabels[matchLabel]}`;
        });
    }

    /**
     * labels (see kubectl describe deployment xxx)
     * @param rawDescribeResponse raw data from describe end point(s)
     */
    private labels(rawDescribeResponse: any): string[] {
        if (!rawDescribeResponse.metadata.labels) {
            return [];
        }

        const annotationKeys = Object.keys(rawDescribeResponse.metadata.labels);
        return annotationKeys.map((key) => {
            return `${key}=${rawDescribeResponse.metadata.labels[key]}`;
        });
    }

    /**
     * annotations (see kubectl describe deployment xxx)
     * @param rawDescribeResponse raw data from describe end point(s)
     */
    private annotations(rawDescribeResponse: any): string[] {
        if (!rawDescribeResponse.metadata.annotations) {
            return [];
        }

        const annotationKeys = Object.keys(rawDescribeResponse.metadata.annotations);
        return annotationKeys.map((key) => {
            return `${key}: ${rawDescribeResponse.metadata.annotations[key]}`;
        });
    }
}
