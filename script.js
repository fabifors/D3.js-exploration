var c = {
  width: 600,
  height: 800
}

const cities = ['Ayr','Aberdeen','Perth','Dundee','Middlesbrough','Coventry','Bath','Exeter','Cambridge','Kingston upon Hull','Londonderry','Lisburn','Penzance','York','Blackpool','Dumfries','Scarborough','Plymouth','Ipswich','Norwich','Brighton','Kirkwall','Inverness','Oxford','Luton','Portsmouth','Peterborough','Nottingham','Stoke','Dover','Edinburgh','Newcastle','Liverpool','Cardiff','Wick','Leeds','Lerwick','Manchester','Birmingham','Belfast','Glasgow','London'];

// Define functions for demo API request
function getCoordinates (data, name) {
  const result = data.features.find(d => {
    return d.properties.name.toLowerCase() === name.toLowerCase()
  })
  return result.geometry.coordinates;
}

function getRandomCity (city) {
  let from, to;
  do {
    from = city && city.from ? city.from : cities[Math.floor(Math.random() * cities.length)]
    to = city && city.to ? city.to : cities[Math.floor(Math.random() * cities.length)]
  } while (from === to);
  return { from, to }
}

function createRequestObject (i, city) {
  const request = {
    id: i,
    amount: Math.floor(Math.random()* 1000),
    currency: '£',
    ...getRandomCity(city)
  }
  return request;
}


function createRequests(amount, city) {
  const output = [];
  for (let i = 0; i < amount; i++) {
    output.push(createRequestObject(i, city))
  }
  return output;
}

// Demo purpose code
const origin = { from: 'london' };
const data = createRequests(5, origin);

var svg = d3.select('body').append('svg')
  .attr('width', c.width)
  .attr('height', c.height);

d3.json('/maps/uk.json', function (error, uk) {
  if (error) return console.error(error);

  // Select the subunits from Data
  var subunits = topojson.feature(uk, uk.objects.subunits_gba)

  // Define the projection
  var projection = d3.geo.albers()
    .center([0, 55.4])
    .rotate([4.4, 0])
    .parallels([50, 60])
    .scale(4000)
    .translate([c.width / 2, c.height / 2]);

  // Define the path with the projection data
  var path = d3.geo.path()
    .projection(projection)
    .pointRadius(2)

  // Append the path to the svg
  svg.selectAll('.subunit')
      .data(subunits.features)
    .enter().append('path')
      .attr('class', d => 'subunit ' + d.id)
      .attr('d', path);
  
  // Append path for borders
  svg.append("path")
    .datum(topojson.mesh(uk, uk.objects.subunits_gba, 
      function(a, b) { return a !== b && a.id !== "IRL"; }))
    .attr("d", path)
    .attr("class", "subunit-boundary");

  // Append border path for Irland
  svg.append("path")
    .datum(topojson.mesh(uk, uk.objects.subunits_gba, 
      function(a, b) { return a === b && a.id === "IRL"; }))
    .attr("d", path)
    .attr("class", "subunit-boundary IRL");

  var places = topojson.feature(uk, uk.objects.places_gba)
  // console.log(places.features)

  // Append places as dots
  svg.append('path')
    .datum(places)
    .attr('d', path)
    .attr('class', 'place')

  // Append a label to each dot
  svg.selectAll('.place-label')
      .data(places.features)
    .enter().append('text')
      .attr('class', 'place-label')
      .attr('transform', 
      function (d) { return 'translate(' + projection(d.geometry.coordinates) + ')'; })
      .attr('dy', '.35em')
      .text(function (d) { return d.properties.name; })

  svg.selectAll('.place-label')
    .attr('x', function (d) { return d.geometry.coordinates[0] > -1 ? 6 : -6})
    .style('text-anchor', function (d) { return d.geometry.coordinates[0] > -1 ? 'start' : 'end'})

  // Append country labels
  svg.selectAll('.subunit-label')
      .data(subunits.features)
    .enter().append('text')
      .attr('class', function (d) { return 'subunit-label ' + d.id; })
      .attr('transform', function(d) { return 'translate('+ path.centroid(d) +')'})
      .attr('dy', '.35em')
      .text(function(d) { return d.properties.name; })


  // Set transition duration
  var dur = 750

  // Define mouse event functions
  function handleMouseOver (d, i) {
    d3.select(this)
      .transition().duration(dur)
      .style('opacity', 1)
  }

  function handleMouseOut (d, i) {
    d3.select(this)
      .transition().duration(dur)
      .style('opacity', 0.5)
  }

  // Add the mouse events
  svg.selectAll('.subunit')
    .on('mouseover', handleMouseOver)
    .on('mouseout', handleMouseOut)

  
  data.forEach(d => {
    d.from = getCoordinates(places, d.from)
    d.to = getCoordinates(places, d.to)
  })

  var lines = svg.selectAll('line')
    .data(data, d => d.id)
  
  // When data comes in, append line and animate between coordinates
  var enter = lines
    .enter().append('line')
      .attr('id', d => d.id)
      .attr('x1', d => projection(d.from)[0])
      .attr('y1', d => projection(d.from)[1])
      .attr('x2', d => projection(d.from)[0])
      .attr('y2', d => projection(d.from)[1])
    .transition().duration(1500)
      .attr('x2', d => projection(d.to)[0])
      .attr('y2', d => projection(d.to)[1])
      .attr('stroke-width', 1)
      .attr('stroke', 'purple')
  
  var exit = lines.exit()
      .transition().duration(1500)
      .attr('x1', d => projection(d.to)[0])
      .attr('y1', d => projection(d.to)[1])
    .remove()
})

function getRandom(max) {
  return Math.floor(Math.random() * max)
}

document.querySelector('body').addEventListener('click', function (e) {
  if (e.target.id === 'remove') {
    console.log('remove')
    const removed = data.splice(getRandom(data.length), 1)
    console.log('removed', removed)
  }
  if (e.target.id === 'add') {
    console.log('add')
    const index = data.push(createRequestObject(data.length))
    const added = data[index - 1]
    console.log('added', added)
  }
})