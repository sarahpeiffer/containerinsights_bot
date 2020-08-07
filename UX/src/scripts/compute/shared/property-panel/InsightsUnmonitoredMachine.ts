import { EntityType } from './data-models/EntityType';

export class InsightsUnmonitoredMachine extends DependencyMap.Machine {
    constructor(id: string) {
        super(id, null);
        this.type = EntityType.UnmonitoredMachine as number;
    }
}
