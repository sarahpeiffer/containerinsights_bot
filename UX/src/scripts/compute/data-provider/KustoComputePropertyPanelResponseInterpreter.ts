/** Compute Resource Summary */
enum ComputeSummaryColumn {
    Monitored = 0,
    isVMSS = 1,
    Count = 2
}

export interface ComputeResourceSummaryRow {
    monitored: number;
    unmonitored: number;
}

export interface ComputeResourceSummary {
    vm: ComputeResourceSummaryRow;
    vmss: ComputeResourceSummaryRow;
}

/** Connection Summary */
enum ConnectionSummaryColumn {
    LinksFailed = 0,
    LinksLive = 1,
    LinksEstablished = 2,
    LinksTerminated = 3
}

export interface ConnectionSummary {
    linksFailed: number;
    linksLive: number;
    linksEstablished: number;
    linksTerminated: number;
}

/**
 * Helper methods to interpret property panel for workspace and group. Typically parses raw query results
 * from `VmInsightsDataProvider.ts`
 *
 * @export
 * @class KustoComputePropertyPanelResponseInterpreter
 */
export class KustoComputePropertyPanelResponseInterpreter {
    /**
     * Expect at most four rows which shows VM and VMSS monitored and unmonitored counts. If we add additional
     * VM types, more rows may be shown.
     *
     * @static
     * @param {*} rawQueryResult
     * @returns {ComputeResourceSummary}
     * @memberof KustoComputePropertyPanelResponseInterpreter
     */
    public static ProcessComputeResourcesSummaryResult(rawQueryResult: any): ComputeResourceSummary {
        const resultRows: any[] = this.extractResultRows(rawQueryResult);
        if (!resultRows) {
            return undefined;
        }

        let result: ComputeResourceSummary = {
            vm: {
                monitored: 0,
                unmonitored: 0
            },
            vmss: {
                monitored: 0,
                unmonitored: 0
            }
        };

        for (const row of resultRows) {
            const count: number = row[ComputeSummaryColumn.Count];
            if (row[ComputeSummaryColumn.isVMSS]) {
                if (row[ComputeSummaryColumn.Monitored]) {
                    result.vmss.monitored = count;
                } else {
                    result.vmss.unmonitored = count;
                }
            } else {
                if (row[ComputeSummaryColumn.Monitored]) {
                    result.vm.monitored = count;
                } else {
                    result.vm.unmonitored = count;
                }
            }
        }

        return result;
    }

    /**
     * Expect a single row with the summary of links information for a given workspace
     *
     * @static
     * @param {*} rawQueryResult
     * @returns {ConnectionSummary}
     * @memberof KustoComputePropertyPanelResponseInterpreter
     */
    public static ProcessConnectionSummaryResult(rawQueryResult: any): ConnectionSummary {
        const resultRows: any[] = this.extractResultRows(rawQueryResult);
        if (!resultRows) {
            return undefined;
        }

        const row: any = resultRows[0];
        const result: ConnectionSummary = {
            linksFailed: row[ConnectionSummaryColumn.LinksFailed],
            linksLive: row[ConnectionSummaryColumn.LinksLive],
            linksEstablished: row[ConnectionSummaryColumn.LinksEstablished],
            linksTerminated: row[ConnectionSummaryColumn.LinksTerminated]
        };
        return result;
    }

    private static extractResultRows(rawQueryResult: any): any[] {
        if (!rawQueryResult || !rawQueryResult.Tables || (rawQueryResult.Tables.length === 0) || !rawQueryResult.Tables[0]) {
            return undefined;
        }

        const resultRows: any[] = rawQueryResult.Tables[0].Rows;
        return resultRows;
    }
}
