/* SETTING UP THE LEAFLET MAP */
//setup window
var width, height;

//set up leaflet map
var map = L.map('map', {
        center: [0, 0],
        zoom: 12
      }).setView([ 0, 0], 3);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoia2hpZ2dpbnMxMTUiLCJhIjoiY2ltcW9pZXZkMDBua3ZsbTRieXh1NmdkdSJ9.CDeDgVkdUyZS3nkyJWYAXg', {
	maxZoom: 18,
	attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
		'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
		'Imagery © <a href="http://mapbox.com">Mapbox</a>',
	id: 'mapbox.streets'
}).addTo(map);


//parse string function
function getNumber(str){
  return (isNaN(parseFloat(str))) ? 0 : parseFloat(str);
}

// Use Leaflet to implement a D3 geometric transformation.
function projectPoint(x, y) {
  var point = map.latLngToLayerPoint(new L.LatLng(y, x));
  this.stream.point(point.x, point.y);
}

var transform = d3.geo.transform({point: projectPoint}),
    path = d3.geo.path().projection(transform);

    map._initPathRoot()

// tooltip follows cursor
$(document).ready(function() {
    $('body').mouseover(function(e) {
        //Set the X and Y axis of the tooltip
        $('#tooltip').css('top', e.pageY + 10 );
        $('#tooltip').css('left', e.pageX + 20 );
    }).mousemove(function(e) {
        //Keep changing the X and Y axis for the tooltip, thus, the tooltip move along with the mouse
        $("#tooltip").css({top:(e.pageY+15)+"px",left:(e.pageX+20)+"px"});
    });
});

/* END LEAFLET MAP SETUP */

//* ALL THE D3 STUFF IS HAPPENING HERE */

//global variables
var world, csv, selectedChloro;

//set up svg
var svg = d3.select('#map').select("svg"),
    g = svg.append("g").attr("id", "countries");

//quantize scale
var color = d3.scale.quantize()
    .range(["#fef0d9", "#fdcc8a", "#fc8d59", "#e34a33", "#b30000"]);

//queue data, await getData function
queue()
  .defer(d3.csv, "data/OSM_research_qgis.csv")
  .defer(d3.json, "data/admin0_countries.json")
  .await(getData);

//get OSM & JSON data
function getData(){
  d3.csv("data/OSM_research_qgis.csv", function(data){
    csv = data;
    //load in geoJSON data
    d3.json("data/admin0_countries.json", function(error, countries) {

    world = countries;

    for(var i=0; i < data.length; i++){
      var csv_iso3 = data[i].iso3;
      var pop = getNumber(data[i].population);
      var popdensity = getNumber(data[i].popDensity);
      var area = getNumber(data[i].areaSqKm);
      var geoExtract = getNumber(data[i].geofabrikExtract);
      var roads = getNumber(data[i].roadsMappedKm);
      var buildings = getNumber(data[i].buildingsMapped);

      //find corresponding iso3 inside the GeoJSON
      for(var j=0; j < world.features.length; j++){
        var jsonCountry = world.features[j].properties.iso_a3;

        if(csv_iso3 == jsonCountry) {
          //copy data value into the json
          world.features[j].properties.population = pop;
          world.features[j].properties.popDensity = popdensity;
          world.features[j].properties.areaSqKm = area;
          world.features[j].properties.geofabrikExtract = geoExtract;
          world.features[j].properties.roadsMappedKm = roads;
          world.features[j].properties.buildingsMapped = buildings;

        }
      }
    }


    makeMap();

    //console.log(id);
    //setDomain(data, id);
    });
  });
}


function makeMap(){
  //console.log(id);


  selectedChloro = g.selectAll("path")
    .data(world.features)
    .enter().append("path")
    .attr("d", path)

  function reset() {
    selectedChloro.attr("d", path);
  }

  map.on("viewreset", reset);
  colorMap("population");
}

function colorMap(id){
  color.domain([
    d3.min(csv, function(d){ return d[id] ;}),
    d3.max(csv, function(d){ return d[id] ;})
  ])

  selectedChloro.style("fill", function(d) {
    var value = d.properties[id];
    //console.log(value);
    if(value) {
      //if a value exists...
      //console.log(value);
      return color(value);
    } else{
      return "#000";
    }
  })

    .on("mouseover", function(d){
      var tooltipText = id + ": " + d.properties[id];
      $("#tooltip").html(tooltipText);
    })
    .on("mouseout", function(d){
      $('#tooltip').empty();
    });
  }//end colormap();
