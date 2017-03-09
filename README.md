# StreamFeel - Twitch chat analytics &amp; more
StreamFeel is a chrome browser extension intended to solve twitch chat's incomprehensible minefield, where it's nearly impossible to hold a conversation or see what people are saying at large volumes. It uses machine learning: specifically multiclass linear SVM classification as well as natural language processing (sentimental analysis) using MITIE (MIT's Information Extraction Tools / Library) which is built on top of dlib, a high performance machine learning library (verbatim: https://github.com/mit-nlp/MITIE). This allows StreamFeel to filter out garbage and see what people are saying (and what they feel).


# Main files;
* inject.js (src/inject)
* handler.js (src/inject)
* default.js (src/inject)
---> Holds default datasets by their raw representation.
* stream_feel.cc (pnacl/Release)
---> NLP, Native Client, Computation

# DONE:
* Ported MITIE (MITIE NLP Information Extraction) to PNaCl
* Allow for persistant categorizer model by:
deserializing "vectorstream" built by the buffer containing raw model data.
* Built classifier, message parser, tokenizer, & more
* Communicate routes setup between components of project.
* Message Listener works properly, where they're parsed by Native Client

# TODO:
* build relevance and sentiment dataset.
* frontend manipulations
* inject.js handler logic.