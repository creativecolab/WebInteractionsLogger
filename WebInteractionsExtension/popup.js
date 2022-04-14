let toggle = document.getElementById("toggleLogging");
toggle.addEventListener("click", setLoggingState);
// Clicking on toggle button will open up study document if not already open and begins logging web history to server.
async function setLoggingState() {
  chrome.storage.sync.get(["loggingStatus"], async (response) => {
    if (response.loggingStatus == false) {
      chrome.storage.sync.set({ loggingStatus: true });
      toggle.value = "on";
      docId = await chrome.storage.sync.get(["docId"]);
      let tabs = await chrome.tabs.query({});
      docTab = tabs.filter((tab) =>
        tab["url"].includes(docId.docId)
      );
      if (docTab.length == 0) {
        let tabId;
        if (docId.docId.includes('http')){
          tabId = await chrome.tabs.create({
            url: docId.docId,
          });
        }else{
          tabId = await chrome.tabs.create({
            url: 'https://docs.google.com/document/d/' + docId.docId,
          });
        }
        

        chrome.storage.sync.set({ docTabId: tabId.id });
        chrome.storage.sync.set({docWindowId: tabId.windowId})
      } else {
        console.log(docTab[0].id);
        chrome.storage.sync.set({ docTabId: docTab[0].id });
        chrome.storage.sync.set({docWindowId: docTab[0].windowId})
      }
    } else if (response.loggingStatus == true) {
      chrome.storage.sync.set({ loggingStatus: false });
      toggle.value = "off";
    }
  });
}

var docIdDiv = document.getElementById("docIdDiv");
var idOn = document.getElementById("idOn");

// Saves docId/study doc URL after inputted by user.
let submitFormId = document.getElementById("submitDocId");
submitFormId.addEventListener("click", setDocId);
function setDocId() {
  let docIdEle = document.getElementById("docId");
  let url = docIdEle.value;
  if (!url.includes("docs.google.com/document/d/")) {
    chrome.storage.sync.set({ docId: url });
  } else {
    lastSlashIndex = url.lastIndexOf("/");
    docIdIndex = url.lastIndexOf("/", lastSlashIndex - 1);
    docIdstr = url.substring(docIdIndex + 1, lastSlashIndex);
    console.log(docIdstr);
    chrome.storage.sync.set({ docId: docIdstr });
  }
  idOn.style.display = "block";
  docIdDiv.style.display = "none";
  chrome.storage.sync.set({ loggingStatus: false });
}

let reset = document.getElementById("resetId");
reset.addEventListener("click", resetDocId);
//Resets docId
function resetDocId() {
  chrome.storage.sync.set({ docId: null });
  idOn.style.display = "none";
  docIdDiv.style.display = "block";
  chrome.storage.sync.set({ loggingStatus: false });
}

let downloadBut = document.getElementById("downloadHistory");
downloadBut.addEventListener("click", downloadHistory);

//Downloads web logging history associated with docId from server
async function downloadHistory() {
  downloadBut.innerText = "Downloading...";
  let docId = await chrome.storage.sync.get(["docId"]);
  let dest = "https://creativesearch.ucsd.edu/getHistory?docId=" + docId.docId;
  let response = await fetch(dest);
  let history = await response.json();
  let rows = [["key", "timestamp", "url"]];
  for (let i in history) {
    let key = i;
    let value = history[i];
    row = [];
    console.log(key);
    row.push('"' + key + '"');
    row.push('"' + value.timestamp.toString() + '"');
    row.push('"' + value.url.toString() + '"');
    rows.push(row);
  }
  let csvContent = rows.map((e) => e.join(",")).join("\n");
  console.log(csvContent);
  download(docId.docId + "_webHistory.csv", csvContent);
  downloadBut.innerText = "Download";
}

//Internal function used within downloadHistory
function download(filename, text) {
  let pom = document.createElement("a");
  pom.setAttribute(
    "href",
    "data:text/csv;charset=utf-8," + encodeURIComponent(text)
  );
  pom.setAttribute("download", filename);
  document.body.appendChild(pom);
  pom.click();
}

let webLogBtn = document.getElementById("webLogBtn");
webLogBtn.addEventListener("click", openWebLogPage);

//Opens web logging history page with table and timelines
async function openWebLogPage(){
  let docId = await chrome.storage.sync.get(['docId'])
  window.open("https://creativesearch.ucsd.edu/loggingHistory?docId=" + docId.docId.replaceAll(/https?:\/\//g, '').replaceAll('/', '_').replaceAll('.', '_'));
}