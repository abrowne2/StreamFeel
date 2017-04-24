# StreamFeel - Twitch chat analytics &amp; more

StreamFeel is a Chrome Browser Extension for Twitch (streaming video platform).
It solves the problem of "I can't understand what people are saying because none of this makes sense!". Twitch chat is, in many ways, a minefield.
It uses an existing "dataset" or collection of messages to make conclusions (natural language processing)

## Primary Features
Without the use of predefined rules or algorithm and by using thousands of twitch messages:
* Filters chat messages intelligently,
* Computes sentiment (what people are feeling),
* User Mentions (in-progress),
* Provides analytics; emote, sentiment, and the ability to view this info in realtime or by the minute.

### Important files
* **stream_feel.cc** (pnacl/Release)
: NLP, Native Client, Computation
* **streamfeelutil.cpp** (/) 
: Utility to update (serialize) dataset for
the native client module to use for classification
* **inject.js** 
: Code injected into stream's page to manipulate twitch chat
* (Other): default & sentiment.js are trained categorizer models used to load StreamFeel.

### Technical Challenges Addressed
* More than I can count with fingers and toes

### Technical Jargon (How)

It uses a form of machine learning: specifically multiclass linear SVM classification as well as natural language processing (sentimental analysis) using MITIE (MIT's Information Extraction Tools / Library) which is built on top of dlib, a high performance machine learning library (verbatim: https://github.com/mit-nlp/MITIE). 

Additionally, for data visualization;
* **Chart.js** Copyright (c) Nick Downie




