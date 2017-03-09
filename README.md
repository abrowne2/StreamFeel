# StreamFeel - Twitch chat analytics &amp; more
StreamFeel is a chrome browser extension intended to solve twitch chat's incomprehensible minefield, where it's nearly impossible to hold a conversation or see what people are saying at large volumes. StreamFeel intends to filter out 'garbage' messages and see what people are saying (and what they feel).

It uses a form of machine learning: specifically multiclass linear SVM classification as well as natural language processing (sentimental analysis) using MITIE (MIT's Information Extraction Tools / Library) which is built on top of dlib, a high performance machine learning library (verbatim: https://github.com/mit-nlp/MITIE). 

### Technical Challenges Addressed
* Porting MITIE to PNaCl by getting it to compile and link with PNaCl's tools statically and addressing other issues with it
* Allowing for a persistent categorizer model (once we've trained our dataset), by observing the nature of 'compute_fingerprint' in mitie/text_categorizer.h. This allowed for a dlib::vectorstream to take a buffer and then deserialize it, preventing the categorizer retrain everytime (bad for user)
* Listening to twitch messages and parsing them, making conclusions about them.
* Building a good Dataset (really important)



# Main files;
* inject.js (src/inject)
* handler.js (src/inject)
* default.js (src/inject)
---> Holds default datasets by their raw representation.
* stream_feel.cc (pnacl/Release)
---> NLP, Native Client, Computation



