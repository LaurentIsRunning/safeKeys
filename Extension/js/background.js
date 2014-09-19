/**
 * Created by Laurent De Plaen on 5/11/13.
 */

var savedUser;

chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
        console.log(sender.url);
        if(!request)
        {
            console.error("request is undefined...");
        }
        else if(request == 'ping')
        {
            sendResponse({status: "ok"});
        }
        else if(request.user)
        {
            if(request.stayConnected) {
                savedUser = null;
                request.user.rememberMe = true;
                localStorage.setObject('savedUser', request.user);
                sendResponse({status: "login stored"});
            }
            else{
                delete localStorage.savedUser;
                request.user.rememberMe = false;
                savedUser = request.user;
                sendResponse({status: "login saved"});
            }
        }
        else{
            console.error("request is corrupted : " + request);
            sendResponse({status: "unknown command"});
        }

    });

Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
};

Storage.prototype.getObject = function(key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
};