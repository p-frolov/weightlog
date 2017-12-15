/**
 * Script for index page
 */

initRestClient();

var TrainingPageModel = function () {
    this.currentUser = ko.observable();
    this.startedTrainings = ko.observableArray();
    this.currentTraining = ko.observable();
    // this.currentSets = ko.observableArray();
};

var pageModel = new TrainingPageModel();

var $currentUserDeferred = $.wgclient.users.read('me');
var $startedTrainingsDeferred = $.wgclient.trainings.read({status:'st'});

$currentUserDeferred.done(function (data) {
    pageModel.currentUser(new User(data));
});

$startedTrainingsDeferred.done(function (data) {
    _.each(data, function (training_json) {
        pageModel.startedTrainings.push(
            new Training(training_json)
        );
    });
});

$.when(
    $currentUserDeferred,
    $startedTrainingsDeferred,
    $(document).ready
).then(function () {
    ko.applyBindings(pageModel);
});
