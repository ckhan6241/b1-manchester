// set the dimensions and margins of the graph

const margin = {top: 60, right: 230, bottom: 50, left: 50},
width = 900 - margin.left - margin.right,
height = 600 - margin.top - margin.bottom;

// append the svg object to the body of the page
const svg = d3.select("#dataviz_area")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          `translate(${margin.left}, ${margin.top})`);

// Parse the Data
d3.csv("diff_data.csv").then( function(data) {
  data = data.map(function(row) {
    season = row.Season.split("/")[0]
    if (+season >= 50) {
      season = "19" + season
    } else {
      season = "20" + season
    }
    row.Year = +season;
    row.ManU = +row.ManU;
    row.ManC = +row.ManC;
    row.Min = +row.Min;
    return row
  }).sort((d1, d2) => d1.Year - d2.Year);

  //////////
  // GENERAL //
  //////////

  // List of groups = header of the csv files
  const keys = ["ManU", "ManC"]

   const name_mapping = {
      ManU: "Manchester United",
      ManC: "Manchester City"
    }

  // color palette
  const color = d3.scaleOrdinal()
    .domain(keys)
    .range(["#DA291C", "#6CABDD"]);

  //////////
  // AXIS //
  //////////

  // Add X axis
  const x = d3.scaleLinear()
    .domain(d3.extent(data, function(d) { return d.Year }))
    .range([ 0, width ]);
  const xAxis = svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x).tickFormat(d => {
      var year = d % 100
      return year + "/" + (year+1)
    }))

  // Add X axis label:
  svg.append("text")
      .attr("text-anchor", "end")
      .attr("x", width)
      .attr("y", height+40 )
      .text("Season");

  // Add Y axis label:
  svg.append("text")
      .attr("text-anchor", "end")
      .attr("x", 0)
      .attr("y", -20 )
      .text("Finishing Points")
      .attr("text-anchor", "start")

  // Add Y axis
  const y = d3.scaleLinear()
    .domain([20, 110])
    .range([ height, 0 ]);
  svg.append("g")
    .call(d3.axisLeft(y).ticks(5))

    //////////
    // Main Charts //
    //////////

  // Lines generator
  const line1 = d3.line()
    .x(function(d) { return x(d.Year) })
    .y(function(d) { return y(d.ManU) })
    .curve(d3.curveCardinal)

  const line2 = d3.line()
    .x(function(d) { return x(d.Year) })
    .y(function(d) { return y(d.ManC) })
    .curve(d3.curveCardinal)

  // Area generator
  const area1 = d3.area()
    .x(function(d) { return x(d.Year) })
    .y0(function(d) { return Math.max(line1.y()(d), line2.y()(d))})
    .y1(line1.y())
    .curve(d3.curveCardinal)

  const area2 = d3.area()
    .x(function(d) { return x(d.Year) })
    .y0(line2.y())
    .y1(function(d) { return Math.max(line1.y()(d), line2.y()(d))})
    .curve(d3.curveCardinal) 

  svg.append("path")
    .datum(data)
    .attr("class", function(d) { return "myArea ManC" })
    .attr("fill", "#6CABDD")
    .attr("d", area2)

  svg.append("path")
    .datum(data)
    .attr("class", function(d) { return "myArea ManU" })
    .attr("fill", "#DA291C")
    .attr("d", area1)

  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#8B0000")
    .attr("stroke-width", 3)
    .attr("d", line1)

  svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#00008B")
      .attr("stroke-width", 3)
      .attr("d", line2)

    //////////
    // Tooltips //
    //////////

  function mouseover() {
    focus1.style("opacity", 1)
    focusText1.style("opacity",1)
    focus2.style("opacity", 1)
    focusText2.style("opacity",1)
  }

  const loc = d3.range(data[0].Year+1, data[data.length-1].Year+1).map(d=>x(d))

  function mousemove(event, d) {
    var i = d3.bisect(loc, event.x - margin.left, 0);
    selectedData = data[i]
    // Control which tooltip at the top
    const manU_delta = selectedData.ManU > selectedData.ManC ? 10 : 130
    const manC_delta = selectedData.ManU <= selectedData.ManC ? 10 : 130
    focus1
      .attr("cx", x(selectedData.Year))
      .attr("cy", y(selectedData.ManU))
    focusText1
      .html("Manchester United " + selectedData.Season + "<br> Finishing Position: " + selectedData.ManU_Rank + "<br> Finishing Points: " + selectedData.ManU)
      .style("left", x(selectedData.Year)+60 + "px")
      .style("top", y(selectedData.ManU) +manU_delta+ "px")
    focus2
      .attr("cx", x(selectedData.Year))
      .attr("cy", y(selectedData.ManC))
    focusText2
      .html("Manchester City " + selectedData.Season + "<br> Finishing Position: " + (selectedData.Imputated == "Y" ? "NA" : selectedData.ManC_Rank) + "<br> Finishing Points: " + (selectedData.Imputated == "Y" ? "NA" : selectedData.ManC))
      .style("left", x(selectedData.Year)+60 + "px")
      .style("top", y(selectedData.ManC) +manC_delta+ "px")
    remark.style("opacity", 0)
    if (selectedData.Imputated == "Y") {
      remark.style("opacity", 1)
      remark
        .html("<i>*Manchester City isn't in Premier League during season " +selectedData.Season+" the points are imputated</i>")
    }
  }
  function mouseout() {
    focus1.style("opacity", 0)
    focusText1.style("opacity", 0)
    focus2.style("opacity", 0)
    focusText2.style("opacity", 0)
    remark.style("opacity", 0)
  }

  var focus1 = svg
    .append('g')
    .append('circle')
      .style("fill", "none")
      .attr("stroke", "black")
      .attr('r', 8.5)
      .style("opacity", 0)

  var focus2 = svg
    .append('g')
    .append('circle')
      .style("fill", "none")
      .attr("stroke", "black")
      .attr('r', 8.5)
      .style("opacity", 0)

  var focusText1 = d3.select("#dataviz_area")
    .append("div")
    .style("opacity", 0)
    .style("background", "white url('./man_u.png') no-repeat")
    .style("background-size", "100px")
    .style("background-position", "right")
    .style("border", "solid")
    .style("width", "270px")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")
    .style("position", "absolute")


  var focusText2 = d3.select("#dataviz_area")
    .append("div")
    .style("opacity", 0)
    .style("background", "white url('./man_c.png') no-repeat")
    .style("background-size", "100px")
    .style("background-position", "right")
    .style("border", "solid")
    .style("width", "270px")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")
    .style("position", "absolute")

  var remark = d3.select("#dataviz_area")
    .append("div")
    .style("opacity", 0)
    .style("background-color", "white")
    .style("padding", "5px")

  svg
    .append('rect')
    .style("fill", "none")
    .style("pointer-events", "all")
    .attr('width', width)
    .attr('height', height)
    .on('mouseover', mouseover)
    .on('mousemove', mousemove)
    .on('mouseout', mouseout);



    //////////
    // HIGHLIGHT GROUP //
    //////////

    // What to do when one group is hovered
    const highlight = function(event,d){
      console.log(event, d)
      // reduce opacity of all groups
      d3.selectAll(".myArea").style("opacity", .1)
      // expect the one that is hovered
      d3.select("."+d).style("opacity", 1)
    }

    // And when it is not hovered anymore
    const noHighlight = function(event,d){
      d3.selectAll(".myArea").style("opacity", 1)
    }



    //////////
    // LEGEND //
    //////////
   
    // Add one dot in the legend for each name.
    const size = 20
    svg.selectAll("myrect")
      .data(keys)
      .join("rect")
        .attr("x", 700)
        .attr("y", function(d,i){ return 10 + i*(size+5)}) // 100 is where the first dot appears. 25 is the distance between dots
        .attr("width", size)
        .attr("height", size)
        .style("fill", function(d){ return color(d)})
        .on("mouseover", highlight)
        .on("mouseleave", noHighlight)

    // Add one dot in the legend for each name.
    svg.selectAll("mylabels")
      .data(keys)
      .join("text")
        .attr("x", 700 + size*1.2)
        .attr("y", function(d,i){ return 10 + i*(size+5) + (size/2)}) // 100 is where the first dot appears. 25 is the distance between dots
        .style("fill", function(d){ return color(d)})
        .text(function(d){ return name_mapping[d]})
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")
        .on("mouseover", highlight)
        .on("mouseleave", noHighlight)

})