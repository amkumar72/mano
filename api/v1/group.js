
//------------------------------------------------------------------------------
// Private members

var utilities = require('../../utilities'),

    config,
    actions = {

    },
    groups = {
        guests: 0,
        administrators: 1,
        seniorManagers: 2,
        projectManagers: 3,
        teamMembers: 4,
        clients: 5
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

    callback(null, 'Invalid API.');

}

module.exports.process = process;
module.exports.groups = groups;

//------------------------------------------------------------------------------
