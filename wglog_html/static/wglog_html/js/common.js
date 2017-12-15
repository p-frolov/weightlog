var app = {
    currentUser: undefined
};


/**
 * User model
 * @param {Object} data - user fields
 * @constructor
 */
function User(data) {
    this.id = ko.observable(data.id);
    this.username = ko.observable(data.username);
    this.firt_name = ko.observable(data.firt_name);
    this.last_name = ko.observable(data.last_name);
    this.email = ko.observable(data.email);
}

/**
 * Training model
 * @param data
 * @constructor
 */
function Training(data) {
    this.id = ko.observable(data.id);
    this.name = ko.observable(data.name);
    this.date = ko.observable(data.date);
}

/**
 * Set model
 * @param data
 * @constructor
 */
function Set(data) {
    this.id = ko.observable(data.id);
    this.training_id = ko.observable(data.training_id);
    this.weight = ko.observable(data.weight);
    this.reps = ko.observable(data.reps);
    this.created_at = ko.observable(data.created_at);
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
            if (settings.type == 'POST' || settings.type == 'PUT' || settings.type == 'DELETE') {
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

    client.trainings.add('sets');
    // client.trainings.sets.read(39)

    client.add('sets');
    // see: trainings

    client.add('users');
    // rest_client.users.read('me')

    $.wgclient = client;
}
