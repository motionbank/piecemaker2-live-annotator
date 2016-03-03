"use strict";

angular.module('liveDocuApp')

    .controller( 'TextAreaController',
        ['focus','piecemaker2','$rootScope','$timeout',
            function (focus,piecemaker2,$root,$timeout) {
        this.blocks = [
            {html:'',dirty:false}
        ];
        var timeoutPromise;
        this.change = function ( i ) {
            var blocksToUpdate = [i];
            if ( this.blocks[i].html ) {
                var html = this.blocks[i].html;
                html = html.replace(/[\s]*$/ig,'');
                var pieces = html.split(/(?:<div><br><\/div>|<br><br>)/ig);
                if (pieces.length > 1 && pieces[pieces.length-1] !== '' && pieces[pieces.length-1] !== '<br>' ) {
                    var blockText = this.blocks[i].html,
                        pieceText = pieces[pieces.length-1];
                    var blockTextNew = blockText.slice(0,blockText.length-pieceText.length);
                    blockTextNew = blockTextNew.replace(/((<div><br><\/div>|<br><br>)[\s]*)+$/i,'');
                    this.blocks[i].html = blockTextNew;
                    var newTime = (new Date()).getTime();
                    if (i < this.blocks.length-1 && this.blocks[i].time) {
                        newTime = this.blocks[i].time; // splitting an item, inherit time
                    }
                    pieceText = pieceText.replace(/^(<br>)*/ig,'');
                    this.blocks.splice(i+1,0,{html:pieceText,time:newTime});
                    focus('text-block-'+(i+1));
                    blocksToUpdate.push(i+1);
                } else {
                    if (!this.blocks[i].time) this.blocks[i].time = (new Date()).getTime();
                }
            }
            var pm2 = piecemaker2.getClient(),
                blocks = this.blocks;
            blocksToUpdate.forEach(function(i){
                blocks[i].dirty = true;
            });
            if (timeoutPromise) $timeout.cancel(timeoutPromise);
            timeoutPromise = $timeout(function() {
                blocks.forEach(function(block,i){
                    if (!block.dirty) return;
                    var description = $('<div>' + block.html + '</div>').text();
                    if (block.id) {
                        pm2.getEvent($root.currentGroup.id, block.id, function (evt) {
                            evt.fields['html-content'] = block.html;
                            evt.fields['description'] = description;
                            evt.fields['title'] = description.slice(0, 100) + ' …';
                            pm2.updateEvent($root.currentGroup.id, block.id, evt, function (evt) {
                                block.dirty = false;
                            });
                        });
                    } else {
                        var fields = {
                            'html-content': block.html,
                            description: description,
                            title: (description.slice(0, 100) + ' …')
                        };
                        if ($root.currentContext) {
                            fields['context_event_id'] = $root.currentContext.id;
                            fields['context_event_type'] = $root.currentContext.type;
                        }
                        pm2.createEvent($root.currentGroup.id, {
                            utc_timestamp: block.time,
                            type: 'document-fragment',
                            fields: fields
                        }, function (evt) {
                            block.id = evt.id;
                            block.time = evt.utc_timestamp.getTime();
                            block.dirty = false;
                            $root.$digest();
                        });
                    }
                });
            },2000);
        };
    }])

    .controller('SigninController',['piecemaker2', function (pm2) {
        this.user = {
            email: 'super-admin-1431529378@example.com',
            password: 'super-admin-1431529378'
        };
        this.login = function(user) {
            if (user.email && user.password) pm2.login(user);
        };
    }])

    .controller('GroupController',['$rootScope','piecemaker2',function($root,pm2){
        var self = this;
        this.groups = [];
        $root.currentGroup = undefined;
        $root.currentContext = undefined;
        pm2.getClient().listGroups(function(groups){
            self.groups = groups;
            $root.$digest();
        });
        this.select = function (group_id) {
            $root.currentGroup = undefined;
            self.groups.forEach(function(g,i){
                if (g.id == group_id) $root.currentGroup = g;
            });
        }

    }])

    .controller('ContextController', ['$scope','$rootScope','piecemaker2',function($scope,$root,pm2){
        var self = this;
        this.events = [];
        var init = function () {
            var group = $root.currentGroup;
            $root.currentContext = undefined;
            pm2.getClient().listEventsOfType(group.id,'video',function(videos){
                self.events = videos;
                $root.$digest();
            });
        };
        init();
        $scope.$watch("$root.currentGroup",function(nextGroup){
            init();
        });
        this.select = function (event_id) {
            self.events.forEach(function(e,i){
                if (e.id == event_id) {
                    $root.currentContext = e;
                }
            });
        }
    }]);