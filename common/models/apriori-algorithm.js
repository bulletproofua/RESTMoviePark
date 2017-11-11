'use strict';
var app = require('../../server/server');
var data = require( "../../server/boot/data.json" );
var _ = require( 'underscore' );
var Backbone = require('backbone');
var async = require("async");


module.exports = function( Apriorialgorithm ) {

  var frequentSets = [];
  var notFrequentSets = [];
  var representativeSets = [];
  function AprioriAlgorithm (filter, support, confidence, cb){
    
    Apriorialgorithm.app.models.UsersMovies.find(filter, function(err, result){
      if (err) {
        return cb(err);
      } else {       
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
        var User = '';
        var allUsers = [];          
        var prevUserId = '';
        var usersInfoForAR = [];
        var finalData = [];
        var itemSet = [];
        var elements = [];

        result.forEach(function(i) {
            if( i.identityUsers.UserId != prevUserId ) {
                if( User !== '') {
                  allUsers.push(User);
                } 
                if( i.identityUsers.UserName === "Last") {
                  return; 
                } 
                prevUserId = i.identityUsers.UserId;
                userNames.push(i.identityUsers.UserName);
                User = { 
                    UserID: i.UserId,
                    UserName: i.identityUsers.UserName,
                    Ratings: []
                };                
            }
            User.Ratings.push(i.MovieId);
        }, this);
        
        allUsers.forEach(function( data){
          finalData.push(data.Ratings);
        });

        finalData.forEach(function(data){
          elements =  _.union(elements, data);
        });
        
        elements.sort(function(a,b){
          return a - b ;
        });
        
        elements.forEach(function( data ){
          var el = [data];
          itemSet.push(el);
        })

        var supData, filteredData;
        var lastResult = [];

        while (true) {
          supData = countSupport(finalData, itemSet);

          filteredData = supCountFilter(supData, support);
    
          lastResult = filteredData;
    
          frequentSets = frequentSets.concat(filteredData);
          notFrequentSets = notFrequentSets.concat(minSupportArr(supData, support));
    
          itemSet = createPairs(filteredData);
    
          if (itemSet.length == 0) break;
        }
          var representativeSets = getRepresentativeSets(frequentSets);
    
          var rules = getRules(representativeSets, frequentSets, confidence);
          console.log(rules);
          cb( null, rules)
      }        
    });
  }
  Apriorialgorithm.AprioriAlgorithm = function(currentUserId, support, confidence, cb){ 

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

    AprioriAlgorithm( filter, support, confidence, function(err, res){
        cb(null, res );
    });
  }

    Apriorialgorithm.remoteMethod("AprioriAlgorithm", {
      description: " ",
      accepts: [
        {
          arg: "currentUserId", type: "string",
          required: true
        },{
            arg: "support", type: "string",
            required: true
        }, {
          arg: "confidence", type: "string",
          required: true
        }],
      http: {
        path: "/AprioriAlgorithm",
        verb: "get"
      },
      returns: {
        arg: "data",
        type: "object",
        root: true
      }
    });


    Apriorialgorithm.ApriorialgorithmAndCollaborativefiltering = function( currentUserId, support, confidence, cb ){

      var CF = Apriorialgorithm.app.models.collaborativeFiltering;

        CF.similarity(currentUserId, function(err, result){
          if(err) {
            return cb(err);
          } else {
            var similarityUsers = [];
            result.forEach(function(data){
              similarityUsers.push(data.UserID);
            });  

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
                where:{ "UserId": {inq: similarityUsers} },
                order: 'UserId ASC',
              }  

            AprioriAlgorithm( filter, support, confidence, function(err, res){
              if(err) {
                return cb(err);
              } else {
                cb(null, res );
              }
            });
          }            
        });
    }

    Apriorialgorithm.remoteMethod("ApriorialgorithmAndCollaborativefiltering", {
      description: " ",
      accepts: [
        {
          arg: "currentUserId", type: "string",
          required: true
        },{
            arg: "support", type: "string",
            required: true
        }, {
          arg: "confidence", type: "string",
          required: true
        }],
      http: {
        path: "/ApriorialgorithmAndCollaborativefiltering",
        verb: "get"
      },
      returns: {
        arg: "data",
        type: "object",
        root: true
      }
    });


function getOnlyIds(data){
    var result = [];

    for(var user in data){
        var arr = [];
        data[user].forEach(function(movie) {
            arr.push(Number(movie['id']));
        });
        result.push(arr);
    }
    return result;
};

function includes(itemsOfUser, itemSet) {

    for(var i = 0; i < itemSet.length; i++){
        if (itemsOfUser.indexOf(itemSet[i]) == -1) return false;
    };
    return true;
}

function countSupport(data, itemSets){
    var itemSetsLocal = [];

    for (var j = 0; j < itemSets.length; j++) {
        itemSetsLocal.push( { id: itemSets[j] , support: 0});
        for (var i = 0; i < data.length; i++) {
            if (includes(data[i], itemSetsLocal[j]['id'])){
                itemSetsLocal[j]['support']++;
            }
        }
    }
    return itemSetsLocal;
}

function check(arr){
  var res = false

  for (var i = 0; i < arr.length; i++) {
    for (var j=i+1 ; j < arr.length; j++) {
        if(arr[i].id == arr[j].id){
          res = true;
        }
    }
  }
  return res;
}

function contains(array, element){

  for (var i = 0; i < array.length; i++) {
       if( _.isEqual(array[i], element)) return true;
  }
  return false;
}

function getSupport(array, element){
  
    for (var i = 0; i < array.length; i++) {
         if( _.isEqual(array[i].id, element)) {
          return array[i].support;
         }  
    }
    return null;
}

function createPairs(itemSets){
  var arrOfCouple = [];

  for (var i = 0; i < itemSets.length; i++) {
    for (var j = i+1; j < itemSets.length; j++) {
      var newPair = createItemSet(itemSets[i].id, itemSets[j].id);
      if( newPair != null){
        if( !contains(arrOfCouple, newPair) && areSubsetsFrequent(newPair) ){
          arrOfCouple.push( newPair );
        }
      }
    }
  }
  return arrOfCouple;
}

function createItemSet(itemSet1, itemSet2){
  var uniqueElements = [];
  if(itemSet1.length != itemSet2.length ) return null;
  if(!_.isEqual(itemSet1.slice(0, itemSet1.length-1), itemSet2.slice(0, itemSet2.length-1))) return null;
    itemSet1.forEach(function(item){
      if(uniqueElements.indexOf(item) == -1){
        uniqueElements.push(item);
      }
    })
    itemSet2.forEach(function(item){
      if(uniqueElements.indexOf(item) == -1){
        uniqueElements.push(item);
      }
    })

    if( uniqueElements.length == itemSet1.length+1){
      return uniqueElements
    } else {
      return null;
    }
};

function supCountFilter(arr, minCount){
  var dataArr = [];
  var maxLength = arr.length;
  for (var i = 0; i < maxLength; i++) {
    if(arr[i].support >= minCount) {
      dataArr.push(arr[i]);
    }
  }
  return dataArr;
}

function minSupportArr (arr, minCount){
  var dataArr = [];
  var maxLength = arr.length;
  for (var i = 0; i < maxLength; i++) {
    if(arr[i].support < minCount) {
      dataArr.push(arr[i].id);
    }
  }
  return dataArr;
}

function deleteMinSupElements (arrWithPairs, arrWithMinSup) {
    var itemSet = [];
    if( arrWithMinSup.length == 0 || arrWithPairs.length == 0 ){
      return arrWithPairs
    }
    for (var i = 0; i < arrWithPairs.length; i++) {
      var minScore = 9999999;
      arrWithPairs[i].length
      for (var j = 0; j < arrWithMinSup.length; j++) {
        var Arr = _.uniq(arrWithPairs[i].concat(arrWithMinSup[j]));
        var minScore = min( minScore, Arr.length );
        if( minScore != arrWithPairs[i].length && j == arrWithMinSup.length-1){
          itemSet.push(arrWithPairs[i]);
        }
      }
    }
    return itemSet;
};

function areSubsetsFrequent(pair){

  var include = true;

    for(var i = 0; i < notFrequentSets.length; i++){
        if (includes(pair, notFrequentSets[i])) {
            include = false;
            break;
        }
    }
    return include;
}

function min(a, b) {
  return a < b ? a : b;
}

function getRepresentativeSets(sets) {

    for (var i = sets.length-1; i >= 0; i--){

        var temp = [];

        var included = false;

        if (sets[i].id.length == 1) break;

        var repLength = representativeSets.length;

        for (var j = repLength - 1; j >= 0; j--){

            if (sets[i].id.length != representativeSets[j].id.length){
                if (includes(representativeSets[j].id, sets[i].id)){

                    included = true;

                    if (sets[i].support > representativeSets[j].support){
                        temp = temp.concat(sets[i]);
                    }
                      break;
                }
            }
        }

        if (!included) {
          temp = temp.concat(sets[i]);
        }

        representativeSets = representativeSets.concat(temp);
    }
    return representativeSets;
}


function getRules( representativeSets, frequentSets, CONFIDENCE){
  var rules = [];

  for (var k = 0; k < representativeSets.length; k++){
      let s = representativeSets[k]; 
      var fromList = [];
      var toList = [];
      var rulesList = [];
      var from = [];
      var to = [];
      for (var i = 1; i < s.id.length; i++)
      permutate(s.id, i, s.support);
      
      for (var q = 0; q < fromList.length; q++) {
        rules.push(rulesList[q]);
      }
      return rules;
      
      function permutate(arr, limit, support) {
        permuteIteration(arr, 0, limit, support);
      }
      
      function permuteIteration(arr, index, limit, support) {
        if (index >= limit) {
      
          for (var i = 0; i < limit; i++) from.push(arr[i]);
          from.sort();
          var includedInRules = false;
      
          for (var i = 0; i < rulesList.length; i++) {
            if (includes(from, rulesList[i].from)) {
              includedInRules = true;
              break;
            }
          }
      
          if (!contains(fromList, from) && !includedInRules) {
            var fromSupport = getSupport(frequentSets, from);
            var ruleConfidence = (support / fromSupport);
            if (ruleConfidence >= CONFIDENCE) {
              fromList.push(from);
              for (var i = limit; i < arr.length; i++) {
                to.push(arr[i]);
              }
              toList.push(to.sort());
              rulesList.push({
                from: from,
                to: to,
                supportFrom: fromSupport,
                support: support,
                confidence: ruleConfidence
              });
            }
            to = [];
          }
          from = [];      
          return;
        }
      
        for (var i = index; i < arr.length; i++) {
          var temp = arr[index];
          arr[index] = arr[i];
          arr[i] = temp;
      
          permuteIteration(arr, index + 1, limit, support);
      
          temp = arr[index];
          arr[index] = arr[i];
          arr[i] = temp;
        }
      }
  } 
  
}
//========================= Тести з файлика==========================================================

  // var myData = data;
  // var frequentSets = [];
  // var notFrequentSets = [];
  // var representativeSets = [];
  // var supArr = [];

// function Apriori(dataBaseTDB, support, CONFIDENCE){
//     var supData, filteredData;
//     var dataWhithPairs =[];
//     var minSupArr = [];
//     var finalData;
//     var itemSet =[];
//     var lastResult = [];
//     var lastSet;

//     // itemSet = [ ['A'], ['B'], ['C'], ['D'], ['E'], ['F'], ['G']   ];
//     // finalData = [
//     //     ['A','C','D', 'F', 'G'],
//     //     ['A','B', 'C', 'D', 'F'],
//     //     ['C', 'D', 'E'],
//     //     ['A', 'D', 'F'],
//     //     ['A','C','D' , 'E', 'F'],
//     //     ['B', 'C', 'D', 'E', 'F', 'G']
//     // ]

//     for(var key in myData){
//         for (var i = 0 ; i < myData[key].length; i++) {
//           var elementOfMyData = [ Number(myData[key][i].id )];
//           if(!contains(itemSet , elementOfMyData )){
//             itemSet.push( elementOfMyData );
//           }
//         }
//     }
    
//     itemSet.sort(function(a,b){
//       return a - b ;
//     });

//     console.log('itemSet 2 ===> ', itemSet)

//   finalData = getOnlyIds(myData);
//   // console.log("myData _>", myData);
//   // console.log("finalData _>", finalData);

//   while (true) {
//       supData = countSupport(finalData, itemSet);

//       filteredData = supCountFilter(supData, support);

//       lastResult = filteredData;

//       frequentSets = frequentSets.concat(filteredData);
//       notFrequentSets = notFrequentSets.concat(minSupportArr(supData, support));

//       itemSet = createPairs(filteredData);

//       if (itemSet.length == 0) break;
//     }
//       var representativeSets = getRepresentativeSets(frequentSets);

//       var rules = getRules(representativeSets, frequentSets, CONFIDENCE);
//       // console.log(rules);
//     return rules;
// }

// var aprioriResult = Apriori(myData, 3, 0.75);

};
