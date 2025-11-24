"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const validate = (schema) => (req, res, next) => {
    try {
        const parsed = schema.parse(req.body);
        req.body = parsed;
        next();
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            error: err.errors ?? err.message
        });
    }
};
exports.validate = validate;
