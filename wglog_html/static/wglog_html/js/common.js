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
    // todo: hide for security reason
    self.email = ko.observable(data.email);
}

function Settings(userSettings) {
    var self = this;

    // todo: validate settings
    // todo: detect locale
    $.extend(self, ko.mapping.fromJS(userSettings));

    self.is_set_by_start = ko.pureComputed(function () {
        return this.set_type() === 'by_start';
    }, self);
    self.is_set_by_stop = ko.pureComputed(function () {
        return this.set_type() === 'by_stop';
    }, self);

    // todo: extract to app
    self.lang.subscribe(function (newValue) {
        moment.locale(newValue);
    });

    self._keys = ['set_type', 'set_weight', 'set_reps', 'lang'];
    self._initValues = {};

    self.cleanChanges = function (keys) {
        if (_.isArray(keys)) {
            // todo: additional checking keys
            _.extend(self._initValues, ko.toJS(_.pick(self, keys)));
        } else {
            self._initValues = ko.toJS(_.pick(self, self._keys));
        }
    };
    self.cleanChanges();

    var fillChanged = function (object, key, value) {
        if (self._initValues[key] !== value) {
            object[key] = value;
        }
    };

    self.changedSettings = ko.pureComputed(function () {
        var changes = {};
        // need to explicitly call properties for subscription
        fillChanged(changes, 'set_type', self.set_type());
        fillChanged(changes, 'set_weight', self.set_weight());
        fillChanged(changes, 'set_reps', self.set_reps());
        fillChanged(changes, 'lang', self.lang());
        return changes;
    });
}

State = {
    SYNCED: 'synced',  // synchronized with server
    PROCESSING: 'processing',  // synchronization in progress
    CREATE: 'create',  // need to create
    // UPDATE: 'update',  // need to update
    DELETE: 'delete'   // need to delete
};

/**
 * Set model
 * @param data
 * @constructor
 */
Set = function (data) {
    var self = this;

    if(data === undefined) {
        data = {};
    }

    // for saving process: synced|processing|create|update|delete
    self._state = ko.observable();

    self.id = ko.observable(data.id);

    self.started_at = ko.observable(data.started_at).extend({
        datetime: {format: 'LTS'},
        chronograph: {format: 'nonzero'}
    });
    self.stopped_at = ko.observable(data.stopped_at).extend({
        datetime: {format: 'LTS'}
    });
    self.duration = ko.pureComputed(function () {
        if (self.started_at() && self.stopped_at()) {
            return timeDiffNonzeroFormat(
                self.started_at._utcDatetime,
                self.stopped_at._utcDatetime
            );
        }
        return '';
    });

    self.weight = ko.observable(data.weight).extend({
        // todo: init from app settings
        intCounter: {min:1, max: 600, step: 5}
    });
    self.reps = ko.observable(data.reps).extend({
        // todo: init from app settings
        intCounter: {min: 1, max: 999}
    });

    self.total_weight = ko.pureComputed(function () {
        return self.weight() * self.reps();
    });

    self.training = ko.observable(data.training);
};

Set.prototype.toJS = function () {
    var data = ko.toJS(_.pick(this, 'training', 'weight', 'reps'));
    data['started_at'] = this.started_at.utcdata();
    data['stopped_at'] = this.stopped_at.utcdata();
    return data;
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
        weight: settings.set_weight(),
        reps: settings.set_reps()
    });
};

/** All objects, copies from all Trainings */
Set.all = ko.observableArray();

Set.creating = ko.computed(function () {
    return ko.utils.arrayFilter(Set.all(), function (set) {
        return set._state() === State.CREATE;
    });
});

Set.deleting = ko.computed(function () {
    return ko.utils.arrayFilter(Set.all(), function (set) {
        return set._state() === State.DELETE;
    });
});

// Set.addToAll = function (sets) {
//     var all_sets = Set.all();
//     Array.prototype.push.apply(all_sets, sets);
//     Set.all(all_sets);
// };


/**
 * Training model
 * @param data
 * @constructor
 */
Training = function (data) {
    var self = this;

    // todo: validation (name: required)

    if (data === undefined) {
        data = {};
    }

    // for saving process: synced|processing|create|update|delete
    self._state = ko.observable();

    self.id = ko.observable(data.id);

    self.name = ko.observable(data.name);
    self.status = ko.observable(
        data.status !== undefined ? data.status : Training.STARTED
    );
    self.sets = ko.observableArray([]);


    self.date = ko.observable(data.date).extend({
        datetime: {format: 'L'},
        chronograph: null
    });

    self.total_weight = ko.pureComputed(function () {
        return _.reduce(self.sets(), function (memo, set) {
            return memo + set.total_weight();
        }, 0);
    });

    self.sets_summary = ko.pureComputed(function () {
        var sets = self.sets();
        var _sets = _(sets);
        if (sets. length > 2) {
            return [_sets.first().getSummary(), '...', _sets.last().getSummary()].join(', ');
        }
        if (sets.length === 2) {
            return [_sets.first().getSummary(), _sets.last().getSummary()].join(', ');
        }
        if (sets.length === 1) {
            return _sets.first().getSummary();
        }
        return '';
    });

    self.sets_full_summary = ko.pureComputed({
        read: function () {
            var summaries = [];
            _.each(self.sets(), function (set) {
                summaries.push(set.getSummary());
            });
            return summaries.join(', ');
        },
        deferEvaluation: true
    });

    self.sets(_.map(data.sets, function (set_json) {
        return new Set(set_json);
    }));
};

Training.prototype.toJS = function () {
    var data = ko.toJS(_.pick(this, 'name', 'status'));
    data['date'] = this.date.utcdata();
    return data;
};

Training.prototype.addSet = function (set) {
    set.training(this.id());
    this.sets.push(set);
    Set.all.push(set);
    set._state(State.CREATE)
    // todo: subscribe to changes
};

Training.prototype.removeSet = function (set) {
    this.sets.remove(set);
    set._state(State.DELETE);
};

Training.all = ko.observableArray();

Training.creating = ko.computed(function () {
    return ko.utils.arrayFilter(Training.all(), function (training) {
        return training._state() === State.CREATE;
    });
});

Training.deleting = ko.computed(function () {
    return ko.utils.arrayFilter(Training.all(), function (training) {
        return training._state() === State.DELETE;
    });
});

Training.STARTED = 'st';
Training.FINISHED = 'fn';

Training.initAll = function(trainingDataArray) {
    var trainings = [];
    _.each(trainingDataArray, function (trainingData) {
        trainings.push( new Training(trainingData) );
    });
    _.each(trainings, function (t) { t._state(State.SYNCED) });
    Training.all(trainings);
    var sets = _.flatten(
        _.map(trainings, function (training) { return training.sets() })
    );
    _.each(sets, function (s) { s._state(State.SYNCED) });
    Set.all(sets);
};

Training.create = function(trainingData) {
    var training = new Training(trainingData);
    Training.all.push(training);
    training._state(State.CREATE);
    // todo: subscribe to changes
    return training;
};

Training.remove = function (training) {
    training._state(State.DELETE);
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
    var ajaxOptions = {
        beforeSend: function(xhr, settings) {
            if (settings.type === 'POST' || settings.type === 'PUT' || settings.type === 'DELETE') {
                if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
                    // Only send the token to relative URLs i.e. locally.
                    xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
                }
            }
        }
    };

    var client = new $.RestClient('/api/rest/', {'ajax': ajaxOptions});

    var syncAjaxOptions = $.extend({async: false}, ajaxOptions);

    /** Synchronous request */
    client.add('appsettings', {'ajax': syncAjaxOptions});
    /** Synchronous request */
    client.add('settings', {'ajax': syncAjaxOptions});

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

/**
 * Requests user settings synchronously
 * @returns {object}
 */
function getUserSettings() {
    var userSettings;
    // todo: handle errors
    $.wgclient.settings.read().done(function (data) {
        userSettings = data;
    });
    return userSettings
}

/**
 * Requests app settings synchronously
 * @returns {object}
 */
function getAppSettings() {
    var appSettings;
    // todo: handle errors
    $.wgclient.appsettings.read().done(function (data) {
        appSettings = data;
    });
    return appSettings;
}