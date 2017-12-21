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

    self.currentWeight = ko.observable(35).extend({ intCounter: {min:1, max: 600, step: 5} });
    self.currentReps = ko.observable(10).extend({ intCounter: {min: 1, max: 999}});

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


/**
 * LOAD DATA
 */

var dataDeferred = {
    currentUser: $.wgclient.users.read('me'),
    startedTrainings: $.wgclient.trainings.read({status:'st'}),
    trainingNames: $.wgclient.trainingnames.read()
};

var $dataLoaded = $.when(
    dataDeferred.currentUser,
    dataDeferred.startedTrainings,
    dataDeferred.trainingNames
);

/**
 * INIT DATA
  */

dataDeferred.currentUser.done(function (data) {
    pageModel.currentUser(new User(data));
});

dataDeferred.trainingNames.done(function (data) {
    // todo: validation (check on list of strings)
    pageModel.trainingNames = data;
});

dataDeferred.startedTrainings.done(function (data) {
    var trainings = pageModel.startedTrainings();
    _.each(data, function (training_json) {
        trainings.push( new Training(training_json) );
    });
    pageModel.startedTrainings(trainings);
});


var $dataInitialized = (function () {
    var dfd = $.Deferred();
    $.when($dataLoaded).done(function () {
        dfd.resolve();
    }).fail(dfd.reject);
    return dfd.promise();
})();

// todo: http://knockoutjs.com/documentation/asynchronous-error-handling.html
// ko.onError = function(error) {
//     myLogger("knockout error", error);
// };

/**
 * START APP
 */

$.when(
    $dataInitialized,
    $(document).ready
).then(function () {
    ko.applyBindings(pageModel);
});
