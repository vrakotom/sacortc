// Load required modules
var http    = require("http");              // http server core module
var express = require("express");           // web framework external module
var io      = require("socket.io");         // web socket external module
var easyrtc = require("easyrtc");      
var request = require('request');

// Setup and configure Express http server. Expect a subfolder called "static" to be the web root.
var httpApp = express();
httpApp.use(express.static(__dirname + "/static/"));


// Start Express http server on port 8080
var webServer = http.createServer(httpApp).listen(8080);

// Start Socket.io so it attaches itself to Express server
var socketServer = io.listen(webServer, {"log level":1});

// Start EasyRTC server
var rtc = easyrtc.listen(httpApp, socketServer);

//set authentication...
var onAuthenticate = function(socket, easyrtcid, appName, username, credential, easyrtcAuthMessage, next){
	if(credential != null){
	if(credential['username'] != null && credential['password'] != null && credential['authtype'] != null){
		console.log("Attempting authentication for user<" + credential['username'] + "> and password <" + credential['password'] + ">");
		var authurl = '';
		//if auth is demo
		if(credential['authtype'] === 'android'){
			authurl = "http://ecesaco.org/saco/webservices/checklogin/" + credential['username'] +"/"+ credential['password'];
		}else if(credential['authtype'] === 'pc'){
			//pc auth url is different from others
			authurl = "http://ecesaco.org/saco/webservices/checkWebRTCUser/" + credential['password'] + "/" + credential['username'];
		}else{
			authurl = "http://ecesaco.org/saco/webservices/checklogin/" + credential['username'] +"/"+ credential['password'];
		}


		//call authetication service
		request(authurl, function (error, response, auth) {
			
		  if (!error && response && auth) {
		  	if(response.statusCode == 200){
		  		console.log("authentication response received with data..." + auth); 
			  	if(auth === "-1"){
				console.log("Connection for user<" + credential['username'] + "> and password <" + credential['password'] + "> denied!");
				//socket.disconnect();
				next(new easyrtc.util.ConnectionError("Failed our private auth."));
				}else{
				console.log("Connection for user<" + credential['username'] + "> and password <" + credential['password'] + "> accepted!");
				next(null);
				}
		  	}else{
		  		console.log("Authentication service response indicate error with connection...");
		  		console.log("response code: "+ response.statusCode);
				next(new easyrtc.util.ConnectionError("Failed our private auth."));
		  	}

		  }else{
		  	console.log("Error contacting authentication service...");
		  	console.log("error message: "+ error);
			next(new easyrtc.util.ConnectionError("Failed our private auth."));
		  }
		})			
	}else{
		console.log("Attempted access to signalling server rejected...");
		next(new easyrtc.util.ConnectionError("Failed our private auth."));
	}
	}else{
		console.log("Attempted access to signalling server rejected...");
		next(new easyrtc.util.ConnectionError("Failed our private auth."));
	}	
};

easyrtc.events.on("authenticate", onAuthenticate);

