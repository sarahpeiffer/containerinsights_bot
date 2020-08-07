
/**
 * Allows the use of Array.find which is not available in IE
 * @export
 */
export function polyfillArrayFind() {
    Array.prototype.find = Array.prototype.find || function (callback, thisObject) {
        if (this === null) {
            throw 'find called on null or undefined';
        } else if (typeof callback !== 'function') {
            throw 'callback not a function';
        }

        if (!this.length ||
            (Number(this.length) !== this.length) ||
            (this.length < 0) ||
            (this.length % 1 !== 0)) {
            throw 'length is not a positive integer number';
        }

        for (let i = 0; i < this.length; i++) {
            let element = this[i];
            if (callback.call(thisObject, element, i, this)) {
                return element;
            }
        }

        return undefined;
    };
};
