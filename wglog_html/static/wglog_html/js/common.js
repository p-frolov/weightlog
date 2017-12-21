// todo: http://knockoutjs.com/documentation/component-registration.html

/**
 * User model
 * @param {Object} data - user fields
 * @constructor
 */
function User(data) {
    var self = this;
    self.id = ko.observable(data.id);
    self.username = ko.observable(data.username);
    self.firt_name = ko.observable(data.firt_name);
    self.last_name = ko.observable(data.last_name);
    self.email = ko.observable(data.email);
}

/**
 * Training model
 * @param data
 * @constructor
 */
function Training(data) {
    var self = this;

    // todo: validation (name: required)

    if(data === undefined) {
        data = {};
    }

    self.id = ko.observable(data.id);

    self.name = ko.observable(data.name);
    self.sets = ko.observableArray([]);


    // todo: utcDate extender
    self._utc_date = ko.observable(moment.utc(data.date));
    self.date = ko.computed(function() {
        // todo: localization: https://momentjs.com/docs/#/displaying/format/
        return self._utc_date().clone().local().format('DD/MM/YY');
    });

    // todo: investigate: http://knockoutjs.com/documentation/computed-pure.html
    self.total_weight = ko.computed(function () {
        return _.reduce(self.sets(), function (memo, set) {
            return memo + set.total_weight();
        }, 0);
    });

    self.sets_short_summary = ko.computed(function () {
        var firstSet = _.first(self.sets());
        if (firstSet !== undefined) {
            return firstSet.getSummary();
        }
        return 'no sets';  //todo: i18n
    });

    self.sets_summary = ko.computed({
        read: function () {
            var summaries = [];
            _.each(self.sets(), function (set) {
                summaries.push(set.getSummary());
            });
            return summaries.join('\n');
        },
        deferEvaluation: true
    });

    _.each(data.sets, function (set_json) {
        self.sets.push(new Set(set_json))
    });
}

/**
 * Set model
 * @param data
 * @constructor
 */
function Set(data) {
    var self = this;

    if(data === undefined) {
        data = {};
    }

    self.id = ko.observable(data.id);

    // todo: apply utcDate extender
    self.started_at = ko.observable(data.started_at);
    self.stopped_at = ko.observable(data.stopped_at);

    self.weight = ko.observable(data.weight);
    self.reps = ko.observable(data.reps);

    self.total_weight = ko.computed(function () {
        return self.weight() * self.reps();
    });

    self.training = ko.observable(data.training);

    self.getSummary = _.bind(function () {
        return self.weight() + ' x' + self.reps();
    });
}

ko.extenders.intCounter = function(target, options) {
    var options = _.extendOwn({
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

            if (options.max !== undefined && newValue > options.max) {
                valueToWrite = options.max;
            }
            if (options.min !== undefined && newValue < options.min) {
                valueToWrite = options.min;
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
        var nextValue = value + options.step;
        if (options.max === undefined || nextValue <= options.max) {
            result(nextValue);
        }
    };

    result.decrease = function () {
        var nextValue = result() - options.step;
        if (options.min === undefined || nextValue >= options.min) {
            result(nextValue);
        }
    };
    result(target());
    return result;
};

/**
 * Creates global rest client $.wgclient
 * https://github.com/jpillora/jquery.rest
 */
function initRestClient() {

    // https://docs.djangoproject.com/en/dev/ref/csrf/#ajax
    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = $.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // https://gist.github.com/alanhamlett/6316427
    var ajaxOption = {
        beforeSend: function(xhr, settings) {
            if (settings.type === 'POST' || settings.type === 'PUT' || settings.type === 'DELETE') {
                if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
                    // Only send the token to relative URLs i.e. locally.
                    xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
                }
            }
        }
    };

    var client = new $.RestClient('/api/rest/', {"ajax": ajaxOption});

    client.add('trainings');
    // client.trainings.read()
    // client.trainings.read(39)
    // client.trainings.create({'name': 'test'})
    // client.trainings.update(41, {'name': 'changed'})
    // client.trainings.del(41)

    client.add('trainingnames');

    client.trainings.add('sets');
    // client.trainings.sets.read(39)

    client.add('sets');
    // client.sets.create({'training': 40, 'name': 'test'})
    // client.sets.update(41, {'training': 40, 'name': 'changed'})
    // client.sets.del(41)

    client.add('users');
    // rest_client.users.read('me')

    $.wgclient = client;
}
