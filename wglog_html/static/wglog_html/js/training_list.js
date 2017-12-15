/**
 * Script for trainings page
 */

initRestClient();

_.extend(app, {
    trainings: []
});

var TrainingListPageModel = function (app) {
    this.username = ko.observable(app.currentUser.username());
    this.trainings = ko.observableArray(app.trainings);
};

var $currentUserDeferred = $.wgclient.users.read('me');
var $trainingListDeferred = $.wgclient.trainings.read();

$currentUserDeferred.done(function (data) {
    app.currentUser = new User(data);
});

$trainingListDeferred.done(function (data) {
    app.trainings = _.map(data, function (training_json) {
        return new Training(training_json);
    });
});

$.when(
    $currentUserDeferred,
    $trainingListDeferred,
    $(document).ready
).then(function () {
    console.log('data has been loaded');
    console.log(app.currentUser);
    console.log(app.trainings);
    console.log('dom ready');
    ko.applyBindings(new TrainingListPageModel(app));
});
