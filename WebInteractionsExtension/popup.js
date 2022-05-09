import { SERVER_URL, SERVER_DOMAIN } from './settings.js';

/**
 * Clicking on toggle button will open up study document if not already open and begins logging web history to server.
 */
async function setLoggingState() {
  chrome.storage.sync.get(["loggingStatus"], async (response) => {
    console.log(response);
    if (response.loggingStatus == false) {
      chrome.storage.sync.set({ loggingStatus: true });
      toggle.value = "on";
      let docId = await chrome.storage.sync.get(["docId"]);
      let tabs = await chrome.tabs.query({});
      let docTab = tabs.filter(
        (tab) =>
          tab["url"].includes(docId.docId) &&
          !tab["url"].includes(SERVER_DOMAIN)
      );
      if (docTab.length == 0) {
        let tabId;
        if (docId.docId.includes("http")) {
          tabId = await chrome.tabs.create({
            url: docId.docId,
          });
        } else {
          tabId = await chrome.tabs.create({
            url: "https://docs.google.com/document/d/" + docId.docId,
          });
        }

        chrome.storage.sync.set({ docTabId: tabId.id });
        chrome.storage.sync.set({ docWindowId: tabId.windowId });
      } else {
        console.log(docTab[0].id);
        chrome.storage.sync.set({ docTabId: docTab[0].id });
        chrome.storage.sync.set({ docWindowId: docTab[0].windowId });
      }
    } else if (response.loggingStatus == true) {
      chrome.storage.sync.set({ loggingStatus: false });
      toggle.value = "off";
    }
  });
}

/**
 * Saves docId(either google doc ID or study doc URL) after inputted by user.
 */
function setDocId() {
  let docIdEle = document.getElementById("docId");
  let url = docIdEle.value;
  if (!url.includes("docs.google.com/document/d/")) {
    chrome.storage.sync.set({ docId: url });
  } else {
    let lastSlashIndex = url.lastIndexOf("/");
    let docIdIndex = url.lastIndexOf("/", lastSlashIndex - 1);
    let docIdstr = url.substring(docIdIndex + 1, lastSlashIndex);
    chrome.storage.sync.set({ docId: docIdstr });
  }
  idOn.style.display = "block";
  docIdDiv.style.display = "none";
  chrome.storage.sync.set({ loggingStatus: false });
}

/**
 * Resets docId
 */
function resetDocId() {
  chrome.storage.sync.set({ docId: null });
  idOn.style.display = "none";
  docIdDiv.style.display = "block";
  chrome.storage.sync.set({ loggingStatus: false });
}

/**
 * Downloads web logging history associated with docId from server
 */
async function downloadHistory() {
  downloadBut.innerText = "Downloading...";
  let docId = await chrome.storage.sync.get(["docId"]);
  let dest = SERVER_URL + "/getHistory?docId=" + docId.docId;
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

/**
 * Internal function used within downloadHistory to allow user to download web interaction history
 * @param  {string} filename - name of csv file to be downloaded
 * @param  {string} text - csv in text format
 */
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

/**
 * Opens web logging history page with table and timelines
 */
async function openWebLogPage() {
  let docId = await chrome.storage.sync.get(["docId"]);
  window.open(
    SERVER_URL + "/loggingHistory?docId=" +
      docId.docId
        .replaceAll(/https?:\/\//g, "")
        .replaceAll("/", "_")
        .replaceAll(".", "_")
  );
}

let toggle = document.getElementById("toggleLogging");
toggle.addEventListener("click", setLoggingState);

var docIdDiv = document.getElementById("docIdDiv");
var idOn = document.getElementById("idOn");

let submitFormId = document.getElementById("submitDocId");
submitFormId.addEventListener("click", setDocId);

let reset = document.getElementById("resetId");
reset.addEventListener("click", resetDocId);

let downloadBut = document.getElementById("downloadHistory");
downloadBut.addEventListener("click", downloadHistory);

let webLogBtn = document.getElementById("webLogBtn");
webLogBtn.addEventListener("click", openWebLogPage);
