//Once docId is added, changes extension display to show web logging button
chrome.storage.sync.get(['docId'], (response)=>{
    console.log(response.docId)
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

//Changes Logging web history slider according to loggingStatus storage 
chrome.storage.sync.get(['loggingStatus'], (response)=>{
    let toggle = document.getElementById("toggleLogging")
    console.log(response.loggingStatus)
    if(response.loggingStatus==true){
        toggle.checked=true
    }
})
