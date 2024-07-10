module.exports.safeExecuteFunctionAndSendResult = async function (func, res, next) {
    try {
        const result = await func();
        if (res) res.json(result);
    } catch (e) {
        next(e);
    }
};