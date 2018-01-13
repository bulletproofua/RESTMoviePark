'use strict';
var data = require( "../../server/boot/data.json" );
var _ = require( 'underscore' );
var Backbone = require('backbone');

module.exports = function(Collaborativefiltering) {   
    function similarity( currentUserId, result, target ) {
        var data =  JSON.stringify(result);
        result = JSON.parse(data);
        // need one more iteration
        result.push({
            "UserId": -1,
            "identityUsers": {
            "UserId": -1,
            "UserName": "Last"
            }
        });
        var userNames = [];
        var currentUser;
        var allUsers = [];
        var User = '';
        var prevUserId = '';
        var usersInfoForAR = [];
        result.forEach(function(i) {
            if( i.identityUsers.UserId != prevUserId ) {
                if( User !== '') {
                    if( prevUserId != currentUserId ){
                        allUsers.push(User);
                    } else {
                        currentUser = User;
                    }
                } 
                if( i.identityUsers.UserName === "Last") {
                return;
                } 
                prevUserId = i.identityUsers.UserId;
                userNames.push(i.identityUsers.UserName);
                User = { 
                    UserID: i.UserId,
                    UserName: i.identityUsers.UserName,
                    Ratings: {}
                };
                
            }
            
            User.Ratings[i.MovieId] = i.Rating; 
        }, this);

        var totalSumA = 0;

        for( var id in currentUser.Ratings){
            totalSumA += Math.pow(currentUser.Ratings[id], 2);
        }
        totalSumA = Math.sqrt(totalSumA);

        var totalSim = 0;
        var keys = [];
        var prediction = { };

        allUsers.forEach(function(user) {
            var totalSumB = 0;
            
            for( var id in user.Ratings){
                totalSumB += Math.pow(user.Ratings[id], 2);
            }
            totalSumB = Math.sqrt(totalSumB);
            
            var sum = 0;
    
            for( var id in currentUser.Ratings){
                if (id in user.Ratings) {
                    sum += currentUser.Ratings[id] * user.Ratings[id];
                }
            }
    
            var similarity = sum / (totalSumA * totalSumB);

           
            // console.log(" --- >similarity")
            if (similarity > 0.3){
                
                totalSim += similarity;
    
                for (var id in user.Ratings) {
                    var predValue = user.Ratings[id] * similarity;
                    if ( id in prediction) {
                        prediction[id] += predValue;                    
                    } else if (!(id in currentUser.Ratings)) {
                        prediction[id] = predValue;
                        keys.push(id);
                    }
                }
                
                var userObj = {
                    UserID: user.UserID,
                    UserName: user.UserName,
                    similarity: similarity
    
                }
                usersInfoForAR.push(userObj);            
                // console.log(' \n usersInfoForAR', usersInfoForAR)
            }

            
    
        }, this);

        if( target == 'AR') {
            return usersInfoForAR;
        } else {
            return  { prediction: prediction, totalSim: totalSim };
        }
    }


    Collaborativefiltering.Collaborativefiltering = function(currentUserId, cb){
        var filter = { 
            include: [{
                    relation: "movies", 
                        scope: {
                            fields: ["MovieId", "Title"]
                        }
                    },{
                    relation:"identityUsers", 
                        scope:{
                            fields:["UserId","UserName"]
                        }
                    }], 
               fields:["UserId","MovieId", "Rating" ],
               order: 'UserId ASC',
            }

        Collaborativefiltering.app.models.UsersMovies.find(filter, function(err, result){
            if (err) {
                console.log(err);
                return cb(err);
            } else {
                var res = similarity(currentUserId, result, "");
                var prediction = res.prediction;
                var totalSim = res.totalSim;
                for (var id in prediction) {
                    prediction[id] /= totalSim;
                }
            
                var predictionSort = [];
                for (var id in prediction) {
                    if(prediction[id] > 5 ){
                        predictionSort.push([id, prediction[id]]);
                    }
                }
                
                predictionSort.sort(function(a, b) {
                    return b[1] - a[1];
                });
            }
            return cb(null, predictionSort);
        });
    }


    Collaborativefiltering.remoteMethod("Collaborativefiltering", {
		description: " ", 
		accepts: [{
           arg: "currentUserId", type: "string",
           required: true
        }],
		http: {
			path: "/Collaborativefiltering",
			verb: "get"
		},
		returns: {
			root: true
		}
    });
    

    Collaborativefiltering.similarity = function(currentUserId, cb){
        var res ;
        var filter = { 
            include: [{
                    relation: "movies", 
                        scope: {
                            fields: ["MovieId", "Title"]
                        }
                    },{
                    relation:"identityUsers", 
                        scope:{
                            fields:["UserId","UserName"]
                        }
                    }], 
               fields:["UserId","MovieId", "Rating" ],
               order: 'UserId ASC',
            }

        Collaborativefiltering.app.models.UsersMovies.find(filter, function(err, result){
            if (err) {
                return cb(err);
            } else {
                res = similarity(currentUserId, result, "AR");
                return cb(null, res);
            }
          
        })
        
    }

    Collaborativefiltering.remoteMethod("similarity", {
		description: " ", 
		accepts: [{
           arg: "currentUserId", type: "string",
           required: true
        }],
		http: {
			path: "/similarity",
			verb: "get"
		},
		returns: {
            arg: "data",
            type: "object",
			root: true
		}
    });
    


// TEST 
    // function usersRatings (id){   
    //     var currentUserRatings = {};
    //     for (var i = 0; i < id.length; i++) {
    //         var key = id[i].id;
    //         var val = id[i].rating    
    //         currentUserRatings[key] = val;   
    //     }
    //     return currentUserRatings;
    // }    
    
    // var myData = data;
    // var itemSet =[];
    // var currentUserId = 'userson1';
    //         var currentUser = {};
        
        
    //         var allUsers = [];
    //         var userNames = []
    //         var index = 0;
    //         for(var i in myData){
    //             // console.log("index", index);
    //             userNames.push(i);
    //             if( i != currentUserId){
                    
    //                 var rating = usersRatings(myData[i]);
    //                 var o = {
    //                     UserID: index,
    //                     UserName: i,
    //                     Ratings: rating
    //                    }
    //                    allUsers.push(o);  
    //                    index++; 
    //             } else {
    //                 var rating = usersRatings(myData[i]);
    //                 currentUser = {
    //                     UserID: index,
    //                     UserName: i,
    //                     Ratings: rating
    //                    }
    //                    index++; 
    //             }
    //         }
        
    //         // console.log(currentUser);
    //         var totalSumA = 0;
        
    //         for( var id in currentUser.Ratings){
    //             // console.log(id , currentUser.Ratings[id])
    //             totalSumA += Math.pow(currentUser.Ratings[id], 2);
    //         }
        
    //         // console.log(totalSumA);
        
    //         totalSumA = Math.sqrt(totalSumA);
    //         // console.log(totalSumA);
        
    //         var totalSim = 0;
    //         var keys = [];
    //         var prediction = { };
        
    //         allUsers.forEach(function(user) {
    //             // console.log(user);
    //             var totalSumB = 0;
                
    //             for( var id in user.Ratings){
    //                 totalSumB += Math.pow(user.Ratings[id], 2);
    //             }
    //             // console.log(totalSumB);
    //             totalSumB = Math.sqrt(totalSumB);
                
    //             var sum = 0;
        
    //             for( var id in currentUser.Ratings){
    //                 if (id in user.Ratings) {
    //                     sum += currentUser.Ratings[id] * user.Ratings[id];
    //                 }
    //             }
    //             // console.log(sum);
        
    //             var similarity = sum / (totalSumA * totalSumB);
    //             console.log("!!!!similarity", similarity);
                
    //             if (similarity > 0.32){
                    
    //                 totalSim += similarity;
        
    //                 for (var id in user.Ratings) {
    //                     var predValue = user.Ratings[id] * similarity;
    //                     if ( id in prediction) {
    //                         prediction[id] += predValue;                    
    //                     } else if (!(id in currentUser.Ratings)) {
    //                         prediction[id] = predValue;
    //                         keys.push(id);
    //                     }
    //                 }
    //             }
        
    //         }, this);
        
    //         for (var id in prediction) {
    //             prediction[id] /= totalSim;
    //         }
        
    //         var predictionSort = [];
    //         for (var id in prediction) {
    //             if(prediction[id] > 5 ){
    //                 predictionSort.push([id, prediction[id]]);
    //             }
    //         }
            
    //         predictionSort.sort(function(a, b) {
    //             return b[1] - a[1];
    //         });
        
            // console.log(predictionSort);
    
};
