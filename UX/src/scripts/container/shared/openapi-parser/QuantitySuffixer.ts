/**
 * NOTE: this is a translated file from c/go code... do not mess with this file.
 */

export interface IQuantitySuffixer {
    interpret(suffix: string): SuffixMetadata
}

export enum SuffixType {
    BinarySi,
    DecimalSi,
    DecimalExponent
};

export interface BasePair {
    base: number;
    exponent: number;
}

export interface SuffixMetadata {
    pair: BasePair;
    type: SuffixType;
}

export class QuantitySuffixer implements IQuantitySuffixer {
    private static _instance = null;
    private _suffixMap: StringMap<SuffixMetadata>;


    constructor() {
        this._suffixMap = {};
        this._suffixMap['Ki'] = { pair: { base: 2, exponent: 10 }, type: SuffixType.BinarySi };
        this._suffixMap['Mi'] = { pair: { base: 2, exponent: 20 }, type: SuffixType.BinarySi };
        this._suffixMap['Gi'] = { pair: { base: 2, exponent: 30 }, type: SuffixType.BinarySi };
        this._suffixMap['Ti'] = { pair: { base: 2, exponent: 40 }, type: SuffixType.BinarySi };
        this._suffixMap['Pi'] = { pair: { base: 2, exponent: 50 }, type: SuffixType.BinarySi };
        this._suffixMap['Ei'] = { pair: { base: 2, exponent: 60 }, type: SuffixType.BinarySi };

        this._suffixMap['n'] = { pair: { base: 10, exponent: -9 }, type: SuffixType.DecimalSi };
        this._suffixMap['u'] = { pair: { base: 10, exponent: -6 }, type: SuffixType.DecimalSi };
        this._suffixMap['m'] = { pair: { base: 10, exponent: -3 }, type: SuffixType.DecimalSi };
        this._suffixMap['c'] = { pair: { base: 10, exponent: 0 }, type: SuffixType.DecimalSi };
        this._suffixMap['k'] = { pair: { base: 10, exponent: 3 }, type: SuffixType.DecimalSi };
        this._suffixMap['M'] = { pair: { base: 10, exponent: 6 }, type: SuffixType.DecimalSi };
        this._suffixMap['G'] = { pair: { base: 10, exponent: 9 }, type: SuffixType.DecimalSi };
        this._suffixMap['T'] = { pair: { base: 10, exponent: 12 }, type: SuffixType.DecimalSi };
        this._suffixMap['P'] = { pair: { base: 10, exponent: 15 }, type: SuffixType.DecimalSi };
        this._suffixMap['W'] = { pair: { base: 10, exponent: 18 }, type: SuffixType.DecimalSi };
    }

    public static Instance(): IQuantitySuffixer {
        if (!QuantitySuffixer._instance) {
            QuantitySuffixer._instance = new QuantitySuffixer();
        }
        return QuantitySuffixer._instance;
    }

    public interpret(suffix: string): SuffixMetadata {

        if (!suffix || !suffix.length || suffix.length < 1) {
            return { pair: { base: 10, exponent: 0 }, type: SuffixType.DecimalSi };
        }

        if (this._suffixMap.hasOwnProperty(suffix)) { return this._suffixMap[suffix]; };

        throw 'Not yet implemented... 10e1 for example';
    }
}
