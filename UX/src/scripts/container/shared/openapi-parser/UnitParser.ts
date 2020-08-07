/**
 * NOTE: this is a translated file from c/go code... do not mess with this file.
 */

import { IQuantitySuffixer, SuffixType } from './QuantitySuffixer';

interface SymbolReferences {
    isPositive: boolean;
    value: string;
    numerator: string;
    denomerator: string;
    suffix: string;
}

export interface IMetricsServerUnitsParser {
    parseOpenApiQuantity(input: string): number;
}

interface MetricsParseEncoded {
    value: number;
    scale: number;
}

const maxInt64Factors = 18;
const Nano = -9;

export class UnitParser implements IMetricsServerUnitsParser {

    constructor(private suffixer: IQuantitySuffixer) { }

    public parseOpenApiQuantity(input: string): number {
        if (!input || !input.length || input.length < 1) { throw 'Invalid input to parseOpenApiQuantity'; }

        // bbax: i think this is a hack original implementor put in to avoid their initial zero's trimming logic
        // converting the entire string into an empty string and crashing?
        if (input === '0') { return 0; }

        const parseResult = this.processSymbols(input);
        const encodedValue = this.convertSymbolsToRealNumeric(parseResult);
        return Math.pow(10, encodedValue.scale) * encodedValue.value;
    }

    private convertSymbolsToRealNumeric(symbols: SymbolReferences): MetricsParseEncoded {
        const suffixerDetails = this.suffixer.interpret(symbols.suffix);
        let precision = 0;
        let scale = 0;
        let mantissa = 1;
        const exponent = suffixerDetails.pair.exponent;
        const numeratorLength = (symbols.numerator || { length: 0 }).length;
        const denominatorLength = (symbols.denomerator || { length: 0 }).length

        switch (suffixerDetails.type) {
            case SuffixType.DecimalExponent:
            case SuffixType.DecimalSi:
                scale = exponent;
                precision = maxInt64Factors - (numeratorLength + denominatorLength);

                let expectedDigits = scale;
                if (symbols.numerator === '0') {
                    expectedDigits -= denominatorLength;
                } else {
                    expectedDigits += (numeratorLength - 1);
                }

                // bbax: javascript limit for a number reliably is: 9,007,199,254,740,991 (15 digits)
                // for ease we are limiting to: 999,999,999,999,999 (14 digits)
                // we are of course losing some precision we could have, but this makes my brain happy
                if (expectedDigits > 14) {
                    precision = -1;
                }

                break;
            case SuffixType.BinarySi:
                scale = 0;

                // bbax: i had to modify this section and remove their denominator checks... they relied 
                // on a huge number object we can't in JS... there is possible precision loss here
                mantissa = Math.pow(2, exponent);
                precision = maxInt64Factors - numeratorLength - (exponent * 3 / 10) - 2;

                if (symbols.numerator === '0') {
                    precision++;
                }
                break;
        }

        if (precision >= 0) {

            if (suffixerDetails.type === SuffixType.BinarySi && precision === 0) {
                throw 'Number is WAY to big or small for our charting engine!';
            }

            scale -= denominatorLength;
            if (scale >= Nano) {
                const shifted = (symbols.numerator || '') + (symbols.denomerator || '');
                let value = parseInt(shifted, 10);
                let result = value * mantissa;

                if (!symbols.isPositive) {
                    result = -result;
                }

                return { value: result, scale };
            }
        }

        throw 'Number is WAY to big or small for our charting engine!';
    }

    private processSymbols(str: string): SymbolReferences {
        let isPositive = true;
        let pos = 0;
        let end = str.length;

        if (pos < end) {
            switch (str.charAt(0)) {
                case '-':
                    isPositive = false;
                    pos++;
                    break;
                case '+':
                    pos++;
                    break;
            }
        }

        do {
            if (pos >= end) {
                return { numerator: '0', value: '0', denomerator: null, suffix: null, isPositive };
            }

            if (str.charAt(pos) === '0') {
                pos++;
            } else { break; }

        } while (str.charAt(pos) === '0');


        let numerator = null;
        for (let i = pos; ; i++) {
            if (i >= end) {
                // if the string only contained zeros... give out zero itself
                // test case: assert.equal(kubernetesParsingAndAggregation.parseCpuString('000000000000000'), 0);
                if (pos === end) {
                    return { numerator: '0', value: str, denomerator: null, suffix: null, isPositive };
                }
                return { numerator: str.substring(pos, end), value: str, denomerator: null, suffix: null, isPositive };
            }

            const candidate = str.charAt(i);
            if (candidate < '0' || candidate > '9') {
                numerator = str.substring(pos, i);
                pos = i;
                break;
            }
        }

        if (!numerator || !numerator.length || numerator.length < 1) {
            numerator = '0';
        }

        let denomerator = null;
        if (pos < end && str.charAt(pos) === '.') {
            pos++;
            for (let i = pos; ; i++) {
                if (i >= end) {
                    return { denomerator: str.substring(pos, end), value: str, numerator, suffix: null, isPositive };
                }

                const candidate = str.charAt(i);
                if (candidate < '0' || candidate > '9') {
                    denomerator = str.substring(pos, i);
                    pos = i;
                    break;
                }
            }
        }

        let value = str.substring(0, pos);
        const suffixStart = pos;
        // tslint:disable-next-line:max-line-length
        const candidateKeys = { 'e': null, 'E': null, 'i': null, 'n': null, 'c': null, 'u': null, 'm': null, 'k': null, 'K': null, 'M': null, 'G': null, 'T': null, 'P': null };

        for (let i = pos; ; i++) {
            if (i >= end) {
                return { numerator, denomerator, value, suffix: str.substring(suffixStart, end), isPositive };
            }

            if (!candidateKeys.hasOwnProperty(str.charAt(i))) {
                pos = i;
                break;
            }
        }

        if (pos < end) {
            switch (str.charAt(pos)) {
                case '-':
                case '+':
                    pos++;
                    break;
            }
        }

        for (let i = pos; ; i++) {
            if (i >= end) {
                return { numerator, denomerator, value, suffix: str.substring(suffixStart, end), isPositive };
            }

            const candidate = str.charAt(i);
            if (candidate < '0' || candidate > '9') {
                break;
            }
        }

        throw 'Non-Numeric suffix value appeared in unexpected position';
    }
}
