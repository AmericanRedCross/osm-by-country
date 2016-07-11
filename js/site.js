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
/* END LEAFLET MAP SETUP */

//parse string function
function getNumber(str){
  return (isNaN(parseFloat(str))) ? 0 : parseFloat(str);
}

//* ALL THE D3 STUFF IS HAPPENING HERE */
//global variables
var svg, world, countryData, rows, worldgeodata;

//set up svg
var svg = d3.select(map.getPanes().overlayPane).append("svg"),
    g = svg.append("g").attr("class", "leaflet-zoom-hide");

//quantize scale
//["#fef0d9","#fdcc8a","#fc8d59","#e34a33","#b30000"]
var color = d3.scale.quantize()
    .range(["#fef0d9", "#fdcc8a", "#fc8d59", "#e34a33", "#b30000"]);

//call first function to get data from
getData();
//get osm data
function getData(){
  d3.csv("data/OSM_research_qgis.csv", function(data){

    //set the color quantize scale's input domain
    color.domain([
      d3.min(data, function(d){ return d.population ;}),
      d3.max(data, function(d){ return d.population ;}),
    ])

    //load in geoJSON data
    d3.json("data/admin0_countries.json", function(error, world) {

    for(var i=0; i < data.length; i++){
      //grab iso3 name
      var dataCountry = data[i].iso3;
      //grab number of hot tasks
      var countryPop = getNumber(data[i].population);

      //find corresponding iso3 inside the GeoJSON
      for(var j=0; j < world.features.length; j++){
        var jsonCountry = world.features[j].properties.iso_a3;

        if(dataCountry == jsonCountry) {
          //copy data value into the json
          world.features[j].properties.popValue = countryPop;
        }
      }
    }

    //#HOT Tasks Chloropleth
    var popchloro = g.selectAll("path")
      .data(world.features)
      .enter().append("path")
    console.log(world.features);

    var transform = d3.geo.transform({point: projectPoint}),
        path = d3.geo.path().projection(transform);

    map.on("viewreset", reset);

    reset();

    // Reposition the SVG to cover the features.
    function reset() {
      var bounds = path.bounds(world),
          topLeft = bounds[0],
          bottomRight = bounds[1];

      svg .attr("width", bottomRight[0] - topLeft[0])
          .attr("height", bottomRight[1] - topLeft[1])
          .style("left", topLeft[0] + "px")
          .style("top", topLeft[1] + "px");

      g   .attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

      popchloro.attr("d", path)
      .style("fill", function(d) {
        var value = d.properties.popValue;
        if(value) {
          //if a value exists...
          return color(value);
        } else{
          return "blue";
        }
    });


    }

    // Use Leaflet to implement a D3 geometric transformation.
    function projectPoint(x, y) {
      var point = map.latLngToLayerPoint(new L.LatLng(y, x));
      this.stream.point(point.x, point.y);
    }

    });

  });
}
