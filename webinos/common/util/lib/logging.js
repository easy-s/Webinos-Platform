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
* Copyright 2011 Habib Virji, Samsung Electronics (UK) Ltd
*******************************************************************************/
var ansi        = require('ansi');
var path        = require('path');
var fs          = require('fs');
var os          = require("os");
try {
  var cursor      = ansi(process.stderr);
} catch (err) {
  console.log("missing ansi module");
}

var wPath, wId;
var webinos     = require("find-dependencies")(__dirname);
try {
  wPath       = webinos.local.require(webinos.local.util.location, "lib/webinosPath.js");
  wId         = webinos.local.require(webinos.local.util.location, "lib/webinosId.js");
} catch(err) {
  wPath       = webinos.global.require(webinos.global.util.location, "lib/webinosPath.js");
  wId         = webinos.local.require(webinos.local.util.location, "lib/webinosId.js");
}
var writeInfo, writeError;

var Log = function(filename) {
  function getLineNumber () {
    var error = new Error();
    if(os.type().toLowerCase() === "windows_nt")
      return (error.stack.split('\n')[3].split(':')[2]);
    else
      return (error.stack.split('\n')[3].split(':')[1]);
  }

  var logging = {
    name:filename,
    id:""
  };
  logging.addId   = function(id) {
    this.id = id;
  };
  logging.addType = function(name ){
     new LogInstance(name);
  };
  logging.error = function(msg) {
    var date = new Date(), name;
    var id =  this.id ? " " +this.id+" ": " ";
    if (typeof msg === "object") {msg = JSON.stringify(msg);}
    if (os.type().toLowerCase() === "windows_nt") { name = this.name.split("\\").pop(); } else { name = this.name.split("/").pop();}
    var time = date.getDate()+"."+date.getMonth()+"."+date.getFullYear()+ " " + date.getHours()+":"+date.getMinutes()+":"+date.getSeconds()+":"+date.getMilliseconds();
    var formattedMsg =  "["+time+ "] error "+ name + "(" +getLineNumber() + ")" + id + msg + "\n";
    cursor.fg.red().write(formattedMsg);
    cursor.fg.reset();
    this.writeLog("error", "<p>"+formattedMsg+"</p>");
  };
  logging.log = function(msg) {
    var date = new Date(), name;
    var id = this.id ? " "+this.id+" ": " ";
    if (typeof msg === "object") {msg = JSON.stringify(msg);}
    if (os.type().toLowerCase() === "windows_nt") { name = this.name.split("\\").pop(); } else { name = this.name.split("/").pop();}
    var time = date.getDate()+"."+date.getMonth()+"."+date.getFullYear()+ "-" + date.getHours()+":"+date.getMinutes()+":"+date.getSeconds()+":"+date.getMilliseconds();
    var formattedMsg =  "["+time+ "] info " + name + "(" +getLineNumber() + ")" +  id + msg + "\n";
    cursor.fg.cyan().write(formattedMsg);
    cursor.fg.reset();
    this.writeLog("info", "<p>"+formattedMsg+"</p>");
  };
  logging.writeLog = function(type, msg) {
    if(writeError && type === "error") {
      writeError.write(msg);
    } else if (writeInfo && type === "info"){
      writeInfo.write(msg);
    }
  };
  logging.fetchLog = function (logType, webinosType, friendlyName, callback){
    wId.fetchDeviceName(webinosType, friendlyName, function(instanceName){
      var filename = path.join(wPath.webinosPath()+"/logs/", instanceName+"_"+ logType+".json");
      fs.readFile(filename, function(err, data) {
        if (!err) {
          callback(data.toString());
        } else {
          if (err.code === "ENOENT")
            callback("no errors reported");
          else
            callback(err.message);
        }
      });
    });
  };
  return logging;
};

var LogInstance = function(name) {
  if (os.platform().toLowerCase() !== "android"){
    if (process.getuid) {
      fs.chown(wPath.webinosPath()+"/logs/", process.getuid(), process.getgid());
      fs.chmod(wPath.webinosPath()+"/logs/", 0777);
    }
  }
  try{
    var split = (process.version.split(".") && process.version.split(".")[1]) || "6";
    var nodeVersionResolve = (parseInt(split) >= 8)? fs: path;
    var filename = path.join(wPath.webinosPath()+"/logs/", name+"_error.json");
    nodeVersionResolve.exists(filename, function(err){
      if(!err){
        fs.writeFile(filename, function(err){
          if(!err) {
            writeError = fs.createWriteStream(filename, { flags: "a", encoding:"utf8"});
          }
        });
      } else{
        writeError = fs.createWriteStream(filename, { flags: "a", encoding:"utf8"});
      }
    });
    filename = path.join(wPath.webinosPath()+"/logs/", name+"_info.json");
    nodeVersionResolve.exists(filename, function(err){
      if(!err){
        console.log(err),
        fs.writeFile(filename, function(err){
          if(!err) {
            writeInfo = fs.createWriteStream(filename, { flags: "a", encoding:"utf8"});
          }
        });
      } else{
        writeInfo = fs.createWriteStream(filename, { flags: "a", encoding:"utf8"});
      }
    });
  } catch (err){
    console.log("Error Initializing logs" + err);
  }
};
module.exports = Log;
