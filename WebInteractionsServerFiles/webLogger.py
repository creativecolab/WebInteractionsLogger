import eventlet
eventlet.monkey_patch()
from typing import Text
from flask import Flask, render_template, jsonify, request, send_file
from flask_cors import CORS, cross_origin
from flask_socketio import SocketIO, send, emit, join_room, leave_room

from datetime import datetime
from bs4 import BeautifulSoup
import requests
import nltk
from textblob import TextBlob, Word
from gensim.models import Word2Vec
from sklearn.datasets import make_blobs
from sklearn.cluster import KMeans
import re
import urllib.request
import random
import string

import logging

import firebase_admin
from firebase_admin import credentials, db

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


def scrape_website(url):
    req = requests.get(url)
    soup = BeautifulSoup(req.text, "html.parser")
    return soup

# Get p tags of BeautifulSoup object, used to parse webpages visited


def get_site_article(beautifulSoupObj):
    texts = set()
    for link in beautifulSoupObj.find_all('p'):
        texts.add(link.get_text())
    return texts

# Get each result header from Google search page


def get_query_headers(beautifulSoupObj):
    texts = set()
    for link in beautifulSoupObj.find_all('div', class_='BNeawe vvjwJb AP7Wnd'):
        texts.add(link.get_text())
    return texts

# Get each result description from Google search page


def get_query_results_descriptions(beautifulSoupObj):
    texts = set()
    for link in beautifulSoupObj.find_all('div', class_='BNeawe s3v9rd AP7Wnd'):
        texts.add(link.get_text())
    return texts

# Get common questions section from Google search page


def get_query_common_questions(beautifulSoupObj):
    texts = []
    for link in beautifulSoupObj.find_all('div', class_='Lt3Tzc'):
        texts.append(link.get_text())
    return texts

# Get query related searches from Google search page


def get_query_related_searches(beautifulSoupObj):
    texts = []
    for link in beautifulSoupObj.find_all('div', class_='BNeawe s3v9rd AP7Wnd lRVwie'):
        texts.append(link.get_text())
    return texts

def get_query_autocomplete(googleurl):
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




def getQueryFromURL(googleurl):
    startIndex = googleurl.find('=')
    endIndex = googleurl.find('&')
    if endIndex==-1:
        return re.sub("\+", " ", googleurl[startIndex+1:])
    else:
        return re.sub("\+", " ", googleurl[startIndex+1: endIndex])


def setToString(set):
    return '; '.join(set)


def cleanPhrases(phrases):
    for count, phrase in enumerate(phrases):
        phrases[count] = Word(re.sub("[^a-zA-Z ]+", "", phrase).strip())
    return phrases


def getNParticle(websitedom):
    paragraphs = get_site_article(websitedom)
    paragraphString = setToString(paragraphs)
    blob = TextBlob(paragraphString)
    phrases = cleanPhrases(blob.noun_phrases)
    frequency = {}
    # iterating over the list
    for item in phrases:
        # checking the element in dictionary
        if item in frequency:
            # incrementing the count
            frequency[item] += 1
        else:
            # initializing the count
            frequency[item] = 1
    return dict(sorted(frequency.items(), key=lambda item: item[1], reverse=True))


def getNPSnippets(websitedom):
    snippets = get_query_results_descriptions(websitedom)
    snippetsString = setToString(snippets)
    blob = TextBlob(snippetsString)
    phrases = cleanPhrases(blob.noun_phrases)
    frequency = {}

    # iterating over the list
    for item in phrases:
        # checking the element in dictionary
        if item in frequency:
            # incrementing the count
            frequency[item] += 1
        else:
            # initializing the count
            frequency[item] = 1
    return dict(sorted(frequency.items(), key=lambda item: item[1], reverse=True))


def getNPSuggestions(websitedom):
    commquestions = get_query_common_questions(websitedom)
    relsearches = get_query_related_searches(websitedom)
    commquestions.update(relsearches)
    suggString = setToString(commquestions)
    blob = TextBlob(suggString)
    phrases = cleanPhrases(blob.noun_phrases)
    frequency = {}

    # iterating over the list
    for item in phrases:
        # checking the element in dictionary
        if item in frequency:
            # incrementing the count
            frequency[item] += 1
        else:
            # initializing the count
            frequency[item] = 1
    return dict(sorted(frequency.items(), key=lambda item: item[1], reverse=True))


def getNPwebpages(websitedom):
    texts = set()
    for link in websitedom.find_all('a'):
        texts.add(link.get('href'))
    texts = [x for x in texts if '/url?q=' in x]
    frequency = {}
    for count, text in enumerate(texts):
        cutoff = text.find('&')
        texts[count] = text[7: cutoff]
        article = get_site_article(scrape_website(texts[count]))
        articleString = setToString(article)
        blob = TextBlob(articleString)
        phrases = cleanPhrases(blob.noun_phrases)
        for item in phrases:
            # checking the element in dictionary
            if item in frequency:
                # incrementing the count
                frequency[item] += 1
            else:
                # initializing the count
                frequency[item] = 1
    return dict(sorted(frequency.items(), key=lambda item: item[1], reverse=True))

# FLASK ROUTING
@app.route('/loggingHistory')
def index():
    return render_template('loggingHistory.html')

@app.route('/sendPage', methods=['POST'])
def getQueryPage():
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
    userId = request.args.get('docId')
    userHistory = ref.child(userId + '/').get()
    return jsonify(userHistory)

@app.route('/removeData', methods = ['POST'])
def removeWebHistory():
    json = request.get_json()
    docId = json['docId']
    key = json['key']
    ref.child(docId + '/' + key).delete()
    return 'Success', 200

if __name__ == '__main__':
    socketio.run(app)
