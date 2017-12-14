define(function (require) {
    require("bootstrap");
    // require("rest");

    var $ = require("jquery");
    var User = require("app/User");
    var client = require("app/restClient");

    var user;
    client.users.read('me').done(function (data) {
        user = new User(data);
        console.log(user);
    });

    $(function () {
        var client = require("app/restClient");

        var User = require("app/User");

        var secondUser = new User({username: 'username2'});
        console.log(secondUser);

        client.trainings.read().done(function (data) {
            console.log(data);
        });

    });

});
