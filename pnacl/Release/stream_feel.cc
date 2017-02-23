//Author: Adam Browne; as well as The Chromium Authors, whom
// were responsible for the module and instance structure,
// I (Adam Browne) wrote all subsequent code which includes;
// OpenCV ML usage, message handling logic, and any further code
#include <vector>
#include <string>

#include "ppapi/cpp/instance.h"
#include "ppapi/cpp/module.h"
#include "ppapi/cpp/var.h"
#include "ppapi/cpp/var_array.h"
#include "opencv2/ml/ml.hpp" //we need for the opencv ML library port.
#include "opencv2/core/mat.hpp"

typedef CvNormalBayesClassifier CvBayes;

struct relevanceClassifier : public CvBayes {
	//keep these here for now, we're going to use to train our classifier.
	cv::Mat l, r;
	bool loaded = false;

	void loadContainers(pp::VarArray& message){
		//containers we're using to convert to needed material.
		std::vector<std::string> labels;
		std::vector<int> responses;

		int i = 1, data_size = message.Get(0).AsInt();
		int needed = data_size / 2;
		//reserve the needed memory for these containers.
		labels.reserve(needed);
		responses.reserve(needed);
		//load our containers.		
		while(i <= data_size){
			if(i & 1)
				labels.push_back(message.Get(i).AsString());
			else
				responses.push_back(message.Get(i).AsInt());
			++i;
		}
		l = cv::Mat(labels, true);
		r = cv::Mat(responses, true);
		loaded = true;
	}
	
	void trainRC() {
		this->train(l,r);
	}
};


/* Variables / functions declared within this namespace
 * persist throughout the duration of the client instance;
 * This is important because it means we can first train our 
 * classifier and then fit it accordingly when handling messages. */
namespace {
	//we're going to use this to classify text as relevant.
	relevanceClassifier RC = relevanceClassifier();
}  // namespace



struct StreamMessage {
	std::string id, time, user, msg;	
		
	/* A 'StreamMessage' is constructed by parsing the original data,
	 * where it is subsequently used for computation. */
	StreamMessage(std::string& data){
		//data format is id | time | user | message.
		int cur_pos = 0;
		int cur_delim = data.find("|", cur_pos);
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
      	auto arr = pp::VarArray(var_message);
      	RC.loadContainers(arr);
      	RC.trainRC();
      }
      return;
    }

  	//get the string message and parse it.
    std::string message = var_message.AsString();
	//test our parser:
	StreamMessage test = StreamMessage(message);
	//now, build the test return string.
	std::string returner = test.id+'|'+test.time+'|'+test.user+'|'+test.msg;
    // make a reply using:
    pp::Var var_reply(returner);
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
