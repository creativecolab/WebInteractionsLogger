import eventlet

eventlet.monkey_patch()
import logging
import re
import urllib.request
import firebase_admin
from firebase_admin import credentials, db
from flask import Flask, jsonify, render_template, request, send_file
from flask_cors import CORS, cross_origin

app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})
logging.getLogger('flask_cors').level = logging.INFO
socketio = SocketIO(app, cors_allowed_origins="*")
app.config['CORS_HEADERS'] = 'Content-Type'

cred = credentials.Certificate("serviceAccountKey.json")

firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://webinteraction-c144c-default-rtdb.firebaseio.com/'
})

ref = db.reference()

def get_query_autocomplete(googleurl):
    """Retrieves automcomplete suggestions from a google query by adding a space to the end of 
    google query and collecting autocomplete results from google servers

    Args:
        googleurl (string): URL of google query

    Returns:
        list: List of autocomplete suggestion strings
    """
    startIndex = googleurl.find('=')
    endIndex = googleurl.find('&')
    queryString = googleurl[startIndex+1: endIndex]
    target_url = 'https://www.google.com/complete/search?q=' + queryString+'+&pq='+queryString+'&client=chrome'
    ##Naive, assuming search query has no brackets
    autocompletesuggestions=''
    for line in urllib.request.urlopen(target_url):
        googleautosugg=line.decode('utf-8')
        startBracket = googleautosugg.index('[', 1)
        endBracket = googleautosugg.index(']', 1)
        autocompletesuggestions = googleautosugg[startBracket+1: endBracket]
    autocompletesuggestions.replace('"', "" )
    return autocompletesuggestions.split(',')

# FLASK ROUTING
@app.route('/loggingHistory')
def index():
    return render_template('loggingHistory.html')

@app.route('/sendPage', methods=['POST'])
def getQueryPage():
    """Collects query page data from front end and sends it to server

    Returns:
        string: denotes success after posting to server
    """
    json = request.get_json()
    userId = json['docId']
    url = json['url']
    dom = json['dom']
    timestamp = json['timestamp']
    if 'docTitle' in json:
        docTitle = json['docTitle'] 
    else:
        docTitle=None
    userHistory = ref.child(userId + '/')
    if bool(re.search(':\/\/www\.google\.com\/search\?q=', json['url'])):
        autocomplete = get_query_autocomplete(json['url'])
        userHistory.push().set({
        "url": url,
        "timestamp": timestamp,
        "dom": dom,
        "docTitle" : docTitle,
        "autocompleteResults": autocomplete,
        })
    else:
        userHistory.push().set({
        "url": url,
        "timestamp": timestamp,
        "docTitle" : docTitle
        })
    return 'Success', 200

@app.route('/getHistory', methods = ['GET'])
def getWebHistory():
    """Gets user's weblogging history data to be sent to front end

    Returns:
        object: response object with JSON format of user history data
    """
    userId = request.args.get('docId')
    userHistory = ref.child(userId + '/').get()
    return jsonify(userHistory)

@app.route('/removeData', methods = ['POST'])
def removeWebHistory():
    """Deletes web logging entry from database 

    Returns:
        string: denotes deletion success
    """
    json = request.get_json()
    docId = json['docId']
    key = json['key']
    ref.child(docId + '/' + key).delete()
    return 'Success', 200

if __name__ == '__main__':
    socketio.run(app)
