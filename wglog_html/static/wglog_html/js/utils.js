/**
 * Add prefix for all element of array
 *
 * @requires _
 *
 * @param prefix {String}
 * @param array {Array}
 */
function prefixAll(prefix, array) {
    return _(array).map(function (s) { return prefix + s })
}

/**
 * Chain execution of function for each items
 *
 * @example
 * selectors = ['.js-weight', '.js-reps', '.js-add-btn']
 * chainEach(selectors, function (s) {
 *     return $(s).effect('highlight', {color: 'yellow'}, 'slow').promise();
 * });
 *
 * @requires _
 * @requires $
 *
 * @param async {function} - must returns deferred object
 * @param items {Array} - each item will be passed to async function
 */
function chainEach(items, async) {
    if ( !_.isArray(items) || !items.length) {
        return;
    }
    if (typeof(async) !== 'function') {
        return;
    }
    var r = function ($def, rest_items) {
        if ( !rest_items.length ) {
            return;
        }
        $.when($def).done(function () {
            var _items = _(rest_items);
            r(async(_items.first()), _items.rest());
        });
    };
    r(async(_.first(items)), _.rest(items));
}