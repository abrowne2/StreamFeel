# StreamFeel - Twitch chat analytics &amp; more

### General description

StreamFeel will be a chrome browser extension intended to solve twitch chat's incomprehensible minefield, where it's nearly impossible to hold a conversation or see what people are saying at large volumes. StreamFeel intends to filter out 'garbage' messages and see what people are saying (and what they feel).

### With some help

It uses a form of machine learning: specifically multiclass linear SVM classification as well as natural language processing (sentimental analysis) using MITIE (MIT's Information Extraction Tools / Library) which is built on top of dlib, a high performance machine learning library (verbatim: https://github.com/mit-nlp/MITIE). 

Additionally, for data visualization;
* **Chart.js** Copyright (c) Nick Downie

### Important files
* **stream_feel.cc** (pnacl/Release)
: NLP, Native Client, Computation
* **streamfeelutil.cpp** (/) 
: Utility to update (serialize) dataset for
the native client module to use for classification
* **inject.js** 
: Code injected into stream's page to manipulate twitch chat
* **handler.js** 
: Connected to inject.js & native client (which is embedded in a background page). Middleman between content script and the native client.
* **default.js** 
: Raw relevance dataset.
* **sentiment.js** 
: Raw sentiment dataset, seperated into two chunks.

### Technical Challenges Addressed
* More than I can count with fingers and toes



