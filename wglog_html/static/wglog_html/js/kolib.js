/**
 * Validates and increases/decreases value in accordance with options.
 *
 * @example
 *
 * currentWeight = ko.observable(35).extend({ intCounter: {min:1, max: 600, step: 5} });
 * data-bind="value: currentWeight"
 * data-bind="click: currentWeight.increase"
 * data-bind="click: currentWeight.decrease"
 *
 * @param target {ko.observable}
 * @param options {Object} - min, max, step
 */
ko.extenders.intCounter = function(target, options) {
    var opt = _.extendOwn({
        min: undefined,
        max: undefined,
        step: 1
    }, options);

    var result = ko.pureComputed({
        read: target,
        write: function (newValue) {
            var current = target(),
                valueToWrite;

            if (typeof(newValue) === 'string') {
                valueToWrite = parseInt(newValue.replace( /\D+/g, ''), 10);
            } else if (isNaN(newValue)) {
                valueToWrite = 0;
            } else {
                valueToWrite = parseInt(newValue);
            }

            if (opt.max !== undefined && newValue > opt.max) {
                valueToWrite = opt.max;
            }
            if (opt.min !== undefined && newValue < opt.min) {
                valueToWrite = opt.min;
            }

            if (valueToWrite !== current) {
                target(valueToWrite);
            } else if (newValue !== current) {
                target.notifySubscribers(valueToWrite)
            }
        }
    }).extend({notify: 'always'});

    // todo: up to max if interval less than step (also for min)
    result.increase = function () {
        var value = result();
        var nextValue = value + opt.step;
        if (opt.max === undefined || nextValue <= opt.max) {
            result(nextValue);
        }
    };

    result.decrease = function () {
        var nextValue = result() - opt.step;
        if (opt.min === undefined || nextValue >= opt.min) {
            result(nextValue);
        }
    };
    result(target());
    return result;
};

/**
 * Formatted local datetime.
 *
 * Requires to set only utc datetime.
 * In addition, extender stores utc datetime.
 *
 * @example
 * a = ko.observable('2017-12-21T12:11:38Z').extend({datetime: {format: 'L LT'}})
 * // or ko.observable(moment.utc()).extend({datetime: {format: 'L LT'}})
 * a() // "21.12.2017 16:11"
 * a.utcdata() // "2017-12-21T12:11:38Z"
 *
 * a = ko.observable().extend({datetime: {format: 'L LT'}})
 * a() // ""
 * a.utcdata() // null
 *
 * a(moment.utc())
 * a(undefined)
 * a(null)
 *
 * @requires moment
 * @param target {ko.observable}
 * @param options {Object} - format
 */
ko.extenders.datetime = function (target, options) {
    var logger = Logger.get('kolib.datetime');

    var opt = _.extendOwn({
        format: 'L LT' // date time
    }, options);

    var result = ko.pureComputed({
        read: target,
        write: function (newValue) {
            var current = target();

            var utcDatetime;
            var valueToWrite;

            if (newValue === undefined || newValue === null) {
                utcDatetime = null;
                valueToWrite = '';
            }
            else {
                // todo: handle error
                utcDatetime = moment.isMoment(newValue)
                    ? newValue
                    : moment.utc(newValue);

                if ( !utcDatetime.isUtc() ) {
                    logger.error('Not valid utc datetime', utcDatetime);
                    // parsing error - prevent write
                    return;
                }
                valueToWrite = utcDatetime.clone().local().format(opt.format);
            }

            result._utcDatetime = utcDatetime;
            if (valueToWrite !== current) {
                target(valueToWrite);
            } else if (newValue !== current) {
                target.notifySubscribers(valueToWrite)
            }
        }
    }).extend({notify: 'always'});

    /**
     * @returns {string|null} - UTC ISO string or null
     */
    result.utcdata = function () {
        if (result._utcDatetime === null) {
            return null;
        }
        return result._utcDatetime.format();
    };

    result(target());
    return result;
};

/**
 * Timer shows past time from datetime.
 *
 * pastTime format:
 * < a min: mm
 * a min - a day: HH:mm
 * > a day: d. HH:mm (d - days)
 *
 * @requires datetime extender
 *
 * @example
 * a = ko.observable().extend({datetime: null, chronograph: null})
 * //
 * a.pastTime.subscribe(function(value) {console.log(value)})
 * a.watch()
 * a(moment.utc().format())
 * // console: "01", "02" ...
 * a.pastTime() // "05"
 * a.stop()
 * // console: "00:00"
 * a.pastTime() // "00:00"
 *
 * @param target {ko.observable}
 * @param options {Object} - empty: string for null time value,
 *                         - format: 'human' - ss | HH:mm | d.HH:mm
 *                         - format: 'nonzero' - ss | mm:ss | HH:mm:ss | d.HH:mm
 * @returns {ko.observable}
 */
ko.extenders.chronograph = function (target, options) {
    var logger = Logger.get('kolib.chronograph');

    // todo: autostart when set
    var opt = _.extendOwn({
        empty: '00:00',
        format: 'human'
    }, options);

    if (!_(['human', 'nonzero']).contains(opt.format)) {
        logger.error('format must be "human" or "nonzero"');
        return;
    }

    if (!_.has(target, '_utcDatetime')) {
        // todo: handle error
        logger.error('chronograph must be applied to datetime extender');
        return;
    }

    target.pastTime = ko.observable(opt.empty);

    var padZero = function(v) { return ((v < 10) ? '0' : '') + v; };

    /**
     * @param start - utc moment or null
     */
    target._pastFrom = function (start) {
        if (start === null) {
            // todo: auto stop
            return opt.empty;
        }

        var now = moment.utc();
        if (now.isBefore(start)) {
            // todo: handle error
            logger.error('pastFrom value can not be from future');
            // todo: auto stop
            return opt.empty;
        }

        var time_text = opt.empty;
        if (opt.format === 'human') {
            time_text = timeDiffHumanFormat(start, now);
        } else if (opt.format === 'nonzero') {
            time_text = timeDiffNonzeroFormat(start, now);
        }
        return time_text;
    };

    var timer = 0;
    /**
     * Stops watching
     */
    target.stop = function () {
        window.clearInterval(timer);
        target.pastTime(opt.empty);
        logger.debug('timer stopped', target());
    };
    /**
     * Starts watching
     *
     * @param is_watch {Boolean} - stop if false otherwise - start watching
     */
    target.watch = function (is_watch) {
        if (is_watch === false) {
            target.stop();
            return;
        }
        timer = window.setInterval(function() {
            // ko prevents events with the same value
            target.pastTime(target._pastFrom(target._utcDatetime));
        }, 1000);
        target.pastTime(target._pastFrom(target._utcDatetime));
        logger.debug('timer started', target());
    };

    return target;
};
