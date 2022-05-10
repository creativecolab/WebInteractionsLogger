import { SERVER_URL } from './settings';
var history;
const queryString = new URLSearchParams(window.location.search);
const docId = queryString.get("docId");
var beginning, ending;
var nodeDict = {};
let historyTable = document.getElementById("historyTable");

/**
 * Remove data from server using remove button in table
 * @param  {object} evt - button element that user prompted to remove from database
 */
function removeRowFromDatabase(evt) {
  let elm = evt.currentTarget;
  let dbEntry = elm.parentNode.parentNode;
  let dest = SERVER_URL + "/removeData";

  fetch(dest, {
    // Declare what type of data we're sending
    headers: {
      "Content-Type": "application/json",
    },
    // Specify the method
    method: "POST",

    // A JSON payload
    body: JSON.stringify({
      docId: docId,
      key: dbEntry.id,
    }),
  })
    .then(function (response) {
      console.log(response.text());
    })
    .then(function (text) {
      console.log(text);
    });
  dbEntry.remove();
}

/**
 * Initialize table rows
 * @param  {string} time - timestamp of the data entry
 * @param  {string} docTitle - Title of the document
 */
function createTableRow(time, docTitle) {
  let row = document.createElement("tr");
  let timeCell = document.createElement("td");
  timeCell.innerHTML = time;
  let titleCell = document.createElement("td");
  titleCell.innerHTML = '<div class="scrollable">' + docTitle + "</div>";
  row.append(timeCell);
  row.append(titleCell);
  let buttonCell = document.createElement("td");
  let button = document.createElement("button");
  button.type = "button";
  button.innerHTML = "Remove from history";
  button.addEventListener("click", removeRowFromDatabase);
  buttonCell.append(button);
  row.append(buttonCell);
  return row;
}

//
/**
 * Retrieve web logging history and instantiate tables and timelines
 * @param  {string} docId - ID/url from database of document being tracked for web logging
 */
async function getWebLoggingHistory(docId) {
  let dest = SERVER_URL + "/getHistory?docId=" + docId;
  let response = await fetch(dest);
  history = await response.json();
  //Set up timelines
  let data = [];
  beginning = Math.floor(
    new Date(history[Object.keys(history)[0]].timestamp.toString())
  );
  ending = Math.floor(
    new Date(
      history[
        Object.keys(history)[Object.keys(history).length - 1]
      ].timestamp.toString()
    )
  );
  let url;
  let dates = {};

  for (let i in history) {
    let value = history[i];
    let url = value.url.toString();
    let timestamp = new Date(value.timestamp);
    let month = timestamp.getMonth() + 1;
    let day = timestamp.getDate();
    let year = timestamp.getFullYear();
    let dateStr = month + "/" + day + "/" + year;
    if (!dates.hasOwnProperty(dateStr)) {
      dates[dateStr] = [];
    }
    if (/www\.google\.com\/search\?/g.test(url)) {
      dates[dateStr].push({
        starting_time: Math.floor(timestamp),
        color: "red",
        display: "circle",
        id: i + "_node",
      });
    } else {
      dates[dateStr].push({
        starting_time: Math.floor(timestamp),
        color: "blue",
        display: "circle",
        id: i + "_node",
      });
    }
    let row;
    if (value.docTitle == undefined) {
      row = createTableRow(value.timestamp, url);
      nodeDict[i] = url;
    } else {
      row = createTableRow(value.timestamp, value.docTitle);
      nodeDict[i] = value.docTitle;
    }
    row.id = i;
    historyTable.append(row);
  }
  for (const property in dates) {
    data.push({ label: property, times: dates[property] });
  }

  var timelineId, elemDiv, svg, date, beginning, end;
  for (let i in data) {
    date = new Date(data[i].label);
    beginning = Math.floor(date);
    ending = Math.floor(date.setHours(23, 59, 59, 999));
    timelineId = "timeline" + i;
    elemDiv = document.createElement("div");
    elemDiv.id = timelineId;
    var chart = d3
      .timelines()
      .stack()
      .margin({ left: 80, right: 30, top: 30, bottom: 30 })
      .beginning(beginning)
      .ending(ending)
      .tickFormat({
        format: d3.timeFormat("%I:%M %p"),
        tickTime: d3.timeHours,
        tickInterval: 1,
        tickSize: 10,
      })
      .display("circle");

    document.body.appendChild(elemDiv);
    var svg = d3
      .select("#" + timelineId)
      .append("svg")
      .attr("width", "100%")
      .datum([data[i]])
      .call(chart);
    for (let j in data[i].times) {
      let nodeId = data[i].times[j].id;
      let node = d3.select("#" + nodeId);
      let ctm = document.getElementById(nodeId).getBoundingClientRect();
      let dbId = nodeId.substring(0, nodeId.lastIndexOf("_"));
      let tooltip = d3
        .select("#" + timelineId)
        .append("div")
        .attr("id", nodeId + "_tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("top", ctm.top - 40 + "px")
        .style("left", node.attr("cx") + "px")
        .text(nodeDict[dbId]);
      node
        .on("mouseover", function () {
          return tooltip.style("visibility", "visible");
        })
        .on("mouseout", function () {
          return tooltip.style("visibility", "hidden");
        });
    }
  }
  return data;
}

// Dummy data for testing purposes
//   let data = [{label: "Queries", times:[{starting_time: 1355752800000, display: "circle", id: 'google'},
// {starting_time: 1355780000000, display:"circle", name:'google'}]},
//         {label: "Webpages", times:[{starting_time: 1355780000000, display: "circle"}]}]
//   let beginningDate = new Date(1355752800000)
//   beginningDate.setHours(0,0,0,0)
//   beginning= Math.floor(beginningDate)
//   let endingDate = new Date(1355752800000)
//   endingDate.setHours(23,)
//   ending= Math.floor(endingDate)
//   ending = 1355780000000


let data = await getWebLoggingHistory(docId); //Test docId: docId=13RN9L5_xIHH6a7ThkTOKWmuJKfTU7QIWU4k-Cm2-GwQ