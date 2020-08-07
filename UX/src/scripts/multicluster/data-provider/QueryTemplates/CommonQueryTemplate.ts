/**
 *  Placedholders which are used in the Draft query 
 *  and replaced with the actual values appropriately
 */
export class Placeholder {
    public static MaxResultCount: string = '$[maxResultCount]';
    public static OrderBy: string = '$[orderByColumnName]';
    public static SortDirection: string = '$[sortDirection]';
    public static GroupFilter: string = '$[groupFilter]';
    public static MonitoredClustersFilter: string = '$[monitoredClustersFilter]';
    public static StartDateTime: string = '$[startDateTime]';
    public static EndDateTime: string = '$[endDateTime]';

}

