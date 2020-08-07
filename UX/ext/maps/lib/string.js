(function(global, undefined) {
    "use strict";

    /*
    Usage:
    var foo = "String with params {0} and {1}";
    foo.format("val1", "val2");

    var bar = "String with parameters {one} and {two}"
    bar.format({one: "val1", two: "val2"});
    */
    if (!global.String.prototype.format) {
        global.String.prototype.format = function() {
            var name, args = arguments;
            if (args && args.length === 1 && args[0] && typeof args[0] === "object") {
                args = args[0];
                return this.replace(/\{[_a-zA-Z\d]+\}/g, function(match, number) {
                    name = match.substring(1, match.length - 1);
                    return args.hasOwnProperty(name) ? args[name] : match;
                });
            }
            return this.replace(/\{(\d+)\}/g, function(match, number) {
                return args[number] !== undefined ? args[number] : match;
            });
        };
    }
})(this);
