module.exports = {
    log: Logger
};

function Logger() {
    var zeroFill = function(num) {
        return num < 10 ? '0' + num.toString() : num.toString();
    };
    var args = Array.prototype.slice.call(arguments),
        date = new Date(),
        curTime = '[' + zeroFill(date.getHours()) + ':' + zeroFill(date.getMinutes()) +
            ':' + zeroFill(date.getSeconds()) + ']';
    args.unshift(curTime);
    console.log.apply(console, args);
}