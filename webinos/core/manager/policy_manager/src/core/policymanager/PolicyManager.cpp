/*******************************************************************************
 *  Code contributed to the webinos project
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *  
 *     http://www.apache.org/licenses/LICENSE-2.0
 *  
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * Copyright 2011 Telecom Italia SpA
 * 
 ******************************************************************************/

#include "PolicyManager.h"
#include "../../debug.h"

PolicyManager::PolicyManager() {}

PolicyManager::PolicyManager(const string & policyFileName){

	TiXmlDocument doc(policyFileName);
	LOGD("Policy manager file : %s",policyFileName.data());

	if (doc.LoadFile())
	{
		LOGD("Policy manager file load ok");
		validPolicyFile = true;
		TiXmlElement * element = (TiXmlElement *)doc.RootElement();
		if(element->ValueStr() == "policy"){
			policyDocument = new PolicySet(new Policy(element, &dhp));
		}
		else if(element->ValueStr() == "policy-set"){
			policyDocument = new PolicySet(element, &dhp);
		}
		policyName = policyDocument->description;
	}
	else{
		validPolicyFile = false;
		LOGD("[PolicyManager] Policy file not found");
		policyName = "no_name";
	}
/*	
	if(policyDocument){
		policyName = policyDocument->description;
	}
	else{
		policyName = "no_name";
	}
*/
	LOGD("Policy manager ctor finish");
}

PolicyManager::~PolicyManager() {}

string PolicyManager::getPolicyName(){
	return policyName;
}

Effect PolicyManager::checkRequest(Request * req){
	Effect xacml_eff;
	bool dhp_eff = false;
	LOGD("Policy manager start check");
	if(validPolicyFile) {
		xacml_eff = policyDocument->evaluate(req, &selectedDHPref);
		LOGD("XACML response: %d", xacml_eff);
		if (selectedDHPref.empty() == false) {
			LOGD("Selected DHPref: %s", selectedDHPref.c_str());
			dhp_eff = dhp[selectedDHPref]->evaluate(req);
		}
		if (dhp_eff == true){
			LOGD("DHP response: true");
		}
		else
			LOGD("DHP response: false");
		if (xacml_eff == PERMIT && dhp_eff == false){
			LOGD("XACML-DHPref combined response: %d", PROMPT_BLANKET);
			return PROMPT_BLANKET;
		}
		else {
			LOGD("XACML-DHPref combined response: %d", xacml_eff);
			return xacml_eff;
		}
	}
	else
		return INAPPLICABLE;
}
