
//------------------------------------------------------------------------------
// Private members
var utilities = require('../../utilities'),

    config,
    actions = {
        login: utilities.actions.create,
        logout: utilities.actions.delete
    };


//------------------------------------------------------------------------------
// Public methods

function process (server,
    method, 
    segments, 
    input, 
    request, 
    response, 
    callback) 
{
    config = server.config.api.v1.session;

    // TODO: Authenticate using user credentials stored in DB
    // Start: Stub
    setTimeout(function () {
        var sessionId = (segments.length === 4 ? segments[3] : null);
        try {
            switch(utilities.getAction(method, segments, input)) {
                case actions.login:
                    sessionId = 0;
                    switch(input.loginName) {
                        case 'manoj':
                            if(input.password === 'pwd') {
                                sessionId = 1;
                            }
                            break;
                    }
                    if(sessionId != 0) {
                        callback({ id: sessionId });
                    } else {
                        callback(null, 'Invalid login credentials');
                    }
                    break;
                case actions.logout:
                    callback({ });
                    break;
                default:
                    callback(null, 'Invalid API call.');
            }
        } catch(error) {
            callback(null, error);
        }
    }, 0);
    // End: Stub

}

module.exports.process = process;

//------------------------------------------------------------------------------
