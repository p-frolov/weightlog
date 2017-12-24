/**
 * Script for index page
 */

initRestClient();

var TrainingPageModel = function () {
    var self = this;

    self.currentUser = ko.observable();

    //region SETTINGS

    self.settings = new Settings({set: {type: 'by_start'}});
    self.settingsShown = ko.observable(false);
    self.langs = ko.observableArray([
        {value: 'ru', text: 'RU'},
        {value: 'en', text: 'EN'}
    ]);
    self.setTypes = ko.observableArray([
        {value: 'by_stop', text: 'По окончанию'},
        {value: 'by_start', text: 'Со стартом'}
    ]);

    //endregion

    //region CURRENT TRAINING

    // todo: extract current training as a component
    self.currentTraining = ko.observable();

    self.trainingNames = ko.observableArray();
    self.selectedTrainingName = ko.observable();

    self.startTraining = function () {
        if (!self.selectedTrainingName()) {
            self._highlight('.js-new-training-block .js-name');
            return;
        }

        var training = new Training({
            name: self.selectedTrainingName(),
            date: moment.utc().format()
        });
        self.startedTrainings.push(training);
        self._setCurrentTraining(training);
        self.selectedTrainingName(undefined);

        var set = Set.createBySettings(self.settings);
        self.currentSet(set);
    };

    self.continueTraining = function (training) {
        var newSet = Set.createBySettings(self.settings);
        var sets = training.sets();
        if (sets.length) {
            newSet.fillBySet(_(sets).first());
        }
        self.currentSet(newSet);
        self._setCurrentTraining(training);
    };

    self.pauseTraining = function () {
        self._setCurrentTraining(null);
        self.currentSet().started_at.stop(); // todo: investigate: is it necessary?
        self.currentSet(null);
    };

    self.finishTraining = function () {
        self.startedTrainings.remove(
            self.currentTraining()
        );
        self.currentSet().started_at.stop();
        self.currentSet(null);
        self._setCurrentTraining(null);
    };

    self.removeSet = function (set) {
        if (confirm('Удалить подход: "' + set.getSummary() + '"?')) {
            self.currentTraining().sets.remove(set);
        }
    };

    self._setCurrentTraining = function (training) {
        if(training === null) {
            self.currentTraining().date.stop();
            self.currentTraining(undefined);
            return;
        }
        self.currentTraining(training);
        self.currentTraining().date.watch();
    };

    //endregion

    //region STARTED TRAININGS

    self.startedTrainings = ko.observableArray();

    self.removeTraining = function (training) {
        if(!training.sets().length) {
            self.startedTrainings.remove(training);
            return;
        }
        if (confirm('Удалить "' + training.name() + '" от ' + training.date() + '"?')) {
            self.startedTrainings.remove(training);
        }
    };

    //endregion

    //region CURRENT SET

    self.currentSet = ko.observable();

    self.startSet = function () {
        self.currentSet().started_at(moment.utc().format());
        self.currentSet().started_at.watch()
    };

    self.addSet = function () {
        var cannotAdd = self.settings.set.is_by_start()
                      && !self.currentSet().started_at();
        if (cannotAdd) {
            self._highlight('.js-current-set-block .js-start-btn');
            return;
        }
        var newSet = Set.createBySettings(self.settings);
        newSet.fillBySet(self.currentSet());
        // todo: extend training to add its id to set:
        self.currentTraining().sets.unshift(self.currentSet());
        self.currentSet().started_at.stop();
        self.currentSet().stopped_at(moment.utc().format());
        self.currentSet(newSet);
    };

    //endregion

    /** start | settings | training */
    self.state = ko.computed(function () {
        if (self.settingsShown()) {
            return 'settings';
        } else if (self.currentTraining()) {
            return 'training';
        } else {
            return 'start';
        }
    });

    self.contextHelp = function () {
        switch (self.state()) {
            case 'start':
                self._highlightStartActions();
                break;
            case 'training':
                self._highlightTrainingActions();
                break;
        }
    };

    //region UTILS

    self._highlightTrainingActions = function () {
        var selectors = self.settings.set.is_by_start()
                  ? ['.js-weight', '.js-start-btn', '.js-reps', '.js-add-btn']
                  : ['.js-weight', '.js-reps', '.js-add-btn'];
        self._highlightChain(
            prefixAll('.js-current-set-block ', selectors)
        );
    };

    self._highlightStartActions = function () {
        var $block = $('.js-new-training-block');
        self._highlightChain([
            $block.find('.js-name, .js-name-btn'),
            $block.find('.js-start-btn')
        ]);
    };

    /**
     * @param selector {Array|String}
     * @private
     */
    self._highlight = function (selector) {
        _.each(_.isArray(selector) ? selector : [selector] , function (s) {
            $(s).effect('highlight', {color: '#fbd850'}, 'slow');
        });
    };

    /**
     * @param selectors {Array}
     * @private
     */
    self._highlightChain = function (selectors) {
        if ( !_.isArray(selectors) || !selectors.length) {
            console.warn('_highlightChain: empty selectors');
            return;
        }
        setTimeout(function () {
            chainEach(selectors, function (s) {
                return $(s).effect('highlight', {color: '#fbd850'}, 'slow').promise();
            });
        }, 250);
    };

    //endregion
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

// todo: player when timer
// var player = document.getElementById('start_set_player');
// player.volume = 0.3;
// player.currentTime = 0;
// player.play();
