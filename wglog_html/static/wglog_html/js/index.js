/**
 * Script for index page
 */

initRestClient();

var TrainingPageModel = function () {
    var self = this;

    self.currentUser = ko.observable();
    self.startedTrainings = ko.observableArray();
    self.currentTraining = ko.observable();

    self.trainingNames = ko.observableArray(['жим', 'тяга', 'присед']);
    self.selectedTrainingName = ko.observable();

    self.startTraining = function () {
        training = new Training({
            name: self.selectedTrainingName()
        });
        self.startedTrainings.push(training);
        self.currentTraining(training);
    };

    self.continueTraining = function (training) {
        self.currentTraining(training);
    };

    self.pauseTraining = function () {
        self.currentTraining(undefined);
    };

    self.finishTraining = function () {
        self.startedTrainings.remove(
            self.currentTraining()
        );
        self.currentTraining(undefined);
    }

    self.removeTraining = function (training) {
        if (confirm('Удалить "' + training.name() + '" от ' + training.date() + '"?')) {
            self.startedTrainings.remove(training);
        }
    };
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
