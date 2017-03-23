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

//reads the contents of the file as a string.
std::string readData(std::ifstream& fileReader){
	std::stringstream buffer;
	buffer << fileReader.rdbuf();
	return buffer.str();
}

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
std::vector<std::string> dataset(char which){
	//used to hold data extracted from the file.
	std::string raw;	
	if(which == 'r'){
		std::ifstream fileReader("relevance.txt");
		raw = readData(fileReader);
	} else {
		std::ifstream fileReader("sentiment.txt");
		raw = readData(fileReader);
	}
	return split(raw);
}


/* Serialize works by pulling the existing dataset, subsequently training it,
 * then serializing (encodes) the data to the vector stream and returning its' buffer */
std::vector<char> serialize(char choice) {
    text_categorizer executor;
    std::vector<std::string> data = dataset(choice);
    text_categorizer_trainer fit;
    int i = 0, invariant = data.size() - 1;
    while(i < invariant){
        std::string label = data[i+1];
        std::string msg = data[i];
        std::vector<std::string> token = tokenize_msg(msg,' ');
        fit.add(token,label);
        i += 2;
    }
    fit.set_num_threads(4);
    executor = fit.train();
    std::vector<char> buf;
    dlib::vectorstream strm(buf);
    executor.encode(executor,strm);
    return buf;
}


void readRecord(std::string& msg, std::string& label, const std::string& lbl) {
	std::cout << "Enter message:\n"; 
	std::cin.ignore();
	std::getline(std::cin,msg);
	std::cout << lbl;
	std::cin >> label;
	//need the delimeter ',': can't confuse it.
	msg.erase(std::remove(msg.begin(), msg.end(), ','), msg.end());
}

void addRecord(char choice) {
	std::string file, lbl, msg, label;
	if(choice == 'r'){
		lbl = "Relevant (y/n):\n";
		file = "relevance.txt";
	} else {
		lbl = "Sentiment:\n";
		file = "sentiment.txt";
	}
	//open the dataset for appending because we're adding another record.	
	std::ofstream fileWriter;
	fileWriter.open(file, std::ios_base::app);
	//append the new record to the dataset.
	readRecord(msg,label,lbl);
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

//after testing, I've discovered the sentiment dataset is so large it must be split into chunks.
void segmentData(std::vector<char>& buffer, std::string& updated_data, char choice){
	if(choice == 'r'){
		for(int byte : buffer)
			updated_data += (to_string(byte) + ",");
		updated_data.pop_back();
		updated_data += "\n];";			
	} else {
		//for sentiment, we must segment it into two chunks.
		for(int i = 0; i < buffer.size() / 2; ++i){
			int byte = buffer[i];
			updated_data += (to_string(byte) + ",");
		}
		updated_data.pop_back();
		updated_data += "\n];\n\nvar sentiment2 = [\n";
		for(int i = buffer.size() / 2; i < buffer.size(); ++i){
			int byte = buffer[i];
			updated_data += (to_string(byte) + ",");
		}
		updated_data.pop_back();
		updated_data += "\n];";
	}
}

/* Serializes a trained categorizer model and writes its
 * raw representation to the javascript file containing it,
 * this will be deserialized by the native client module. */
void updateDataset(char choice){
	//get the trained buffer (raw representation of the model)
	std::vector<char> buffer = serialize(choice);
	std::string var_name, file_name;
	if(choice == 'r'){
		var_name = "relevance_data = [\n";
		file_name = "/Users/adambrowne/Desktop/Personal/StreamFeel/src/inject/default.js";
	} else {
		var_name = "sentiment = [\n";
		file_name = "/Users/adambrowne/Desktop/Personal/StreamFeel/src/inject/sentiment.js";
	}
	std::string updated_data = "var " + var_name;
	segmentData(buffer,updated_data,choice);
	std::ofstream dataWriter(file_name);
	dataWriter << updated_data;
}


//1 - Update Rel, 2 - Update Sent, 3 - Add Rel, 4 - Add Sent - 5: display menu
int main() {
	int choice; //1 - 4:	
	displayMenu();
	do {
		std::cin >> choice;
		switch(choice){
			case 1:
				addRecord('r');
				break;
			case 2:
				addRecord('s');
				break;
			case 3:
				updateDataset('r');
				break;
			case 4:
				updateDataset('s');
				break;
			case 5:
				displayMenu();
				break;
		}
	} while(choice >= 1 && choice <= 5);
}

