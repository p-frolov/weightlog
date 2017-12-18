/**
 * Script for index page
 */

initRestClient();

var TrainingPageModel = function () {
    var self = this;

    self.currentUser = ko.observable();

    // TRAININGS

    self.startedTrainings = ko.observableArray();

    self.currentTraining = ko.observable();

    self.trainingNames = ko.observableArray();
    self.selectedTrainingName = ko.observable();

    self.startTraining = function () {
        if (!self.selectedTrainingName()) {
            alert("Выберите название тренировки.");
            return;
        }
        var training = new Training({
            name: self.selectedTrainingName()
        });
        self.startedTrainings.push(training);
        self.currentTraining(training);
        // todo: add training name
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
    };

    self.removeTraining = function (training) {
        if (confirm('Удалить "' + training.name() + '" от ' + training.date() + '"?')) {
            self.startedTrainings.remove(training);
        }
    };

    // SETS

    self.currentWeight = ko.intObservable(35, {min:1, max: 600, step: 5});
    self.currentReps = ko.intObservable(10, {min: 1, max: 999});

    self.addSet = function () {
        self.currentTraining().sets.unshift(
            new Set({weight: self.currentWeight(), reps: self.currentReps()})
        );
    };

    self.removeSet = function (set) {
        if (confirm('Удалить подход: "' + set.getSummary() + '"?')) {
            self.currentTraining().sets.remove(set);
        }
    };
};

var pageModel = new TrainingPageModel();

var $currentUserDeferred = $.wgclient.users.read('me');
var $startedTrainingsDeferred = $.wgclient.trainings.read({status:'st'});
var $trainingNamesDeferred = $.wgclient.trainingnames.read();

$currentUserDeferred.done(function (data) {
    pageModel.currentUser(new User(data));
});

$trainingNamesDeferred.done(function (data) {
    pageModel.trainingNames = data;
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
    $trainingNamesDeferred,
    $startedTrainingsDeferred,
    $(document).ready
).then(function () {
    ko.applyBindings(pageModel);
});
