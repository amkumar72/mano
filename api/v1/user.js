
//------------------------------------------------------------------------------
// Private members

var utilities = require('../../utilities'),

    config,
    actions = {
        find: utilities.actions.find
    };

//------------------------------------------------------------------------------
// Private methods


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

    callback(null, 'This API is not yet implemented.');

}

module.exports.process = process;

//------------------------------------------------------------------------------
