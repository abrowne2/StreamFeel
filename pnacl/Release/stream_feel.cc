//Author: Adam Browne; as well as The Chromium Authors, whom
// were responsible for the module and instance structure,
// I (Adam Browne) wrote all subsequent code which includes;
// Mitie ML usage, message handling logic, and any further code
#include <vector>
#include <string>
#include <algorithm>
#include <cstring>
#include <queue>
#include <cctype>

#include "ppapi/cpp/instance.h"
#include "ppapi/cpp/module.h"
#include "ppapi/cpp/var.h"
#include "ppapi/cpp/var_array.h"
#include "mitie/mitie/text_categorizer.h"
#include "mitie/mitie/text_categorizer_trainer.h"


//we're using MIT's Information Extraction Library / Tool(s)
using namespace mitie;
using namespace dlib;

/* a block contains a vector of type <char> and a boolean value to determine
 * if it's entire contents have been received. This is to ensure that we can decode. */
struct Block {
	std::vector<char> container;
	bool populated = false;

	Block() = default;

	void storeByte(char c) {
		container.push_back(c);
	}
};

struct serializedData {
	bool fused = false, trained = false;
	std::vector<Block> blocks;
	std::vector<char> main_buffer;

	serializedData() {
		int accum = 0;
		while(accum != 8){
			blocks.push_back(Block());
			++accum;
		}
	}

	bool needsFusion() const {
		for(int i = 0; i<blocks.size(); ++i)
			if(blocks[i].populated == false)
				return false;
		return (fused == false);
	}

	void populateBlock(pp::VarArray& data, int offset){
		int index = 1, size = data.GetLength();
		while(index < size){
			char byte = data.Get(index).AsInt();
			blocks[offset].storeByte(byte);
			++index;
		}
		blocks[offset].populated = true;
	}

	//takes all the chunks and fuses them into a singular buffer.
	void fuseBuffer() {
		for(int i = 0; i<blocks.size(); ++i)
			for(char c : blocks[i].container)
				main_buffer.push_back(c);
		blocks.clear();
		fused = true;
	}
};

struct dataClassifier {
	//categorizers for sentiment and relevance.
	text_categorizer drelevant, sentiment; 
	bool isTrained = false;
	serializedData rel_raw, sent_raw;

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

	/* We're receiving the entire trained model as binary.
	 * We parse the binary into it's representation, create a 
	 * vectorstream and decode the stream into the categorizer. */
	void buildCategorizer(pp::VarArray& data){
		int offset = data.Get(0).AsInt();
		if(offset >= 0 && offset <= 7){
			rel_raw.populateBlock(data, offset);
		} else {
			offset -= 8;
			sent_raw.populateBlock(data, offset);
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

	//tolower can crash if not ascii...
	void ensureCase(std::string& substring){
		for(int i=0; i<substring.size(); ++i)
			if((substring[i] & ~0x7F) == 0) //toascii used to be defined similarly.
				substring[i] = std::tolower(substring[i]);
	}

	void searchUser(std::string& look_for){
		int index = 0;
		while(index != msg.size()){
			std::string part = msg.substr(index,look_for.size());
			ensureCase(part);
			if(part == cur_user){
				userMentioned = true;
				break;
			}
			++index;
		}
	}

	void parseMention() {
		//once we've determined the user's name, we then parse the mention in it...
		if(cur_user.size() > 0) {
			std::string look_for = '@' + cur_user;
			searchUser(look_for);
			cur_user = userMentioned != true? "": cur_user; 
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

	// a more stricter comparison to determine if nightbot command.
	bool strictCmdComp(int next){
		return msg[next] != ' ' && msg[next] != '!' && msg[next] != '?';
	}

	/* naive approach to determine if the message was a command:
	 * If the next character after the '!' isn't a space, it could be one. 
	 * We also extract the command from the message to examine them. */
	void determineCommand() {
		auto exclamation = msg.find("!");
		if(exclamation != std::string::npos && exclamation + 1 < msg.size()){
			cmdMsg = strictCmdComp(exclamation+1);
			//extract the command for use in analytics.			
			if(cmdMsg == true){
				int begin = exclamation + 1, end = msg.find(" ",begin);
				if(end != std::string::npos){
					cmd = "!" + msg.substr(begin,end-begin);
				} else {
					cmd = "!" + msg.substr(begin);
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
	 * where it is subsequently used for computation. 
	 * data format is id | time | user | cur_user | message */
	StreamMessage(std::string& data) {
		int cur_pos = 0, cur_delim = data.find("|", cur_pos);
		id = data.substr(0,cur_delim);
		cur_pos = cur_delim + 1;
		cur_delim = data.find("|", cur_delim+1);
		time = data.substr(cur_pos, cur_delim-cur_pos);
		cur_pos = cur_delim + 1;
		cur_delim = data.find("|", cur_delim+1);
		user = data.substr(cur_pos, cur_delim-cur_pos);
		cur_pos = cur_delim + 1;
		cur_delim = data.find("|", cur_delim+1);
		cur_user = data.substr(cur_pos, cur_delim-cur_pos);
		cur_pos = cur_delim + 1;
		msg = data.substr(cur_pos);
		//perform final parsing; parse mentions and determine if !cmd.
		handleMsg();
	}
};

/* The responseFormatter contains the classifier which makes conclusions about our data.
 * it also has a backlog, which as the categorizer is being trained stores the messages.
 * once trained, it unloads the backlog and then processes subsequent messages */
struct responseFormatter {
	dataClassifier RC;	
	std::queue<StreamMessage> backlog;

	bool isReady() const { 
		return RC.isTrained;
	}

	void addMessage(StreamMessage& msg){
		backlog.push(msg);
	}

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
		std::string response = parsed.id + "|" + parsed.time + "|" 
			+ parsed.user + "|" + parsed.cur_user + "|";
		if(parsed.cmdMsg == true) {
			response += ("0||" + parsed.cmd);
		} else {
			bool relevant = RC.isRelevant(parsed.msg);
			response += (relevant == true? "1|": "0|");
			std::string feeling = RC.determineFeel(parsed.msg);
			response += feeling;
		}
		response += ("|" + parsed.msg);	 //lastly, append the msg.
		return response;
	}

	void processData(pp::VarArray& data) {
		RC.buildCategorizer(data);
	}

	//important function that handles the construction of text categorizers in our classifiers.
	void handleFusion() {
		if(RC.rel_raw.fused == true && RC.rel_raw.trained == false){
			RC.decodeStream('r',RC.rel_raw.main_buffer);
			RC.rel_raw.trained = true;
		} else if(RC.sent_raw.fused == true && RC.sent_raw.trained == false){
			RC.decodeStream('s',RC.sent_raw.main_buffer);
			RC.sent_raw.trained = true;
		} else if(RC.rel_raw.needsFusion() == true){
			RC.rel_raw.fuseBuffer();
		} else if(RC.sent_raw.needsFusion() == true){
			RC.sent_raw.fuseBuffer();
		} else if(RC.rel_raw.trained == true && RC.sent_raw.trained == true){
			RC.isTrained = true;
		}
	}
};


//namespace referenced by the below instance.
namespace {
	responseFormatter RF;
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
		auto val = pp::VarArray(var_message);
		//loads our containers and trains the classifier.
		RF.processData(val);
      }
      return;
    }
	// ID | Time | From | Rel | Sentiment | Command | Msg  <-- Response Format
	std::string message = var_message.AsString();
	StreamMessage parsed = StreamMessage(message); 
	if(RF.isReady() == false){
		RF.addMessage(parsed);
		RF.handleFusion();
	} else if(!RF.backlog.empty() && RF.isReady() == true){
		RF.addMessage(parsed);
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