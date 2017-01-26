// README https://github.com/markmarkoh/datamaps/blob/master/README.md#getting-started

const COMMITS = "commits";
const COMMITSPOP = "commitsPop";
const DEVSMILLION = "devPerMil";
const COMMITSANDDEVS = "commitsAndDevs";

var commits = null;
var commitsPop = null;
var devsPop = null;
var commitsAndDevs = null;
var map = null;

$(function(){
    $.getJSON('/githubdata/data/commits.json',function(data){
        commits = data
        console.log('loading commits');
        map.updateChoropleth(commits);
    }).error(function(){
        console.log('error reading map data');
    });
    $.getJSON('/githubdata/data/commitsPerPop.json',function(data){
        commitsPop = data
        console.log('loading pop commits');
    }).error(function(){
        console.log('error reading map data');
    });
    $.getJSON('/githubdata/data/devsPerMillion.json',function(data){
        devsPop = data
        console.log('loading devs');
    }).error(function(){
        console.log('error reading map data');
    });
    $.getJSON('/githubdata/data/commitsAndDevsPerPop.json',function(data){
        commitsAndDevs = data
        console.log('loading pop commits and devs');
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
          done: function(datamap) {
             datamap.svg.call(d3.behavior.zoom().on("zoom", redraw));

             function redraw() {
                  datamap.svg.selectAll("g").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
             }
          },
          geographyConfig: {
              hideAntarctica: true,
              borderWidth: 0.5,
              borderOpacity: 0.6,
              borderColor: '#575757',
              popupTemplate: function(geography, data) { // This function should just return a string
                let isoCode = geography.id;
                return `<div class="hoverinfo"> <h4>${geography.properties.name}</h4> ${formatNumber(data.value)} </div>`; //.toFixed(2)
              },
              popupOnHover: true, // True to show the popup while hovering
              highlightFillColor: 'cadetblue',
              highlightBorderColor: 'cadetblue',
          },
        }
   map = new Datamap(config);
};

function formatNumber(n) {
    return (+n.toFixed(2)).toString().replace(/(\d)(?=(\d{3})+(?:\.|$))/g, '$1,');
};

function selectedMapType() {
    let type = document.getElementById("dropdownselect").value;
    if (type == COMMITS) {
      map.updateChoropleth(commits);
    } else if (type == COMMITSPOP) {
      map.updateChoropleth(commitsPop);
    } else if (type == DEVSMILLION) {
      map.updateChoropleth(devsPop);
    } else if (type == COMMITSANDDEVS) {
      map.updateChoropleth(commitsAndDevs);
    }
    // map.svg.call(d3.behavior.zoom().scale(1));
    // map.svg.call(d3.behavior.zoom().translate([0, 0]));
};

function initCommitsTable() {
    var countries = ['', 'United States','Germany','China','United Kingdom','Canada','France','India','Japan','Russia','Spain'];
    var commitsNumber = [83435128, 16607241, 16489205, 15316503, 10343840, 10295446, 6856128, 6039780, 5710194, 5466626];

    var colors = ['steelBlue','steelBlue','steelBlue','steelBlue','steelBlue','steelBlue','steelBlue','steelBlue','steelBlue','steelBlue'];

    var grid = d3.range(10).map(function(i){ return {'x1':0,'y1':0,'x2':0,'y2':320}; });

    var tickVals = grid.map(function(d,i){ return i*10000000; });

    var xscale = d3.scale.linear()
            .domain([0,100000000])
            .range([0,722]);

    var yscale = d3.scale.linear()
            .domain([0,countries.length])
            .range([0,320]);

    var colorScale = d3.scale.quantize()
            .domain([0,countries.length])
            .range(colors);

    var canvas = d3.select('#commits-table-wrapper')
            .append('svg')
            .attr({'width':900,'height':380});

    var grids = canvas.append('g')
              .attr('id','grid')
              .attr('transform','translate(100,10)')
              .selectAll('line')
              .data(grid)
              .enter()
              .append('line')
              .attr({'x1':function(d,i){ return i*72; },
                 'y1':function(d){ return d.y1; },
                 'x2':function(d,i){ return i*72; },
                 'y2':function(d){ return d.y2; },
              })
              .style({'stroke':'#adadad','stroke-width':'1px'});

    var xAxis = d3.svg.axis();
    xAxis
        .orient('bottom')
        .scale(xscale)
        .tickFormat(function(d) {
          if (d == 0) {
            return d;
          } else {
            return d/1000000 + "M";
          }
        })
        .tickValues(tickVals);

    var yAxis = d3.svg.axis();
    yAxis
        .orient('left')
        .scale(yscale)
        .tickSize(2)
        .tickFormat(function(d,i){ return countries[i]; })
        .tickValues(d3.range(17));

    var y_xis = canvas.append('g')
              .attr("transform", "translate(100,0)")
              .attr('id','yaxis')
              .call(yAxis);

    var x_xis = canvas.append('g')
              .attr("transform", "translate(100,320)")
              .attr('id','xaxis')
              .call(xAxis);

    var chart = canvas.append('g')
              .attr("transform", "translate(100,0)")
              .attr('id','bars')
              .selectAll('rect')
              .data(commitsNumber)
              .enter()
              .append('rect')
              .attr('height',19)
              .attr({'x':0,'y':function(d,i){ return yscale(i)+19; }})
              .style('fill',function(d,i){ return colorScale(i); })
              .attr('width',function(d){ return xscale(d) + "px"; });


    var transit = d3.select("svg").selectAll("rect")
                .data(commitsNumber)
                .transition()
                .duration(1000)
                .attr("width", function(d) {return xscale(d); });

    var transitext = d3.select('#bars')
              .selectAll('text')
              .data(commitsNumber)
              .enter()
              .append('text')
              .attr({'x':function(d) {return xscale(d)+10; },'y':function(d,i){ return yscale(i)+35; }})
              .text(function(d){ return formatNumber(d); })
              .style({'fill':'steelBlue','font-size':'14px'});
}

function initStarsTimeline() {
    // Set the dimensions of the canvas / graph
    var margin = {top: 30, right: 20, bottom: 30, left: 70},
        width = 800 - margin.left - margin.right,
        height = 270 - margin.top - margin.bottom;

    // Parse the date / time
    var parseDate = d3.time.format("%Y-%m-%d").parse;

    // Set the ranges
    var x = d3.time.scale().range([0, width]);
    var y = d3.scale.linear().range([height, 0]);

    // Define the axes
    var xAxis = d3.svg.axis().scale(x)
        .orient("bottom").ticks(5);

    var yAxis = d3.svg.axis().scale(y)
        .orient("left").ticks(5);

    // Define the line
    var valueline = d3.svg.line()
    	.x(function(d) { return x(d.date1); })    //  <= Change to date1
      .y(function(d) { return y(d.close); });

    // Adds the svg canvas
    var svg = d3.select("#stars-timeline-wrapper")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform",
                  "translate(" + margin.left + "," + margin.top + ")");

    // Get the data
    d3.csv("/githubdata/data/stars-timeline.csv", function(error, data) {
        data.forEach(function(d) {
    		    d.date1 = parseDate(d.date);    //  <= Change to date1
            d.close = +d.close;
        });

        // Scale the range of the data
      	x.domain(d3.extent(data, function(d) { return d.date1; }));//<=date1
        y.domain([0, d3.max(data, function(d) { return d.close; })]);

        // Add the valueline path.
        svg.append("path")
            .attr("class", "line")
            .attr("d", valueline(data));

        // Add the X Axis
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        // Add the Y Axis
        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);
    });
}

function initPie() {
    var width = 960,
      height = 500,
      radius = Math.min(width, height) / 2;

    var color = d3.scale.ordinal()
        .range(["#f1e05a", "#89e051", "#e44b23", "#563d7c", "#3572A5", "#701516", "#b07219", "#555555", "#427819", "#f34b7d", "#4F5D95", "#438eff", "#178600", "#222", "#375eab", "#C1F12E", "#0298c3", "#244776", "#f0f0f0", "#ffac45", "#222"]);

    var arc = d3.svg.arc()
        .outerRadius(radius - 10)
        .innerRadius(0);

    var labelArc = d3.svg.arc()
        .outerRadius(radius - 40)
        .innerRadius(radius - 40);

    var pie = d3.layout.pie()
        .sort(null)
        .value(function(d) { return d.stars; });

    var svg = d3.select("#languages-pie-wrapper").append("svg")
        .attr("width", width)
        .attr("height", height)
      .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    d3.csv("/githubdata/data/languages.csv", type, function(error, data) {
      if (error) throw error;

      var g = svg.selectAll(".arc")
          .data(pie(data))
        .enter().append("g")
          .attr("class", "arc");

      g.append("path")
          .attr("d", arc)
          .style("fill", function(d) { return color(d.data.language); });

      g.append("text")
          .attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
          .attr("dy", ".35em")
          .text(function(d) { return d.data.language; });
    });

    function type(d) {
      d.stars = +d.stars;
      return d;
    }
}

initMap({});
initCommitsTable();
initStarsTimeline();
initPie();
