/**
 * Script for trainings page
 */

initRestClient();

var TrainingListPageModel = function (appSettings, userSettings) {
    var self = this;

    self.currentUser = ko.observable();
    self.settings = new Settings(userSettings);
    self.trainings = ko.observableArray();
    self.contextHelp = function () {};

};

var $currentUserDeferred = $.wgclient.users.read('me');
var $trainingListDeferred = $.wgclient.trainings.read();

var pageModel = new TrainingListPageModel(
    getAppSettings(),
    getUserSettings()
);

$currentUserDeferred.done(function (userData) {
    pageModel.currentUser = new User(userData);
});

$trainingListDeferred.done(function (trainingDataArray) {
    _.each(trainingDataArray, function (trainingData) {
        pageModel.trainings.push(
            new Training(trainingData)
        );
    });
});

$.when(
    $currentUserDeferred,
    $trainingListDeferred,
    $(document).ready
).then(function () {
    ko.applyBindings(pageModel);
});
