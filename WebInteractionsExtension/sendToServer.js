/**
 * Retrieves message from chrome extension's background.js, retrieves URL info, 
 * then sends it back to chrome extension to be sent to server
 */
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
