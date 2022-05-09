/**
 * Once docId is added, dynamically changes popup display to show web logging button
 * @param  {string} ['docId'] - Google Doc ID/web URL that is being tracked for web logging
 * @param  {object} response - contains docId string that is stored in browser
 */
chrome.storage.sync.get(['docId'], (response)=>{
    if(response.docId!=undefined){
        var style = `
            #docIdDiv{
                display: none
            }
        `
        var styleSheet = document.createElement("style")
        styleSheet.innerText = style
        document.head.appendChild(styleSheet)
    }else{
        var style = `
            #idOn{
                display: none
            }
        `
        var styleSheet = document.createElement("style")
        styleSheet.innerText = style
        document.head.appendChild(styleSheet)
    }

})

/**
 * Changes Logging web history slider according to loggingStatus storage 
 * @param  {boolean} ['loggingStatus'] - Status of whether extension is currently logging web activity or not
 * @param  {object} response - contains loggingStatus boolean that is stored in browser
 */
chrome.storage.sync.get(['loggingStatus'], (response)=>{
    let toggle = document.getElementById("toggleLogging")
    if(response.loggingStatus==true){
        toggle.checked=true
    }
})
