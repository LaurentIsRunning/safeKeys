/**
 * Created by Laurent De Plaen on 31/10/13.
 */

safeKeys.factory('chromeHelper', function() {
    var chromeHelper = {};

    chromeHelper.getActiveTabDomain = function (callback){
            if(chrome.tabs)
            {
                chrome.tabs.query({'active': true, 'currentWindow':true},
                    function(tabs){
                        if(tabs && tabs.length > 0) {
                            callback(getDomainFrom(tabs[0].url));
                        }
                    });
            }
        };

    function getDomainFrom(url) {
        var domain = url.match(/:\/\/(.[^/]+)/)[1];

        if(domain && domain.length > 0)
        {
            domain = domain.substring(0, domain.lastIndexOf("."));
            domain = domain.substring(domain.lastIndexOf(".")+1);
        }
        else{
            console.log('The domain name is not valid');
        }

        return domain;
    }

    chromeHelper.getSavedUser = function(){
        if(localStorage.savedUser){
            return localStorage.getObject('savedUser');
        }
        else{
            var background = chrome.extension.getBackgroundPage();
            return background.savedUser;
        }
    };

    chromeHelper.clearSavedUser = function(){
        localStorage.savedUser = null;
        var background = chrome.extension.getBackgroundPage();
        background.savedUser = null;
    };

    return chromeHelper;
});

safeKeys.factory('cryptoHelper', function()
{
    var helper = {};

    helper.characters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z' ,
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    helper.getPassword = function(item, secretKey)
    {
        var hash = CryptoJS.SHA256(item.name + item.login + item.creationDate.toString()+ secretKey);

        var characterSet = helper.characters.concat(item.specialCharacters.split(''));
        var adaptedSetSize = Math.floor(16 * characterSet.length / item.passwordSize); // The size of the character set is adapted to get the correct password length

        // Build the array of int16 from the hash
        var hashInt16Words = [];
        for(var j=0; j < hash.words.length; j++)
        {
            hashInt16Words.push(hash.words[j] & 0xFFFF);
            hashInt16Words.push(hash.words[j] >>> 16);
        }

        var password='';
        for(var i=0; i < hashInt16Words.length; i++)
        {
            var moduloFactor =  adaptedSetSize;
            if((item.passwordSize - password.length) == (hashInt16Words.length - i))
            {
                moduloFactor = characterSet.length;
            }

            var index = hashInt16Words[i] % moduloFactor;
            if(index < characterSet.length)
                password += characterSet[index];

            if(password.length == item.passwordSize) break;
        }

        if(password.length != item.passwordSize)
        {
            alert('The password size is not good ' + password.length);
        }

        return password;
    };

    return helper;
});