import * as moment from 'moment';

export class KustoResponseInterpreter {
    public processGridQueryResult(result: any, trendIsAverage: boolean): any[] {
        // result must have an array of tables
        if (!result || !result.Tables || (result.Tables.length === 0)) {
            return null;
        }

        // first table contains results in array of rows
        const resultRows = result.Tables[0].Rows;

        if (!resultRows) {
            return null;
        }

        // hashtable object-name => object-index-in-array
        const nameDictionary = {};
        const objectList = new Array();

        for (let i = 0; i < resultRows.length; i++) {
            // each row is an array of values for columns
            const resultRow = resultRows[i];
            
            const name = resultRow[0];
            const averageValue = resultRow[1];
            const p50thValue = resultRow[2];
            const p90thValue = resultRow[3];
            const p95thValue = resultRow[4];
            const timeGenerated = resultRow[5];
            const trendAverageValue = resultRow[6];
            const trendPercentileValue = resultRow[7];

            // see if we've seen this object name
            if (nameDictionary[name] === undefined) {
                const objectData = [];
                objectData.push(
                    name, averageValue, p50thValue, p90thValue, p95thValue, []);
                
                nameDictionary[name] = objectList.length;
                objectList.push(objectData);
            }

            // obtain object index in list from hash map
            const objectIndex = nameDictionary[name];

            const objectData = objectList[objectIndex];
            const trendDataPoint = {
                dateTimeUtc: moment.utc(timeGenerated).toDate(), 
                value: trendIsAverage ? trendAverageValue : trendPercentileValue
            };

            // trend is the 6th element of the array
            objectData[5].push(trendDataPoint);
        }

        return objectList;
    }
}
