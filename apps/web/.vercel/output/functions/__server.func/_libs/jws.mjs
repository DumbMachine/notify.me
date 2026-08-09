import { n as __require, t as __commonJSMin } from "../_runtime.mjs";
import { n as require_safe_buffer } from "./ecdsa-sig-formatter+[...].mjs";
import { t as require_jwa } from "./jwa.mjs";
//#region ../../node_modules/.pnpm/jws@4.0.1/node_modules/jws/lib/data-stream.js
var require_data_stream = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Buffer = require_safe_buffer().Buffer;
	var Stream$2 = __require("stream");
	var util$2 = __require("util");
	function DataStream(data) {
		this.buffer = null;
		this.writable = true;
		this.readable = true;
		if (!data) {
			this.buffer = Buffer.alloc(0);
			return this;
		}
		if (typeof data.pipe === "function") {
			this.buffer = Buffer.alloc(0);
			data.pipe(this);
			return this;
		}
		if (data.length || typeof data === "object") {
			this.buffer = data;
			this.writable = false;
			process.nextTick(function() {
				this.emit("end", data);
				this.readable = false;
				this.emit("close");
			}.bind(this));
			return this;
		}
		throw new TypeError("Unexpected data type (" + typeof data + ")");
	}
	util$2.inherits(DataStream, Stream$2);
	DataStream.prototype.write = function write(data) {
		this.buffer = Buffer.concat([this.buffer, Buffer.from(data)]);
		this.emit("data", data);
	};
	DataStream.prototype.end = function end(data) {
		if (data) this.write(data);
		this.emit("end", data);
		this.emit("close");
		this.writable = false;
		this.readable = false;
	};
	module.exports = DataStream;
}));
//#endregion
//#region ../../node_modules/.pnpm/jws@4.0.1/node_modules/jws/lib/tostring.js
var require_tostring = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Buffer = __require("buffer").Buffer;
	module.exports = function toString(obj) {
		if (typeof obj === "string") return obj;
		if (typeof obj === "number" || Buffer.isBuffer(obj)) return obj.toString();
		return JSON.stringify(obj);
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/jws@4.0.1/node_modules/jws/lib/sign-stream.js
var require_sign_stream = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Buffer = require_safe_buffer().Buffer;
	var DataStream = require_data_stream();
	var jwa = require_jwa();
	var Stream$1 = __require("stream");
	var toString = require_tostring();
	var util$1 = __require("util");
	function base64url(string, encoding) {
		return Buffer.from(string, encoding).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
	}
	function jwsSecuredInput(header, payload, encoding) {
		encoding = encoding || "utf8";
		var encodedHeader = base64url(toString(header), "binary");
		var encodedPayload = base64url(toString(payload), encoding);
		return util$1.format("%s.%s", encodedHeader, encodedPayload);
	}
	function jwsSign(opts) {
		var header = opts.header;
		var payload = opts.payload;
		var secretOrKey = opts.secret || opts.privateKey;
		var encoding = opts.encoding;
		var algo = jwa(header.alg);
		var securedInput = jwsSecuredInput(header, payload, encoding);
		var signature = algo.sign(securedInput, secretOrKey);
		return util$1.format("%s.%s", securedInput, signature);
	}
	function SignStream(opts) {
		var secret = opts.secret;
		secret = secret == null ? opts.privateKey : secret;
		secret = secret == null ? opts.key : secret;
		if (/^hs/i.test(opts.header.alg) === true && secret == null) throw new TypeError("secret must be a string or buffer or a KeyObject");
		var secretStream = new DataStream(secret);
		this.readable = true;
		this.header = opts.header;
		this.encoding = opts.encoding;
		this.secret = this.privateKey = this.key = secretStream;
		this.payload = new DataStream(opts.payload);
		this.secret.once("close", function() {
			if (!this.payload.writable && this.readable) this.sign();
		}.bind(this));
		this.payload.once("close", function() {
			if (!this.secret.writable && this.readable) this.sign();
		}.bind(this));
	}
	util$1.inherits(SignStream, Stream$1);
	SignStream.prototype.sign = function sign() {
		try {
			var signature = jwsSign({
				header: this.header,
				payload: this.payload.buffer,
				secret: this.secret.buffer,
				encoding: this.encoding
			});
			this.emit("done", signature);
			this.emit("data", signature);
			this.emit("end");
			this.readable = false;
			return signature;
		} catch (e) {
			this.readable = false;
			this.emit("error", e);
			this.emit("close");
		}
	};
	SignStream.sign = jwsSign;
	module.exports = SignStream;
}));
//#endregion
//#region ../../node_modules/.pnpm/jws@4.0.1/node_modules/jws/lib/verify-stream.js
var require_verify_stream = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Buffer = require_safe_buffer().Buffer;
	var DataStream = require_data_stream();
	var jwa = require_jwa();
	var Stream = __require("stream");
	var toString = require_tostring();
	var util = __require("util");
	var JWS_REGEX = /^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/;
	function isObject(thing) {
		return Object.prototype.toString.call(thing) === "[object Object]";
	}
	function safeJsonParse(thing) {
		if (isObject(thing)) return thing;
		try {
			return JSON.parse(thing);
		} catch (e) {
			return;
		}
	}
	function headerFromJWS(jwsSig) {
		var encodedHeader = jwsSig.split(".", 1)[0];
		return safeJsonParse(Buffer.from(encodedHeader, "base64").toString("binary"));
	}
	function securedInputFromJWS(jwsSig) {
		return jwsSig.split(".", 2).join(".");
	}
	function signatureFromJWS(jwsSig) {
		return jwsSig.split(".")[2];
	}
	function payloadFromJWS(jwsSig, encoding) {
		encoding = encoding || "utf8";
		var payload = jwsSig.split(".")[1];
		return Buffer.from(payload, "base64").toString(encoding);
	}
	function isValidJws(string) {
		return JWS_REGEX.test(string) && !!headerFromJWS(string);
	}
	function jwsVerify(jwsSig, algorithm, secretOrKey) {
		if (!algorithm) {
			var err = /* @__PURE__ */ new Error("Missing algorithm parameter for jws.verify");
			err.code = "MISSING_ALGORITHM";
			throw err;
		}
		jwsSig = toString(jwsSig);
		var signature = signatureFromJWS(jwsSig);
		var securedInput = securedInputFromJWS(jwsSig);
		return jwa(algorithm).verify(securedInput, signature, secretOrKey);
	}
	function jwsDecode(jwsSig, opts) {
		opts = opts || {};
		jwsSig = toString(jwsSig);
		if (!isValidJws(jwsSig)) return null;
		var header = headerFromJWS(jwsSig);
		if (!header) return null;
		var payload = payloadFromJWS(jwsSig);
		if (header.typ === "JWT" || opts.json) payload = JSON.parse(payload, opts.encoding);
		return {
			header,
			payload,
			signature: signatureFromJWS(jwsSig)
		};
	}
	function VerifyStream(opts) {
		opts = opts || {};
		var secretOrKey = opts.secret;
		secretOrKey = secretOrKey == null ? opts.publicKey : secretOrKey;
		secretOrKey = secretOrKey == null ? opts.key : secretOrKey;
		if (/^hs/i.test(opts.algorithm) === true && secretOrKey == null) throw new TypeError("secret must be a string or buffer or a KeyObject");
		var secretStream = new DataStream(secretOrKey);
		this.readable = true;
		this.algorithm = opts.algorithm;
		this.encoding = opts.encoding;
		this.secret = this.publicKey = this.key = secretStream;
		this.signature = new DataStream(opts.signature);
		this.secret.once("close", function() {
			if (!this.signature.writable && this.readable) this.verify();
		}.bind(this));
		this.signature.once("close", function() {
			if (!this.secret.writable && this.readable) this.verify();
		}.bind(this));
	}
	util.inherits(VerifyStream, Stream);
	VerifyStream.prototype.verify = function verify() {
		try {
			var valid = jwsVerify(this.signature.buffer, this.algorithm, this.key.buffer);
			var obj = jwsDecode(this.signature.buffer, this.encoding);
			this.emit("done", valid, obj);
			this.emit("data", valid);
			this.emit("end");
			this.readable = false;
			return valid;
		} catch (e) {
			this.readable = false;
			this.emit("error", e);
			this.emit("close");
		}
	};
	VerifyStream.decode = jwsDecode;
	VerifyStream.isValid = isValidJws;
	VerifyStream.verify = jwsVerify;
	module.exports = VerifyStream;
}));
//#endregion
//#region ../../node_modules/.pnpm/jws@4.0.1/node_modules/jws/index.js
var require_jws = /* @__PURE__ */ __commonJSMin(((exports) => {
	var SignStream = require_sign_stream();
	var VerifyStream = require_verify_stream();
	exports.ALGORITHMS = [
		"HS256",
		"HS384",
		"HS512",
		"RS256",
		"RS384",
		"RS512",
		"PS256",
		"PS384",
		"PS512",
		"ES256",
		"ES384",
		"ES512"
	];
	exports.sign = SignStream.sign;
	exports.verify = VerifyStream.verify;
	exports.decode = VerifyStream.decode;
	exports.isValid = VerifyStream.isValid;
	exports.createSign = function createSign(opts) {
		return new SignStream(opts);
	};
	exports.createVerify = function createVerify(opts) {
		return new VerifyStream(opts);
	};
}));
//#endregion
export { require_jws as t };
