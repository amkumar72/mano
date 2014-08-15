
//------------------------------------------------------------------------------
// Private members

var utilities = {};

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

module.exports = utilities;

//------------------------------------------------------------------------------