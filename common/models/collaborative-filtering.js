'use strict';
var data = require( "../../server/boot/data.json" );
var _ = require( 'underscore' );
var Backbone = require('backbone');

module.exports = function(Collaborativefiltering) {
    
    var myData = data;
    var itemSet =[];
    var currentUserId = 'userson1';
    var currentUser = {};

    function usersRatings (id){   
        var currentUserRatings = {};
        for (var i = 0; i < id.length; i++) {
            var key = id[i].id;
            var val = id[i].rating    
            currentUserRatings[key] = val;   
        }
        return currentUserRatings;
    }    

    var allUsers = [];
    var userNames = []
    var index = 0;
    for(var i in myData){
        // console.log("index", index);
        userNames.push(i);
        if( i != currentUserId){
            
            var rating = usersRatings(myData[i]);
            var o = {
                UserID: index,
                UserName: i,
                Ratings: rating
               }
               allUsers.push(o);  
               index++; 
        } else {
            var rating = usersRatings(myData[i]);
            currentUser = {
                UserID: index,
                UserName: i,
                Ratings: rating
               }
               index++; 
        }
    }

    // console.log(currentUser);
    var totalSumA = 0;

    for( var id in currentUser.Ratings){
        // console.log(id , currentUser.Ratings[id])
        totalSumA += Math.pow(currentUser.Ratings[id], 2);
    }

    console.log(totalSumA);

    totalSumA = Math.sqrt(totalSumA);
    console.log(totalSumA);

    var totalSim = 0;
    var keys = [];
    var prediction = { };

    allUsers.forEach(function(user) {
        // console.log(user);
        var totalSumB = 0;
        
        for( var id in user.Ratings){
            totalSumB += Math.pow(user.Ratings[id], 2);
        }
        // console.log(totalSumB);
        totalSumB = Math.sqrt(totalSumB);
        
        var sum = 0;

        for( var id in currentUser.Ratings){
            if (id in user.Ratings) {
                sum += currentUser.Ratings[id] * user.Ratings[id];
            }
        }
        // console.log(sum);

        var similarity = sum / (totalSumA * totalSumB);
        console.log("similarity", similarity); // відібрати собі юзерів хічічччічі

        if (similarity > 0.1){
            
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
        }

    }, this);

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

    console.log(predictionSort);
    
};
