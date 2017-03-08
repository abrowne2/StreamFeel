//Author: Adam Browne; as well as The Chromium Authors, whom
// were responsible for the module and instance structure,
// I (Adam Browne) wrote all subsequent code which includes;
// Mitie ML usage, message handling logic, and any further code
#include <vector>
#include <string>
#include <algorithm>
#include <cstring>
#include <bitset>

#include "ppapi/cpp/instance.h"
#include "ppapi/cpp/module.h"
#include "ppapi/cpp/var.h"
#include "ppapi/cpp/var_array.h"
#include "mitie/mitie/text_categorizer.h"
#include "mitie/mitie/text_categorizer_trainer.h"


//we're using MIT's Information Extraction Library / Tool(s)
using namespace mitie;
using namespace dlib;

struct relevanceClassifier {
	//text categorizer to determine relevance.
	text_categorizer drelevant;
		
	/* In order to categorize a msg, we must first tokenize it.
	 * this helper function does that by parsing spaces. */
	std::vector<std::string> tokenize_msg(std::string& input){
		std::vector<std::string> tokens;
		tokens.reserve(input.size());
		int curSpace = input.find(" "), curPos = 0;
		while(curSpace != std::string::npos){
			tokens.push_back(input.substr(curPos,curSpace-curPos));
			curPos = curSpace+1;
			curSpace = input.find(" ",curPos);		
		}
		//if no space, or last region, push it in.
		tokens.push_back(input.substr(curPos));
		return tokens;
	}

	/* We're receiving the entire trained model as binary.
	 * We parse the binary into it's representation, create a 
	 * vectorstream and decode the stream into the categorizer. */
	void buildCategorizer(pp::VarArray& data){
		int index = 0, size = data.GetLength();
		std::vector<char> buffer;
		buffer.reserve(size/2);
		while(index < size){
			char byte = data.Get(index).AsInt();
			buffer.push_back(byte);
			++index;
		}
		dlib::vectorstream trained_model(buffer);
		//decode the serialized stream and the categorizer is built.
		drelevant.decode(drelevant,trained_model);
		buffer.clear();
	}
	
	bool isRelevant(std::string& message){
		//get our tokens to predict if a msg is relevant.
		std::vector<std::string> tokenized = tokenize_msg(message);
		std::string tag = "";
		double confidence;
		drelevant.predict(tokenized, tag, confidence);
		while(tag == "") { } //do nothing until prediction formed.
		return tag == "y"? true: false;
	}
};


namespace {
	//we're going to use this to classify text as relevant.
	relevanceClassifier RC;
	std::string current_user;
}  // namespace


/* first, parse the user's name. Then, determine if there is a mention
 * with their name. if so, set the flag; also parse that mention out, 
 * same applies whether or not the user is mentioned. */
struct StreamMessage {
	std::string id, time, user, msg, cur_user;	
	bool userMentioned = false, cmdMsg = false;		

	/* parseMention will parse the message and see if
	 * the user using StreamFeel was mentioned. We will parse any and all
	 * mentions out of the string regardless; so that the classifier isn't confused. */
	void parseMention() {
		//once we've determined the user's name, we then parse the mention in it...
		std::string look_for = '@' + cur_user;
		auto user_mention = msg.find(look_for);
		if(user_mention != std::string::npos){
			userMentioned = true;
			//finish this LOGIC!!!
		}
		bool in_mention = false;
		std::string new_msg = "";
		for(auto letter : msg){
			if(in_mention == false){
				if(letter == '@')
					in_mention = true;
				else
					new_msg += letter;
			} else {
				if(letter == ' ')
					in_mention = false;
			}
		}
		msg = std::move(new_msg);
	}

	/* naive approach to determine if the message was a command:
	 * If the next character after the '!' isn't a space, it could be one. */
	void determineCommand() {
		//try to find an exclamation mark first.
		auto exclamation = msg.find("!");
		if(exclamation != std::string::npos && exclamation + 1 < msg.size())
			cmdMsg = msg[exclamation+1] != ' '? true: false;
		else
			cmdMsg = false;
	}

	/* A 'StreamMessage' is constructed by parsing the original data,
	 * where it is subsequently used for computation. */
	StreamMessage(std::string& data, std::string& sf_usr) {
		cur_user = sf_usr; 
		//data format is id | time | user | message.
		int cur_pos = 0, cur_delim = data.find("|", cur_pos);
		//get the id.
		id = data.substr(0,cur_delim);
		cur_pos = cur_delim + 1;
		cur_delim = data.find("|", cur_delim+1);
		// //get the timestamp.
		time = data.substr(cur_pos, cur_delim-cur_pos);
		cur_pos = cur_delim + 1;
		cur_delim = data.find("|", cur_delim+1);
		//get the user.
		user = data.substr(cur_pos, cur_delim-cur_pos);
		cur_pos = cur_delim + 1;
		//get the msg.
		msg = data.substr(cur_pos);
		//perform final parsing; parse mentions and determine if !cmd.
		parseMention();
		determineCommand();
	}
};

class StreamFeelModInstance : public pp::Instance {
 public:
  explicit StreamFeelModInstance(PP_Instance instance)
      : pp::Instance(instance) {}
  virtual ~StreamFeelModInstance() {}

  virtual void HandleMessage(const pp::Var& var_message) {
    // Ignore the message if it is not a string.
    if (!var_message.is_string()){
      if(var_message.is_array()){
		auto val = pp::VarArray(var_message);
		//loads our containers and trains the classifier.
		RC.buildCategorizer(val);
		std::string complete = "Train complete";
      	pp::Var reply(complete);
      	PostMessage(reply);
      }
      return;
    }
	//get the string message and parse it.
	std::string message = var_message.AsString();
	StreamMessage parsed = StreamMessage(message, current_user);
     // ID | Time | From | Rel | Usr | Msg  <-- Response Format
	std::string response = parsed.id + "|" + parsed.time + "|" + parsed.user + "|";
	//if the sfeel user was mentioned here...
	if(parsed.userMentioned == true) {
		bool relevant = RC.isRelevant(parsed.msg);
		response += (relevant == true? "1|": "0|");
		//COMPUTE THE SENTIMENT NEXT.
	} else {
		if(parsed.cmdMsg == true) //we assume commands aren't relevant.
			response += "0|";
		else {
			bool relevant = RC.isRelevant(parsed.msg);
			response += (relevant == true? "1|": "0|");
			//COMPUTE SENTIMENT HERE.
		}
	}
	response += ("|" + parsed.msg);	 //lastly, append the msg.
	pp::Var var_reply(response);
	//post the msg using PostMessage(var_reply) ^^
	PostMessage(var_reply);
  }
};

class StreamFeelModule : public pp::Module {
 public:
  StreamFeelModule() : pp::Module() {}
  virtual ~StreamFeelModule() {}

  virtual pp::Instance* CreateInstance(PP_Instance instance) {
    return new StreamFeelModInstance(instance);
  }
};

namespace pp {

Module* CreateModule() {
  return new StreamFeelModule();
}

}  // namespace pp