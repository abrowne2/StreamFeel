# StreamFeel - Twitch chat analytics &amp; more

### General description

StreamFeel will be a chrome browser extension intended to solve twitch chat's incomprehensible minefield, where it's nearly impossible to hold a conversation or see what people are saying at large volumes. StreamFeel intends to filter out 'garbage' messages and see what people are saying (and what they feel).

### With some help

It uses a form of machine learning: specifically multiclass linear SVM classification as well as natural language processing (sentimental analysis) using MITIE (MIT's Information Extraction Tools / Library) which is built on top of dlib, a high performance machine learning library (verbatim: https://github.com/mit-nlp/MITIE). 

Additionally, for data visualization;
* **d3.js**
(Copyright 2010-2016 Mike Bostock)
* **d3pie**
(Copyright (c) 2014-2015 Benjamin Keen)

### Important files
* **stream_feel.cc** (pnacl/Release)
: NLP, Native Client, Computation
* **streamfeelutil.cpp** (/) 
: Utility to update (serialize) dataset for
the native client module to use for classification
* **inject.js** (src/inject)
: Code injected into stream's page to manipulate twitch chat
* **handler.js** (src/inject)
: Connected to inject.js & native client (which is embedded in a background page). Middleman between content script and the native client.
* **default.js** (src/inject) 
: Raw relevance dataset.
* **sentiment.js** (src/inject)
: Raw sentiment dataset.

### Technical Challenges Addressed
* Porting MITIE to PNaCl by getting it to compile and link with PNaCl's tools statically and addressing other issues with it
* Allowing for a persistent categorizer model (once we've trained our dataset), by observing the nature of 'compute_fingerprint' in mitie/text_categorizer.h. This allowed for a dlib::vectorstream to take a buffer and then deserialize it, preventing the categorizer retrain everytime (bad for user)
* Making StreamFeel compatible with Better TwitchTV, another popular extension.
* Fixing message flickering/rendering
* Listening to twitch messages and parsing them, making conclusions about them.
* Building a good Dataset (really important)




