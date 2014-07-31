
//------------------------------------------------------------------------------
// Private members
var config;


//------------------------------------------------------------------------------
// Public members

function process (server,
    method, 
    segments, 
    inputs, 
    request, 
    response, 
    isDevelopment, 
    callback) 
{
    config = server.config.api.v1.session;

    // Test async
    setTimeout(function () {
        var sessionId = (segments.length ==3 ? segments[2] : null);
        try {
            switch(method) {
                case 'POST': // Login
                    callback({ id: 1 });
                    break;
                case 'DELETE': // Logout
                    callback({ });
                    break;
                default:
                    callback(null, 'Invalid API call.');
            }
        } catch(error) {
            callback(null, error);
        }
    }, 0);
}

module.exports.process = process;

//------------------------------------------------------------------------------
