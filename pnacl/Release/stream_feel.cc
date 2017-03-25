//Author: Adam Browne; as well as The Chromium Authors, whom
// were responsible for the module and instance structure,
// I (Adam Browne) wrote all subsequent code which includes;
// Mitie ML usage, message handling logic, and any further code
#include <vector>
#include <string>
#include <algorithm>
#include <cstring>
#include <queue>

#include "ppapi/cpp/instance.h"
#include "ppapi/cpp/module.h"
#include "ppapi/cpp/var.h"
#include "ppapi/cpp/var_array.h"
#include "mitie/mitie/text_categorizer.h"
#include "mitie/mitie/text_categorizer_trainer.h"


//we're using MIT's Information Extraction Library / Tool(s)
using namespace mitie;
using namespace dlib;

struct dataClassifier {
	//categorizers for sentiment and relevance.
	text_categorizer drelevant, sentiment; 
	bool isTrained = false;

	static bool checkSpaces(char left, char right) 
		{ return (left == right) && (left == ' '); }

	void simplifyString(std::string& input){
		//then, reduce multiple spaces into one between each valid character.
		if(input.find(' ') != std::string::npos) {    
			auto badspace = std::unique(input.begin(), input.end(), checkSpaces);
			input.erase(badspace, input.end());
		}
	}		
	/* In order to categorize a msg, we must first tokenize it.
	 * this helper function does that by parsing spaces. */
	std::vector<std::string> tokenize_msg(std::string& input){
		simplifyString(input);
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

	void buildBuffer(pp::VarArray& data, std::vector<char>& buffer){
		int index = 1, size = data.GetLength();
		while(index < size){
			char byte = data.Get(index).AsInt();
			buffer.push_back(byte);
			++index;
		}
	}

	/* We're receiving the entire trained model as binary.
	 * We parse the binary into it's representation, create a 
	 * vectorstream and decode the stream into the categorizer. */
	void buildCategorizer(pp::VarArray& data, std::vector<char>& buf, int inst_id){
		auto inst = pp::Instance(inst_id); 
		int choice = data.Get(0).AsInt();
		if(choice == 0){
			buildBuffer(data, buf);
			decodeStream('r',buf);
		} else if(choice == 1){
			buildBuffer(data,buf);
			inst.PostMessage(pp::Var("f")); //tells them to send second chunk.
		} else if(choice == 2){
			buildBuffer(data,buf);
			decodeStream('s',buf);
			isTrained = true;
		}
	}


	void decodeStream(char part, std::vector<char>& cont){
		dlib::vectorstream trained_model(cont);
		deserialize(trained_model,part);
		cont.clear();
	}

	void deserialize(dlib::vectorstream& trained_model, char ch){
		if(ch == 'r')
			drelevant.decode(drelevant,trained_model);
		else 
			sentiment.decode(sentiment,trained_model);
	}
	
	bool isRelevant(std::string& message){
		//get our tokens to predict if a msg is relevant.
		std::vector<std::string> tokenized = tokenize_msg(message);
		std::string tag = drelevant(tokenized);
		return tag == "y";
	}

	//as opposed to relevance, return the tag for the message.
	std::string determineFeel(std::string& message) {
		std::vector<std::string> tokenized = tokenize_msg(message);
		std::string tag = sentiment(tokenized);
		return tag;
	}
};

/* first, parse the user's name. Then, determine if there is a mention
 * with their name. if so, set the flag; also parse that mention out, 
 * same applies whether or not the user is mentioned. */
struct StreamMessage {
	std::string id, time, user, msg, cur_user, cmd;
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
		msg = new_msg;
	}

	/* naive approach to determine if the message was a command:
	 * If the next character after the '!' isn't a space, it could be one. 
	 * We also extract the command from the message to examine them. */
	void determineCommand() {
		auto exclamation = msg.find("!");
		if(exclamation != std::string::npos && exclamation + 1 < msg.size()){
			cmdMsg = msg[exclamation+1] != ' '? true: false;
			//extract the command for use in analytics.			
			if(cmdMsg == true){
				int begin = exclamation + 1, end = msg.find(" ",begin);
				if(end != std::string::npos){
					cmd = msg.substr(begin,end-begin);
				} else {
					cmd = msg.substr(begin);
				}
			}
		}
		else
			cmdMsg = false;
	}

	void handleMsg() {
		parseMention();
		determineCommand();
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
		handleMsg();
	}
};

struct responseFormatter {
	dataClassifier RC;	
	std::queue<StreamMessage> backlog;

	void addMessage(StreamMessage& msg){
		backlog.push(msg);
	}

	//unloads the backlog.
	std::vector<std::string> unload() {
		std::vector<std::string> log;
		log.reserve(backlog.size());
		while(!backlog.empty()) {
			StreamMessage msg = backlog.front();
			backlog.pop();
			std::string response = processMessage(msg);
			log.push_back(response);
		}
		return log;
	}

	std::string processMessage(StreamMessage& parsed){
		std::string response = parsed.id + "|" + parsed.time + "|" + parsed.user + "|";
		//if the sfeel user was mentioned here...
		if(parsed.userMentioned == true) {
			bool relevant = RC.isRelevant(parsed.msg);
			response += (relevant == true? "1|": "0|");
			std::string feeling = RC.determineFeel(parsed.msg);
			response += feeling;
		} else {
			if(parsed.cmdMsg == true) { //we assume commands aren't relevant.
				response += ("0||" + parsed.cmd);
			} else {
				bool relevant = RC.isRelevant(parsed.msg);
				response += (relevant == true? "1|": "0|");
				std::string feeling = RC.determineFeel(parsed.msg);
				response += feeling;
			}
		}
		response += ("|" + parsed.msg);	 //lastly, append the msg.
		return response;
	}
};


//namespace referenced by the below instance.
namespace {
	responseFormatter RF;
	std::vector<char> cat_buf;
	std::string current_user;
}

class StreamFeelModInstance : public pp::Instance {
 public:
  explicit StreamFeelModInstance(PP_Instance instance)
      : pp::Instance(instance) {}
  virtual ~StreamFeelModInstance() {}

  virtual void HandleMessage(const pp::Var& var_message) {
    // Ignore the message if it is not a string.
    if (!var_message.is_string()){
      if(var_message.is_array()){
      	int inst_id = pp_instance();
		auto val = pp::VarArray(var_message);
		//loads our containers and trains the classifier.
		RF.RC.buildCategorizer(val,cat_buf,inst_id);
      }
      return;
    }
	// ID | Time | From | Rel | Sentiment | Command | Msg  <-- Response Format
	std::string message = var_message.AsString();
	StreamMessage parsed = StreamMessage(message, current_user);    
	if(RF.RC.isTrained == false){
		RF.addMessage(parsed);
	} else if(!RF.backlog.empty() && RF.RC.isTrained == true){
		std::vector<std::string> handle = RF.unload();
		for(auto message : handle){
			PostMessage(pp::Var(message));
		}
	} else {
		std::string response = RF.processMessage(parsed);
		PostMessage(pp::Var(response));
	}
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