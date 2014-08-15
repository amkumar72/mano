
//------------------------------------------------------------------------------
// Private members

var utilities = require('../../utilities'),
    groups = require('./group').groups,

    config,
    actions = {
        login: utilities.actions.create,
        logout: utilities.actions.delete
    };

//------------------------------------------------------------------------------
// Private methods

function sessionMgmtOwn (server, token, method, segments, input, callback) {
    var tokenString = '';

    switch(utilities.getAction(method, segments, input)) {
        case actions.login:
            if(token.sessionId !== 0) {
                // TODO: Close old session in DB
                token.sessionId = 0;
            }
            // TODO: Authenticate using user credentials stored in DB
            // Start: Stub
            switch(input.loginName) {
                case 'manoj':
                    if(input.password === 'pwd') {
                        token.sessionId = 1;
                        token.name = 'Manoj KA';
                        token.roles = [groups.administrators];
                    }
                    break;
                case 'tesni':
                    if(input.password === 'pwd') {
                        token.sessionId = 2;
                        token.name = 'Tesni Edathil';
                        token.roles = [groups.seniorManagers];
                    }
                    break;
                case 'kumar':
                    if(input.password === 'pwd') {
                        token.sessionId = 3;
                        token.name = 'AM Kumar';
                        token.roles = [groups.projectManagers];
                    }
                    break;
                case 'aarav':
                    if(input.password === 'pwd') {
                        token.sessionId = 4;
                        token.name = 'Aarav Manoj';
                        token.roles = [groups.teamMembers];
                    }
                    break;
                case 'rithurag':
                    if(input.password === 'pwd') {
                        token.sessionId = 5;
                        token.name = 'Rithurag Babu';
                        token.roles = [groups.clients];
                    }
                    break;
            }
            // End: Stub
            if(token.sessionId !== 0) {
                token.createdOn = new Date();
                token.validUntil = new Date();
                token.validUntil.setMinutes(
                    token.createdOn.getMinutes() +
                    config.timeout
                );
                token.lastAccessedOn = token.createdOn;
                tokenString = generateTokenString(token);
                server.setCookie('token',
                    tokenString,
                    token.validUntil
                );
                if(server.isDevelopment) {
                    // To help debugging, set a plain text token
                    server.setCookie('tokenPlain',
                        generateTokenString(token, true),
                        token.validUntil
                    );
                } else {
                    server.setCookie('tokenPlain',
                        '',
                        token.validUntil
                    );
                }
                callback({
                    token: tokenString,
                    name: token.name
                });
            } else {
                callback(null, 'Invalid login credentials');
            }
            break;
        case actions.logout:
            if(token.sessionId !== 0) {
                // TODO: Close old session in DB
                token.sessionId = 0;
                token.createdOn = new Date();
                token.validUntil = new Date();
                token.validUntil.setMinutes(
                    token.createdOn.getMinutes() +
                    config.timeout
                );
                token.lastAccessedOn = token.createdOn;
                token.roles = [groups.guests];
                tokenString = generateTokenString(token);
                server.setCookie('token',
                    '',
                    token.validUntil
                );
                server.setCookie('tokenPlain',
                    '',
                    token.validUntil
                );
            }
            callback({ token: null });
            break;
        default:
            callback(null, 'Invalid API call.');
    }
}

//------------------------------------------------------------------------------
// Public methods

function process (server,
    method,
    segments,
    input,
    request,
    response,
    token,
    callback)
{
    var token = extractToken(server.getCookie('token')),
        type = input.type;

    config = server.config.api.v1.session;
    type = type || config.defaultType;

    switch(type) {
        case 'own':
            sessionMgmtOwn(server, token, method, segments, input, callback);
            break;
        default:
            callback(null, 'Configuration error: Invalid authentication type.');
            break;
    }

}
//------------------------------------------------------------------------------
function extractToken (tokenString) {
    var token = {
            type: 'own',
            sessionId: 0,
            createdOn: new Date(),
            validUntil: new Date(),
            lastAccessedOn: new Date(),
            roles: []
        },
        tokenElements;

    try {
        if(tokenString) {
            tokenString = utilities.simpleDecrypt(tokenString);
            tokenElements = tokenString.split(':');
            if(tokenElements.length === 5) {
                token.type = tokenElements[0];
                token.sessionId = tokenElements[1];
                token.createdOn = new Date(tokenElements[2]);
                token.validUntil = new Date(tokenElements[3]);
                token.lastAccessedOn = new Date();
                // TODO: Load access control details here
            }
        }
    } catch (err) {
        // TODO: Is this worth logging?
        console.log('extractToken error: ' + err);
    };

    return token;
}
//------------------------------------------------------------------------------
function generateTokenString (token, dontEncrypt) {
    var str = token.type + ':'
                + token.sessionId + ':'
                + utilities.getDateTimeStamp(token.createdOn) + ':'
                + utilities.getDateTimeStamp(token.validUntil) + ':'
                + utilities.getDateTimeStamp(token.lastAccessedOn);

    if(!dontEncrypt) {
        // To prevent casual tampering, not serious hacking
        str = utilities.simpleEncrypt(str);
    }
    return str;
}
//------------------------------------------------------------------------------

module.exports.process = process;
module.exports.extractToken = extractToken;
module.exports.generateTokenString = generateTokenString;

//------------------------------------------------------------------------------
