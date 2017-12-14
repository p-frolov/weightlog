requirejs.config({
    baseUrl: "static/wglog_html/js/lib",
    shim : {
        "bootstrap" : { "deps" :[
            "jquery"
        ]},
        "rest": { "deps": ["jquery"] },
        "underscore": 'lib/underscore-min'
    },
    paths: {
        "jquery" : "jquery-3.2.1.min",
        "bootstrap" :  "bootstrap-3.3.7/js/bootstrap.min",
        "rest": "jquery.rest",
        "underscore": { exports: "_" },
        "app": "../app"
    }
});
