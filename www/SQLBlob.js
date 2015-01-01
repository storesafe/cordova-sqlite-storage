(function() {
  var BASE64_CHARS, SQLBlob, arrayBufferToBase64, arrayBufferToBinaryString, base64ToArrayBuffer, binaryStringToArrayBuffer, root;

  root = this;

  BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  arrayBufferToBase64 = function(arraybuffer) {
    var base64, bytes, i, len;
    bytes = new Uint8Array(arraybuffer);
    len = bytes.length;
    base64 = "";
    i = 0;
    while (i < len) {
      base64 += BASE64_CHARS[bytes[i] >> 2];
      base64 += BASE64_CHARS[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
      base64 += BASE64_CHARS[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
      base64 += BASE64_CHARS[bytes[i + 2] & 63];
      i += 3;
    }
    if ((len % 3) === 2) {
      base64 = base64.substring(0, base64.length - 1) + "=";
    } else if ((len % 3) === 1) {
      base64 = base64.substring(0, base64.length - 2) + "==";
    }
    return base64;
  };

  base64ToArrayBuffer = function(base64) {
    var arraybuffer, bufferLength, bytes, encoded1, encoded2, encoded3, encoded4, i, len, p;
    bufferLength = base64.length * 0.75;
    len = base64.length;
    p = 0;
    if (base64[base64.length - 1] === "=") {
      bufferLength--;
    }
    if (base64[base64.length - 2] === "=") {
      bufferLength--;
    }
    arraybuffer = new ArrayBuffer(bufferLength);
    bytes = new Uint8Array(arraybuffer);
    i = 0;
    while (i < len) {
      encoded1 = BASE64_CHARS.indexOf(base64[i]);
      encoded2 = BASE64_CHARS.indexOf(base64[i + 1]);
      encoded3 = BASE64_CHARS.indexOf(base64[i + 2]);
      encoded4 = BASE64_CHARS.indexOf(base64[i + 3]);
      bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
      i += 4;
    }
    return arraybuffer;
  };

  arrayBufferToBinaryString = function(buffer) {
    var binary, bytes, i, length;
    binary = "";
    bytes = new Uint8Array(buffer);
    length = bytes.byteLength;
    i = 0;
    while (i < length) {
      binary += String.fromCharCode(bytes[i]);
      ++i;
    }
    return binary;
  };

  binaryStringToArrayBuffer = function(binary) {
    var buffer, bytes, code, i, length;
    length = binary.length;
    buffer = new ArrayBuffer(length);
    bytes = new Uint8Array(buffer);
    i = 0;
    while (i < length) {
      code = binary.charCodeAt(i);
      if (code > 255) {
        throw new Error("a multibyte character was encountered in the provided string which indicates it was not encoded as a binary string");
      }
      bytes[i] = code;
      ++i;
    }
    return bytes.buffer;
  };

  SQLBlob = (function() {
    var DATA_URL_PREFIX, SQLBLOB_URL_BASE64_ENCODING, SQLBLOB_URL_BASE64_PREFIX, SQLBLOB_URL_PREFIX;

    SQLBLOB_URL_PREFIX = "sqlblob:";

    DATA_URL_PREFIX = "data:";

    SQLBLOB_URL_BASE64_ENCODING = ";base64";

    SQLBLOB_URL_BASE64_PREFIX = SQLBLOB_URL_PREFIX + SQLBLOB_URL_BASE64_ENCODING;

    SQLBlob._value;

    SQLBlob._commaIndex;

    SQLBlob._options;

    function SQLBlob(obj, options) {
      var commaIndex, data, isBase64, prefix, startsWithData, startsWithSqlBlob;
      if (options == null) {
        options = {
          encoding: "auto"
        };
      }
      this._options = options;
      if (options.encoding !== "auto" && options.encoding !== "url" && options.encoding !== "base64") {
        throw new Error("Unknown encoding (must be 'auto', 'url', or 'base64'): " + options.encoding);
      }
      if (!obj) {
        this._value = obj;
        return;
      }
      if (obj instanceof ArrayBuffer) {
        if (options.encoding === "base64" || options.encoding === "auto") {
          this._value = SQLBLOB_URL_BASE64_PREFIX + "," + arrayBufferToBase64(obj);
          this._commaIndex = SQLBLOB_URL_BASE64_PREFIX.length;
        } else if (options.encoding === "url") {
          this._value = SQLBLOB_URL_PREFIX + "," + encodeURIComponent(arrayBufferToBinaryString(obj));
          this._commaIndex = SQLBLOB_URL_PREFIX.length;
        }
      } else if (typeof obj === "string") {
        startsWithSqlBlob = obj.slice(0, SQLBLOB_URL_PREFIX.length) === SQLBLOB_URL_PREFIX;
        startsWithData = obj.slice(0, DATA_URL_PREFIX.length) === DATA_URL_PREFIX;
        if (!startsWithSqlBlob && !startsWithData) {
          throw new Error("Only 'sqlblob' and 'data' URI strings are supported");
        }
        if (startsWithData) {
          obj = SQLBLOB_URL_PREFIX + obj.slice(DATA_URL_PREFIX.length);
        }
        this._commaIndex = commaIndex = obj.indexOf(",");
        if (commaIndex === -1) {
          throw new Error("Missing comma in SQLBlob URL");
        }
        isBase64 = obj.slice(0, commaIndex).indexOf(SQLBLOB_URL_BASE64_ENCODING) !== -1;
        if (options.encoding === "auto") {
          this._value = obj;
        } else if (options.encoding === "base64") {
          if (isBase64) {
            this._value = obj;
          } else {
            prefix = obj.slice(0, commaIndex) + SQLBLOB_URL_BASE64_ENCODING + ",";
            this._commaIndex = prefix.length - 1;
            data = obj.slice(commaIndex + 1);
            this._value = prefix + window.btoa(unescape(data));
          }
        } else if (options.encoding === "url") {
          if (!isBase64) {
            this._value = obj;
          } else {
            prefix = obj.slice(0, commaIndex + 1).replace(SQLBLOB_URL_BASE64_ENCODING, "");
            this._commaIndex = prefix.length - 1;
            data = obj.slice(commaIndex + 1);
            this._value = prefix + encodeURIComponent(window.atob(data));
          }
        }
      } else {
        throw new Error("unsupported object type (must be ArrayBuffer or string): " + typeof obj);
      }
      return;
    }

    Object.defineProperties(SQLBlob.prototype, {
      isBase64: {
        get: function() {
          return this._value.slice(0, this._commaIndex).indexOf(SQLBLOB_URL_BASE64_ENCODING) !== -1;
        }
      }
    });

    SQLBlob.prototype.toString = function() {
      return this._value;
    };

    SQLBlob.prototype.valueOf = function() {
      return this._value;
    };

    SQLBlob.prototype.toJSON = function() {
      return this._value;
    };

    SQLBlob.prototype.toArrayBuffer = function() {
      var data;
      if (!this._value) {
        return this._value;
      }
      data = this._value.slice(this._commaIndex + 1);
      if (this.isBase64) {
        return base64ToArrayBuffer(data);
      } else {
        return binaryStringToArrayBuffer(unescape(data));
      }
    };

    SQLBlob.prototype.toBase64 = function() {
      var data;
      if (!this._value) {
        return this._value;
      }
      data = this._value.slice(this._commaIndex + 1);
      if (this.isBase64) {
        return data;
      } else {
        return window.btoa(unescape(data));
      }
    };

    SQLBlob.prototype.toBinaryString = function() {
      var data;
      if (!this._value) {
        return this._value;
      }
      data = this._value.slice(this._commaIndex + 1);
      if (this.isBase64) {
        return window.atob(data);
      } else {
        return unescape(data);
      }
    };

    SQLBlob.prototype.toUnicodeString = function() {
      var data;
      if (!this._value) {
        return this._value;
      }
      data = this._value.slice(this._commaIndex + 1);
      if (this.isBase64) {
        return decodeURIComponent(escape(window.atob(data)));
      } else {
        return decodeURIComponent(data);
      }
    };

    SQLBlob.createFromBase64 = function(base64, options) {
      return new SQLBlob(SQLBLOB_URL_BASE64_PREFIX + "," + base64, options);
    };

    SQLBlob.createFromBinaryString = function(binary, options) {
      if (options == null) {
        options = {
          encoding: "auto"
        };
      }
      if (options.encoding === "base64" || options.encoding === "auto") {
        return new SQLBlob(SQLBLOB_URL_BASE64_PREFIX + "," + window.btoa(binary), options);
      } else if (options.encoding === "url") {
        return new SQLBlob(SQLBLOB_URL_PREFIX + "," + encodeURIComponent(binary), options);
      }
    };

    SQLBlob.createFromUnicodeString = function(text, options) {
      if (options == null) {
        options = {
          encoding: "auto"
        };
      }
      return new SQLBlob(SQLBLOB_URL_PREFIX + "," + encodeURIComponent(text), options);
    };

    return SQLBlob;

  })();

  root.SQLBlob = SQLBlob;

}).call(this);
