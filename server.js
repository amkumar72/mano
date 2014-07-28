
//------------------------------------------------------------------------------
var http = require('http'),
    url = require('url'),
    environments = {
        'Development': 0,
        'Production': 1
    },
    server = http.createServer(),
    regExp = {
        apiVersion: new RegExp('^v[0-9]+$', 'i'),
        date: new RegExp('^20[1-9][0-9][01][0-9][01][0-9]$')
    },
    errorId = 0,
    port = 3000,                        // Configuration: Port Number
    env = environments.Development,     // Configuration: Environment
    logAPICalls = false;                // Configuration: Logging
//------------------------------------------------------------------------------
function getDateStamp () {
    var today = new Date(),
        year = today.getFullYear(),
        month = today.getMonth()+1,
        day = today.getDate();

    return year.toString() 
        + (month<10 ? ('0'+month) : month) 
        + (day<10 ? ('0'+day) : day);
}
//------------------------------------------------------------------------------
function isDevelopment () {
    return env === environments.Development;
}
//------------------------------------------------------------------------------
function done (response, result, code, type) {
    code = code || 200;
    type = type || 'application/json';
    response.writeHead(code, {'Content-Type': type});
    response.write(JSON.stringify(result));
    response.end();
}
//------------------------------------------------------------------------------
function apiError (response, error, code) {
    code = code || 500;
    if(code === 500) {
        // Hide the error message in production environment
        error: isDevelopment() ? error : 
                    'Sorry, unable to service this request.'
    }
    // TODO: Log error in error file
    done(response, {
        error: error,
        errorId: errorId
    }, code);
}
//------------------------------------------------------------------------------
function notFound (response, error) {
    error = error || 'API Not found.';
    apiError(response, error, 404);
}
//------------------------------------------------------------------------------
server.on('request', function (request, response) {
    try {
        var apiCall = request.url.toLowerCase(),
            segments = apiCall.substr(1).split('?')[0].toLowerCase().split('/'),
            api = null,
            query = url.parse(request.url, true).query,
            method = (query.method || request.method).toUpperCase(),
            fileName;
        
        if(logAPICalls || isDevelopment()) {
            // TODO: Log api request in log file
        }

        switch (segments[0]) {
            case 'api':     // Format: ^/api/v[0-9]+/
                if(segments.length<3) {
                    notFound(response);
                } else {
                    if(!regExp.apiVersion.test(segments[1])) {
                        notFound(response, 'Invalid api version.');
                    } else {
                        fileName = './' + segments[0] 
                                    + '/' + segments[1]
                                    + '/' + segments[2];
                        api = require(fileName);
                        if(api) {
                            // TODO: Combine form variables with query as inputs
                            api.process(method, 
                                segments, 
                                query, 
                                request, 
                                response, 
                                isDevelopment(), 
                                function (result, error, code) {
                                    if(!error) {
                                        done(response, result);
                                    } else {
                                        apiError(response, error);
                                    }
                                }
                            );  
                        }
                    }
                }
                break;
            case 'log':     // Format: ^/log/20[1-9][0-9][01][0-9][01][0-9]$
            case 'error':   // Format: ^/error/20[1-9][0-9][01][0-9][01][0-9]$
                if(isDevelopment()) {
                    fileName = segments[1] + '/';
                    if(segments.length==3) {
                        // Date is specified
                        if(!regExp.date.test(segments[2])) {
                            notFound(response, 'Invalid date.');
                        } else {
                            fileName += segments[2];
                        }
                    } else {
                        // Default to today
                        fileName += getDateStamp();
                    }
                    // TODO: Render the error/log file                  
                } else {
                    notFound(response);
                }
                break;
            default:
                notFound(response, 
                    'Sorry, the resource you requested does not exist.');
                break;
        }
    } catch(error) {
        if(error.code && error.code=='MODULE_NOT_FOUND') {
            notFound(response);
        } else {
            apiError(response, error);
        }
    }
    
});
//------------------------------------------------------------------------------
server.listen(port);
if(isDevelopment()) {
    console.log('API Server started on port %d', port);
}
//------------------------------------------------------------------------------
