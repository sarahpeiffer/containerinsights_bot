import { StringHelpers } from './Utilities/StringHelpers';

// bbax: TODO: this could be extended so we can define some things are optional when others exist.. the validity
// maybe make it customizable validity... maybe we have SimpleBaseBuilder here and more complex extended?? ideas to explore
export abstract class BaseBuilder {
    constructor(private _requiredParameters: string[], private _name: string) {}

    protected resolveParameter(parameter: string) {
        if (!StringHelpers.contains(this._requiredParameters, parameter)) {
            throw 'BaseBuilder::resolveParameter attempted to resolve a parameter not owned or twice';
        }
        this._requiredParameters = this._requiredParameters.filter((item) => item !== parameter);
    }

    protected throwObjectValid() {
        if (this._requiredParameters.length > 0) {
            throw `BaseBuilder [${this._name}] all parameters have not yet been resolved!`;
        }
    }
}
