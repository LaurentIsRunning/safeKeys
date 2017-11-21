/**
 * Created by Laurent De Plaen on 28/10/13.
 */
var safeKeys = angular.module('safeKeys', ['ui.bootstrap', 'ja.qr', 'ngAnimate']);

safeKeys.controller('popupCtrl', function ($scope, $timeout, chromeHelper, cryptoHelper)
{
    var configRef;
    $scope.password = "";
    $scope.isSaveRequired = false;
    $("#secretKey").focus();

    var rootRef = new Firebase("https://safestkeys.firebaseio.com");

    var savedUser = chromeHelper.getSavedUser();

    $timeout(tryToConnect);

    function tryToConnect() {
      if (savedUser) {
        rootRef.auth(savedUser.firebaseAuthToken,
          function(error, result) {
            if (error) {
              console.log('Login Failed!', error);
            }
            else {
              console.log('Authenticated successfully with payload:', result.auth);
              console.log('Auth expires at:', new Date(result.expires * 1000));
              $scope.$apply(function() { $scope.user = savedUser; });
            }
          });
      }
      else
      {
        savedUser = chromeHelper.getSavedUser();
        $timeout(tryToConnect, 500);
      }
    }

    $scope.login = function () { window.open(safekeysWebsiteUrl); };

    $scope.goToSettings = function () { window.open(safekeysSettingsUrl); };

    $scope.logout = function() {
        rootRef.unauth();
        $scope.user = null;
        chromeHelper.clearSavedUser();
    };

    $scope.$on('$destroy', function() {
        if(savedUser && !savedUser.rememberMe)     $scope.logout();
    });

    $scope.formData = {};

    $scope.selectedItem = {};
    $scope.selectedItem.specialCharacters = '.-!_*?+&()';
    $scope.selectedItem.passwordSize = 12;
    $scope.selectedItem.creationDate = new Date().getTime();

    $scope.renewPassword = function(){ $scope.selectedItem.creationDate = new Date().getTime()};

    $scope.createPassword = function(){
        console.log('Create password');

        if(!$scope.IsDataValid()) return;

        var encryptedLogin;
        var encryptedName;

        if($scope.isEncrypted)
        {
            encryptedName = $scope.selectedItem.name;
            encryptedLogin = $scope.selectedItem.login;
            $scope.formData.UserName = CryptoJS.AES.decrypt($scope.selectedItem.login, $scope.secretKey).toString(CryptoJS.enc.Utf8);
        }
        else
        {
            encryptedName = CryptoJS.AES.encrypt($scope.selectedItemName, $scope.secretKey).toString();
            encryptedLogin = CryptoJS.AES.encrypt($scope.formData.UserName, $scope.secretKey).toString();
        }

        $scope.selectedItem.name = $scope.selectedItemName;
        $scope.selectedItem.login = $scope.formData.UserName;

        $scope.password = cryptoHelper.getPassword($scope.selectedItem,$scope.secretKey);

        // Save data on server
        if($scope.isSaveRequired && configRef)
        {
            $scope.selectedItem.login = encryptedLogin;
            $scope.selectedItem.name =  encryptedName;

            if($scope.isNewConfiguration)
            {
                var countRef = rootRef.child('users/'+ $scope.user.provider + $scope.user.id + '/configurationCount');
                countRef.once('value', function(dataSnapshot){
                    var value = dataSnapshot.val();
                    if(value)
                    {
                        console.log('Save new configuration at n°' + value);
                        configRef.set($scope.selectedItem);
                        countRef.set(value + 1);
                        $scope.isNewConfiguration = false;
                    }
                    else
                    {
                        console.log('Save first configuration');
                        configRef.set($scope.selectedItem);
                        countRef.set(1);
                        $scope.isNewConfiguration = false;
                    }
                });
            }
            else{
                console.log('Update configuration');
                configRef.set($scope.selectedItem);
            }
        }

        // Set the decrypted info
        $scope.isEncrypted = false;

        console.log('create password - END');
    };

    /**
     * @return {boolean}
     */
    $scope.IsDataValid = function(){
        $scope.warningMessage = false;
        if(!$scope.selectedItemName || $scope.selectedItemName == '')
        {
            $scope.warningMessage = 'Please enter the configuration name';
            return false;
        }
        if(!$scope.formData.UserName || $scope.formData.UserName == '')
        {
            $scope.warningMessage = 'Please enter a user name';
            return false;
        }
        if(!$scope.secretKey || $scope.secretKey == '')
        {
            $scope.warningMessage = 'Please enter your secret key';
            return false;
        }
        return true;
    };

    chromeHelper.getActiveTabDomain(function (domain) {
        $scope.$apply(function(){$scope.selectedItemName = domain});
    });

    $scope.$watch('user',function(newval, oldval){
        if(newval && (newval!=oldval) && $scope.selectedItemName)
        {
            console.log('Watch user');
            SetReferenceToFireBase();
        }
    });

    // Handling the manual site name changing
    $scope.$watch('selectedItemName', function(newval, oldval){
        if(newval && newval != oldval && $scope.user)
        {
            console.log('Watch name');
            SetReferenceToFireBase();
        }
    });

    // Select password for COPY/PAST
    $scope.$watch('password', function(newval){
        if(newval) {
            $timeout(function() {$("#password").select();});
        }
    });

    // Check if SAVE is required
    $scope.$watch('showSettings', function(newval, oldval){
        if(newval && !oldval)
        {
            $scope.isSaveRequired = true;
            console.log("Save is required");
        }
    });

    function SetReferenceToFireBase()
    {
        if(configRef)
        {
            configRef.off(); // Disconnect first if needed
        }

        console.log('Ready to get config : ' + $scope.selectedItemName + ', ' + $scope.user.name + ', ' + $scope.user.id + ', ' + $scope.user.email + ', ' + $scope.user.provider);
        configRef = getConfigurationResourcePath(rootRef, $scope.user.provider + $scope.user.id, $scope.selectedItemName);
        configRef.once('value', function(dataSnapshot){
            var value = dataSnapshot.val();
            if(value)
            {
                console.log('Snapshoot:' + value.creationDate);
                $scope.$apply(function(){
                    $scope.selectedItem.login = value.login;
                    $scope.selectedItem.name = value.name;
                    $scope.selectedItem.specialCharacters = value.specialCharacters;
                    $scope.selectedItem.passwordSize = value.passwordSize;
                    $scope.selectedItem.creationDate = value.creationDate;
                    $scope.showSettings = false;
                    $scope.isEncrypted = true;
                    $scope.formData.UserName = 'Encrypted';
                    $scope.isSaveRequired = false;
                    $scope.isNewConfiguration = false;
                });
            }
            else{
                console.log('No data');
                $scope.$apply(function(){
                    $scope.showSettings = true;
                    $scope.isNewConfiguration = true;
                    $scope.isSaveRequired = true;
                    if($scope.isEncrypted)
                    {
                        $scope.formData.UserName = "";
                        $scope.isEncrypted = false;
                    }
                });
            }
        });
    }

    $scope.ToggleConfiguration = function(){$scope.showSettings = !$scope.showSettings;};
});

function getConfigurationResourcePath(rootRef, id, name)
{
    return rootRef.child('users/'+ id + '/configurations/' + getValidResourceName(name + id));
}

function getValidResourceName(resourceName)
{
    return replaceAll(CryptoJS.SHA256(resourceName).toString(CryptoJS.enc.Base64), "/", "*");
}

function replaceAll(str, find, replace)
{
    return str.split(find).join(replace);
}