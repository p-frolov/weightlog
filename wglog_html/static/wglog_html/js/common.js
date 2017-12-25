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

function Settings(data) {
    var self = this;
    // todo: validate settings

    var defaults = {
        set: {
            type: 'by_stop',
            weight: 35,
            reps: 10
        },
        lang: 'ru' // todo: detect locale
    };

    $.extend(true, defaults, data);

    self.set = {
        // by_stop | by_start
        type: ko.observable(defaults.set.type),
        weight: ko.observable(defaults.set.weight),
        reps: ko.observable(defaults.set.reps)
    };
    self.set.is_by_start = ko.computed(function () {
        return this.set.type() === 'by_start';
    }, self);
    self.set.is_by_stop = ko.computed(function () {
        return this.set.type() === 'by_stop';
    }, self);

    self.lang = ko.observable();
    self.lang.subscribe(function (newValue) {
        moment.locale(newValue);
    });
    self.lang(defaults.lang);
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


    self.date = ko.observable(data.date).extend({
        datetime: {format: 'L'},
        chronograph: null
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
            return summaries.join(', ');
        },
        deferEvaluation: true
    });

    var sorted_sets = _.sortBy(data.sets, function (set_json) {
        return -set_json.id
    });
    _.each(sorted_sets, function (set_json) {
        self.sets.push(new Set(set_json))
    });
}

/**
 * Set model
 * @param data
 * @constructor
 */
var Set = function (data) {
    var self = this;

    if(data === undefined) {
        data = {};
    }

    self.id = ko.observable(data.id);

    self.started_at = ko.observable(data.started_at).extend({
        datetime: {format: 'LTS'},
        chronograph: {format: 'nonzero'}
    });
    self.stopped_at = ko.observable(data.stopped_at).extend({
        datetime: {format: 'LTS'}
    });
    self.duration = ko.computed(function () {
        if (self.started_at() && self.stopped_at()) {
            return timeDiffNonzeroFormat(
                self.started_at._utcDatetime,
                self.stopped_at._utcDatetime
            );
        }
        return '';
    });

    self.weight = ko.observable(data.weight).extend({
        intCounter: {min:1, max: 600, step: 5}
    });
    self.reps = ko.observable(data.reps).extend({
        intCounter: {min: 1, max: 999}
    });

    self.total_weight = ko.computed(function () {
        return self.weight() * self.reps();
    });

    self.training = ko.observable(data.training);
};

Set.prototype.getSummary = function () {
    return this.weight() + ' x' + this.reps();
};

/**
 * @param set {Set}
 */
Set.prototype.fillBySet = function (set) {
    this.weight(set.weight());
    this.reps(set.reps());
    // this.training(set.training());
};

/**
 * @param settings {Settings}
 * @returns {Set}
 */
Set.createBySettings = function(settings) {
    return new Set({
        weight: settings.set.weight(),
        reps: settings.set.reps()
    });
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
