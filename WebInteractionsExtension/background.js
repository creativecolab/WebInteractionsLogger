var authToken = "";
var docId = "";
var userId = "";
updateStorage()
var nIntervId;
var intervCnt = 0;

chrome.tabs.onUpdated.addListener(checkTab);
chrome.tabs.onRemoved.addListener(removedTab);
chrome.storage.onChanged.addListener(updateStorage);
chrome.tabs.onActivated.addListener(isDocActive);
// chrome.windows.onRemoved.addListener(async (windowId)=>{
//   let docWindowId = await chrome.storage.sync.get(["docWindowId"])
//   console.log(docWindowId.docWindowId + ' ' + windowId)
//   if (windowId == docWindowId.docWindowId){
//     clearInterval(nIntervId);
//     nIntervId = null;
//     intervCnt = 0;
//     chrome.storage.sync.set({ loggingStatus: false })
//     chrome.storage.sync.set({ docTabId: null });
//     chrome.storage.sync.set({docWindowId: null})
//   }
// })

async function isDocActive(activeInfo) {
  let loggingStatus = await chrome.storage.sync.get(["loggingStatus"])
  let docTabId = await chrome.storage.sync.get(["docTabId"])
  // console.log(loggingStatus)
  // console.log('Tab activated!')
  if (loggingStatus.loggingStatus == false) {
    clearInterval(nIntervId);
    nIntervId = null;
    intervCnt = 0;
    return false;
  }
  activeTabId = activeInfo.tabId;
  if (activeTabId == docTabId.docTabId) {
    clearInterval(nIntervId);
    nIntervId = null;
    intervCnt = 0;
    return true
  } else if (activeTabId != docTabId && nIntervId ==null) {
    intervCnt = 0;
    nIntervId = setInterval(displayNotif, 60000, docTabId.docTabId);
  }
  return false
}

async function displayNotif(docTabId) {
  let window =await chrome.windows.getLastFocused();
  let queryOptions = { active: true, windowId: window.id};
  let [tab] = await chrome.tabs.query(queryOptions);
  if (tab.id==docTabId){
    clearInterval(nIntervId);
    nIntervId = null;
  }else{
    console.log("Running displayNotif on minute %s!", intervCnt++);
    if (intervCnt == 20) {
      chrome.notifications.create("", {
        iconUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/How_to_use_icon.svg/1200px-How_to_use_icon.svg.png",
        message:
          "You have not opened your google doc tab in the past 20 minutes. Turning off web logging.",
        title: "Notification title",
        type: "basic",
      });
      chrome.storage.sync.set({ loggingStatus: false }, ()=>{
        console.log('Logging status set to false through timer')
      });
    }
  }
  
  return;
}

function updateStorage() {
  chrome.storage.sync.get(["docId"], (response) => {
    if (response.docId != undefined) {
      docId = response.docId;
    }
  });

  chrome.storage.sync.get(["loggingStatus"], (response) => {
    if (response.loggingStatus == true) {
      chrome.action.setBadgeText({ text: "ON" });
      chrome.action.setBadgeBackgroundColor({ color: "#2832C2" });
    } else if (response.loggingStatus == false) {
      clearInterval(nIntervId);
      nIntervId = null;
      intervCount = 0;
      chrome.action.setBadgeText({ text: "OFF" });
      chrome.action.setBadgeBackgroundColor({ color: "#000000" });
    }
  });
}

async function removedTab(tabId, removeInfo) {
  let docTabId = await chrome.storage.sync.get(["docTabId"])
  if (docTabId.docTabId == tabId) {
    // console.log("Tab removed");
    chrome.storage.sync.set({ loggingStatus: false }, ()=>{
      console.log('Logging status set to false through removedTab')
    });
    chrome.storage.sync.set({ docTabId: null });
    clearInterval(nIntervId);
    nIntervId = null;
    intervCnt = 0;
  }
  return;
}

async function checkTab(tabId, changeInfo, tab) {
  let loggingStatus = await chrome.storage.sync.get(["loggingStatus"])
  // console.log('Tab updated!')
  if (
    changeInfo.url == null ||
    changeInfo.url.includes("chrome://") ||
    changeInfo.url.includes("edge://") ||
    changeInfo.url.includes("brave://") ||
    changeInfo.url.includes("extensions://") ||
    changeInfo.url.includes("//newtab")||
    loggingStatus.loggingStatus == false
  )
    return;
  isDocActive(tabId)
  sendMessage(tabId, changeInfo.url);
}

async function sendMessage(tabId, url) {
  chrome.tabs.sendMessage(
    tabId,
    {
      url: url,
    },
    (response) => {
      console.log(response)
      console.log(docId)
      i = 0;
      if (
        chrome.runtime.lastError != undefined &&
        chrome.runtime.lastError.message ==
          "Could not establish connection. Receiving end does not exist."
      ) {
        console.log(chrome.runtime.lastError);
        if (i > 30) {
          return;
        }
        i += 1;
        setTimeout(sendMessage, 1000, tabId, url);
        return;
      } else {
        dest = "https://creativesearch.ucsd.edu/sendPage";
        fetch(dest, {
          // Declare what type of data we're sending
          headers: {
            "Content-Type": "application/json",
          },
          // Specify the method
          method: "POST",

          // A JSON payload
          body: JSON.stringify({
            docId: docId.replaceAll(/https?:\/\//g, '').replaceAll('/', '_').replaceAll('.', '_'),
            url: response["url"],
            dom: response["dom"],
            docTitle: response["docTitle"],
            timestamp: response["timestamp"],
          }),
        })
          .then(function (response) {
            console.log(response.text());
          })
          .then(function (text) {
            console.log(text);
          });
      }
    }
  );
}
