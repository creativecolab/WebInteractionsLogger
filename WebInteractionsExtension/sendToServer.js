// After retrieving message from background.js, get tab's webpage information
// and sends it back to background.js to send to server.
chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  console.log("Message received!");
  timestamp = new Date().toLocaleString("en-US");
  if (/^https?\:\/\/www\.google\.com\/search\?q\=[^\&]+/.test(request.url)) {
    dom = document.getElementById("main").innerHTML;
    docTitle = document.title;
    await sendResponse({ url: request.url, timestamp: timestamp, dom: dom , docTitle: docTitle});
    
    return true;
  } else{
    docTitle = document.title;
    await sendResponse({ url: request.url, timestamp: timestamp, dom: null , docTitle: docTitle });
    return true
  }
});
