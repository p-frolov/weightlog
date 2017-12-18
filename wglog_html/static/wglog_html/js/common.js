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

    self._utc_date = ko.observable(
        (data.date !== undefined)
            ? moment.utc(data.date)
            : moment.utc()
    );

    self.id = (data.id !== undefined)
        ? ko.observable(data.id)
        : ko.observable();

    self.name = ko.observable(data.name);
    self.sets = ko.observableArray();

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

    self.weight = ko.observable(data.weight);
    self.reps = ko.observable(data.reps);

    self.total_weight = ko.computed(function () {
        return self.weight() * self.reps();
    });

    self.id = ko.observable(data.id);
    self.training_id = ko.observable(data.training_id);
    self.created_at = ko.observable(data.created_at);
    
    self.getSummary = _.bind(function () {
        return self.weight() + ' x' + self.reps();
    });
}

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
    // see: trainings

    client.add('users');
    // rest_client.users.read('me')

    $.wgclient = client;
}
