var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// netlify/functions/utils/cors.js
var require_cors = __commonJS({
  "netlify/functions/utils/cors.js"(exports2, module2) {
    var corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400"
      // 24 hours
    };
    var handleCors2 = (event) => {
      if (event.httpMethod === "OPTIONS") {
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: ""
        };
      }
      return null;
    };
    var createResponse2 = (statusCode, body, additionalHeaders = {}) => {
      return {
        statusCode,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          ...additionalHeaders
        },
        body: typeof body === "string" ? body : JSON.stringify(body)
      };
    };
    module2.exports = {
      corsHeaders,
      handleCors: handleCors2,
      createResponse: createResponse2
    };
  }
});

// netlify/functions/health.js
var { handleCors, createResponse } = require_cors();
exports.handler = async (event, context) => {
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;
  if (event.httpMethod !== "GET") {
    return createResponse(405, { error: "Method not allowed" });
  }
  try {
    return createResponse(200, {
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      platform: "netlify-functions",
      version: "1.0.0"
    });
  } catch (error) {
    console.error("Health check error:", error);
    return createResponse(500, {
      error: "Internal server error"
    });
  }
};
//# sourceMappingURL=health.js.map
