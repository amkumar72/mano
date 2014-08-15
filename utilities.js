
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
// Public members

utilities.actions = actions;

//------------------------------------------------------------------------------
// Public methods

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
	var action = actions.invalid;

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
        	// Note: Returns the actual action and not actions.custom
        	action = input.action;
        	break;
    }
    return action;
}
//------------------------------------------------------------------------------
utilities.removeLineComments = function (textData, commentPrefix) {
    var lines = textData.replace('\r\n', '\n').replace('\r', '\n').split('\n'),
        line,
        i,
        output = '';

    commentPrefix = commentPrefix || '//';
    for(i=0; i<lines.length; i++) {
        line = lines[i].split(commentPrefix);
        output += ((output == '' ? '' : '\n') + line[0]);
    }

    return output;
}
//------------------------------------------------------------------------------
utilities.simpleEncrypt = function (text) {
    var output = '',
        i,
        c;

    for(i=text.length-1; i>=0; i--) {
        c = text.charCodeAt(i).toString();
        c = c.length === 3 ? c : '0' + c;
        output += c;
    }

    return Math.floor(Math.random()*10) + output + Math.floor(Math.random()*10);
}
//------------------------------------------------------------------------------
utilities.simpleDecrypt = function (text) {
    var output = '',
        i,
        c = '';

    text = text.substr(1, text.length - 2);
    for(i=0; i<text.length; i++) {
        c += text.charAt(i);
        if(c.length == 3) {
            output = (String.fromCharCode(c) + output);
            c = '';
        }
    }

    return output;
}

module.exports = utilities;

//------------------------------------------------------------------------------