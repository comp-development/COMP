import moment from 'moment';

// A standard date formatting for this project

// Pads left of str with 0s until it is length len
function padZeros(str, len) {
	str = str.toString();
	const lenDiff = len - str.length;
	if (lenDiff <= 0) return str;
	return "0".repeat(lenDiff) + str;
}

/**
 * Formats the time part of a given date to a specific format
 * @param {String | Date} date - The date or time to format
 * @param {String} format - The time format string (default is 'HH:mm:ss')
 * @returns {String} - The formatted time
 */
export function formatTime(date, format = 'HH:mm:ss') {
	return moment(date).format(format);
  }
  


/**
 * Formats a given date/time to a specific format
 * @param {String | Date} date - The date to format
 * @param {String} format - The format string (default is 'YYYY-MM-DD HH:mm:ss')
 * @returns {String} - The formatted date
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
	return moment(date).format(format);
  }
  
  /**
   * Calculates the difference between two dates
   * @param {String | Date} date1 - The first date
   * @param {String | Date} date2 - The second date
   * @param {String} unit - The unit of time to measure ('days', 'hours', 'minutes', 'seconds', etc.)
   * @returns {Number} - The difference in the specified unit
   */

/**
 * Formats a duration given in seconds to a specific format
 * @param {Number} seconds - The duration in seconds
 * @param {String} format - The format string (default is 'HH:mm:ss')
 * @returns {String} - The formatted duration
 */
export function formatDuration(seconds, format = 'HH:mm:ss') {
	const duration = moment.duration(seconds, 'seconds');
	return moment.utc(duration.asMilliseconds()).format(format);
  }


  export function diffBetweenDates(date1, date2, unit = 'days') {
	return moment(date1).diff(moment(date2), unit);
  }
  
  /**
   * Adds time to a given date
   * @param {String | Date} date - The base date
   * @param {Number} amount - The amount of time to add
   * @param {String} unit - The unit of time to add ('days', 'hours', 'minutes', 'seconds', etc.)
   * @returns {String} - The new date after adding the time
   */
  export function addTime(date, amount, unit = 'days') {
	return moment(date).add(amount, unit).format('YYYY-MM-DD HH:mm:ss');
  }
  
  /**
   * Subtracts time from a given date
   * @param {String | Date} date - The base date
   * @param {Number} amount - The amount of time to subtract
   * @param {String} unit - The unit of time to subtract ('days', 'hours', 'minutes', 'seconds', etc.)
   * @returns {String} - The new date after subtracting the time
   */
  export function subtractTime(date, amount, unit = 'days') {
	return moment(date).subtract(amount, unit).format('YYYY-MM-DD HH:mm:ss');
  }
  
  /**
   * Checks if a date is before another date
   * @param {String | Date} date1 - The first date
   * @param {String | Date} date2 - The second date
   * @returns {Boolean} - True if date1 is before date2, otherwise false
   */
  export function isBefore(date1, date2) {
	return moment(date1).isBefore(date2);
  }
  
  /**
   * Checks if a date is after another date
   * @param {String | Date} date1 - The first date
   * @param {String | Date} date2 - The second date
   * @returns {Boolean} - True if date1 is after date2, otherwise false
   */
  export function isAfter(date1, date2) {
	return moment(date1).isAfter(date2);
  }
  
  /**
   * Converts a time duration from one unit to another
   * @param {Number} duration - The time duration to convert
   * @param {String} fromUnit - The current unit of the duration
   * @param {String} toUnit - The desired unit to convert to
   * @returns {Number} - The converted duration
   */
  export function convertDuration(duration, fromUnit = 'seconds', toUnit = 'minutes') {
	return moment.duration(duration, fromUnit).as(toUnit);
  }