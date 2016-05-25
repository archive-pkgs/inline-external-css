'use strict';
const chalk = require('chalk');
// log message with colors, no less no more
function logger(level, args) {
    if (!level)
        throw new Error('level should be provided');
    args = Array.prototype.slice.call(arguments, 1);
    // make single logging message from multiple pieces
    const message = args.reduce((acc, _curr, id, arr) => {
        try {
            return (typeof _curr === 'string') ? acc += _curr : acc += JSON.stringify(_curr);
        }
        catch (error) {
            console.error('error while processing message' + JSON.stringify(error));
        }
    }, '');
    // available levels
    const levels = {
        info: { color: 'blue' },
        error: { color: 'red' },
        debug: { color: 'green' }
    };
    const log = {};
    Object.keys(levels).forEach((levl) => {
        log[levl] = function (msg) {
            console.log(chalk[levels[levl].color]('[' + levl + '] '), msg);
        };
    });
    log[level](message);
}
;
module.exports = logger;
