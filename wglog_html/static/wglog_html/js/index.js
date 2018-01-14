/**
 * Script for index page
 */

initRestClient();

var TrainingPageModel = function (appSettings, userSettings) {
    var logger = Logger.get('page');

    var self = this;

    self.currentUser = ko.observable(null);

    var _states = ['start', 'settings', 'training', 'trainings'];
    self.state = ko.observable('start');
    self._lastState = self.state();
    self.statePrev = function () {
        self.state(self._lastState);
    };
    self.state.subscribe(function(newState) {
        console.assert(_.contains(_states, newState), 'Unexpected state: ' + newState);
        logger.debug('Changed state', newState);
    });
    self.state.subscribe(function (oldState) {
        if (oldState !== self._lastState) {
            self._lastState = oldState;
        }
    }, null, 'beforeChange');

    //region SETTINGS

    self._appSettings = appSettings;

    self.settings = new Settings(userSettings);
    // [{value: 'ru', text: 'RU'},]
    self.langs = ko.observableArray(
        _(appSettings.langs).map(function(v, k) {
            return {value: k, text: v}
        })
    );
    // [{value: 'by_stop', text: 'По окончанию'},]
    self.setTypes = ko.observableArray(
        _(appSettings.set_types).map(function(v, k) {
            return {value: k, text: v}
        })
    );

    //endregion

    //region CURRENT TRAINING

    // todo: extract current training as a component
    self.currentTraining = ko.observable(null);

    self.trainingNames = ko.observableArray();
    self.selectedTrainingName = ko.observable(null);

    self.startTraining = function () {
        logger.info('Starting training');
        if (!self.selectedTrainingName()) {
            // self._highlight('.js-new-training-block .js-name'); todo: tooltips
            alert("Выберите название тренировки."); // todo: i18n
            return;
        }

        var training = Training.create({
            name: self.selectedTrainingName(),
            date: moment.utc().format()
        });
        self.currentTraining(training);
        self.selectedTrainingName(null);

        self.currentSet(Set.createBySettings(self.settings));
        logger.debug('Started training', training.toJS());
    };

    self.continueTraining = function (training) {
        logger.info('Continuing training');
        var newSet = Set.createBySettings(self.settings);
        var sets = training.sets();
        if (sets.length) {
            newSet.fillBySet(_(sets).last());
        }
        self.currentSet(newSet);
        self.currentTraining(training);
        logger.debug('Continued training', training.toJS());
    };

    self.pauseTraining = function () {
        logger.info('Pausing training');
        self.currentTraining(null);
        self.currentSet(null);
    };

    self.finishTraining = function () {
        logger.info('Finishing training');
        self.currentTraining().status(Training.FINISHED);
        self.currentSet(null);
        self.currentTraining(null);
    };

    self.removeSet = function (set) {
        logger.info('Removing training');
        if (confirm('Удалить подход: "' + set.getSummary() + '"?')) {
            self.currentTraining().removeSet(set);
        }
    };

    self.currentTraining.subscribe(function (newTraining) {
        logger.debug('Set current training');
        if (newTraining === null) {
            logger.debug('Training is null');
            self.state('start');
            self.currentSet(null);
        } else {
            logger.debug('Training data', newTraining.toJS());
            newTraining.date.watch();
            self.state('training');
        }
    });

    self.currentTraining.subscribe(function (oldTraining) {
        if (oldTraining !== null) {
            logger.debug('Stopping old training date when set current', oldTraining.toJS());
            oldTraining.date.stop();
        }
    }, null, 'beforeChange');

    //endregion

    //region CURRENT SET

    self.currentSet = ko.observable(null);

    self.startSet = function () {
        logger.info('Starting current set');
        self.currentSet().started_at(moment.utc().format());
        self.currentSet().started_at.watch();
    };

    self.stopSet = function () {
        logger.info('Stopping current set');
        self.currentSet().stopped_at(moment.utc().format());
        self.currentSet().started_at.stop();
    };

    self.addSet = function () {
        logger.info('Adding set to current training');
        var currentSet = self.currentSet();
        var cannotAdd = self.settings.is_set_by_start()
                      && !currentSet.started_at();

        if (cannotAdd) {
            // self._highlight('.js-current-set-block .js-start-btn');
            alert("Сначала запустите таймер подхода."); // todo: i18n
            return;
        }

        currentSet.started_at.stop();
        if ( !currentSet.stopped_at() ) {
            currentSet.stopped_at(moment.utc().format());
        }

        self.currentTraining().addSet(currentSet);

        var newSet = Set.createBySettings(self.settings);
        newSet.fillBySet(currentSet);
        self.currentSet(newSet);
        logger.debug('Added set to current training', newSet.toJS());
    };

    self.currentSet.subscribe(function (oldSet) {
        if (oldSet !== null) {
            logger.debug('Stopping started_at of old set when set current set');
            oldSet.started_at.stop();
        }
    }, null, 'beforeChange');

    //endregion

    //region STARTED TRAININGS

    self.startedTrainings = ko.computed(function () {
        // todo: reverse order
        return ko.utils.arrayFilter(Training.all(), function (training) {
            return training.status() === Training.STARTED;
        })
    });

    self.removeTraining = function (training) {
        logger.info('Removing training');
        if(!training.sets().length) {
            Training.remove(training);
            return;
        }
        if (confirm('Удалить "' + training.name() + '" от ' + training.date() + '"?')) {
            Training.remove(training);
        }
    };

    //endregion

    //region TRAININGS

    self.trainings = ko.computed(function () {
        return ko.utils.arrayFilter(Training.all(), function (training) {
            return training.status() === Training.FINISHED;
        })
    }, {deferEvaluation: true}); // todo: investigate

    //endregion

    //region PAST TIME FROM LAST SET

    self.pastFromLastSet = ko.observable(null).extend({
        datetime: {format: 'LTS'},
        chronograph: {format: 'nonzero'}
    });
    self.state.subscribe(function (newState) {
        self.pastFromLastSet.watch(newState === 'training');
    });
    ko.computed(function () {
        if (self.currentTraining() === null) {
            return;
        }

        var currentSet = self.currentSet();
        var currentSets = self.currentTraining().sets();

        if (currentSet && currentSet.started_at() && currentSet.stopped_at()) {
            // show when set is stopped but not added
            self.pastFromLastSet(currentSet.stopped_at.utcdata());
        }
        else if (currentSet && currentSet.started_at() && !currentSet.stopped_at()) {
            // don't show when doing set (started but not stopped)
            self.pastFromLastSet(null);
        }
        else if (currentSets.length) {
            // time by last set in current training,
            // also when settings.set_type is 'by stop'
            self.pastFromLastSet(currentSets[0].stopped_at.utcdata())
        }
        else {
            self.pastFromLastSet(null);
        }
    });

    //endregion

    self.contextHelp = function () {
        switch (self.state()) {
            case 'start':
                // self._highlightStartActions(); todo: tooltips
                break;
            case 'training':
                // self._highlightTrainingActions(); todo: tooltips
                break;
        }
    };

    //region UTILS

    self._highlightTrainingActions = function () {
        var selectors = self.settings.is_set_by_start()
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
            logger.warn('_highlightChain: empty selectors');
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


// todo: bad idea 2 sync requests - will be fixed by require.js
var pageModel = new TrainingPageModel(
    getAppSettings(),
    getUserSettings()
);

//region SYNC DATA

pageModel.settings.changedSettings.subscribe(function (changed) {
    var logger = Logger.get('ajax.settings');
    logger.debug('Changing data', changed);
    $.wgclient.settings.update(changed).done(function () {
        logger.debug('Changed');
        pageModel.settings.cleanChanges(_.keys(changed));
    }).fail(function (jqXHR, textStatus, errorThrown) {
        // todo: handle error
        logger.error('Changing fail', textStatus, errorThrown);
    });
});

Training.creating.subscribe(function(trainings) {
    var logger = Logger.get('ajax.training');
    _.each(trainings, function (training) {
        logger.debug('Creating data', training.toJS());
        if (training.id() !== undefined) {  // todo: refactoring: to null
            logger.warn('Creating of existance', training.id(), training.toJS());
            // todo: error dump
            return;
        }
        training._state(State.PROCESSING);
        $.wgclient.trainings.create(training.toJS()).done(function (trainingData) {
            training.id(trainingData.id);
            training._state(State.SYNCED);
            logger.debug('Created id', training.id());
        }).fail(function (jqXHR, textStatus, errorThrown) {
            // todo: handle error
            logger.error('Creating fail', training.toJS(), textStatus, errorThrown);
        });
    });
});

Training.deleting.subscribe(function(trainings) {
    var logger = Logger.get('ajax.training');
    _.each(trainings, function (training) {
        logger.debug('Deleting id', training.id());
        if (training.id() === undefined) {  // todo: refactoring: to null
            logger.warn('Deleting of non-existnce', training.toJS());
            // todo: error dump
            return;
        }
        training._state(State.PROCESSING);
        $.wgclient.trainings.del(training.id()).done(function () {
            Training.all.remove(training);
            logger.debug('Deleted', training.id());
        }).fail(function (jqXHR, textStatus, errorThrown) {
            // todo: handle error
            logger.error('Deleting fail', training.id(), textStatus, errorThrown);
        });
    });
});

Set.creating.subscribe(function(sets) {
    var logger = Logger.get('ajax.set');
    _.each(sets, function (set) {
        logger.debug('Creating data', set.toJS());
        if (set.id() !== undefined) {  // todo: refactoring: to null
            logger.warn('Creating of existance', set.id(), set.toJS());
            // todo: error dump
            return;
        }
        if (set.training() === undefined) {
            logger.warn('Creating without training', set.toJS());
            // todo: error dump
            return;
        }
        set._state(State.PROCESSING);
        $.wgclient.sets.create(set.toJS()).done(function (setData) {
            set.id(setData.id);
            set._state(State.SYNCED);
            logger.debug('Created id', set.id());
        }).fail(function (jqXHR, textStatus, errorThrown) {
            // todo: handle error
            logger.error('Creating fail', set.toJS(), textStatus, errorThrown);
        });
    });
});

Set.deleting.subscribe(function(sets) {
    var logger = Logger.get('ajax.set');
    _.each(sets, function (set) {
        logger.debug('Deleting id', set.id());
        if (set.id() === undefined) {  // todo: refactoring: to null
            logger.warn('Deleting of non-existance', set.toJS());
            // todo: error dump
            return;
        }
        set._state(State.PROCESSING);
        $.wgclient.sets.del(set.id()).done(function () {
            Set.all.remove(set);
            logger.debug('Deleted', set.id());
        }).fail(function (jqXHR, textStatus, errorThrown) {
            // todo: handle error
            logger.error('Deleting fail', set.id(), textStatus, errorThrown);
        });
    });
});

//endregion

//region LOAD DATA

var dataDeferred = {
    currentUser: $.wgclient.users.read('me'),
    trainings: $.wgclient.trainings.read(),
    trainingNames: $.wgclient.trainingnames.read()
};

var $dataLoaded = $.when(
    dataDeferred.currentUser,
    dataDeferred.trainings,
    dataDeferred.trainingNames
);

//endregion

//region INIT DATA

dataDeferred.currentUser.done(function (data) {
    pageModel.currentUser(new User(data));
});

dataDeferred.trainingNames.done(function (data) {
    // todo: validation (check on list of strings)
    pageModel.trainingNames = data;
});

dataDeferred.trainings.done(function (data) {
    Training.initAll(data);
});


var $dataInitialized = (function () {
    var dfd = $.Deferred();
    $.when($dataLoaded).done(function () {
        dfd.resolve();
    }).fail(dfd.reject);
    return dfd.promise();
})();

//endregion

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
