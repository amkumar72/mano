
//------------------------------------------------------------------------------
// Private members

var http = require('http'),
    url = require('url'),
    fs = require('fs'),
    uuid = require('node-uuid'),
    utilities = require('./utilities'),
    session = require('./api/v1/session'),

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
    configurations, // All configuration are loaded into this
    config;         // The configuration for the current module (server)

//------------------------------------------------------------------------------
// Private methods

function getLogId () {
    return serverId + '#' + (logId++);
}
//------------------------------------------------------------------------------
function isDevelopment () {
    return config.env === environments.Development;
}
//------------------------------------------------------------------------------
function done (request, response, result, code, type, cookies) {
    code = code || 200;
    type = type || 'application/json';
    response.writeHead(code, {
        'Content-Type': type,
        'Set-Cookie': cookies
    });
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
function apiError (request, response, error, code, cookies) {
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
    errorEntry = '\n##APIError,' + utilities.getDateTimeStamp() + ',' + errorId
        + ': ' + request.url
        + ': ' + code
        + ': ' + error;
    errorFile.write(errorEntry);

    done(request,
        response,
        {
            error: error,
            errorId: errorId
        },
        code,
        null,
        cookies
    );

    if(isDevelopment) {
        console.log('Error:' + errorId + ': ' + error);
    }
}
//------------------------------------------------------------------------------
function notFound (request, response, error, cookies) {
    error = error || 'API Not found.';
    apiError(request, response, error, 404, cookies);
}
//------------------------------------------------------------------------------
function getCookie (request, cookieName) {
    var name = (cookieName + "="),
        cookies = [],
        cookie,
        i;

    if(request.headers.cookie) {
        cookies = request.headers.cookie.split(';');
    }
    for(i = 0; i<cookies.length; i++) {
        cookie = cookies[i];
        while (cookie.charAt(0)==' ') cookie = cookie.substring(1);
        if (cookie.indexOf(name) != -1) {
            return cookie.substring(name.length, cookie.length);
        }
    }
    return "";
}
//------------------------------------------------------------------------------
function setCookie (cookies, cookieName, cookieValue, expiry) {
    var expires = '';

    if(expiry) {
        expires = "expires=" + expiry.toGMTString();
    }
    cookies.push(cookieName + "=" + cookieValue + "; " + expires);
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
            cookieToken,
            cookies = [],
            fileExt = '',
            token,
            logOrErrorFile;

        if(config.logAPICalls || isDevelopment()) {
            logEntry = '\n##APICall,' + utilities.getDateTimeStamp()
                + ',' + getLogId()
                + ': ' + request.url;
            logFile.write(logEntry);
        }

        // Authentication & access control
        cookieToken = getCookie(request, 'token');
        token = session.extractToken(cookieToken);

        switch (segments[0]) {

            // API call
            case 'api':     // Format: ^/api/v[0-9]+/
                if(segments.length < 3) {
                    notFound(request, response, null, cookies);
                } else {
                    if(!regExp.apiVersion.test(segments[1])) {
                        notFound(request,
                            response,
                            'Invalid api version. Expected: /api/v1/...',
                            cookies
                        );
                    } else {
                        fileName = './' + segments[0]
                                    + '/' + segments[1]
                                    + '/' + segments[2];
                        api = require(fileName);
                        if(api) {
                            // TODO: Combine form variables with query as inputs
                            api.process(
                                { // Server object exposed to the api handler
                                    config: configurations,
                                    isDevelopment: isDevelopment(),
                                    getCookie: function(cookieName) {
                                        return(getCookie(request, cookieName));
                                    },
                                    setCookie: function(cookieName,
                                        cookieValue,
                                        lifeInMinutes
                                    ) {
                                        setCookie(cookies,
                                            cookieName,
                                            cookieValue,
                                            lifeInMinutes
                                        );
                                    }
                                },
                                method,
                                segments,
                                query,
                                request,
                                response,
                                token,
                                function (result, error, code) {
                                    if(!error) {
                                        done(request,
                                            response,
                                            result,
                                            null,
                                            null,
                                            cookies
                                        );
                                    } else {
                                        apiError(request,
                                            response,
                                            error,
                                            code,
                                            cookies
                                        );
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
                    if(segments.length === 2) {
                        // Date is specified
                        if(!regExp.date.test(segments[1])) {
                            notFound(request,
                                response,
                                'Invalid date. Expected: /' + segments[0]
                                    + '/' + utilities.getDateStamp(),
                                cookies
                            );
                        } else {
                            fileName += segments[1];
                        }
                    } else {
                        // Default to today
                        fileName += utilities.getDateStamp();
                    }
                    fileName += fileExt;
                    fs.exists(fileName, function(exists) {
                        if(exists) {
                            // Render the error/log file
                            logOrErrorFile = fs.createReadStream(fileName);
                            logOrErrorFile.pipe(response);
                        } else {
                            done(request,
                                response,
                                'None.',
                                200,
                                'text/plain',
                                cookies
                            );
                        }
                    });
                } else {
                    notFound(request, response, null, cookies);
                }
                break;

            default:
                notFound(request,
                    response,
                    'Sorry, the resource you requested does not exist.',
                    cookies
                );
                break;
        }
    } catch(error) {
        if(error.code && error.code == 'MODULE_NOT_FOUND') {
            notFound(request, response, null, cookies);
        } else {
            apiError(request, response, error, null, cookies);
        }
    }

});

//------------------------------------------------------------------------------
// Initialize

configurations = JSON.parse(
    utilities.removeLineComments(fs.readFileSync('./config.json').toString())
);
config = configurations.server;

fileOptions = {
        flags: 'a',
        encoding: null,
        mode: 0666
    };

if(!fs.existsSync('./log')) {
    fs.mkdirSync('./log');
};
logFile = fs.createWriteStream('./log/' + utilities.getDateStamp()
            + '.log', fileOptions);

if(!fs.existsSync('./error')) {
    fs.mkdirSync('./error');
};
errorFile = fs.createWriteStream('./error/' + utilities.getDateStamp()
                + '.err.log', fileOptions);

server.listen(config.port);

logFile.write('\n##Server started,' + utilities.getDateTimeStamp()
    + ',' + serverId);

if(isDevelopment()) {
    console.log('API Server started on port %d', config.port);
}

//------------------------------------------------------------------------------
