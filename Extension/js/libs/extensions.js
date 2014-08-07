/**
 * Created with JetBrains WebStorm.
 * User: Laurent
 * Date: 15/07/13
 * Time: 23:48
 * To change this template use File | Settings | File Templates.
 */

Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
};

Storage.prototype.ogetObject = function(key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
};

