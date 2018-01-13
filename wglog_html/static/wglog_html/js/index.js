/**
 * Script for index page
 */

initRestClient();

var TrainingPageModel = function (appSettings, userSettings) {
    var self = this;

    self.currentUser = ko.observable();

    //region SETTINGS

    self._appSettings = appSettings;

    self.settings = new Settings(userSettings);
    self.settingsShown = ko.observable(false);
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
    self.currentTraining = ko.observable();

    self.trainingNames = ko.observableArray();
    self.selectedTrainingName = ko.observable();

    self.startTraining = function () {
        if (!self.selectedTrainingName()) {
            // self._highlight('.js-new-training-block .js-name'); todo: tooltips
            alert("Выберите название тренировки."); // todo: i18n
            return;
        }

        var training = Training.create({
            name: self.selectedTrainingName(),
            date: moment.utc().format()
        });
        self._setCurrentTraining(training);
        self.selectedTrainingName(undefined);

        self.currentSet(Set.createBySettings(self.settings));
    };

    self.continueTraining = function (training) {
        var newSet = Set.createBySettings(self.settings);
        var sets = training.sets();
        if (sets.length) {
            newSet.fillBySet(_(sets).last());
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
        self.currentTraining().status(Training.FINISHED);
        self.currentSet().started_at.stop();
        self.currentSet(null);
        self._setCurrentTraining(null);
    };

    self.removeSet = function (set) {
        if (confirm('Удалить подход: "' + set.getSummary() + '"?')) {
            self.currentTraining().removeSet(set);
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

    self.startedTrainings = ko.computed(function () {
        // todo: reverse order
        return ko.utils.arrayFilter(Training.all(), function (training) {
            return training.status() === Training.STARTED;
        })
    });

    self.removeTraining = function (training) {
        if(!training.sets().length) {
            Training.remove(training);
            return;
        }
        if (confirm('Удалить "' + training.name() + '" от ' + training.date() + '"?')) {
            Training.remove(training);
        }
    };

    //endregion

    //region CURRENT SET

    self.currentSet = ko.observable();

    self.startSet = function () {
        self.currentSet().started_at(moment.utc().format());
        self.currentSet().started_at.watch()
    };

    self.stopSet = function () {
        self.currentSet().stopped_at(moment.utc().format());
        self.currentSet().started_at.stop();
    };

    self.addSet = function () {
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


    //region PAST TIME FROM LAST SET

    self.pastFromLastSet = ko.observable().extend({
        datetime: {format: 'LTS'},
        chronograph: {format: 'nonzero'}
    });
    self.state.subscribe(function (newState) {
        self.pastFromLastSet.watch(newState == 'training');
    });
    ko.computed(function () {
        if (self.state() !== 'training') {
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


// todo: bad idea 2 sync requests - will be fixed by require.js
var pageModel = new TrainingPageModel(
    getAppSettings(),
    getUserSettings()
);

//region SYNC DATA

pageModel.settings.changedSettings.subscribe(function (changed) {
    $.wgclient.settings.update(changed).done(function () {
        pageModel.settings.cleanChanges(_.keys(changed));
    }).fail(function (jqXHR, textStatus, errorThrown) {
        // todo: handle error
        console.error('fail: ', textStatus, errorThrown);
    });
});

Training.creating.subscribe(function(trainings) {
    _.each(trainings, function (training) {
        if (training.id() !== undefined) {
            console.warn('Creating of existance (id) training', training);
            // todo: error dump
            return;
        }
        training._state(State.PROCESSING);
        $.wgclient.trainings.create(training.toJS()).done(function (trainingData) {
            training.id(trainingData.id);
            training._state(State.SYNCED);
            console.log('T created id', training.id());
        }).fail(function (jqXHR, textStatus, errorThrown) {
            // todo: handle error
            console.error('fail: ', textStatus, errorThrown);
        });
        console.log('T creating data', training.toJS());
    });
    // todo: debug executions
});

Training.deleting.subscribe(function(trainings) {
    _.each(trainings, function (training) {
        if (training.id() === undefined) {
            console.warn('Deleting of non-existnce (id) training', training);
            // todo: error dump
            return;
        }
        training._state(State.PROCESSING);
        $.wgclient.trainings.del(training.id()).done(function () {
            Training.all.remove(training);
            console.log('T deleted', training.id());
        }).fail(function (jqXHR, textStatus, errorThrown) {
            // todo: handle error
            console.error('fail: ', textStatus, errorThrown);
        });
        console.log('T deleting id', training.id());
    });
});

Set.creating.subscribe(function(sets) {
    _.each(sets, function (set) {
        if (set.id() !== undefined) {
            console.warn('Creating of existance (id) set', set);
            // todo: error dump
            return;
        }
        if (set.training() === undefined) {
            console.warn('Creating of set without training', set);
            // todo: error dump
            return;
        }
        set._state(State.PROCESSING);
        $.wgclient.sets.create(set.toJS()).done(function (setData) {
            set.id(setData.id);
            set._state(State.SYNCED);
            console.log('S created id', set.id());
        }).fail(function (jqXHR, textStatus, errorThrown) {
            // todo: handle error
            console.error('fail: ', textStatus, errorThrown);
        });
        console.log('S creating data', set.toJS());
    });
});

Set.deleting.subscribe(function(sets) {
    _.each(sets, function (set) {
        if (set.id() === undefined) {
            console.warn('Deleting of non-existance (id) set', set);
            // todo: error dump
            return;
        }
        set._state(State.PROCESSING);
        $.wgclient.sets.del(set.id()).done(function () {
            Set.all.remove(set);
            console.log('S deleted', set.id());
        }).fail(function (jqXHR, textStatus, errorThrown) {
            // todo: handle error
            console.error('fail: ', textStatus, errorThrown);
        });
        console.log('S deleting', set.id());
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
