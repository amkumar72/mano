
//------------------------------------------------------------------------------
// Private members

var utilities = {},
	actions = {
		invalid: 0,
		create: 1,
		find: 2,
		get: 3,
		update: 4,
		delete: 5,
		custom: 6
	}

//------------------------------------------------------------------------------
// Public methods

utilities.actions = actions;
//------------------------------------------------------------------------------
utilities.getDateStamp = function (date) {
    var date = date || new Date(),
        year = date.getFullYear(),
        month = date.getMonth()+1,
        day = date.getDate();

    return year.toString() 
        + (month<10 ? ('0'+month) : month) 
        + (day<10 ? ('0'+day) : day);
}
//------------------------------------------------------------------------------
utilities.getDateTimeStamp = function (dateTime) {
    var dateTime = dateTime || new Date(),
        hour = dateTime.getHours(),
        min = dateTime.getMinutes(),
        sec = dateTime.getSeconds();

    return this.getDateStamp(dateTime)
        + (hour<10 ? ('0'+hour) : hour)
        + (min<10 ? ('0'+min) : min)
        + (sec<10 ? ('0'+sec) : sec)
}
//------------------------------------------------------------------------------
utilities.getAction = function (method, segments, input) {
	var action;

    switch(method) {
    	case 'GET':
    		action = ((segments.length === 3) ? actions.find : actions.get);
    		break;
        case 'POST': 
        	action = actions.create;
            break;
        case 'PUT':
        case 'PATCH':
        	action = actions.update;
        	break;
        case 'DELETE':
        	action = actions.delete;
            break;
        case 'CUSTOM':
        	action = input.action;
        	break;
        default:
        	action = actions.invalid;
        	break;
    }
    console.log('action='+action);
    return action;
}

module.exports = utilities;

//------------------------------------------------------------------------------