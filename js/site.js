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

var transform = d3.geoTransform({point: projectPoint}),
    path = d3.geoPath().projection(transform);

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
var formatNum = d3.format(",.0f");
//global variables
var world, csv, selectedChloro, currentRank, rank;

// global object to convert ids to human readable strings
var readId = {
  country: "Country",
  population: "Population",
  popDensity: "Population Density",
  areaSqKm: "Area (square Km)",
  geofabrikExtract: "Geofabrik Extract Size (MB)",
  popPerExtract: "Population Per MB of Geofabrik Extract",
  areaPerExtract: "Area Per MB of Geofabrik Extract",
  roadsMappedKm: "Roads Mapped (km)",
  buildingsMapped: "Buildings Mapped",
  popPerBuilding: "Population Per Building Mapped",
  numHotTasks: "Number of HOT Tasks"
};


//set up svg
var svg = d3.select('#map').select("svg"),
    g = svg.append("g").attr("id", "countries");

//quantize scale
var color = d3.scaleQuantize()
    .range(["#fef0d9", "#fdcc8a", "#fc8d59", "#e34a33", "#b30000"]);

//queue data, await getData function
queue()
  .defer(d3.csv, "data/OSM_research_qgis.csv")
  .defer(d3.json, "data/admin0_countries.json")
  .await(getData);

/* GET DATA */
function getData(){
  d3.csv("data/osm_research.csv", function(data){
    csv = data;
    //load in geoJSON data
    d3.json("data/admin0_countries.json", function(error, countries) {

    world = countries;

    for(var i=0; i < data.length; i++){
      var country = data[i].country;
      var csv_iso3 = data[i].iso3;
      var pop = getNumber(data[i].population);
      var popdensity = getNumber(data[i].popDensity);
      var area = getNumber(data[i].areaSqKm);
      var geoExtract = getNumber(data[i].geofabrikExtract);
      var popPerExtract = getNumber(data[i].popPerExtract);
      var areaPerExtract = getNumber(data[i].areaPerExtract);
      var roads = getNumber(data[i].roadsMappedKm);
      var buildings = getNumber(data[i].buildingsMapped);
      var popPerBuilding = getNumber(data[i].popPerBuilding);
      var hot = getNumber(data[i].numHotTasks);


      //find corresponding iso3 inside the GeoJSON
      for(var j=0; j < world.features.length; j++){
        var jsonCountry = world.features[j].properties.iso_a3;

        if(csv_iso3 == jsonCountry) {
          //copy data value into the json
          world.features[j].properties.country = country;
          world.features[j].properties.population = pop;
          world.features[j].properties.popDensity = popdensity;
          world.features[j].properties.areaSqKm = area;
          world.features[j].properties.geofabrikExtract = geoExtract;
          world.features[j].properties.popPerExtract = popPerExtract;
          world.features[j].properties.areaPerExtract = areaPerExtract;
          world.features[j].properties.roadsMappedKm = roads;
          world.features[j].properties.buildingsMapped = buildings;
          world.features[j].properties.popPerBuilding = popPerBuilding;
          world.features[j].properties.numHotTasks = hot;

        }
      }
    }


    makeMap();

    });
  });
}/* END GETDATA */

/* FUNCTION TO CREATE RANK?? */

/* MAKE MAP */
function makeMap(){

  selectedChloro = g.selectAll("path")
    .data(world.features)
    .enter().append("path")
    .attr("d", path)

  function reset() {
    selectedChloro.attr("d", path);
  }

  map.on("viewreset", reset);
  colorMap("buildingsMapped"); //population passed first, then colormap called from onclick in index and corresponding new id is passed
} /* END MAKEMAP */

/* COLOR MAP */
function colorMap(id){
  //domain set dynamically depending on id passed w/click.
    color.domain([
      d3.min(csv, function(d){ return d[id] ;}),
      d3.max(csv, function(d){ return d[id] ;})
    ])

  //sort for rank by clicked id
  currentRank = csv.sort(function(a,b){
    return parseFloat(b[id]) - parseFloat(a[id])
  });
  //get index+1 of current rank, create new property rankById in world
  for(i = 0; i < currentRank.length; i++){
    var csvCountry = currentRank[i].iso3;
    rank = i + 1;
    for(j = 0; j < world.features.length; j++){
      var worldCountry = world.features[j].properties.iso_a3;
      if(csvCountry == worldCountry){
        world.features[j].properties.rankById = rank;
      }
    }
  }

  //console.log(currentRank);
  //selectedChloro styled based w/color quantize function that accepts value at id
  selectedChloro.style("fill", function(d) {
    var value = d.properties[id];
    if(value) {
      //if a value exists...
      return color(value);
    } else{
      return "#000";
    }
  })

    .on("mouseover", function(d){
      var tooltipText = "<strong>" + d.properties.country + "</strong>" + "<br>" + "Rank: " + d.properties.rankById + "<br>" + readId[id] + ": " + formatNum(d.properties[id]);   //id corresponds to property name in global object readId
      $("#tooltip").html(tooltipText);
    })
    .on("mouseout", function(d){
      $('#tooltip').empty();
    });
  }/* END COLORMAP */
