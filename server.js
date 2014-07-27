
//------------------------------------------------------------------------------
var http = require('http'),
	api = null,
	environments = {
		'Development': 0,
		'Production': 1
	},
	server = http.createServer(),
	env = environments.Development,  	// Configuration: Environment
	logAPICalls = false;				// Configuration: Logging
//------------------------------------------------------------------------------
function getDateStamp () {
	var today = new Date(),
		year = today.getFullYear(),
		month = today.getMonth()+1,
		day = today.getDate();

	return year.toString() 
		+ (month<10 ? '0'+month : month) 
		+ (day<10 ? '0'+day : day);
}
//------------------------------------------------------------------------------
function isDevelopment () {
	return env === environments.Development;
}
//------------------------------------------------------------------------------
function isProduction () {
	return env === environments.Production;
}
//------------------------------------------------------------------------------
server.on('request', function (request, response) {
	try {
		var url = request.url.toLowerCase(),
			segments = url.substr(1).split('/'),
			errorId = 0,
			url = require('url'),
			query = url.parse(request.url, true).query,
			method = query.method || request.method,
			fileName;
		
		function done (result, code, type) {
			code = code || 200;
			type = type || 'application/json';
			response.writeHead(code, {'Content-Type': type});
			response.write(JSON.stringify(result));
			response.end();
		}

		function apiError (error, code) {
			code = code || 500;
			if(code === 500) {
				// Hide the error message in production environment
				error: isDevelopment() ? 
					error : 'Sorry, unable to service this request.'
			}
			// TODO: Log error in error file
			done({
				error: error,
				errorId: errorId
			}, code);
		}

		function notFound (error) {
			error = error || 'API Not found.';
		}

		if(logAPICalls || isDevelopment()) {
			// TODO: Log api request in log file
		}

		method = method.toUpperCase();
		switch (segments[0]) {
			case 'api':
				if(segments.length<2) {
					notFound();
				} else {
					switch(segments[1]) {
						//------------------------------------------------------
						/* Start: Code specific to this application */
						case 'sessions':
							api = require('./session');
							break;
						case 'users':
							api = require('./user');
							break;
						/* End: Code specific to this application */
						//------------------------------------------------------
						default:
							notFound();
							break;
					}
					if(api) {
						// TODO: Combine form variables with query as inputs
						api.process(method, segments, query, request, response, 
							isDevelopment(), 
							function (result, error, code) {
								if(!error) {
									done(result);
								} else {
									apiError(error);
								}
							}
						);	
					}
				}
				break;
			case 'log':
			case 'error':
				if(isDevelopment()) {
					fileName = segments[1] + '/';
					if(segments.length==3) {
						// Date is specified
						fileName += segments[2];
					} else {
						// Default to today
						fileName += getDateStamp();
					}
					// TODO: Render the error/log file					
				} else {
					notFound();
				}
				break;
			default:
				notFound('Sorry, the resource you requested does not exist.');
				break;
		}
	} catch(error) {
		apiError(error);
	}
	
});
//------------------------------------------------------------------------------
server.listen(3000);
//------------------------------------------------------------------------------