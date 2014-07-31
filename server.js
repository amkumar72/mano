
//------------------------------------------------------------------------------
// Private members

var http = require('http'),
    url = require('url'),
    fs = require('fs'),
    uuid = require('node-uuid'),
    environments = {
        'Development': 0,
        'Production': 1
    },
    server = http.createServer(),
    serverId = uuid.v4(),
    logId = 1,
    regExp = {
        apiVersion: new RegExp('^v[0-9]+$', 'i'),
        date: new RegExp('^20[1-9][0-9][01][0-9][0-3][0-9]$')
    },
    fileOptions,
    logFile,
    errorFile,
    errorId = 0,
    port = 3000,                        // Configuration: Port Number
    env = environments.Development,     // Configuration: Environment
    logAPICalls = false;                // Configuration: Logging

//------------------------------------------------------------------------------
// Private methods

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
function getDateTimeStamp () {
    var today = new Date(),
        year = today.getFullYear(),
        month = today.getMonth()+1,
        day = today.getDate(),
        hour = today.getHours(),
        min = today.getMinutes(),
        sec = today.getSeconds();

    return year.toString() 
        + (month<10 ? ('0'+month) : month) 
        + (day<10 ? ('0'+day) : day)
        + (hour<10 ? ('0'+hour) : hour)
        + (min<10 ? ('0'+min) : min)
        + (sec<10 ? ('0'+sec) : sec)
}
//------------------------------------------------------------------------------
function getLogId () {
    return serverId + '#' + (logId++);
}
//------------------------------------------------------------------------------
function isDevelopment () {
    return env === environments.Development;
}
//------------------------------------------------------------------------------
function done (request, response, result, code, type) {
    code = code || 200;
    type = type || 'application/json';
    response.writeHead(code, {'Content-Type': type});
    switch(type) {
        case 'text/plain':
            response.write(result);
            break;
        default:
            response.write(JSON.stringify(result));
            break;
    }
    response.end();
}
//------------------------------------------------------------------------------
function apiError (request, response, error, code) {
    var errorEntry;

    errorId = getLogId();   // This will be returned to the client
                            // and it can be used in production environment
                            // to identify the error from the error log file.
    code = code || 500;
    if(code === 500) {
        // Hide the error message in production environment
        error: isDevelopment() ? error : 
                    'Sorry, unable to service this request.'
    }
    errorEntry = '\n##APIError,' + getDateTimeStamp() + ',' + errorId
        + ': ' + request.url
        + ': ' + code
        + ': ' + error;
    errorFile.write(errorEntry);

    done(request, 
        response, {
        error: error,
        errorId: errorId
    }, code);

    if(isDevelopment) {
        console.log('Error:' + errorId + ': ' + error);
    }
}
//------------------------------------------------------------------------------
function notFound (request, response, error) {
    error = error || 'API Not found.';
    apiError(request, response, error, 404);
}
//------------------------------------------------------------------------------
server.on('request', function (request, response) {
    try {
        var apiCall = request.url.toLowerCase(),
            segments = apiCall.substr(1).split('?')[0].toLowerCase().split('/'),
            api = null,
            query = url.parse(request.url, true).query,
            method = (query.method || request.method).toUpperCase(),
            logEntry,
            fileName,
            fileExt = '',
            logOrErrorFile;
        
        if(logAPICalls || isDevelopment()) {
            logEntry = '\n##APICall,' + getDateTimeStamp() + ',' + getLogId()
                + ': ' + request.url;
            logFile.write(logEntry);
        }

        switch (segments[0]) {
            // API call
            case 'api':     // Format: ^/api/v[0-9]+/
                if(segments.length<3) {
                    notFound(request, response);
                } else {
                    if(!regExp.apiVersion.test(segments[1])) {
                        notFound(request, response, 
                            'Invalid api version. Expected: /api/v1/...');
                    } else {
                        fileName = './' + segments[0] 
                                    + '/' + segments[1]
                                    + '/' + segments[2];
                        api = require(fileName);
                        if(api) {
                            // TODO: Combine form variables with query as inputs
                            api.process(
                                null,
                                method, 
                                segments, 
                                query, 
                                request, 
                                response, 
                                isDevelopment(), 
                                function (result, error, code) {
                                    if(!error) {
                                        done(request, response, result);
                                    } else {
                                        apiError(request, response, 
                                            error, code);
                                    }
                                }
                            );  
                        }
                    }
                }
                break;

            // Dump error and log files (only in development environment)
            case 'error':   // Format: ^/error/20[1-9][0-9][01][0-9][01][0-9]$
                fileExt = '.err';
            case 'log':     // Format: ^/log/20[1-9][0-9][01][0-9][01][0-9]$
                fileExt += '.log';
                if(isDevelopment()) {
                    fileName = './' + segments[0] + '/';
                    if(segments.length==2) {
                        // Date is specified
                        if(!regExp.date.test(segments[1])) {
                            notFound(request, response, 
                                'Invalid date. Expected: /' + segments[0]
                                    + '/' + getDateStamp());
                        } else {
                            fileName += segments[1];
                        }
                    } else {
                        // Default to today
                        fileName += getDateStamp();
                    }
                    fileName += fileExt;
                    fs.exists(fileName, function(exists) {
                        if(exists) {
                            // Render the error/log file
                            logOrErrorFile = fs.createReadStream(fileName);
                            logOrErrorFile.pipe(response);
                        } else {
                            done(request, response, 'None.', 200, 'text/plain');
                        }
                    });
                } else {
                    notFound(request, response);
                }
                break;

            default:
                notFound(request, response, 
                    'Sorry, the resource you requested does not exist.');
                break;
        }
    } catch(error) {
        if(error.code && error.code=='MODULE_NOT_FOUND') {
            notFound(request, response);
        } else {
            apiError(request, response, error);
        }
    }
    
});

//------------------------------------------------------------------------------
// Initialize

fileOptions = {
        flags: 'a',
        encoding: null,
        mode: 0666
    };

if(!fs.existsSync('./log')) {
    fs.mkdirSync('./log');
};
logFile = fs.createWriteStream('./log/' + getDateStamp() + '.log', fileOptions);

if(!fs.existsSync('./error')) {
    fs.mkdirSync('./error');
};
errorFile = fs.createWriteStream('./error/' + getDateStamp() + '.err.log',
                fileOptions);

server.listen(port);

logFile.write('\n##Server started,' + getDateTimeStamp() + ',' + serverId);

if(isDevelopment()) {
    console.log('API Server started on port %d', port);
}

//------------------------------------------------------------------------------
