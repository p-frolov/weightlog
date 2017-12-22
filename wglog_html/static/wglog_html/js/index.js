/**
 * Script for index page
 */

initLocale();
initRestClient();

var TrainingPageModel = function () {
    var self = this;

    self.currentUser = ko.observable();

    // TRAININGS

    // todo: extract current training as a component

    self.startedTrainings = ko.observableArray();

    self.currentTraining = ko.observable();

    self.trainingNames = ko.observableArray();
    self.selectedTrainingName = ko.observable();
    self.currentTrainingPastTimer = ko.observable().extend({
        datetime: null,
        chronograph: null
    });

    self.currentSetPastTimer = ko.observable().extend({
        datetime: null,
        chronograph: {format: 'nonzero'}
    });

    self._setCurrentTraining = function (training) {
        if(training === null) {
            self.currentTraining(undefined);
            self.currentTrainingPastTimer(null);
            self.currentTrainingPastTimer.stop();
            return;
        }
        self.currentTrainingPastTimer(training.date.utcdata());
        self.currentTrainingPastTimer.watch();
        self.currentTraining(training);
    };

    self.startTraining = function () {
        if (!self.selectedTrainingName()) {
            $(".js-new-training-block .js-name").effect('highlight', {color: '#fbd850'}, 'slow');
            return;
        }
        var training = new Training({
            name: self.selectedTrainingName(),
            date: moment.utc().format()
        });
        self.startedTrainings.push(training);
        self._setCurrentTraining(training);
        self.selectedTrainingName(undefined);
    };

    self.continueTraining = function (training) {
        self._setCurrentTraining(training);
    };

    self.pauseTraining = function () {
        self._setCurrentTraining(null);
    };

    self.finishTraining = function () {
        self.startedTrainings.remove(
            self.currentTraining()
        );
        self._setCurrentTraining(null);
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

    self.startSet = function () {
        var player = document.getElementById('start_set_player');
        player.volume = 0.3;
        player.currentTime = 0;
        self.currentSetPastTimer(moment.utc().format());
        self.currentSetPastTimer.watch();
        player.play();
    }
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
