export interface IGridLineObject<T> {
    value: any;
    metaData: T; // todo: create explicit interface
    maxValue?: number;
}

export class GridLineObject<T> implements IGridLineObject<T> {

    private _value: any;
    private _metaDataProps: T;

    constructor(value: any, metaDataProps: T) {
        this._value = value;
        this._metaDataProps = metaDataProps;
    }

    get value(): any { return this._value; }

    get metaData(): T { return this._metaDataProps; }

}

export class  MaxValuedGridLineObject<T> extends GridLineObject<T> {

    private _maxValue: number;

    constructor(
        value: any,
        metaDataProps: T,
        maxValue: number
    ) {

        super(value, metaDataProps);
        this._maxValue = maxValue;
    }

    get maxValue() { return this._maxValue; }
}



