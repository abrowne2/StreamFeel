/* StreamFeel Dataset Utility/Serializer (Author: Adam Browne)
 * This utility encodes the dataset and adds new records to existing datasets.
 * the serialized data we get from the trained model is used in the actual extension. */

// text_categorizer.h was modified to include "encode / decode" to use the serialization/deserialization.

#include <algorithm>
#include <iostream>
#include <sstream>
#include <vector>
#include <fstream>
#include <string>

#include "../../../mitielib/include/mitie/text_categorizer.h"
#include "../../../mitielib/include/mitie/text_categorizer_trainer.h"

using namespace mitie;
using namespace dlib;

//an abstraction intended to keep the # of checks down (?)
struct DataInst {
	std::string file_name, lbl, type, file;
	char selection;
	int curOffset;
	std::string dir = "/Users/adambrowne/Desktop/Personal/StreamFeel/src/inject/";

	DataInst(char choice){
		selection = choice;
		if(selection == 'r'){
			curOffset = 0;
			lbl = "Relevant (y/n):\n", file = "relevance.txt";
			type = "relevance_data", file_name = dir + "default.js";			
		} else {
			curOffset = 16;
			lbl = "Sentiment:\n", file = "sentiment.txt";
			type = "sentiment", file_name = dir + "sentiment.js";
		}
	}
	//reads the contents of the file as a string.
	std::string readData() {
		std::ifstream fileReader(file);		
		std::stringstream buffer;
		buffer << fileReader.rdbuf();
		return buffer.str();
	}

};

/* In order to categorize a msg, we must first tokenize it.
* this helper function does that by parsing spaces. */
std::vector<std::string> tokenize_msg(std::string& input, char delim){
    std::vector<std::string> tokens;
        tokens.reserve(input.size());
        int curSpace = input.find(delim), curPos = 0;
        while(curSpace != std::string::npos){
            tokens.push_back(input.substr(curPos,curSpace-curPos));
            curPos = curSpace+1;
            curSpace = input.find(delim,curPos);      
        }
        //if no space, or last region, push it in.
        tokens.push_back(input.substr(curPos));
        return tokens;
}

//split by commas
std::vector<std::string> split(std::string& raw){
	return tokenize_msg(raw,',');
}

/* Load an existing dataset from a file. */
std::vector<std::string> dataset(DataInst& inst){
	std::string raw = inst.readData();
	return split(raw);
}


void buildTrainer(text_categorizer_trainer& fit, std::vector<std::string> const& data) {
    int i = 0, invariant = data.size() - 1;
    while(i < invariant){
        std::string label = data[i+1];
        std::string msg = data[i];
        std::vector<std::string> token = tokenize_msg(msg,' ');
        fit.add(token,label);
        i += 2;
    }
}

/* Serialize works by pulling the existing dataset, subsequently training it,
 * then serializing (encodes) the data to the vector stream and returning its' buffer */
std::vector<char> serialize(DataInst& inst) {
    text_categorizer executor;
    std::vector<std::string> data = dataset(inst);
    text_categorizer_trainer fit;
    buildTrainer(fit,data);
    fit.set_num_threads(4);
    executor = fit.train();
    std::vector<char> buf;
    dlib::vectorstream strm(buf);
    executor.encode(executor,strm);
    return buf;
}

//input validation for adding records.
bool notValid(const std::string& input, char type) {
	if(type == 'r')
		return input != "y" && input != "n";
	else
		return (input != "funny" && input != "sad" && input != "happy" 
			&& input != "angry" && input != "confused" && input != "curious" 
			&& input != "gentlemanly" && input != "astonished" && input != "friendly");
}

void readRecord(std::string& msg, DataInst& inst, std::string& label) {
	std::cout << "Enter message:\n"; 
	std::cin.ignore();
	std::getline(std::cin,msg);
	std::cout << inst.lbl;
	do {
		std::cin >> label;
	} while(notValid(label,inst.selection) == true);
	//need the delimeter ',': can't confuse it.
	msg.erase(std::remove(msg.begin(), msg.end(), ','), msg.end());
}

void addRecord(DataInst& inst) {
	std::string msg, label;
	//open the dataset for appending because we're adding another record.	
	std::ofstream fileWriter;
	fileWriter.open(inst.file, std::ios_base::app);
	//append the new record to the dataset.
	readRecord(msg,inst,label);
	std::string new_msg = "," + msg + "," + label;
	fileWriter << new_msg;
	std::cout << "Added " << msg << "," << label << std::endl;
}

void displayMenu() {
	std::cout << "1. Add Relevance\n";
	std::cout << "2. Add Sentiment\n";
	std::cout << "3. Update Relevance\n";
	std::cout << "4. Update Sentiment\n";		
	std::cout << "5. Display Menu\n";
}



/* SegmenData breaks up the entire serialized buffer into eight different chunks
 * They're subsequently interpreted by the native client module. */
void segmentData(std::vector<char>& buffer, std::string& updated_data, DataInst& inst){
	int index = 0, origBound = buffer.size() / 16, curBound;
	curBound = origBound;
	int curOffset = inst.curOffset;
	std::string type = inst.type;
	while(index != buffer.size()){
		std::string offset = to_string(curOffset++);
		updated_data += ("\nvar " + type + offset + " = [\n" + offset + ",");
		for(; index < curBound; ++index){
			int byte = buffer[index];
			updated_data += (to_string(byte) + ",");
		}
		updated_data.pop_back();
		updated_data += "\n];";
		curBound = origBound + curBound;
		if(curBound + origBound > buffer.size())
			curBound = buffer.size();
	}
}

/* Serializes a trained categorizer model and writes its
 * raw representation to the javascript file containing it,
 * this will be deserialized by the native client module. */
void updateDataset(DataInst& inst){
	//get the trained buffer (raw representation of the model)
	std::vector<char> buffer = serialize(inst);
	std::string updated_data;
	segmentData(buffer,updated_data,inst);
	std::ofstream dataWriter(inst.file_name);
	dataWriter << updated_data;
}


//1 - Update Rel, 2 - Update Sent, 3 - Add Rel, 4 - Add Sent - 5: display menu
int main() {
	int choice; //1 - 4:	
	displayMenu();
	do {
		std::cin >> choice;
		auto rel = DataInst('r'), sen = DataInst('s');
		switch(choice){
			case 1:
				addRecord(rel);
				break;
			case 2:
				addRecord(sen);
				break;
			case 3:
				updateDataset(rel);
				break;
			case 4:
				updateDataset(sen);
				break;
			case 5:
				displayMenu();
				break;
		}
	} while(choice >= 1 && choice <= 5);
}

