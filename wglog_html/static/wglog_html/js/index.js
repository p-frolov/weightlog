/**
 * Script for index page
 */

initRestClient();

_.extend(app, {
    training: undefined
});

var TrainingPageModel = function (app) {
    this.username = ko.observable(app.currentUser.username());
    this.training = ko.observable();
};

var $currentUserDeferred = $.wgclient.users.read('me');

$currentUserDeferred.done(function (data) {
    app.currentUser = new User(data);
});

$.when(
    $currentUserDeferred,
    $(document).ready
).then(function () {
    console.log('data has been loaded');
    console.log(app.currentUser);
    console.log('dom ready');
    ko.applyBindings(new TrainingPageModel(app));
});
