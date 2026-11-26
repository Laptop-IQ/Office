// utils/httpError.js
// Typed HTTP errors + a tiny route wrapper so controllers stay thin:
// services/validators `throw new HttpError(...)`, the wrapper turns it into JSON.

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export const badRequest = (message) => new HttpError(400, message);
export const notFound = (message) => new HttpError(404, message);

// route(async (req, res) => {...}) — never throws into Express, always answers JSON
export const route = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    console.error(`${req.method} ${req.originalUrl} failed:`, err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
