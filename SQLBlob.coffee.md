# SQLBlob in Markdown (litcoffee)

## Top-level objects

### Root window object

    root = @
    
### Base64 conversion

    # Adapted from: base64-arraybuffer
    # https://github.com/niklasvh/base64-arraybuffer
    # Copyright (c) 2012 Niklas von Hertzen
    # Licensed under the MIT license.

    BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
    
    arrayBufferToBase64 = (arraybuffer) ->
      bytes = new Uint8Array(arraybuffer)
      len = bytes.length
      base64 = ""
      
      i = 0
      while i < len    
        base64 += BASE64_CHARS[bytes[i] >> 2]
        base64 += BASE64_CHARS[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)]
        base64 += BASE64_CHARS[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)]
        base64 += BASE64_CHARS[bytes[i + 2] & 63]
        i += 3
    
      if (len % 3) is 2
        base64 = base64.substring(0, base64.length - 1) + "="
      else if (len % 3) is 1
        base64 = base64.substring(0, base64.length - 2) + "=="
    
      return base64
      
    # This direct conversion should be faster than atob() and array copy
    base64ToArrayBuffer = (base64) ->
      bufferLength = base64.length * 0.75
      len = base64.length
      p = 0
      
      if base64[base64.length - 1] is "="
        bufferLength--
        
      if base64[base64.length - 2] is "="
        bufferLength--

      arraybuffer = new ArrayBuffer(bufferLength)
      bytes = new Uint8Array(arraybuffer)

      i = 0
      while i < len
        encoded1 = BASE64_CHARS.indexOf(base64[i])
        encoded2 = BASE64_CHARS.indexOf(base64[i+1])
        encoded3 = BASE64_CHARS.indexOf(base64[i+2])
        encoded4 = BASE64_CHARS.indexOf(base64[i+3])

        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4)
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2)
        bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63)
        i += 4

      return arraybuffer
      
### Binary string conversion

Binary string is a JavaScript term that basically means treat the string as a byte array.

    # Each byte from the buffer is transferred into a JavaScript UCS-2 string.
    arrayBufferToBinaryString = (buffer) ->
      binary = ""
      bytes = new Uint8Array(buffer)
      length = bytes.byteLength
      i = 0
      while i < length
        # code will be < 256 but expanded to 2 bytes
        # when stored in a JavaScript string
        binary += String.fromCharCode(bytes[i])
        ++i
      return binary
    
    # The binary string is UCS-2 encoded, but all characters are required to be < 256. 
    # That is, the string must represent a series of bytes. Because UCS-2 is a 2 byte 
    # format, it's possible a multi-byte character was added and that this isn't
    # a true "binary string", so the method throws if encountered.
    binaryStringToArrayBuffer = (binary) ->
      length = binary.length
      buffer = new ArrayBuffer(length)
      bytes = new Uint8Array(buffer)
      i = 0
      while i < length
        code = binary.charCodeAt(i)
        if code > 255 
          throw new Error("a multibyte character was encountered in the provided string which indicates it was not encoded as a binary string")
        bytes[i] = code
        ++i
      return bytes.buffer

### SQLBlob

#### Summary

SQLite determines column types for data rows during insert based on the type used to bind the value to the statement, not the type specified in the table schema. The latter is only an informational tag to indicate expected binding.

Browser implementations convert between JS and SQL types when binding statements:

* JS number -> SQLite integer | float
* JS UCS-2 string -> SQLite text

Values never serialize to SQLite blobs and at best will be serialized as text. Some implementations serialize text using UTF-8 and some UTF-16.

In a Web SQL environment, it's up to the caller to determine how to encode binary into a string format that can be serialized and deserialized given those conversions.

One can use a "binary string" which is a JS UCS-2 string where every real byte of data has an extra byte of padding internally, but unfortunately not all browser implementations support all Unicode values from end to end. Some interpret `\u0000` as a null terminator when reading back the string from their internal SQLite implementations which results in truncated data.

Additionally, Cordova invokes `JSON.stringify()` before sending data to the native layer. See the [JSON spec](http://json.org/) for what that does to strings; generally any Unicode character is allowed except `"` and `\` which will be escaped. A JSON parser like `JSON.parse()` will handle unescaping.

Even though browser Web SQL implementations only persist binary data as text, it is useful in Cordova scenarios to be able to consume or produce databases that conform to external specifications that make use of blobs and raw binary data.

The `SQLBlob` type below abstracts these problems by making it:

1. Easy to serialize binary data to and from an ArrayBuffer, base64 string, or binary string.
2. Possible to recognize binary data in the Cordova plugin so it can be stored as a binary blob.
3. Possible to write the same code for persisting binary data whether using the Cordova plugin or Web SQL in a browser.

#### SQLBlob object is defined by a constructor function and prototype member functions
       
    class SQLBlob
      # This prefix allows a Cordova native SQL plugin to recognize binary data.
      SQLBLOB_URL_PREFIX = "sqlblob:"
      DATA_URL_PREFIX = "data:"
      SQLBLOB_URL_BASE64_ENCODING = ";base64"
      SQLBLOB_URL_BASE64_PREFIX = SQLBLOB_URL_PREFIX + SQLBLOB_URL_BASE64_ENCODING

      # The blob's value is internally and externally represented as
      # a SQLBlob URL which is nearly identical to a data URL:
      #   sqlblob:[<mimetype>][;charset=<charset>][;base64],<data>
      #
      # If ";base64" is part of the URL then data is base64 encoded,
      # otherwise it is URL encoded (percent encoded UTF-8).
      #
      # The former is generally better for binary and the latter for text.
      # There is an encoding option to specify the default representation.
      # "auto": Prefer base64 for ArrayBuffer and BinaryString, pass through encoding for URLs
      # "base64": Always base64 encode
      # "url": Always url encode

      @_value # the sqlblob URL with base64 or url encoded data
      @_commaIndex # the comma index in the sqlblob URL separating the prefix and data regions
      @_options # options like encoding

      constructor: (obj, options = { encoding: "auto" }) ->
        @_options = options
        
        if options.encoding isnt "auto" and options.encoding isnt "url" and options.encoding isnt "base64"
          throw new Error("Unknown encoding (must be 'auto', 'url', or 'base64'): " + options.encoding)
  
        # allow null or undefined as a passthrough
        if !obj
          @_value = obj
          return
  
        if obj instanceof ArrayBuffer
          if options.encoding is "base64" or options.encoding is "auto"
            @_value = SQLBLOB_URL_BASE64_PREFIX + "," + arrayBufferToBase64(obj)
            @_commaIndex = SQLBLOB_URL_BASE64_PREFIX.length;
          else if options.encoding is "url"
            # convert to percent encoded UTF-8 (good for most text, not so good for binary)
            @_value = SQLBLOB_URL_PREFIX + "," + encodeURIComponent(arrayBufferToBinaryString(obj));
            @_commaIndex = SQLBLOB_URL_PREFIX.length;
        else if typeof obj is "string"
          # Decode SQLBlob or Data URL if detected.
          # Slice is faster than indexOf.
          startsWithSqlBlob = obj.slice(0, SQLBLOB_URL_PREFIX.length) is SQLBLOB_URL_PREFIX
          startsWithData = obj.slice(0, DATA_URL_PREFIX.length) is DATA_URL_PREFIX
          
          # verify supported format
          if not startsWithSqlBlob and not startsWithData
            throw new Error("Only 'sqlblob' and 'data' URI strings are supported")
          
          # convert data to sqlblob
          if startsWithData
            obj = SQLBLOB_URL_PREFIX + obj.slice(DATA_URL_PREFIX.length)
          
          # find comma dividing prefix and data regions
          @_commaIndex = commaIndex = obj.indexOf(",")
          throw new Error("Missing comma in SQLBlob URL") if commaIndex is -1
          
          # test for base64
          isBase64 = obj.slice(0, commaIndex).indexOf(SQLBLOB_URL_BASE64_ENCODING) isnt -1
          
          # assign value
          if options.encoding is "auto"
            @_value = obj # save the sqlblob verbatim
          else if options.encoding is "base64"
            if isBase64
              @_value = obj # save the sqlblob verbatim
            else
              # take the percent encoded UTF-8, unescape it to get a byte string, then base64 encode
              prefix = obj.slice(0, commaIndex) + SQLBLOB_URL_BASE64_ENCODING + ","
              @_commaIndex = prefix.length - 1;
              data = obj.slice(commaIndex + 1)
              # use unescape here to decode to binary rather than interpret the bytes as UTF-8
              @_value = prefix + window.btoa(unescape(data))
          else if options.encoding is "url"
            if not isBase64
              @_value = obj # save the url encoded sqlblob verbatim
            else
              # decode the base64 to binary, escape to convert bytes back into percent encoding
              prefix = obj.slice(0, commaIndex + 1).replace(SQLBLOB_URL_BASE64_ENCODING, "")
              @_commaIndex = prefix.length - 1;
              data = obj.slice(commaIndex + 1)
              @_value = prefix + encodeURIComponent(window.atob(data))
        else
          throw new Error("unsupported object type (must be ArrayBuffer or string): " + typeof obj)
          # TODO: Blob with FileReader
  
        return
       
      Object.defineProperties @prototype,
        isBase64:
          get: -> @_value.slice(0, @_commaIndex).indexOf(SQLBLOB_URL_BASE64_ENCODING) isnt -1
  
      toString: () ->
        return @_value # already string

      # This is for JavaScript automatic type conversion and used
      # by Web SQL for serialization.
      valueOf: () ->
        return @_value
        
      toJSON: () ->
        return @_value
  
      toArrayBuffer: () ->          
        return @_value if !@_value
    
        data = @_value.slice(@_commaIndex + 1)
    
        if @isBase64
          return base64ToArrayBuffer(data)
        else
          return binaryStringToArrayBuffer(unescape(data))

      toBase64: () ->
        return @_value if !@_value
    
        data = @_value.slice(@_commaIndex + 1)
    
        if @isBase64
          return data
        else
          return window.btoa(unescape(data))
  
      toBinaryString: () ->
        return @_value if !@_value
      
        data = @_value.slice(@_commaIndex + 1)
      
        if @isBase64
          return window.atob(data)
        else
          return unescape(data)
          
      toUnicodeString: () ->
        return @_value if !@_value
  
        data = @_value.slice(@_commaIndex + 1)
  
        if @isBase64
          return decodeURIComponent(escape(window.atob(data)))
        else
          return decodeURIComponent(data)
          
      @createFromBase64: (base64, options) ->
        return new SQLBlob(SQLBLOB_URL_BASE64_PREFIX + "," + base64, options)

      # All character codes must be < 256 as the string is used in place of a byte array.
      @createFromBinaryString: (binary, options = { encoding: "auto" }) ->
        if options.encoding is "base64" or options.encoding is "auto"
          return new SQLBlob(SQLBLOB_URL_BASE64_PREFIX + "," + window.btoa(binary), options)
        else if options.encoding is "url"
          return new SQLBlob(SQLBLOB_URL_PREFIX + "," + encodeURIComponent(binary), options)
      
      # Unicode chars are converted to UTF-8 and percent encoded. If "url" encoding is not
      # specified as an option, then the constructor used below will complete the 
      # conversion of the UTF-8 encoded string to base64.
      @createFromUnicodeString: (text, options = { encoding: "auto" }) ->
        return new SQLBlob(SQLBLOB_URL_PREFIX + "," + encodeURIComponent(text), options)

### Exported API

    root.SQLBlob = SQLBlob