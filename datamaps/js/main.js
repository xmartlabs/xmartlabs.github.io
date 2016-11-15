// README https://github.com/markmarkoh/datamaps/blob/master/README.md#getting-started

const COMMITSAREA = "commitsArea";
const COMMITSPOP = "commitsPop";
const DEVSMILLION = "devPerMil";

var commitsPop = null;
var commitsArea = null;
var devsPop = null;
var map = null;

$(function(){
    $.getJSON('/datamaps/data/commitsPerPop.json',function(data){
         commitsPop = data
         console.log('loading pop commits');
         map.updateChoropleth(commitsPop);
    }).error(function(){
        console.log('error reading map data');
    });
    $.getJSON('/datamaps/data/commitsPerArea.json',function(data){
         commitsArea = data
         console.log('loading area commits');
    }).error(function(){
        console.log('error reading map data');
    });
    $.getJSON('/datamaps/data/devsPerMillion.json',function(data){
         devsPop = data
         console.log('loading devs');
    }).error(function(){
        console.log('error reading map data');
    });
});

function initMap(jsondata) {
    var config = {
          element: document.getElementById('container'),
          fills: {
              L8: '#b10026',
              L7: '#e31a1c',
              L6: '#fc4e2a',
              L5: '#fd8d3c',
              L4: '#feb24c',
              L3: '#fed976',
              L2: '#ffeda0',
              L1: '#ffffcc',
              defaultFill: '#eaeaea'
          },
          data: jsondata,
          geographyConfig: {
              hideAntarctica: true,
              borderWidth: 0.5,
              borderOpacity: 0.6,
              borderColor: '#575757',
              popupTemplate: function(geography, data) { // This function should just return a string
                let isoCode = geography.id;
                return `<div class="hoverinfo"> <h4>${geography.properties.name}</h4> ${data.value} </div>`; //.toFixed(2)
              },
              popupOnHover: true, // True to show the popup while hovering
              highlightFillColor: 'cadetblue',
              highlightBorderColor: 'cadetblue',
          },
        }
   map = new Datamap(config);
};

function selectedMapType() {
    let type = document.getElementById("dropdownselect").value;
    if (type == COMMITSPOP) {
      map.updateChoropleth(commitsPop);
      console.log(commitsPop['URY']);
      console.log('update pop commits');
    } else if (type == COMMITSAREA) {
      map.updateChoropleth(commitsArea);
      console.log(commitsArea['URY']);
      console.log('update area commits');
    } else if (type == DEVSMILLION) {
      map.updateChoropleth(devsPop);
      console.log('update dev million');
    }
};

initMap({});