
import { KubeConfigClusterType } from '../../KubeConfigClusterType';
import { AADv1KubeConfigInterpretor as AADv1KubeConfigInterpreter } from './AADv1KubeConfigInterpreter';
import { ADProvider } from '../AzureADProvider';
import { AADv2KubeConfigInterpreter } from './AADv2KubeConfigInterpreter';
import { TokenBasedKubeConfigInterpretor as TokenBasedKubeConfigInterpreter } from './TokenBasedKubeConfigInterpreter';

export class KubeConfigInterpreterFactory {
    /**
     * Gets the right Kube config interpreter based on the cluster type
     * @param rawKubeConfig 
     * @param clusterType 
     */
    public getKubeConfigInterpreter(rawKubeConfig: string, clusterType: KubeConfigClusterType) {
        switch (clusterType) {
            case KubeConfigClusterType.AksAADUnmanaged:
                return new AADv1KubeConfigInterpreter(rawKubeConfig, ADProvider.Instance());
            case KubeConfigClusterType.AksAADManaged:
                return new AADv2KubeConfigInterpreter(rawKubeConfig);
            case KubeConfigClusterType.AksNonAAD:
                return new TokenBasedKubeConfigInterpreter(rawKubeConfig);
            default:
                throw `KubeConfigInterpreterFactory unexpected cluster type ${clusterType}`;
        }
    }

}
