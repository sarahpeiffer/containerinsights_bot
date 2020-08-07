import { IGridLineObject, GridLineObject } from '../../../shared/GridLineObject';
import { RowType, IMetaDataBase, TrendDataWrapper } from './Shared';
import { StringHelpers } from '../../../shared/Utilities/StringHelpers';

/**
 * Represent a pod row... optionally can contain an owning controllerName used by controller view
 */
export class PodMetaDataLegacy implements IMetaDataBase {

    public rowType: RowType = RowType.Pod;

    /**
     * .ctor()
     * @param podName the pods name, used for breaking ambiguous sort ties
     * @param podStatus the status of the pod
     * @param lastReported last time this pod reported (stolen from container today)
     * @param controllerName [optional] used by controller view
     */
    constructor(
        public podName, 
        public podStatus, 
        public lastReported, 
        public controllerName, 
        public timeGenerated, 
        public hostName: string, 
        public nameSpace: string, 
        public clusterId: string, 
        public controllerKind?: string
    ) {}

    /**
     * helper function to wrap a pod sgdatarow entry to include this metadata class utilizing
     * the gridlineobject class
     * @param record the value we want metadata attached to
     * @param metaReference the metadata entry we are attaching to the value
     */
    public static metaWrapperHelper(record: any, metaReference: PodMetaDataLegacy): IGridLineObject<PodMetaDataLegacy> {
        return new GridLineObject(record, metaReference);
    }

    /**
     * trend line should be ported into the metadata itself so columns dont need to be accessed...
     * @param containers list of containers whose trends we would like to sum
     * @param trendIndex the column index of the trend line (see comment above... this may be removable)
     */
    public static addTrends(containers: IGridLineObject<PodMetaDataLegacy>[][], trendIndex: number): TrendDataWrapper[] {
        const runningValue: TrendDataWrapper[] = [];

        let value: number[] = [];
        let max: number[] = [];
        let dateTime: Date[] = [];
        const dateTimeIndexHash: StringMap<number> = {};
        let recordCount: number = 0;

        containers.forEach((container: IGridLineObject<PodMetaDataLegacy>[], k) => {
            const containerValue: TrendDataWrapper[] = container[trendIndex].value;


            containerValue.forEach((trendItem: TrendDataWrapper) => {
                const itemDate = trendItem.dateTimeUtc;
                if (!itemDate) {
                    return;
                }
                const itemDateString = itemDate.toString();

                let workingIndex = recordCount;
                if (dateTimeIndexHash.hasOwnProperty(itemDateString)) {
                    workingIndex = dateTimeIndexHash[itemDateString];
                } else {
                    dateTimeIndexHash[itemDateString] = recordCount;
                    recordCount++;
                }


                dateTime[workingIndex] = trendItem.dateTimeUtc;
                if (!value[workingIndex]) {
                    max[workingIndex] = trendItem.value.maxValue;
                    value[workingIndex] = trendItem.value.valueItem;
                } else {
                    max[workingIndex] += trendItem.value.maxValue;
                    value[workingIndex] += trendItem.value.valueItem;
                }
            });
        });

        for (let i = 0; i < recordCount; i++) {
            runningValue[i] = new TrendDataWrapper(dateTime[i], { maxValue: max[i], valueItem: value[i] })
        }
        const sortedTrends = runningValue.sort((left: TrendDataWrapper, right: TrendDataWrapper): number => {
            return left.dateTimeUtc.getTime() - right.dateTimeUtc.getTime();
        });
        return sortedTrends;
    }

    public getSortableKey(): string {
        return this.podName;
    }

    public get isVirtual(): boolean {
        return (
            StringHelpers.startsWith(this.hostName, 'virtual-kubelet') ||
            StringHelpers.startsWith(this.hostName, 'virtual-node')
        );
    }
}
