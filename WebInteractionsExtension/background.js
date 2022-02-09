var authToken = "";

var docId = ''
var userId = ''
// chrome.runtime.onInstalled.addListener(() => {
// chrome.identity.getAuthToken({ interactive: true }, function (token) {
//   authToken = token;
//   console.log(token);
// });
console.log('Background loaded')
// chrome.identity.getProfileUserInfo(function(userInfo) {
//   userId = userInfo['id']
// });

chrome.tabs.onUpdated.addListener(checkTab);

async function checkTab(tabId, changeInfo, tab) {
  if (
    changeInfo.url == null ||
    changeInfo.url.includes("chrome://") ||
    changeInfo.url.includes("edge://")
  )
    return;

  let tabs = await chrome.tabs.query({});
  tabs = tabs.filter((tab) =>
    tab["url"].includes("docs.google.com/document/d/")
  );
  console.log(tabs)
  if (tabs.length > 0) {
    let docUrls = tabs.map(x=> x.url.match(/d\/.+\/edit/)[0])
    let docIds = docUrls.map(x=>x.substring(2, x.length-5))
    if (docId == '' || !docIds.includes(docId)){
      docId = docIds[0]
    }
    sendMessage(tabId, changeInfo.url);
  }
}

async function sendMessage(tabId, url) {
  chrome.tabs.sendMessage(
    tabId,
    {
      url: url,
    },
    (response) => {
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
        console.log(response);
        console.log(docId)
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
            url: response["url"],
            dom: response["dom"],
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
