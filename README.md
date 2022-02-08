# Web Interactions Logger

Apparatus -- Web interactions logger 
* Log all search interactions
    * Timestamped urls opened
    * search query terms, 
    * search results text, DOM, 
    * search result snippets text, 
    * web page urls
* Log all interactions with the notes document (assigned google doc) 
    * every time >10-50 characters changed start logging/send to firebase
    * If idle for >15-30mins stop logging 
* Organize database s.t. Unique ID per participant based on participant login or IP address + session numbers 
* Develop UI front end of the web extension 
    * Toggle start and pause logging in the web extension at the top of 
* A way to view their logs and edit it, button share with researchers
*  Message: Hi ___, welcome back to the document. Would you like to record this session? This session will be discussed at the next weekly check-in.
*  Notify participants to start logging when they type >50chars into the notes document and haven't toggle started logging
*  Notify participants to stop logging by hitting the toggle when they’ve been idle for >15-30mins
