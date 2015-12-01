'use strict';

//(function() {


  app.controller('YouGotAMailController', ['$scope','$state', 'authToken','myhttphelper','picturesManager',
    function($scope,$state, authToken,myhttphelper,picturesManager)
    {

      var vm = this;

      myhttphelper.doGet('/isauth').
        then(sendResponseData1).
        catch(sendResponseError1);


      function sendResponseData1(response)
      {
        if (response != "OK")
        {
          $state.go('login', {}, {reload: true});
        } else {
          start();
        }
      }
      function sendResponseError1(response)
      {
        $state.go('login', {}, {reload: true});
      }

      myhttphelper.doGet('/api/commands/contactus/yougotmail').
          then(sendResponseData).
          catch(sendResponseError);


      function sendResponseData(response)
      {
        $scope.data = response;
      }
      function sendResponseError(response)
      {
        $scope.data = response;
      }

      function start()
      {
         picturesManager.getProfilePictureSourcePath(function (pic)
         {
             vm.myProfilePicture = pic;
         });

      }

    }

  ]);

//}());

