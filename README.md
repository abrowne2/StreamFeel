# StreamFeel - Twitch chat analytics &amp; more


# Main files;
* inject.js (src/inject)
* handler.js (src/inject)
* default.js (src/inject)
---> Holds default datasets.
* stream_feel.cc (pnacl/Release)
---> NLP, Native Client, Computation

# DONE:
* Ported MITIE (MITIE NLP Information Extraction) to PNaCl
* Built classifier, message parser, tokenizer, & more
* Communicate routes setup between components of project.
* Message Listener works properly, where they're parsed by Native Client

# TODO:
* build relevance and sentiment dataset.
* frontend manipulations
* inject.js handler logic.