// Generated by CoffeeScript 1.3.3
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Hoodie.Account = (function() {

  Account.prototype.username = void 0;

  function Account(hoodie) {
    this.hoodie = hoodie;
    this._handleDestroySucces = __bind(this._handleDestroySucces, this);

    this._handleFetchBeforeDestroySucces = __bind(this._handleFetchBeforeDestroySucces, this);

    this._handlePasswordResetStatusRequestError = __bind(this._handlePasswordResetStatusRequestError, this);

    this._handlePasswordResetStatusRequestSuccess = __bind(this._handlePasswordResetStatusRequestSuccess, this);

    this._checkPasswordResetStatus = __bind(this._checkPasswordResetStatus, this);

    this._handleSignOutSuccess = __bind(this._handleSignOutSuccess, this);

    this._handleSignInSuccess = __bind(this._handleSignInSuccess, this);

    this._delayedSignIn = __bind(this._delayedSignIn, this);

    this._handleSignUpSucces = __bind(this._handleSignUpSucces, this);

    this._handleRequestError = __bind(this._handleRequestError, this);

    this._handleAuthenticateSuccess = __bind(this._handleAuthenticateSuccess, this);

    this.fetch = __bind(this.fetch, this);

    this.authenticate = __bind(this.authenticate, this);

    this.username = this.hoodie.my.config.get('_account.username');
    this.owner = this.hoodie.my.config.get('_account.owner');
    if (!this.owner) {
      this.owner = this.hoodie.my.store.uuid();
      this.hoodie.my.config.set('_account.owner', this.owner);
    }
    this._checkPasswordResetStatus();
  }

  Account.prototype.authenticate = function() {
    if (!this.username) {
      return this.hoodie.defer().reject().promise();
    }
    if (this._authenticated === true) {
      return this.hoodie.defer().resolve(this.username).promise();
    }
    if (this._authenticated === false) {
      return this.hoodie.defer().reject().promise();
    }
    return this.hoodie.request('GET', "/_session").pipe(this._handleAuthenticateSuccess, this._handleRequestError);
  };

  Account.prototype.signUp = function(username, password) {
    var options;
    if (password == null) {
      password = '';
    }
    if (this.hasAnonymousAccount()) {
      return this._upgradeAnonymousAccount(username, password);
    }
    options = {
      data: JSON.stringify({
        _id: this._key(username),
        name: this._userKey(username),
        type: 'user',
        roles: [],
        password: password,
        $owner: this.owner,
        database: this.db()
      }),
      contentType: 'application/json'
    };
    return this.hoodie.request('PUT', this._url(username), options).pipe(this._handleSignUpSucces(username, password), this._handleRequestError);
  };

  Account.prototype.anonymousSignUp = function() {
    var password, username,
      _this = this;
    password = this.hoodie.my.store.uuid(10);
    username = this.owner;
    return this.signUp(username, password).fail(this._handleRequestError).done(function() {
      return _this.hoodie.my.config.set('_account.anonymousPassword', password);
    });
  };

  Account.prototype.hasAnonymousAccount = function() {
    return this.hoodie.my.config.get('_account.anonymousPassword') != null;
  };

  Account.prototype.signIn = function(username, password) {
    var options;
    if (password == null) {
      password = '';
    }
    options = {
      data: {
        name: this._userKey(username),
        password: password
      }
    };
    return this.hoodie.request('POST', '/_session', options).pipe(this._handleSignInSuccess);
  };

  Account.prototype.login = Account.prototype.signIn;

  Account.prototype.signOut = function() {
    this.hoodie.my.remote.disconnect();
    return this.hoodie.request('DELETE', '/_session').pipe(this._handleSignOutSuccess);
  };

  Account.prototype.logout = Account.prototype.signOut;

  Account.prototype.on = function(event, cb) {
    return this.hoodie.on("account:" + event, cb);
  };

  Account.prototype.db = function() {
    return "user/" + this.owner;
  };

  Account.prototype.fetch = function(username) {
    if (username == null) {
      username = this.username;
    }
    if (!username) {
      return this.hoodie.defer().reject({
        error: "unauthenticated",
        reason: "not logged in"
      }).promise();
    }
    return this.hoodie.request('GET', this._url(username)).pipe(null, this._handleRequestError).done(function(response) {
      return response = this._doc;
    });
  };

  Account.prototype.changePassword = function(currentPassword, newPassword) {
    var data, options;
    if (!this.username) {
      return this.hoodie.defer().reject({
        error: "unauthenticated",
        reason: "not logged in"
      }).promise();
    }
    data = $.extend({}, this._doc);
    data.password = newPassword;
    delete data.salt;
    delete data.password_sha;
    options = {
      data: JSON.stringify(data),
      contentType: "application/json"
    };
    this.hoodie.my.remote.disconnect();
    return this.hoodie.request('PUT', this._url(), options).pipe(this._handleChangePasswordSuccess(newPassword), this._handleRequestError);
  };

  Account.prototype.resetPassword = function(username) {
    var data, key, options, resetPasswordId;
    if (resetPasswordId = this.hoodie.my.config.get('_account.resetPasswordId')) {
      return this._checkPasswordResetStatus();
    }
    resetPasswordId = "" + username + "/" + (this.hoodie.my.store.uuid());
    this.hoodie.my.config.set('_account.resetPasswordId', resetPasswordId);
    key = "" + this._prefix + ":$passwordReset/" + resetPasswordId;
    data = {
      _id: key,
      name: "$passwordReset/" + resetPasswordId,
      type: 'user',
      password: resetPasswordId,
      createdAt: new Date,
      updatedAt: new Date
    };
    options = {
      data: JSON.stringify(data),
      contentType: "application/json"
    };
    return this.hoodie.request('PUT', "/_users/" + (encodeURIComponent(key)), options).pipe(null, this._handleRequestError).done(this._checkPasswordResetStatus);
  };

  Account.prototype.changeUsername = function(currentPassword, newUsername) {
    return this._changeUsernameAndPassword(currentPassword, newUsername);
  };

  Account.prototype.destroy = function() {
    return this.fetch().pipe(this._handleFetchBeforeDestroySucces, this._handleRequestError).pipe(this._handleDestroySucces);
  };

  Account.prototype._prefix = 'org.couchdb.user';

  Account.prototype._doc = {};

  Account.prototype._setUsername = function(username) {
    this.username = username;
    return this.hoodie.my.config.set('_account.username', this.username);
  };

  Account.prototype._setOwner = function(owner) {
    this.owner = owner;
    return this.hoodie.my.config.set('_account.owner', this.owner);
  };

  Account.prototype._handleAuthenticateSuccess = function(response) {
    var defer;
    defer = this.hoodie.defer();
    if (response.userCtx.name) {
      this._authenticated = true;
      this._setUsername(response.userCtx.name.replace(/^(anonymous_)?user\//, ''));
      this._setOwner(response.userCtx.roles[0]);
      defer.resolve(this.username);
    } else {
      this._authenticated = false;
      this.hoodie.trigger('account:error:unauthenticated');
      defer.reject();
    }
    return defer.promise();
  };

  Account.prototype._handleRequestError = function(xhr) {
    var error;
    if (xhr == null) {
      xhr = {};
    }
    try {
      error = JSON.parse(xhr.responseText);
    } catch (e) {
      error = {
        error: xhr.responseText || "unknown"
      };
    }
    return this.hoodie.defer().reject(error).promise();
  };

  Account.prototype._handleSignUpSucces = function(username, password) {
    var defer,
      _this = this;
    defer = this.hoodie.defer();
    return function(response) {
      _this.hoodie.trigger('account:signup', username);
      _this._doc._rev = response.rev;
      return _this._delayedSignIn(username, password);
    };
  };

  Account.prototype._delayedSignIn = function(username, password) {
    var defer,
      _this = this;
    defer = this.hoodie.defer();
    window.setTimeout((function() {
      var promise;
      promise = _this.signIn(username, password);
      promise.done(defer.resolve);
      return promise.fail(function(error) {
        if (error.error === 'unconfirmed') {
          return _this._delayedSignIn(username, password);
        } else {
          return defer.reject.apply(defer, arguments);
        }
      });
    }), 300);
    return defer.promise();
  };

  Account.prototype._handleSignInSuccess = function(response) {
    var defer, username,
      _this = this;
    defer = this.hoodie.defer();
    username = response.name.replace(/^(anonymous_)?user\//, '');
    if (~response.roles.indexOf("error")) {
      this.fetch(username).fail(defer.reject).done(function() {
        return defer.reject({
          error: "error",
          reason: _this._doc.$error
        });
      });
      return defer.promise();
    }
    if (!~response.roles.indexOf("confirmed")) {
      return defer.reject({
        error: "unconfirmed",
        reason: "account has not been confirmed yet"
      });
    }
    this._authenticated = true;
    this._setUsername(username);
    this._setOwner(response.roles[0]);
    this.hoodie.trigger('account:signin', this.username);
    this.fetch();
    return defer.resolve(this.username, response);
  };

  Account.prototype._handleChangePasswordSuccess = function(newPassword) {
    var _this = this;
    return function() {
      return _this.signIn(_this.username, newPassword);
    };
  };

  Account.prototype._handleSignOutSuccess = function() {
    delete this.username;
    delete this.owner;
    this.hoodie.my.config.clear();
    this._authenticated = false;
    return this.hoodie.trigger('account:signout');
  };

  Account.prototype._checkPasswordResetStatus = function() {
    var hash, options, resetPasswordId, url, username,
      _this = this;
    resetPasswordId = this.hoodie.my.config.get('_account.resetPasswordId');
    if (!resetPasswordId) {
      return this.hoodie.defer().reject({
        error: "missing"
      }).promise();
    }
    username = "$passwordReset/" + resetPasswordId;
    url = "/_users/" + (encodeURIComponent("" + this._prefix + ":" + username));
    hash = btoa("" + username + ":" + resetPasswordId);
    options = {
      headers: {
        Authorization: "Basic " + hash
      }
    };
    return this.hoodie.request('GET', url, options).pipe(this._handlePasswordResetStatusRequestSuccess, this._handlePasswordResetStatusRequestError).fail(function() {
      if (error.error === 'pending') {
        window.setTimeout(_this._checkPasswordResetStatus, 1000);
        return;
      }
      return _this.hoodie.trigger('account:password_reset:error');
    });
  };

  Account.prototype._handlePasswordResetStatusRequestSuccess = function() {
    var defer;
    defer = this.hoodie.defer();
    if (response.$error) {
      defer.reject({
        error: response.$error
      });
    } else {
      defer.reject({
        error: 'pending'
      });
    }
    return defer.promise();
  };

  Account.prototype._handlePasswordResetStatusRequestError = function(xhr) {
    if (xhr.status === 401) {
      this.hoodie.defer().resolve();
      this.hoodie.my.config.remove('_account.resetPasswordId');
      return this.hoodie.trigger('account:password_reset:success');
    } else {
      return this._handleRequestError(xhr);
    }
  };

  Account.prototype._changeUsernameAndPassword = function(currentPassword, newUsername, newPassword) {
    var _this = this;
    return this.authenticate().pipe(function() {
      var data, options;
      data = $.extend({}, _this._doc);
      data.$newUsername = newUsername;
      if (newPassword) {
        delete data.salt;
        delete data.password_sha;
        data.password = newPassword;
      }
      options = {
        data: JSON.stringify(data),
        contentType: 'application/json'
      };
      return _this.hoodie.request('PUT', _this._url(), options).pipe(function() {
        _this.hoodie.my.remote.disconnect();
        return _this._delayedSignIn(newUsername, newPassword || currentPassword);
      });
    });
  };

  Account.prototype._upgradeAnonymousAccount = function(username, password) {
    var currentPassword,
      _this = this;
    currentPassword = this.hoodie.my.config.get('_account.anonymousPassword');
    return this._changeUsernameAndPassword(currentPassword, username, password).done(function() {
      return _this.hoodie.my.config.remove('_account.anonymousPassword');
    });
  };

  Account.prototype._handleFetchBeforeDestroySucces = function() {
    this.hoodie.my.remote.disconnect();
    this._doc._deleted = true;
    return this.hoodie.request('PUT', this._url(), {
      data: JSON.stringify(this._doc),
      contentType: 'application/json'
    });
  };

  Account.prototype._handleDestroySucces = function() {
    delete this.username;
    delete this.owner;
    return delete this._authenticated;
  };

  Account.prototype._userKey = function(username) {
    if (username === this.owner) {
      return "user_anonymous/" + username;
    } else {
      return "user/" + username;
    }
  };

  Account.prototype._key = function(username) {
    if (username == null) {
      username = this.username;
    }
    return "" + this._prefix + ":" + (this._userKey(username));
  };

  Account.prototype._url = function(username) {
    if (username == null) {
      username = this.username;
    }
    return "/_users/" + (encodeURIComponent(this._key(username)));
  };

  return Account;

})();
