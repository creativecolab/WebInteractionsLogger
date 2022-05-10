# Web Interactions Logger

For bug reporting or any issues you encounter in the code, please email srpalani@ucsd.edu and/or smzhu@ucsd.edu.

## Code for Server

The code is in the ![ServerFiles](https://github.com/creativecolab/WebInteractionsLogger/tree/main/WebInteractionsServerFiles) folder.

To guarantee you could still use our extension even after our current server shuts down, we provide the code of our server and you could deploy it on your server. You could also use it separately as a way to get the overview of a corpus and what it lacks compared with the meta-data. After you deploy this code on your own server, please also change the SERVER_URL in ![settings.js](https://github.com/creativecolab/WebInteractionsLogger/tree/main/WebInteractionsExtension/settings.js) to the link to your own server.

## Chrome Extension Setup 
- Clone the repo (or download and extract it)
- Unzip WebInteractionsLogger.zip
- Open a Chromium-based browser (such as Google Chrome, Microsoft Edge, Opera, Brave) that can run Chrome extensions
- Navigate to chrome://extensions (chrome can be replaced with your appropriate browser name) and toggle on developer mode (on the top right)
- Drag and drop the unzipped folder into the tab
- Access the extension by clicking the "Extensions" button in the toolbar of your browser

### Chrome Extension Development
- popup.html - The popup that users interact with when they click the extension button
- setVisibility.js, popup.js - Changes popup.html webpage based on underlying data stored in Chrome extension
- sendToServer.js - Processes message from background.js to retrieve webpage data and send it back to background.js
- background.js - Transfers information between sendToServer.js and runs data through the server
- settings.js - Stores the SERVER_URL if others wish to run this extension through their own server
- loggingHistory.html, loggingHistory.html, d3-timelines.js, d3-tip.js - Webpage where users can view their web history that the extension logged in tabular and timeline format
- serviceAccountKey.json - Credentials allowing server to access and save data to Firebase database