chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  console.log("Message received!");
  timestamp = new Date().toLocaleString("en-US");
  if (/^https?\:\/\/www\.google\.com\/search\?q\=[^\&]+/.test(request.url)) {
    dom = document.getElementById("main").innerHTML;
    console.log(dom);
    await sendResponse({ url: request.url, timestamp: timestamp, dom: dom });
    
    return true;
  } else{
    await sendResponse({ url: request.url, timestamp: timestamp, dom: null });
    return true
  }
});
