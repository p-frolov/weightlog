define(function (require) {
    require("bootstrap");
    require("rest");

    var $ = require("jquery");

    $(function () {
        var client = new $.RestClient('/api/rest/');
        client.add('trainings');

        client.trainings.read().done(function (data) {
            console.log(data);
        });

    });

});
