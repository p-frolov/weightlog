define(function (require) {
    console.log('User init')

    function User(data) {
        console.log('User constructor')
        this.username = data.username;
    }

    User.prototype = {
    };

    return User;
});