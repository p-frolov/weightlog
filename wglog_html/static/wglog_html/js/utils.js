/**
 * Add prefix for all element of array
 *
 * @requires underscore
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
 * @requires underscore
 * @requires jquery
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

/**
 * Convenient human format time for UI.
 *
 * Shows days, hours, minutes, seconds
 * < a min: ss
 * a min - a day: HH:mm
 * > a day: d.HH:mm
 *
 * @requires moment
 * @requires js-logger
 *
 * @param start {moment}
 * @param stop {moment}
 */
function timeDiffHumanFormat(start, stop) {
    var logger = Logger.get('utils.timeDiffHumanFormat');

    if (stop.isBefore(start)) {
        logger.error('stop before start');
        return '';
    }

    var padZero = function(v) { return ((v < 10) ? '0' : '') + v; };
    var d = moment.duration(stop.diff(start));

    if (d.asDays() > 1) {
        return parseInt(d.asDays()) + "." + padZero(d.hours()) + ':' + padZero(d.minutes());
    }
    else if (d.asMinutes() > 1) {
        return padZero(d.hours()) + ':' + padZero(d.minutes());
    }
    else {
        return padZero(d.seconds());
    }
}

/**
 * Convenient for UI time format.
 *
 * < a min: ss
 * a min - a hour: mm:ss
 * a hour - a day: HH:mm:ss
 * > a day: d.HH:mm
 *
 * @requires moment
 * @requires underscore
 * @requires js-logger
 *
 * @param start {moment}
 * @param stop {moment}
 */
function timeDiffNonzeroFormat(start, stop) {
    var logger = Logger.get('utils.timeDiffNonzeroFormat');

    if (stop.isBefore(start)) {
        logger.error('stop before start');
        return '';
    }

    var padZero = function(v) { return ((v < 10) ? '0' : '') + v; };
    var d = moment.duration(stop.diff(start));

    if (d.asDays() > 1) {
        return parseInt(d.asDays()) + "." + _([d.hours(), d.minutes()]).map(padZero).join(':');
    }
    else if (d.asHours() > 1) {
        return _([d.hours(), d.minutes(), d.seconds()]).map(padZero).join(':');
    }
    else if (d.asMinutes() > 1) {
        return _([d.minutes(), d.seconds()]).map(padZero).join(':');
    }
    else {
        return padZero(d.seconds());
    }
}

/**
 * Each reversed
 *
 * @param arr
 * @param callback
 */
function eachReversed(arr, callback) {
    // todo: validation: assert

    // todo: test on unexpected behaviour, see each of underscore and jquery
    for (var i = arr.length - 1; i >= 0; --i) {
        callback(arr[i]);
    }
}

// todo: implement and use asserts
function assert(condition, message)
{
  if (!condition) {
    throw "Assertion failed! See stack trace for details";
  }
}
