'use strict';

app.controller('gallerybookController', ['$scope', '$state', 'authToken', '$window',
  'myhttphelper', 'dbsearch', 'myConfig', '$http', '$timeout', 'myutils',
  'appCookieStore', 'socketioservice', 'Idle', '$rootScope', 'SessionStorageService','API','$msgbox','mypage',
  function ($scope, $state, authToken, $window, myhttphelper, dbsearch,
            myConfig, $http, $timeout, myutils, appCookieStore, socketioservice,
            Idle, $rootScope, SessionStorageService,API,$msgbox,mypage) {

    var vm = this;
    $scope.content = [];

    appCookieStore.set('mainview', 'gallerybook');
    vm.currentSentMessage = {};
    var cssUpdateTimer;
    var cssUpdateTimer1;
    $scope.allmembersthumb = [];
    vm.currentUserTotalPictures = 0;
    vm.currentUserAllPictures = [];
    var index = 0;
    var index1 = 0;
    vm.skipSize = 0;
    $scope.isOnline = false;
    var maxPageToLoad = 30;

    $scope.$on('IdleStart', function () {
      // the user appears to have gone idle
      console.log('IdleStart');
      socketioservice.disconnect();
    });

    $scope.$on('IdleTimeout', function () {
      // the user has timed out (meaning idleDuration + timeout has passed without any activity)
      // this is where you'd log them
      //console.log('IdleTimeout');
      //console.log("logging out");
      socketioservice.disconnect().success(function (id) {

        authToken.RemoveToken();
        $state.go('login', {}, {
          reload: true
        });
        $rootScope.$broadcast("updateHeader", authToken.getToken());
        return;
      });
    });

    $scope.$on('IdleEnd', function () {
      // the user has come back from AFK and is doing stuff. if you are warning them, you can use this to hide the dialog
      console.log('IdleEnd');
      socketioservice.connect();
    });


    socketioservice.setCallback(connectionCallback);

    appCookieStore.set('mainview', 'gallery');

    myhttphelper.doGet('/isauth').
      then(sendResponseData1).
      catch(sendResponseError1);

    function sendResponseData1(response) {
      if (response != "OK") {
        $state.go('login', {}, {
          reload: true
        });
      } else {
        var n1 = SessionStorageService.getSessionStorage('needInitiaDetailsBase');
        var n2 = SessionStorageService.getSessionStorage('needInitiaDetailsAll');
        var msgtoshow = '';
        if (n1 == 'true') {
          msgtoshow = 'נתוני בסיס חסרים';
        }

        if (n2 == 'true') {
          msgtoshow = 'פרטים נוספים חסרים';
        }

        if (n1 == 'true' || n2 == 'true') {
          $msgbox.show(msgtoshow)
            .then(function(){
              $state.go('memberdetails', {}, {
                reload: true
              });
            }, function(){
              $state.go('memberdetails', {}, {
                reload: true
              });
            });
        }

        API.IsProfilePictureLoaded().then(function(loaded){
           if (loaded.data == false)
           {
             msgtoshow = 'תמונות פרופיל חסרה.חובה להעלות לפחות תמונה אחת לפני שמתחילים';
             $msgbox.show(msgtoshow)
               .then(function(){
                 $state.go('memberdetails', {}, {
                   reload: true
                 });
               }, function(){
                 $state.go('memberdetails', {}, {
                   reload: true
                 });
               });
           }
        });

      }
    }

    function sendResponseError1(response) {
      $state.go('login', {}, {
        reload: true
      });
    }

    function connectionCallback(status, id) {

      //$scope.isOnline = socketioservice.isUserOnline(id);
      //console.log('connectionCallback ' + $scope.isOnline);
      //$scope.$digest();
    }


    dbsearch.setCriteria("none");
    dbsearch.getFirstNUserIds(maxPageToLoad).
      then(UsersOk).
      catch(UsersError);


    function UsersOk(result) {

      var totalPictures = result.length;
      vm.skipSize = maxPageToLoad;
      for (var i = 0; i < result.length; i++) {
        var picName = '/uploads/' + result[i].rid.toString() + '/raw/' + 100 + '.jpg';
        var x = {
          src: picName,
          id: result[i].id,
          rid: result[i].rid,
          online: result[i].online
        }

        $scope.allmembersthumb.push(x);
      }
    }

    function UsersError(result) {

    }

    $scope.lions = false;
    $scope.allthumberspictures = true;
    $scope.currentMemberToShow = {};

    $(function (j) {
      j("#cLeft").text("אותיות נשארו: 320");
      j(document).on('keypress', '#new_message', function () {
        if (this.value.length > 500) {
          return false;
        }
        j("#cLeft").text("אותיות נשארו: " + (320 - this.value.length));
      });
    });

    $scope.ClosePopup = function () {
      $scope.lions = false;
      $scope.isOnline = false;
      $('onlinetext').removeClass('animated infinite pulse');
      $scope.allthumberspictures = true;
    }


    $scope.AddToChatRoom = function (id, rid, obj) {


      var dataValue = obj.target.attributes.data.value;

      var fromid = SessionStorageService.getSessionStorage('userid');

      var onlineObject = document.getElementById('online' + dataValue);
      API.IsUserInACall(rid, function (result) {

        console.log(result);
        if (result == true) {
          onlineObject.innerHTML = 'לא פנוי, כרגע בשיחה';
          onlineObject.style.color = 'red';
          onlineObject.width = '240px';
          onlineObject.className = 'animated swing';
          setTimeout(function () {
            onlineObject.innerHTML = 'online';
            onlineObject.style.color = 'lime';
            onlineObject.width = '100px';
            onlineObject.className = 'animated infinite pulse';
          }, 3000);

          return;
        }

        //console.log('fromid %s , toid %s', fromid, rid);
        API.SendChatRequest(fromid, id, rid, function (err) {
          if (err != "ok") {
            $state.go('login', {}, {
              reload: false
            });
          } else {
            //$scope.showDialog = true;
          }
        });
      });
    }

    $scope.ShowMember = function (id, rid) {

      $scope.isOnline = false;
      socketioservice.isUserOnlineById(rid, function (err, online) {
        if (err == "ok") {
          $scope.isOnline = online.data;
          if (online == false)
          {
             document.getElementById('onlinetext').style.display = "none";
             $('onlinetext').removeClass('animated infinite pulse');
          } else {
            $('onlinetext').addClass('animated infinite pulse');
          }
        } else {
          $scope.isOnline = false;
        }

        mypage.getuserpage(rid).then(function (results) {

          $scope.content = [];
          for (var i = 0; i < results.data.length; i++) {

            var dir = './mypage/' + rid + '/' + results.data[i].data.filename;
            var x = {
              "dated": results.data[i].dated,
              "content_type": results.data[i].data.content_type,
              "title": results.data[i].data.title,
              "data": results.data[i].data.data,
              "filename": dir

            }
            $scope.content.unshift(x);
          }
        });



        var membersAPI = myConfig.url + "/api/getuserinfoById";
        $http.post(membersAPI, {
          'UserId': rid
        }).success(function (result) {
          vm.userImageList = result.list;
          vm.currentUserAllPictures = [];
          var j = 0;
          for (var i = 1; i < 16; i++) {
            if (vm.userImageList[j] == true) {
              vm.currentUserAllPictures.push('/uploads/' + rid.toString() + '/raw/' + i + '.jpg');
            }
            j++;
          }
          vm.currentUserTotalPictures = vm.currentUserAllPictures.length;
          $scope.currentMemberToShow.src = vm.currentUserAllPictures[0];
          if (vm.userImageList[1] == true) {
            $scope.currentMemberToShow.src1 = vm.currentUserAllPictures[1];
            index1 = 1;
          } else {
            $scope.currentMemberToShow.src1 = vm.currentUserAllPictures[0];
          }
          $scope.currentMemberToShow.id = id;
          $scope.currentMemberToShow.rid = rid;
          $scope.currentMemberToShow.member = result.member;
          $scope.currentMemberToShow.member.age = myutils.getAge($scope.currentMemberToShow.member);
          $scope.allthumberspictures = false;
          $scope.lions = true;

        }).error(function (result) {
          console.log(result);
        });
      });
    }

    $scope.swiperight = function ($event) {
      //console.log("swiperight");
      $scope.next();
    };
    $scope.swipeleft = function ($event) {
      previous();
    };

    $scope.notifyServiceOnChage = function () {
      //console.log($scope.windowHeight);
    };

    var previous = function () {
      if (index > 0) {
        index = index - 1;
      } else {
        index = vm.currentUserTotalPictures - 1;
      }
      $scope.currentMemberToShow.src = vm.currentUserAllPictures[index];


      if (index1 > 0) {
        index1 = index1 - 1;
      } else {
        index1 = vm.currentUserTotalPictures - 1;
      }
      $scope.currentMemberToShow.src1 = vm.currentUserAllPictures[index1];

    }

    $scope.myStyle = {
      //"max-height": Math.min($window.innerHeight - 100, 700)
      "max-height": $window.innerHeight - 200
    };


    $scope.next = function () {
      //console.log('vm.currentUserTotalPictures %d', index);
      index = (index + 1) % vm.currentUserTotalPictures;
      $scope.currentMemberToShow.src = vm.currentUserAllPictures[index];

      index1 = (index1 + 1) % vm.currentUserTotalPictures;
      $scope.currentMemberToShow.src1 = vm.currentUserAllPictures[index1];
    }

    $scope.submit = function (isValid) {
      if (!isValid) {
        console.log("not valid");
      } else {
        if (vm.currentSentMessage.id == $scope.currentMemberToShow.id &&
          vm.currentSentMessage.messagebody == $scope.messagebody) {


          if (cssUpdateTimer1 != null)
            $timeout.cancel(cssUpdateTimer1);

          $scope.showMessageSendFailure = true;
          document.getElementById('sendButton').innerHTML = 'לא נשלח';
          document.getElementById('sendButton').style.color = 'red';
          cssUpdateTimer1 = $timeout(function () {
            $scope.showMessageSendFailure = false;
            document.getElementById('sendButton').style.color = 'white';
            document.getElementById('sendButton').innerHTML = 'שלח הודעה';
          }, 1000)
          return;
        }

        //console.log($scope.messagebody +  " to send to: " + $scope.currentMemberToShow.id);
        //alert ($scope.currentMemberToShow.member.nickName);
        var data = {
          mb: $scope.messagebody,
          title: 'הודעה מ' + $scope.currentMemberToShow.member.nickName,
          toid: $scope.currentMemberToShow.rid
        }
        myhttphelper.doApiPost('sendMessageToMember', data).then(function (response) {

          if (cssUpdateTimer != null)
            $timeout.cancel(cssUpdateTimer);

          $scope.showMessageSendOk = true;
          vm.currentSentMessage.id = $scope.currentMemberToShow.id;
          vm.currentSentMessage.messagebody = $scope.messagebody;

          document.getElementById('sendButton').style.color = 'lightgreen';
          document.getElementById('sendButton').innerHTML = 'הודעה נשלחה';

          cssUpdateTimer = $timeout(function () {
            $scope.showMessageSendOk = false;
            document.getElementById('sendButton').innerHTML = 'שלח הודעה';
            document.getElementById('sendButton').style.color = 'white';
          }, 1000);

        }).catch(function (response) {
          $scope.showMessageSendFailure = true;
          document.getElementById('sendButton').style.color = 'lightred';
          document.getElementById('sendButton').innerHTML = 'לא נשלח';
        });
      }
    }


    $(window).scroll(function () {
      if ($scope.allthumberspictures == false) {
        return;
      }
      if ($(window).scrollTop() + $(window).height() == $(document).height()) {

        dbsearch.getNextNUserIds(maxPageToLoad, vm.skipSize).then(function (result) {
          //console.log("Get next: " + result);
          var totalPictures = result.length;
          if (totalPictures == 0) {
            console.log("no more to present");
            return;
          }
          vm.skipSize += maxPageToLoad;

          for (var i = 0; i < result.length; i++) {
            var picName = '/uploads/' + result[i].rid.toString() + '/raw/' + 100 + '.jpg';
            var x = {
              src: picName,
              id: result[i].id,
              rid: result[i].rid
            }
            $scope.allmembersthumb.push(x);
            //$scope.$apply();
          }
        }).catch(function (result) {

        });
      }
    });
  }
]).config(function (IdleProvider, KeepaliveProvider, myConfig) {
  // configure Idle settings
  IdleProvider.idle(myConfig.idletimeSeconds); // in seconds
  IdleProvider.timeout(myConfig.timeoutSeconds); // in seconds
  KeepaliveProvider.interval(2); // in seconds
})
  .run(function (Idle) {
    // start watching when the app runs. also starts the Keepalive service by default.
    Idle.watch();
  });
