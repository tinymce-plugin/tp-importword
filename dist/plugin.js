/*! 
*  @plugin @tinymce-plugin/tp-importword
*  @version 0.0.3-beta.6 (2022-7-29)
*  @description 导入word文档
*  @copyright (2022) Li Hailong . All rights reserved. https://github.com/tinymce-plugin/tp-importword
*/

(function() {
  "use strict";
  var extendStatics = function(d2, b) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d3, b2) {
      d3.__proto__ = b2;
    } || function(d3, b2) {
      for (var p in b2)
        if (Object.prototype.hasOwnProperty.call(b2, p))
          d3[p] = b2[p];
    };
    return extendStatics(d2, b);
  };
  function __extends(d2, b) {
    if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d2, b);
    function __() {
      this.constructor = d2;
    }
    d2.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }
  var __assign = function() {
    __assign = Object.assign || function __assign2(t) {
      for (var s2, i = 1, n = arguments.length; i < n; i++) {
        s2 = arguments[i];
        for (var p in s2)
          if (Object.prototype.hasOwnProperty.call(s2, p))
            t[p] = s2[p];
      }
      return t;
    };
    return __assign.apply(this, arguments);
  };
  function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar)
            ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from));
  }
  var RelationshipTypes;
  (function(RelationshipTypes2) {
    RelationshipTypes2["OfficeDocument"] = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument";
    RelationshipTypes2["FontTable"] = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable";
    RelationshipTypes2["Image"] = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image";
    RelationshipTypes2["Numbering"] = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering";
    RelationshipTypes2["Styles"] = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles";
    RelationshipTypes2["StylesWithEffects"] = "http://schemas.microsoft.com/office/2007/relationships/stylesWithEffects";
    RelationshipTypes2["Theme"] = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme";
    RelationshipTypes2["Settings"] = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings";
    RelationshipTypes2["WebSettings"] = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/webSettings";
    RelationshipTypes2["Hyperlink"] = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink";
    RelationshipTypes2["Footnotes"] = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes";
    RelationshipTypes2["Endnotes"] = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/endnotes";
    RelationshipTypes2["Footer"] = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer";
    RelationshipTypes2["Header"] = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/header";
    RelationshipTypes2["ExtendedProperties"] = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties";
    RelationshipTypes2["CoreProperties"] = "http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties";
    RelationshipTypes2["CustomProperties"] = "http://schemas.openxmlformats.org/package/2006/relationships/metadata/custom-properties";
  })(RelationshipTypes || (RelationshipTypes = {}));
  function parseRelationships(root, xml) {
    return xml.elements(root).map(function(e) {
      return {
        id: xml.attr(e, "Id"),
        type: xml.attr(e, "Type"),
        target: xml.attr(e, "Target"),
        targetMode: xml.attr(e, "TargetMode")
      };
    });
  }
  var ns = {
    wordml: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    drawingml: "http://schemas.openxmlformats.org/drawingml/2006/main",
    picture: "http://schemas.openxmlformats.org/drawingml/2006/picture",
    compatibility: "http://schemas.openxmlformats.org/markup-compatibility/2006"
  };
  var LengthUsage = {
    Dxa: { mul: 0.05, unit: "pt" },
    Emu: { mul: 1 / 12700, unit: "pt" },
    FontSize: { mul: 0.5, unit: "pt" },
    Border: { mul: 0.125, unit: "pt" },
    Point: { mul: 1, unit: "pt" },
    Percent: { mul: 0.02, unit: "%" },
    LineHeight: { mul: 1 / 240, unit: null }
  };
  function convertLength(val, usage) {
    var _a;
    if (usage === void 0) {
      usage = LengthUsage.Dxa;
    }
    if (val == null || /.+(p[xt]|[%])$/.test(val)) {
      return val;
    }
    return "".concat((parseInt(val) * usage.mul).toFixed(2)).concat((_a = usage.unit) !== null && _a !== void 0 ? _a : "");
  }
  function convertBoolean(v, defaultValue) {
    if (defaultValue === void 0) {
      defaultValue = false;
    }
    switch (v) {
      case "1":
        return true;
      case "0":
        return false;
      case "on":
        return true;
      case "off":
        return false;
      case "true":
        return true;
      case "false":
        return false;
      default:
        return defaultValue;
    }
  }
  function parseCommonProperty(elem, props, xml) {
    if (elem.namespaceURI != ns.wordml)
      return false;
    switch (elem.localName) {
      case "color":
        props.color = xml.attr(elem, "val");
        break;
      case "sz":
        props.fontSize = xml.lengthAttr(elem, "val", LengthUsage.FontSize);
        break;
      default:
        return false;
    }
    return true;
  }
  function parseXmlString(xmlString, trimXmlDeclaration) {
    if (trimXmlDeclaration === void 0) {
      trimXmlDeclaration = false;
    }
    if (trimXmlDeclaration)
      xmlString = xmlString.replace(/<[?].*[?]>/, "");
    var result = new DOMParser().parseFromString(xmlString, "application/xml");
    var errorText = hasXmlParserError(result);
    if (errorText)
      throw new Error(errorText);
    return result;
  }
  function hasXmlParserError(doc) {
    var _a;
    return (_a = doc.getElementsByTagName("parsererror")[0]) === null || _a === void 0 ? void 0 : _a.textContent;
  }
  function serializeXmlString(elem) {
    return new XMLSerializer().serializeToString(elem);
  }
  var XmlParser = function() {
    function XmlParser2() {
    }
    Object.defineProperty(XmlParser2.prototype, "elements", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem, localName) {
        if (localName === void 0) {
          localName = null;
        }
        var result = [];
        for (var i = 0, l = elem.childNodes.length; i < l; i++) {
          var c = elem.childNodes.item(i);
          if (c.nodeType == 1 && (localName == null || c.localName == localName))
            result.push(c);
        }
        return result;
      }
    });
    Object.defineProperty(XmlParser2.prototype, "element", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem, localName) {
        for (var i = 0, l = elem.childNodes.length; i < l; i++) {
          var c = elem.childNodes.item(i);
          if (c.nodeType == 1 && c.localName == localName)
            return c;
        }
        return null;
      }
    });
    Object.defineProperty(XmlParser2.prototype, "elementAttr", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem, localName, attrLocalName) {
        var el = this.element(elem, localName);
        return el ? this.attr(el, attrLocalName) : void 0;
      }
    });
    Object.defineProperty(XmlParser2.prototype, "attr", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem, localName) {
        for (var i = 0, l = elem.attributes.length; i < l; i++) {
          var a = elem.attributes.item(i);
          if (a.localName == localName)
            return a.value;
        }
        return null;
      }
    });
    Object.defineProperty(XmlParser2.prototype, "intAttr", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(node, attrName, defaultValue) {
        if (defaultValue === void 0) {
          defaultValue = null;
        }
        var val = this.attr(node, attrName);
        return val ? parseInt(val) : defaultValue;
      }
    });
    Object.defineProperty(XmlParser2.prototype, "hexAttr", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(node, attrName, defaultValue) {
        if (defaultValue === void 0) {
          defaultValue = null;
        }
        var val = this.attr(node, attrName);
        return val ? parseInt(val, 16) : defaultValue;
      }
    });
    Object.defineProperty(XmlParser2.prototype, "floatAttr", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(node, attrName, defaultValue) {
        if (defaultValue === void 0) {
          defaultValue = null;
        }
        var val = this.attr(node, attrName);
        return val ? parseFloat(val) : defaultValue;
      }
    });
    Object.defineProperty(XmlParser2.prototype, "boolAttr", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(node, attrName, defaultValue) {
        if (defaultValue === void 0) {
          defaultValue = null;
        }
        return convertBoolean(this.attr(node, attrName), defaultValue);
      }
    });
    Object.defineProperty(XmlParser2.prototype, "lengthAttr", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(node, attrName, usage) {
        if (usage === void 0) {
          usage = LengthUsage.Dxa;
        }
        return convertLength(this.attr(node, attrName), usage);
      }
    });
    return XmlParser2;
  }();
  var globalXmlParser = new XmlParser();
  var Part = function() {
    function Part2(_package, path) {
      Object.defineProperty(this, "_package", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: _package
      });
      Object.defineProperty(this, "path", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: path
      });
      Object.defineProperty(this, "_xmlDocument", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "rels", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
    }
    Object.defineProperty(Part2.prototype, "load", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function() {
        var _this = this;
        return Promise.all([
          this._package.loadRelationships(this.path).then(function(rels) {
            _this.rels = rels;
          }),
          this._package.load(this.path).then(function(text) {
            var xmlDoc = _this._package.parseXmlDocument(text);
            if (_this._package.options.keepOrigin) {
              _this._xmlDocument = xmlDoc;
            }
            _this.parseXml(xmlDoc.firstElementChild);
          })
        ]);
      }
    });
    Object.defineProperty(Part2.prototype, "save", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function() {
        this._package.update(this.path, serializeXmlString(this._xmlDocument));
      }
    });
    Object.defineProperty(Part2.prototype, "parseXml", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(root) {
      }
    });
    return Part2;
  }();
  var embedFontTypeMap = {
    embedRegular: "regular",
    embedBold: "bold",
    embedItalic: "italic",
    embedBoldItalic: "boldItalic"
  };
  function parseFonts(root, xml) {
    return xml.elements(root).map(function(el) {
      return parseFont(el, xml);
    });
  }
  function parseFont(elem, xml) {
    var result = {
      name: xml.attr(elem, "name"),
      embedFontRefs: []
    };
    for (var _i = 0, _a = xml.elements(elem); _i < _a.length; _i++) {
      var el = _a[_i];
      switch (el.localName) {
        case "family":
          result.family = xml.attr(el, "val");
          break;
        case "altName":
          result.altName = xml.attr(el, "val");
          break;
        case "embedRegular":
        case "embedBold":
        case "embedItalic":
        case "embedBoldItalic":
          result.embedFontRefs.push(parseEmbedFontRef(el, xml));
          break;
      }
    }
    return result;
  }
  function parseEmbedFontRef(elem, xml) {
    return {
      id: xml.attr(elem, "id"),
      key: xml.attr(elem, "fontKey"),
      type: embedFontTypeMap[elem.localName]
    };
  }
  var FontTablePart = function(_super) {
    __extends(FontTablePart2, _super);
    function FontTablePart2() {
      var _this = _super !== null && _super.apply(this, arguments) || this;
      Object.defineProperty(_this, "fonts", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      return _this;
    }
    Object.defineProperty(FontTablePart2.prototype, "parseXml", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(root) {
        this.fonts = parseFonts(root, this._package.xmlParser);
      }
    });
    return FontTablePart2;
  }(Part);
  var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
  function commonjsRequire(path) {
    throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
  }
  var jszip_min = { exports: {} };
  (function(module, exports) {
    !function(t) {
      module.exports = t();
    }(function() {
      return function s2(a, o, h2) {
        function u(r, t2) {
          if (!o[r]) {
            if (!a[r]) {
              var e = typeof commonjsRequire == "function" && commonjsRequire;
              if (!t2 && e)
                return e(r, true);
              if (l)
                return l(r, true);
              var i = new Error("Cannot find module '" + r + "'");
              throw i.code = "MODULE_NOT_FOUND", i;
            }
            var n = o[r] = { exports: {} };
            a[r][0].call(n.exports, function(t3) {
              var e2 = a[r][1][t3];
              return u(e2 || t3);
            }, n, n.exports, s2, a, o, h2);
          }
          return o[r].exports;
        }
        for (var l = typeof commonjsRequire == "function" && commonjsRequire, t = 0; t < h2.length; t++)
          u(h2[t]);
        return u;
      }({ 1: [function(t, e, r) {
        var c = t("./utils"), d2 = t("./support"), p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        r.encode = function(t2) {
          for (var e2, r2, i, n, s2, a, o, h2 = [], u = 0, l = t2.length, f = l, d3 = c.getTypeOf(t2) !== "string"; u < t2.length; )
            f = l - u, i = d3 ? (e2 = t2[u++], r2 = u < l ? t2[u++] : 0, u < l ? t2[u++] : 0) : (e2 = t2.charCodeAt(u++), r2 = u < l ? t2.charCodeAt(u++) : 0, u < l ? t2.charCodeAt(u++) : 0), n = e2 >> 2, s2 = (3 & e2) << 4 | r2 >> 4, a = 1 < f ? (15 & r2) << 2 | i >> 6 : 64, o = 2 < f ? 63 & i : 64, h2.push(p.charAt(n) + p.charAt(s2) + p.charAt(a) + p.charAt(o));
          return h2.join("");
        }, r.decode = function(t2) {
          var e2, r2, i, n, s2, a, o = 0, h2 = 0, u = "data:";
          if (t2.substr(0, u.length) === u)
            throw new Error("Invalid base64 input, it looks like a data url.");
          var l, f = 3 * (t2 = t2.replace(/[^A-Za-z0-9\+\/\=]/g, "")).length / 4;
          if (t2.charAt(t2.length - 1) === p.charAt(64) && f--, t2.charAt(t2.length - 2) === p.charAt(64) && f--, f % 1 != 0)
            throw new Error("Invalid base64 input, bad content length.");
          for (l = d2.uint8array ? new Uint8Array(0 | f) : new Array(0 | f); o < t2.length; )
            e2 = p.indexOf(t2.charAt(o++)) << 2 | (n = p.indexOf(t2.charAt(o++))) >> 4, r2 = (15 & n) << 4 | (s2 = p.indexOf(t2.charAt(o++))) >> 2, i = (3 & s2) << 6 | (a = p.indexOf(t2.charAt(o++))), l[h2++] = e2, s2 !== 64 && (l[h2++] = r2), a !== 64 && (l[h2++] = i);
          return l;
        };
      }, { "./support": 30, "./utils": 32 }], 2: [function(t, e, r) {
        var i = t("./external"), n = t("./stream/DataWorker"), s2 = t("./stream/Crc32Probe"), a = t("./stream/DataLengthProbe");
        function o(t2, e2, r2, i2, n2) {
          this.compressedSize = t2, this.uncompressedSize = e2, this.crc32 = r2, this.compression = i2, this.compressedContent = n2;
        }
        o.prototype = { getContentWorker: function() {
          var t2 = new n(i.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new a("data_length")), e2 = this;
          return t2.on("end", function() {
            if (this.streamInfo.data_length !== e2.uncompressedSize)
              throw new Error("Bug : uncompressed data size mismatch");
          }), t2;
        }, getCompressedWorker: function() {
          return new n(i.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize", this.compressedSize).withStreamInfo("uncompressedSize", this.uncompressedSize).withStreamInfo("crc32", this.crc32).withStreamInfo("compression", this.compression);
        } }, o.createWorkerFrom = function(t2, e2, r2) {
          return t2.pipe(new s2()).pipe(new a("uncompressedSize")).pipe(e2.compressWorker(r2)).pipe(new a("compressedSize")).withStreamInfo("compression", e2);
        }, e.exports = o;
      }, { "./external": 6, "./stream/Crc32Probe": 25, "./stream/DataLengthProbe": 26, "./stream/DataWorker": 27 }], 3: [function(t, e, r) {
        var i = t("./stream/GenericWorker");
        r.STORE = { magic: "\0\0", compressWorker: function(t2) {
          return new i("STORE compression");
        }, uncompressWorker: function() {
          return new i("STORE decompression");
        } }, r.DEFLATE = t("./flate");
      }, { "./flate": 7, "./stream/GenericWorker": 28 }], 4: [function(t, e, r) {
        var i = t("./utils");
        var o = function() {
          for (var t2, e2 = [], r2 = 0; r2 < 256; r2++) {
            t2 = r2;
            for (var i2 = 0; i2 < 8; i2++)
              t2 = 1 & t2 ? 3988292384 ^ t2 >>> 1 : t2 >>> 1;
            e2[r2] = t2;
          }
          return e2;
        }();
        e.exports = function(t2, e2) {
          return t2 !== void 0 && t2.length ? i.getTypeOf(t2) !== "string" ? function(t3, e3, r2, i2) {
            var n = o, s2 = i2 + r2;
            t3 ^= -1;
            for (var a = i2; a < s2; a++)
              t3 = t3 >>> 8 ^ n[255 & (t3 ^ e3[a])];
            return -1 ^ t3;
          }(0 | e2, t2, t2.length, 0) : function(t3, e3, r2, i2) {
            var n = o, s2 = i2 + r2;
            t3 ^= -1;
            for (var a = i2; a < s2; a++)
              t3 = t3 >>> 8 ^ n[255 & (t3 ^ e3.charCodeAt(a))];
            return -1 ^ t3;
          }(0 | e2, t2, t2.length, 0) : 0;
        };
      }, { "./utils": 32 }], 5: [function(t, e, r) {
        r.base64 = false, r.binary = false, r.dir = false, r.createFolders = true, r.date = null, r.compression = null, r.compressionOptions = null, r.comment = null, r.unixPermissions = null, r.dosPermissions = null;
      }, {}], 6: [function(t, e, r) {
        var i = null;
        i = typeof Promise != "undefined" ? Promise : t("lie"), e.exports = { Promise: i };
      }, { lie: 37 }], 7: [function(t, e, r) {
        var i = typeof Uint8Array != "undefined" && typeof Uint16Array != "undefined" && typeof Uint32Array != "undefined", n = t("pako"), s2 = t("./utils"), a = t("./stream/GenericWorker"), o = i ? "uint8array" : "array";
        function h2(t2, e2) {
          a.call(this, "FlateWorker/" + t2), this._pako = null, this._pakoAction = t2, this._pakoOptions = e2, this.meta = {};
        }
        r.magic = "\b\0", s2.inherits(h2, a), h2.prototype.processChunk = function(t2) {
          this.meta = t2.meta, this._pako === null && this._createPako(), this._pako.push(s2.transformTo(o, t2.data), false);
        }, h2.prototype.flush = function() {
          a.prototype.flush.call(this), this._pako === null && this._createPako(), this._pako.push([], true);
        }, h2.prototype.cleanUp = function() {
          a.prototype.cleanUp.call(this), this._pako = null;
        }, h2.prototype._createPako = function() {
          this._pako = new n[this._pakoAction]({ raw: true, level: this._pakoOptions.level || -1 });
          var e2 = this;
          this._pako.onData = function(t2) {
            e2.push({ data: t2, meta: e2.meta });
          };
        }, r.compressWorker = function(t2) {
          return new h2("Deflate", t2);
        }, r.uncompressWorker = function() {
          return new h2("Inflate", {});
        };
      }, { "./stream/GenericWorker": 28, "./utils": 32, pako: 38 }], 8: [function(t, e, r) {
        function A(t2, e2) {
          var r2, i2 = "";
          for (r2 = 0; r2 < e2; r2++)
            i2 += String.fromCharCode(255 & t2), t2 >>>= 8;
          return i2;
        }
        function i(t2, e2, r2, i2, n2, s3) {
          var a, o, h2 = t2.file, u = t2.compression, l = s3 !== O.utf8encode, f = I.transformTo("string", s3(h2.name)), d2 = I.transformTo("string", O.utf8encode(h2.name)), c = h2.comment, p = I.transformTo("string", s3(c)), m2 = I.transformTo("string", O.utf8encode(c)), _ = d2.length !== h2.name.length, g = m2.length !== c.length, b = "", v = "", y2 = "", w = h2.dir, k = h2.date, x = { crc32: 0, compressedSize: 0, uncompressedSize: 0 };
          e2 && !r2 || (x.crc32 = t2.crc32, x.compressedSize = t2.compressedSize, x.uncompressedSize = t2.uncompressedSize);
          var S = 0;
          e2 && (S |= 8), l || !_ && !g || (S |= 2048);
          var z = 0, C = 0;
          w && (z |= 16), n2 === "UNIX" ? (C = 798, z |= function(t3, e3) {
            var r3 = t3;
            return t3 || (r3 = e3 ? 16893 : 33204), (65535 & r3) << 16;
          }(h2.unixPermissions, w)) : (C = 20, z |= function(t3) {
            return 63 & (t3 || 0);
          }(h2.dosPermissions)), a = k.getUTCHours(), a <<= 6, a |= k.getUTCMinutes(), a <<= 5, a |= k.getUTCSeconds() / 2, o = k.getUTCFullYear() - 1980, o <<= 4, o |= k.getUTCMonth() + 1, o <<= 5, o |= k.getUTCDate(), _ && (v = A(1, 1) + A(B(f), 4) + d2, b += "up" + A(v.length, 2) + v), g && (y2 = A(1, 1) + A(B(p), 4) + m2, b += "uc" + A(y2.length, 2) + y2);
          var E = "";
          return E += "\n\0", E += A(S, 2), E += u.magic, E += A(a, 2), E += A(o, 2), E += A(x.crc32, 4), E += A(x.compressedSize, 4), E += A(x.uncompressedSize, 4), E += A(f.length, 2), E += A(b.length, 2), { fileRecord: R.LOCAL_FILE_HEADER + E + f + b, dirRecord: R.CENTRAL_FILE_HEADER + A(C, 2) + E + A(p.length, 2) + "\0\0\0\0" + A(z, 4) + A(i2, 4) + f + b + p };
        }
        var I = t("../utils"), n = t("../stream/GenericWorker"), O = t("../utf8"), B = t("../crc32"), R = t("../signature");
        function s2(t2, e2, r2, i2) {
          n.call(this, "ZipFileWorker"), this.bytesWritten = 0, this.zipComment = e2, this.zipPlatform = r2, this.encodeFileName = i2, this.streamFiles = t2, this.accumulate = false, this.contentBuffer = [], this.dirRecords = [], this.currentSourceOffset = 0, this.entriesCount = 0, this.currentFile = null, this._sources = [];
        }
        I.inherits(s2, n), s2.prototype.push = function(t2) {
          var e2 = t2.meta.percent || 0, r2 = this.entriesCount, i2 = this._sources.length;
          this.accumulate ? this.contentBuffer.push(t2) : (this.bytesWritten += t2.data.length, n.prototype.push.call(this, { data: t2.data, meta: { currentFile: this.currentFile, percent: r2 ? (e2 + 100 * (r2 - i2 - 1)) / r2 : 100 } }));
        }, s2.prototype.openedSource = function(t2) {
          this.currentSourceOffset = this.bytesWritten, this.currentFile = t2.file.name;
          var e2 = this.streamFiles && !t2.file.dir;
          if (e2) {
            var r2 = i(t2, e2, false, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
            this.push({ data: r2.fileRecord, meta: { percent: 0 } });
          } else
            this.accumulate = true;
        }, s2.prototype.closedSource = function(t2) {
          this.accumulate = false;
          var e2 = this.streamFiles && !t2.file.dir, r2 = i(t2, e2, true, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
          if (this.dirRecords.push(r2.dirRecord), e2)
            this.push({ data: function(t3) {
              return R.DATA_DESCRIPTOR + A(t3.crc32, 4) + A(t3.compressedSize, 4) + A(t3.uncompressedSize, 4);
            }(t2), meta: { percent: 100 } });
          else
            for (this.push({ data: r2.fileRecord, meta: { percent: 0 } }); this.contentBuffer.length; )
              this.push(this.contentBuffer.shift());
          this.currentFile = null;
        }, s2.prototype.flush = function() {
          for (var t2 = this.bytesWritten, e2 = 0; e2 < this.dirRecords.length; e2++)
            this.push({ data: this.dirRecords[e2], meta: { percent: 100 } });
          var r2 = this.bytesWritten - t2, i2 = function(t3, e3, r3, i3, n2) {
            var s3 = I.transformTo("string", n2(i3));
            return R.CENTRAL_DIRECTORY_END + "\0\0\0\0" + A(t3, 2) + A(t3, 2) + A(e3, 4) + A(r3, 4) + A(s3.length, 2) + s3;
          }(this.dirRecords.length, r2, t2, this.zipComment, this.encodeFileName);
          this.push({ data: i2, meta: { percent: 100 } });
        }, s2.prototype.prepareNextSource = function() {
          this.previous = this._sources.shift(), this.openedSource(this.previous.streamInfo), this.isPaused ? this.previous.pause() : this.previous.resume();
        }, s2.prototype.registerPrevious = function(t2) {
          this._sources.push(t2);
          var e2 = this;
          return t2.on("data", function(t3) {
            e2.processChunk(t3);
          }), t2.on("end", function() {
            e2.closedSource(e2.previous.streamInfo), e2._sources.length ? e2.prepareNextSource() : e2.end();
          }), t2.on("error", function(t3) {
            e2.error(t3);
          }), this;
        }, s2.prototype.resume = function() {
          return !!n.prototype.resume.call(this) && (!this.previous && this._sources.length ? (this.prepareNextSource(), true) : this.previous || this._sources.length || this.generatedError ? void 0 : (this.end(), true));
        }, s2.prototype.error = function(t2) {
          var e2 = this._sources;
          if (!n.prototype.error.call(this, t2))
            return false;
          for (var r2 = 0; r2 < e2.length; r2++)
            try {
              e2[r2].error(t2);
            } catch (t3) {
            }
          return true;
        }, s2.prototype.lock = function() {
          n.prototype.lock.call(this);
          for (var t2 = this._sources, e2 = 0; e2 < t2.length; e2++)
            t2[e2].lock();
        }, e.exports = s2;
      }, { "../crc32": 4, "../signature": 23, "../stream/GenericWorker": 28, "../utf8": 31, "../utils": 32 }], 9: [function(t, e, r) {
        var u = t("../compressions"), i = t("./ZipFileWorker");
        r.generateWorker = function(t2, a, e2) {
          var o = new i(a.streamFiles, e2, a.platform, a.encodeFileName), h2 = 0;
          try {
            t2.forEach(function(t3, e3) {
              h2++;
              var r2 = function(t4, e4) {
                var r3 = t4 || e4, i3 = u[r3];
                if (!i3)
                  throw new Error(r3 + " is not a valid compression method !");
                return i3;
              }(e3.options.compression, a.compression), i2 = e3.options.compressionOptions || a.compressionOptions || {}, n = e3.dir, s2 = e3.date;
              e3._compressWorker(r2, i2).withStreamInfo("file", { name: t3, dir: n, date: s2, comment: e3.comment || "", unixPermissions: e3.unixPermissions, dosPermissions: e3.dosPermissions }).pipe(o);
            }), o.entriesCount = h2;
          } catch (t3) {
            o.error(t3);
          }
          return o;
        };
      }, { "../compressions": 3, "./ZipFileWorker": 8 }], 10: [function(t, e, r) {
        function i() {
          if (!(this instanceof i))
            return new i();
          if (arguments.length)
            throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
          this.files = /* @__PURE__ */ Object.create(null), this.comment = null, this.root = "", this.clone = function() {
            var t2 = new i();
            for (var e2 in this)
              typeof this[e2] != "function" && (t2[e2] = this[e2]);
            return t2;
          };
        }
        (i.prototype = t("./object")).loadAsync = t("./load"), i.support = t("./support"), i.defaults = t("./defaults"), i.version = "3.9.1", i.loadAsync = function(t2, e2) {
          return new i().loadAsync(t2, e2);
        }, i.external = t("./external"), e.exports = i;
      }, { "./defaults": 5, "./external": 6, "./load": 11, "./object": 15, "./support": 30 }], 11: [function(t, e, r) {
        var u = t("./utils"), n = t("./external"), i = t("./utf8"), s2 = t("./zipEntries"), a = t("./stream/Crc32Probe"), l = t("./nodejsUtils");
        function f(i2) {
          return new n.Promise(function(t2, e2) {
            var r2 = i2.decompressed.getContentWorker().pipe(new a());
            r2.on("error", function(t3) {
              e2(t3);
            }).on("end", function() {
              r2.streamInfo.crc32 !== i2.decompressed.crc32 ? e2(new Error("Corrupted zip : CRC32 mismatch")) : t2();
            }).resume();
          });
        }
        e.exports = function(t2, o) {
          var h2 = this;
          return o = u.extend(o || {}, { base64: false, checkCRC32: false, optimizedBinaryString: false, createFolders: false, decodeFileName: i.utf8decode }), l.isNode && l.isStream(t2) ? n.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")) : u.prepareContent("the loaded zip file", t2, true, o.optimizedBinaryString, o.base64).then(function(t3) {
            var e2 = new s2(o);
            return e2.load(t3), e2;
          }).then(function(t3) {
            var e2 = [n.Promise.resolve(t3)], r2 = t3.files;
            if (o.checkCRC32)
              for (var i2 = 0; i2 < r2.length; i2++)
                e2.push(f(r2[i2]));
            return n.Promise.all(e2);
          }).then(function(t3) {
            for (var e2 = t3.shift(), r2 = e2.files, i2 = 0; i2 < r2.length; i2++) {
              var n2 = r2[i2], s3 = n2.fileNameStr, a2 = u.resolve(n2.fileNameStr);
              h2.file(a2, n2.decompressed, { binary: true, optimizedBinaryString: true, date: n2.date, dir: n2.dir, comment: n2.fileCommentStr.length ? n2.fileCommentStr : null, unixPermissions: n2.unixPermissions, dosPermissions: n2.dosPermissions, createFolders: o.createFolders }), n2.dir || (h2.file(a2).unsafeOriginalName = s3);
            }
            return e2.zipComment.length && (h2.comment = e2.zipComment), h2;
          });
        };
      }, { "./external": 6, "./nodejsUtils": 14, "./stream/Crc32Probe": 25, "./utf8": 31, "./utils": 32, "./zipEntries": 33 }], 12: [function(t, e, r) {
        var i = t("../utils"), n = t("../stream/GenericWorker");
        function s2(t2, e2) {
          n.call(this, "Nodejs stream input adapter for " + t2), this._upstreamEnded = false, this._bindStream(e2);
        }
        i.inherits(s2, n), s2.prototype._bindStream = function(t2) {
          var e2 = this;
          (this._stream = t2).pause(), t2.on("data", function(t3) {
            e2.push({ data: t3, meta: { percent: 0 } });
          }).on("error", function(t3) {
            e2.isPaused ? this.generatedError = t3 : e2.error(t3);
          }).on("end", function() {
            e2.isPaused ? e2._upstreamEnded = true : e2.end();
          });
        }, s2.prototype.pause = function() {
          return !!n.prototype.pause.call(this) && (this._stream.pause(), true);
        }, s2.prototype.resume = function() {
          return !!n.prototype.resume.call(this) && (this._upstreamEnded ? this.end() : this._stream.resume(), true);
        }, e.exports = s2;
      }, { "../stream/GenericWorker": 28, "../utils": 32 }], 13: [function(t, e, r) {
        var n = t("readable-stream").Readable;
        function i(t2, e2, r2) {
          n.call(this, e2), this._helper = t2;
          var i2 = this;
          t2.on("data", function(t3, e3) {
            i2.push(t3) || i2._helper.pause(), r2 && r2(e3);
          }).on("error", function(t3) {
            i2.emit("error", t3);
          }).on("end", function() {
            i2.push(null);
          });
        }
        t("../utils").inherits(i, n), i.prototype._read = function() {
          this._helper.resume();
        }, e.exports = i;
      }, { "../utils": 32, "readable-stream": 16 }], 14: [function(t, e, r) {
        e.exports = { isNode: typeof Buffer != "undefined", newBufferFrom: function(t2, e2) {
          if (Buffer.from && Buffer.from !== Uint8Array.from)
            return Buffer.from(t2, e2);
          if (typeof t2 == "number")
            throw new Error('The "data" argument must not be a number');
          return new Buffer(t2, e2);
        }, allocBuffer: function(t2) {
          if (Buffer.alloc)
            return Buffer.alloc(t2);
          var e2 = new Buffer(t2);
          return e2.fill(0), e2;
        }, isBuffer: function(t2) {
          return Buffer.isBuffer(t2);
        }, isStream: function(t2) {
          return t2 && typeof t2.on == "function" && typeof t2.pause == "function" && typeof t2.resume == "function";
        } };
      }, {}], 15: [function(t, e, r) {
        function s2(t2, e2, r2) {
          var i2, n2 = u.getTypeOf(e2), s3 = u.extend(r2 || {}, f);
          s3.date = s3.date || new Date(), s3.compression !== null && (s3.compression = s3.compression.toUpperCase()), typeof s3.unixPermissions == "string" && (s3.unixPermissions = parseInt(s3.unixPermissions, 8)), s3.unixPermissions && 16384 & s3.unixPermissions && (s3.dir = true), s3.dosPermissions && 16 & s3.dosPermissions && (s3.dir = true), s3.dir && (t2 = g(t2)), s3.createFolders && (i2 = _(t2)) && b.call(this, i2, true);
          var a2 = n2 === "string" && s3.binary === false && s3.base64 === false;
          r2 && r2.binary !== void 0 || (s3.binary = !a2), (e2 instanceof d2 && e2.uncompressedSize === 0 || s3.dir || !e2 || e2.length === 0) && (s3.base64 = false, s3.binary = true, e2 = "", s3.compression = "STORE", n2 = "string");
          var o2 = null;
          o2 = e2 instanceof d2 || e2 instanceof l ? e2 : p.isNode && p.isStream(e2) ? new m2(t2, e2) : u.prepareContent(t2, e2, s3.binary, s3.optimizedBinaryString, s3.base64);
          var h3 = new c(t2, o2, s3);
          this.files[t2] = h3;
        }
        var n = t("./utf8"), u = t("./utils"), l = t("./stream/GenericWorker"), a = t("./stream/StreamHelper"), f = t("./defaults"), d2 = t("./compressedObject"), c = t("./zipObject"), o = t("./generate"), p = t("./nodejsUtils"), m2 = t("./nodejs/NodejsStreamInputAdapter"), _ = function(t2) {
          t2.slice(-1) === "/" && (t2 = t2.substring(0, t2.length - 1));
          var e2 = t2.lastIndexOf("/");
          return 0 < e2 ? t2.substring(0, e2) : "";
        }, g = function(t2) {
          return t2.slice(-1) !== "/" && (t2 += "/"), t2;
        }, b = function(t2, e2) {
          return e2 = e2 !== void 0 ? e2 : f.createFolders, t2 = g(t2), this.files[t2] || s2.call(this, t2, null, { dir: true, createFolders: e2 }), this.files[t2];
        };
        function h2(t2) {
          return Object.prototype.toString.call(t2) === "[object RegExp]";
        }
        var i = { load: function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, forEach: function(t2) {
          var e2, r2, i2;
          for (e2 in this.files)
            i2 = this.files[e2], (r2 = e2.slice(this.root.length, e2.length)) && e2.slice(0, this.root.length) === this.root && t2(r2, i2);
        }, filter: function(r2) {
          var i2 = [];
          return this.forEach(function(t2, e2) {
            r2(t2, e2) && i2.push(e2);
          }), i2;
        }, file: function(t2, e2, r2) {
          if (arguments.length !== 1)
            return t2 = this.root + t2, s2.call(this, t2, e2, r2), this;
          if (h2(t2)) {
            var i2 = t2;
            return this.filter(function(t3, e3) {
              return !e3.dir && i2.test(t3);
            });
          }
          var n2 = this.files[this.root + t2];
          return n2 && !n2.dir ? n2 : null;
        }, folder: function(r2) {
          if (!r2)
            return this;
          if (h2(r2))
            return this.filter(function(t3, e3) {
              return e3.dir && r2.test(t3);
            });
          var t2 = this.root + r2, e2 = b.call(this, t2), i2 = this.clone();
          return i2.root = e2.name, i2;
        }, remove: function(r2) {
          r2 = this.root + r2;
          var t2 = this.files[r2];
          if (t2 || (r2.slice(-1) !== "/" && (r2 += "/"), t2 = this.files[r2]), t2 && !t2.dir)
            delete this.files[r2];
          else
            for (var e2 = this.filter(function(t3, e3) {
              return e3.name.slice(0, r2.length) === r2;
            }), i2 = 0; i2 < e2.length; i2++)
              delete this.files[e2[i2].name];
          return this;
        }, generate: function(t2) {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, generateInternalStream: function(t2) {
          var e2, r2 = {};
          try {
            if ((r2 = u.extend(t2 || {}, { streamFiles: false, compression: "STORE", compressionOptions: null, type: "", platform: "DOS", comment: null, mimeType: "application/zip", encodeFileName: n.utf8encode })).type = r2.type.toLowerCase(), r2.compression = r2.compression.toUpperCase(), r2.type === "binarystring" && (r2.type = "string"), !r2.type)
              throw new Error("No output type specified.");
            u.checkSupport(r2.type), r2.platform !== "darwin" && r2.platform !== "freebsd" && r2.platform !== "linux" && r2.platform !== "sunos" || (r2.platform = "UNIX"), r2.platform === "win32" && (r2.platform = "DOS");
            var i2 = r2.comment || this.comment || "";
            e2 = o.generateWorker(this, r2, i2);
          } catch (t3) {
            (e2 = new l("error")).error(t3);
          }
          return new a(e2, r2.type || "string", r2.mimeType);
        }, generateAsync: function(t2, e2) {
          return this.generateInternalStream(t2).accumulate(e2);
        }, generateNodeStream: function(t2, e2) {
          return (t2 = t2 || {}).type || (t2.type = "nodebuffer"), this.generateInternalStream(t2).toNodejsStream(e2);
        } };
        e.exports = i;
      }, { "./compressedObject": 2, "./defaults": 5, "./generate": 9, "./nodejs/NodejsStreamInputAdapter": 12, "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31, "./utils": 32, "./zipObject": 35 }], 16: [function(t, e, r) {
        e.exports = t("stream");
      }, { stream: void 0 }], 17: [function(t, e, r) {
        var i = t("./DataReader");
        function n(t2) {
          i.call(this, t2);
          for (var e2 = 0; e2 < this.data.length; e2++)
            t2[e2] = 255 & t2[e2];
        }
        t("../utils").inherits(n, i), n.prototype.byteAt = function(t2) {
          return this.data[this.zero + t2];
        }, n.prototype.lastIndexOfSignature = function(t2) {
          for (var e2 = t2.charCodeAt(0), r2 = t2.charCodeAt(1), i2 = t2.charCodeAt(2), n2 = t2.charCodeAt(3), s2 = this.length - 4; 0 <= s2; --s2)
            if (this.data[s2] === e2 && this.data[s2 + 1] === r2 && this.data[s2 + 2] === i2 && this.data[s2 + 3] === n2)
              return s2 - this.zero;
          return -1;
        }, n.prototype.readAndCheckSignature = function(t2) {
          var e2 = t2.charCodeAt(0), r2 = t2.charCodeAt(1), i2 = t2.charCodeAt(2), n2 = t2.charCodeAt(3), s2 = this.readData(4);
          return e2 === s2[0] && r2 === s2[1] && i2 === s2[2] && n2 === s2[3];
        }, n.prototype.readData = function(t2) {
          if (this.checkOffset(t2), t2 === 0)
            return [];
          var e2 = this.data.slice(this.zero + this.index, this.zero + this.index + t2);
          return this.index += t2, e2;
        }, e.exports = n;
      }, { "../utils": 32, "./DataReader": 18 }], 18: [function(t, e, r) {
        var i = t("../utils");
        function n(t2) {
          this.data = t2, this.length = t2.length, this.index = 0, this.zero = 0;
        }
        n.prototype = { checkOffset: function(t2) {
          this.checkIndex(this.index + t2);
        }, checkIndex: function(t2) {
          if (this.length < this.zero + t2 || t2 < 0)
            throw new Error("End of data reached (data length = " + this.length + ", asked index = " + t2 + "). Corrupted zip ?");
        }, setIndex: function(t2) {
          this.checkIndex(t2), this.index = t2;
        }, skip: function(t2) {
          this.setIndex(this.index + t2);
        }, byteAt: function(t2) {
        }, readInt: function(t2) {
          var e2, r2 = 0;
          for (this.checkOffset(t2), e2 = this.index + t2 - 1; e2 >= this.index; e2--)
            r2 = (r2 << 8) + this.byteAt(e2);
          return this.index += t2, r2;
        }, readString: function(t2) {
          return i.transformTo("string", this.readData(t2));
        }, readData: function(t2) {
        }, lastIndexOfSignature: function(t2) {
        }, readAndCheckSignature: function(t2) {
        }, readDate: function() {
          var t2 = this.readInt(4);
          return new Date(Date.UTC(1980 + (t2 >> 25 & 127), (t2 >> 21 & 15) - 1, t2 >> 16 & 31, t2 >> 11 & 31, t2 >> 5 & 63, (31 & t2) << 1));
        } }, e.exports = n;
      }, { "../utils": 32 }], 19: [function(t, e, r) {
        var i = t("./Uint8ArrayReader");
        function n(t2) {
          i.call(this, t2);
        }
        t("../utils").inherits(n, i), n.prototype.readData = function(t2) {
          this.checkOffset(t2);
          var e2 = this.data.slice(this.zero + this.index, this.zero + this.index + t2);
          return this.index += t2, e2;
        }, e.exports = n;
      }, { "../utils": 32, "./Uint8ArrayReader": 21 }], 20: [function(t, e, r) {
        var i = t("./DataReader");
        function n(t2) {
          i.call(this, t2);
        }
        t("../utils").inherits(n, i), n.prototype.byteAt = function(t2) {
          return this.data.charCodeAt(this.zero + t2);
        }, n.prototype.lastIndexOfSignature = function(t2) {
          return this.data.lastIndexOf(t2) - this.zero;
        }, n.prototype.readAndCheckSignature = function(t2) {
          return t2 === this.readData(4);
        }, n.prototype.readData = function(t2) {
          this.checkOffset(t2);
          var e2 = this.data.slice(this.zero + this.index, this.zero + this.index + t2);
          return this.index += t2, e2;
        }, e.exports = n;
      }, { "../utils": 32, "./DataReader": 18 }], 21: [function(t, e, r) {
        var i = t("./ArrayReader");
        function n(t2) {
          i.call(this, t2);
        }
        t("../utils").inherits(n, i), n.prototype.readData = function(t2) {
          if (this.checkOffset(t2), t2 === 0)
            return new Uint8Array(0);
          var e2 = this.data.subarray(this.zero + this.index, this.zero + this.index + t2);
          return this.index += t2, e2;
        }, e.exports = n;
      }, { "../utils": 32, "./ArrayReader": 17 }], 22: [function(t, e, r) {
        var i = t("../utils"), n = t("../support"), s2 = t("./ArrayReader"), a = t("./StringReader"), o = t("./NodeBufferReader"), h2 = t("./Uint8ArrayReader");
        e.exports = function(t2) {
          var e2 = i.getTypeOf(t2);
          return i.checkSupport(e2), e2 !== "string" || n.uint8array ? e2 === "nodebuffer" ? new o(t2) : n.uint8array ? new h2(i.transformTo("uint8array", t2)) : new s2(i.transformTo("array", t2)) : new a(t2);
        };
      }, { "../support": 30, "../utils": 32, "./ArrayReader": 17, "./NodeBufferReader": 19, "./StringReader": 20, "./Uint8ArrayReader": 21 }], 23: [function(t, e, r) {
        r.LOCAL_FILE_HEADER = "PK", r.CENTRAL_FILE_HEADER = "PK", r.CENTRAL_DIRECTORY_END = "PK", r.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x07", r.ZIP64_CENTRAL_DIRECTORY_END = "PK", r.DATA_DESCRIPTOR = "PK\x07\b";
      }, {}], 24: [function(t, e, r) {
        var i = t("./GenericWorker"), n = t("../utils");
        function s2(t2) {
          i.call(this, "ConvertWorker to " + t2), this.destType = t2;
        }
        n.inherits(s2, i), s2.prototype.processChunk = function(t2) {
          this.push({ data: n.transformTo(this.destType, t2.data), meta: t2.meta });
        }, e.exports = s2;
      }, { "../utils": 32, "./GenericWorker": 28 }], 25: [function(t, e, r) {
        var i = t("./GenericWorker"), n = t("../crc32");
        function s2() {
          i.call(this, "Crc32Probe"), this.withStreamInfo("crc32", 0);
        }
        t("../utils").inherits(s2, i), s2.prototype.processChunk = function(t2) {
          this.streamInfo.crc32 = n(t2.data, this.streamInfo.crc32 || 0), this.push(t2);
        }, e.exports = s2;
      }, { "../crc32": 4, "../utils": 32, "./GenericWorker": 28 }], 26: [function(t, e, r) {
        var i = t("../utils"), n = t("./GenericWorker");
        function s2(t2) {
          n.call(this, "DataLengthProbe for " + t2), this.propName = t2, this.withStreamInfo(t2, 0);
        }
        i.inherits(s2, n), s2.prototype.processChunk = function(t2) {
          if (t2) {
            var e2 = this.streamInfo[this.propName] || 0;
            this.streamInfo[this.propName] = e2 + t2.data.length;
          }
          n.prototype.processChunk.call(this, t2);
        }, e.exports = s2;
      }, { "../utils": 32, "./GenericWorker": 28 }], 27: [function(t, e, r) {
        var i = t("../utils"), n = t("./GenericWorker");
        function s2(t2) {
          n.call(this, "DataWorker");
          var e2 = this;
          this.dataIsReady = false, this.index = 0, this.max = 0, this.data = null, this.type = "", this._tickScheduled = false, t2.then(function(t3) {
            e2.dataIsReady = true, e2.data = t3, e2.max = t3 && t3.length || 0, e2.type = i.getTypeOf(t3), e2.isPaused || e2._tickAndRepeat();
          }, function(t3) {
            e2.error(t3);
          });
        }
        i.inherits(s2, n), s2.prototype.cleanUp = function() {
          n.prototype.cleanUp.call(this), this.data = null;
        }, s2.prototype.resume = function() {
          return !!n.prototype.resume.call(this) && (!this._tickScheduled && this.dataIsReady && (this._tickScheduled = true, i.delay(this._tickAndRepeat, [], this)), true);
        }, s2.prototype._tickAndRepeat = function() {
          this._tickScheduled = false, this.isPaused || this.isFinished || (this._tick(), this.isFinished || (i.delay(this._tickAndRepeat, [], this), this._tickScheduled = true));
        }, s2.prototype._tick = function() {
          if (this.isPaused || this.isFinished)
            return false;
          var t2 = null, e2 = Math.min(this.max, this.index + 16384);
          if (this.index >= this.max)
            return this.end();
          switch (this.type) {
            case "string":
              t2 = this.data.substring(this.index, e2);
              break;
            case "uint8array":
              t2 = this.data.subarray(this.index, e2);
              break;
            case "array":
            case "nodebuffer":
              t2 = this.data.slice(this.index, e2);
          }
          return this.index = e2, this.push({ data: t2, meta: { percent: this.max ? this.index / this.max * 100 : 0 } });
        }, e.exports = s2;
      }, { "../utils": 32, "./GenericWorker": 28 }], 28: [function(t, e, r) {
        function i(t2) {
          this.name = t2 || "default", this.streamInfo = {}, this.generatedError = null, this.extraStreamInfo = {}, this.isPaused = true, this.isFinished = false, this.isLocked = false, this._listeners = { data: [], end: [], error: [] }, this.previous = null;
        }
        i.prototype = { push: function(t2) {
          this.emit("data", t2);
        }, end: function() {
          if (this.isFinished)
            return false;
          this.flush();
          try {
            this.emit("end"), this.cleanUp(), this.isFinished = true;
          } catch (t2) {
            this.emit("error", t2);
          }
          return true;
        }, error: function(t2) {
          return !this.isFinished && (this.isPaused ? this.generatedError = t2 : (this.isFinished = true, this.emit("error", t2), this.previous && this.previous.error(t2), this.cleanUp()), true);
        }, on: function(t2, e2) {
          return this._listeners[t2].push(e2), this;
        }, cleanUp: function() {
          this.streamInfo = this.generatedError = this.extraStreamInfo = null, this._listeners = [];
        }, emit: function(t2, e2) {
          if (this._listeners[t2])
            for (var r2 = 0; r2 < this._listeners[t2].length; r2++)
              this._listeners[t2][r2].call(this, e2);
        }, pipe: function(t2) {
          return t2.registerPrevious(this);
        }, registerPrevious: function(t2) {
          if (this.isLocked)
            throw new Error("The stream '" + this + "' has already been used.");
          this.streamInfo = t2.streamInfo, this.mergeStreamInfo(), this.previous = t2;
          var e2 = this;
          return t2.on("data", function(t3) {
            e2.processChunk(t3);
          }), t2.on("end", function() {
            e2.end();
          }), t2.on("error", function(t3) {
            e2.error(t3);
          }), this;
        }, pause: function() {
          return !this.isPaused && !this.isFinished && (this.isPaused = true, this.previous && this.previous.pause(), true);
        }, resume: function() {
          if (!this.isPaused || this.isFinished)
            return false;
          var t2 = this.isPaused = false;
          return this.generatedError && (this.error(this.generatedError), t2 = true), this.previous && this.previous.resume(), !t2;
        }, flush: function() {
        }, processChunk: function(t2) {
          this.push(t2);
        }, withStreamInfo: function(t2, e2) {
          return this.extraStreamInfo[t2] = e2, this.mergeStreamInfo(), this;
        }, mergeStreamInfo: function() {
          for (var t2 in this.extraStreamInfo)
            this.extraStreamInfo.hasOwnProperty(t2) && (this.streamInfo[t2] = this.extraStreamInfo[t2]);
        }, lock: function() {
          if (this.isLocked)
            throw new Error("The stream '" + this + "' has already been used.");
          this.isLocked = true, this.previous && this.previous.lock();
        }, toString: function() {
          var t2 = "Worker " + this.name;
          return this.previous ? this.previous + " -> " + t2 : t2;
        } }, e.exports = i;
      }, {}], 29: [function(t, e, r) {
        var h2 = t("../utils"), n = t("./ConvertWorker"), s2 = t("./GenericWorker"), u = t("../base64"), i = t("../support"), a = t("../external"), o = null;
        if (i.nodestream)
          try {
            o = t("../nodejs/NodejsStreamOutputAdapter");
          } catch (t2) {
          }
        function l(t2, o2) {
          return new a.Promise(function(e2, r2) {
            var i2 = [], n2 = t2._internalType, s3 = t2._outputType, a2 = t2._mimeType;
            t2.on("data", function(t3, e3) {
              i2.push(t3), o2 && o2(e3);
            }).on("error", function(t3) {
              i2 = [], r2(t3);
            }).on("end", function() {
              try {
                var t3 = function(t4, e3, r3) {
                  switch (t4) {
                    case "blob":
                      return h2.newBlob(h2.transformTo("arraybuffer", e3), r3);
                    case "base64":
                      return u.encode(e3);
                    default:
                      return h2.transformTo(t4, e3);
                  }
                }(s3, function(t4, e3) {
                  var r3, i3 = 0, n3 = null, s4 = 0;
                  for (r3 = 0; r3 < e3.length; r3++)
                    s4 += e3[r3].length;
                  switch (t4) {
                    case "string":
                      return e3.join("");
                    case "array":
                      return Array.prototype.concat.apply([], e3);
                    case "uint8array":
                      for (n3 = new Uint8Array(s4), r3 = 0; r3 < e3.length; r3++)
                        n3.set(e3[r3], i3), i3 += e3[r3].length;
                      return n3;
                    case "nodebuffer":
                      return Buffer.concat(e3);
                    default:
                      throw new Error("concat : unsupported type '" + t4 + "'");
                  }
                }(n2, i2), a2);
                e2(t3);
              } catch (t4) {
                r2(t4);
              }
              i2 = [];
            }).resume();
          });
        }
        function f(t2, e2, r2) {
          var i2 = e2;
          switch (e2) {
            case "blob":
            case "arraybuffer":
              i2 = "uint8array";
              break;
            case "base64":
              i2 = "string";
          }
          try {
            this._internalType = i2, this._outputType = e2, this._mimeType = r2, h2.checkSupport(i2), this._worker = t2.pipe(new n(i2)), t2.lock();
          } catch (t3) {
            this._worker = new s2("error"), this._worker.error(t3);
          }
        }
        f.prototype = { accumulate: function(t2) {
          return l(this, t2);
        }, on: function(t2, e2) {
          var r2 = this;
          return t2 === "data" ? this._worker.on(t2, function(t3) {
            e2.call(r2, t3.data, t3.meta);
          }) : this._worker.on(t2, function() {
            h2.delay(e2, arguments, r2);
          }), this;
        }, resume: function() {
          return h2.delay(this._worker.resume, [], this._worker), this;
        }, pause: function() {
          return this._worker.pause(), this;
        }, toNodejsStream: function(t2) {
          if (h2.checkSupport("nodestream"), this._outputType !== "nodebuffer")
            throw new Error(this._outputType + " is not supported by this method");
          return new o(this, { objectMode: this._outputType !== "nodebuffer" }, t2);
        } }, e.exports = f;
      }, { "../base64": 1, "../external": 6, "../nodejs/NodejsStreamOutputAdapter": 13, "../support": 30, "../utils": 32, "./ConvertWorker": 24, "./GenericWorker": 28 }], 30: [function(t, e, r) {
        if (r.base64 = true, r.array = true, r.string = true, r.arraybuffer = typeof ArrayBuffer != "undefined" && typeof Uint8Array != "undefined", r.nodebuffer = typeof Buffer != "undefined", r.uint8array = typeof Uint8Array != "undefined", typeof ArrayBuffer == "undefined")
          r.blob = false;
        else {
          var i = new ArrayBuffer(0);
          try {
            r.blob = new Blob([i], { type: "application/zip" }).size === 0;
          } catch (t2) {
            try {
              var n = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
              n.append(i), r.blob = n.getBlob("application/zip").size === 0;
            } catch (t3) {
              r.blob = false;
            }
          }
        }
        try {
          r.nodestream = !!t("readable-stream").Readable;
        } catch (t2) {
          r.nodestream = false;
        }
      }, { "readable-stream": 16 }], 31: [function(t, e, s2) {
        for (var o = t("./utils"), h2 = t("./support"), r = t("./nodejsUtils"), i = t("./stream/GenericWorker"), u = new Array(256), n = 0; n < 256; n++)
          u[n] = 252 <= n ? 6 : 248 <= n ? 5 : 240 <= n ? 4 : 224 <= n ? 3 : 192 <= n ? 2 : 1;
        u[254] = u[254] = 1;
        function a() {
          i.call(this, "utf-8 decode"), this.leftOver = null;
        }
        function l() {
          i.call(this, "utf-8 encode");
        }
        s2.utf8encode = function(t2) {
          return h2.nodebuffer ? r.newBufferFrom(t2, "utf-8") : function(t3) {
            var e2, r2, i2, n2, s3, a2 = t3.length, o2 = 0;
            for (n2 = 0; n2 < a2; n2++)
              (64512 & (r2 = t3.charCodeAt(n2))) == 55296 && n2 + 1 < a2 && (64512 & (i2 = t3.charCodeAt(n2 + 1))) == 56320 && (r2 = 65536 + (r2 - 55296 << 10) + (i2 - 56320), n2++), o2 += r2 < 128 ? 1 : r2 < 2048 ? 2 : r2 < 65536 ? 3 : 4;
            for (e2 = h2.uint8array ? new Uint8Array(o2) : new Array(o2), n2 = s3 = 0; s3 < o2; n2++)
              (64512 & (r2 = t3.charCodeAt(n2))) == 55296 && n2 + 1 < a2 && (64512 & (i2 = t3.charCodeAt(n2 + 1))) == 56320 && (r2 = 65536 + (r2 - 55296 << 10) + (i2 - 56320), n2++), r2 < 128 ? e2[s3++] = r2 : (r2 < 2048 ? e2[s3++] = 192 | r2 >>> 6 : (r2 < 65536 ? e2[s3++] = 224 | r2 >>> 12 : (e2[s3++] = 240 | r2 >>> 18, e2[s3++] = 128 | r2 >>> 12 & 63), e2[s3++] = 128 | r2 >>> 6 & 63), e2[s3++] = 128 | 63 & r2);
            return e2;
          }(t2);
        }, s2.utf8decode = function(t2) {
          return h2.nodebuffer ? o.transformTo("nodebuffer", t2).toString("utf-8") : function(t3) {
            var e2, r2, i2, n2, s3 = t3.length, a2 = new Array(2 * s3);
            for (e2 = r2 = 0; e2 < s3; )
              if ((i2 = t3[e2++]) < 128)
                a2[r2++] = i2;
              else if (4 < (n2 = u[i2]))
                a2[r2++] = 65533, e2 += n2 - 1;
              else {
                for (i2 &= n2 === 2 ? 31 : n2 === 3 ? 15 : 7; 1 < n2 && e2 < s3; )
                  i2 = i2 << 6 | 63 & t3[e2++], n2--;
                1 < n2 ? a2[r2++] = 65533 : i2 < 65536 ? a2[r2++] = i2 : (i2 -= 65536, a2[r2++] = 55296 | i2 >> 10 & 1023, a2[r2++] = 56320 | 1023 & i2);
              }
            return a2.length !== r2 && (a2.subarray ? a2 = a2.subarray(0, r2) : a2.length = r2), o.applyFromCharCode(a2);
          }(t2 = o.transformTo(h2.uint8array ? "uint8array" : "array", t2));
        }, o.inherits(a, i), a.prototype.processChunk = function(t2) {
          var e2 = o.transformTo(h2.uint8array ? "uint8array" : "array", t2.data);
          if (this.leftOver && this.leftOver.length) {
            if (h2.uint8array) {
              var r2 = e2;
              (e2 = new Uint8Array(r2.length + this.leftOver.length)).set(this.leftOver, 0), e2.set(r2, this.leftOver.length);
            } else
              e2 = this.leftOver.concat(e2);
            this.leftOver = null;
          }
          var i2 = function(t3, e3) {
            var r3;
            for ((e3 = e3 || t3.length) > t3.length && (e3 = t3.length), r3 = e3 - 1; 0 <= r3 && (192 & t3[r3]) == 128; )
              r3--;
            return r3 < 0 ? e3 : r3 === 0 ? e3 : r3 + u[t3[r3]] > e3 ? r3 : e3;
          }(e2), n2 = e2;
          i2 !== e2.length && (h2.uint8array ? (n2 = e2.subarray(0, i2), this.leftOver = e2.subarray(i2, e2.length)) : (n2 = e2.slice(0, i2), this.leftOver = e2.slice(i2, e2.length))), this.push({ data: s2.utf8decode(n2), meta: t2.meta });
        }, a.prototype.flush = function() {
          this.leftOver && this.leftOver.length && (this.push({ data: s2.utf8decode(this.leftOver), meta: {} }), this.leftOver = null);
        }, s2.Utf8DecodeWorker = a, o.inherits(l, i), l.prototype.processChunk = function(t2) {
          this.push({ data: s2.utf8encode(t2.data), meta: t2.meta });
        }, s2.Utf8EncodeWorker = l;
      }, { "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./support": 30, "./utils": 32 }], 32: [function(t, e, a) {
        var o = t("./support"), h2 = t("./base64"), r = t("./nodejsUtils"), i = t("set-immediate-shim"), u = t("./external");
        function n(t2) {
          return t2;
        }
        function l(t2, e2) {
          for (var r2 = 0; r2 < t2.length; ++r2)
            e2[r2] = 255 & t2.charCodeAt(r2);
          return e2;
        }
        a.newBlob = function(e2, r2) {
          a.checkSupport("blob");
          try {
            return new Blob([e2], { type: r2 });
          } catch (t2) {
            try {
              var i2 = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
              return i2.append(e2), i2.getBlob(r2);
            } catch (t3) {
              throw new Error("Bug : can't construct the Blob.");
            }
          }
        };
        var s2 = { stringifyByChunk: function(t2, e2, r2) {
          var i2 = [], n2 = 0, s3 = t2.length;
          if (s3 <= r2)
            return String.fromCharCode.apply(null, t2);
          for (; n2 < s3; )
            e2 === "array" || e2 === "nodebuffer" ? i2.push(String.fromCharCode.apply(null, t2.slice(n2, Math.min(n2 + r2, s3)))) : i2.push(String.fromCharCode.apply(null, t2.subarray(n2, Math.min(n2 + r2, s3)))), n2 += r2;
          return i2.join("");
        }, stringifyByChar: function(t2) {
          for (var e2 = "", r2 = 0; r2 < t2.length; r2++)
            e2 += String.fromCharCode(t2[r2]);
          return e2;
        }, applyCanBeUsed: { uint8array: function() {
          try {
            return o.uint8array && String.fromCharCode.apply(null, new Uint8Array(1)).length === 1;
          } catch (t2) {
            return false;
          }
        }(), nodebuffer: function() {
          try {
            return o.nodebuffer && String.fromCharCode.apply(null, r.allocBuffer(1)).length === 1;
          } catch (t2) {
            return false;
          }
        }() } };
        function f(t2) {
          var e2 = 65536, r2 = a.getTypeOf(t2), i2 = true;
          if (r2 === "uint8array" ? i2 = s2.applyCanBeUsed.uint8array : r2 === "nodebuffer" && (i2 = s2.applyCanBeUsed.nodebuffer), i2)
            for (; 1 < e2; )
              try {
                return s2.stringifyByChunk(t2, r2, e2);
              } catch (t3) {
                e2 = Math.floor(e2 / 2);
              }
          return s2.stringifyByChar(t2);
        }
        function d2(t2, e2) {
          for (var r2 = 0; r2 < t2.length; r2++)
            e2[r2] = t2[r2];
          return e2;
        }
        a.applyFromCharCode = f;
        var c = {};
        c.string = { string: n, array: function(t2) {
          return l(t2, new Array(t2.length));
        }, arraybuffer: function(t2) {
          return c.string.uint8array(t2).buffer;
        }, uint8array: function(t2) {
          return l(t2, new Uint8Array(t2.length));
        }, nodebuffer: function(t2) {
          return l(t2, r.allocBuffer(t2.length));
        } }, c.array = { string: f, array: n, arraybuffer: function(t2) {
          return new Uint8Array(t2).buffer;
        }, uint8array: function(t2) {
          return new Uint8Array(t2);
        }, nodebuffer: function(t2) {
          return r.newBufferFrom(t2);
        } }, c.arraybuffer = { string: function(t2) {
          return f(new Uint8Array(t2));
        }, array: function(t2) {
          return d2(new Uint8Array(t2), new Array(t2.byteLength));
        }, arraybuffer: n, uint8array: function(t2) {
          return new Uint8Array(t2);
        }, nodebuffer: function(t2) {
          return r.newBufferFrom(new Uint8Array(t2));
        } }, c.uint8array = { string: f, array: function(t2) {
          return d2(t2, new Array(t2.length));
        }, arraybuffer: function(t2) {
          return t2.buffer;
        }, uint8array: n, nodebuffer: function(t2) {
          return r.newBufferFrom(t2);
        } }, c.nodebuffer = { string: f, array: function(t2) {
          return d2(t2, new Array(t2.length));
        }, arraybuffer: function(t2) {
          return c.nodebuffer.uint8array(t2).buffer;
        }, uint8array: function(t2) {
          return d2(t2, new Uint8Array(t2.length));
        }, nodebuffer: n }, a.transformTo = function(t2, e2) {
          if (e2 = e2 || "", !t2)
            return e2;
          a.checkSupport(t2);
          var r2 = a.getTypeOf(e2);
          return c[r2][t2](e2);
        }, a.resolve = function(t2) {
          for (var e2 = t2.split("/"), r2 = [], i2 = 0; i2 < e2.length; i2++) {
            var n2 = e2[i2];
            n2 === "." || n2 === "" && i2 !== 0 && i2 !== e2.length - 1 || (n2 === ".." ? r2.pop() : r2.push(n2));
          }
          return r2.join("/");
        }, a.getTypeOf = function(t2) {
          return typeof t2 == "string" ? "string" : Object.prototype.toString.call(t2) === "[object Array]" ? "array" : o.nodebuffer && r.isBuffer(t2) ? "nodebuffer" : o.uint8array && t2 instanceof Uint8Array ? "uint8array" : o.arraybuffer && t2 instanceof ArrayBuffer ? "arraybuffer" : void 0;
        }, a.checkSupport = function(t2) {
          if (!o[t2.toLowerCase()])
            throw new Error(t2 + " is not supported by this platform");
        }, a.MAX_VALUE_16BITS = 65535, a.MAX_VALUE_32BITS = -1, a.pretty = function(t2) {
          var e2, r2, i2 = "";
          for (r2 = 0; r2 < (t2 || "").length; r2++)
            i2 += "\\x" + ((e2 = t2.charCodeAt(r2)) < 16 ? "0" : "") + e2.toString(16).toUpperCase();
          return i2;
        }, a.delay = function(t2, e2, r2) {
          i(function() {
            t2.apply(r2 || null, e2 || []);
          });
        }, a.inherits = function(t2, e2) {
          function r2() {
          }
          r2.prototype = e2.prototype, t2.prototype = new r2();
        }, a.extend = function() {
          var t2, e2, r2 = {};
          for (t2 = 0; t2 < arguments.length; t2++)
            for (e2 in arguments[t2])
              arguments[t2].hasOwnProperty(e2) && r2[e2] === void 0 && (r2[e2] = arguments[t2][e2]);
          return r2;
        }, a.prepareContent = function(r2, t2, i2, n2, s3) {
          return u.Promise.resolve(t2).then(function(i3) {
            return o.blob && (i3 instanceof Blob || ["[object File]", "[object Blob]"].indexOf(Object.prototype.toString.call(i3)) !== -1) && typeof FileReader != "undefined" ? new u.Promise(function(e2, r3) {
              var t3 = new FileReader();
              t3.onload = function(t4) {
                e2(t4.target.result);
              }, t3.onerror = function(t4) {
                r3(t4.target.error);
              }, t3.readAsArrayBuffer(i3);
            }) : i3;
          }).then(function(t3) {
            var e2 = a.getTypeOf(t3);
            return e2 ? (e2 === "arraybuffer" ? t3 = a.transformTo("uint8array", t3) : e2 === "string" && (s3 ? t3 = h2.decode(t3) : i2 && n2 !== true && (t3 = function(t4) {
              return l(t4, o.uint8array ? new Uint8Array(t4.length) : new Array(t4.length));
            }(t3))), t3) : u.Promise.reject(new Error("Can't read the data of '" + r2 + "'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"));
          });
        };
      }, { "./base64": 1, "./external": 6, "./nodejsUtils": 14, "./support": 30, "set-immediate-shim": 54 }], 33: [function(t, e, r) {
        var i = t("./reader/readerFor"), n = t("./utils"), s2 = t("./signature"), a = t("./zipEntry"), o = (t("./utf8"), t("./support"));
        function h2(t2) {
          this.files = [], this.loadOptions = t2;
        }
        h2.prototype = { checkSignature: function(t2) {
          if (!this.reader.readAndCheckSignature(t2)) {
            this.reader.index -= 4;
            var e2 = this.reader.readString(4);
            throw new Error("Corrupted zip or bug: unexpected signature (" + n.pretty(e2) + ", expected " + n.pretty(t2) + ")");
          }
        }, isSignature: function(t2, e2) {
          var r2 = this.reader.index;
          this.reader.setIndex(t2);
          var i2 = this.reader.readString(4) === e2;
          return this.reader.setIndex(r2), i2;
        }, readBlockEndOfCentral: function() {
          this.diskNumber = this.reader.readInt(2), this.diskWithCentralDirStart = this.reader.readInt(2), this.centralDirRecordsOnThisDisk = this.reader.readInt(2), this.centralDirRecords = this.reader.readInt(2), this.centralDirSize = this.reader.readInt(4), this.centralDirOffset = this.reader.readInt(4), this.zipCommentLength = this.reader.readInt(2);
          var t2 = this.reader.readData(this.zipCommentLength), e2 = o.uint8array ? "uint8array" : "array", r2 = n.transformTo(e2, t2);
          this.zipComment = this.loadOptions.decodeFileName(r2);
        }, readBlockZip64EndOfCentral: function() {
          this.zip64EndOfCentralSize = this.reader.readInt(8), this.reader.skip(4), this.diskNumber = this.reader.readInt(4), this.diskWithCentralDirStart = this.reader.readInt(4), this.centralDirRecordsOnThisDisk = this.reader.readInt(8), this.centralDirRecords = this.reader.readInt(8), this.centralDirSize = this.reader.readInt(8), this.centralDirOffset = this.reader.readInt(8), this.zip64ExtensibleData = {};
          for (var t2, e2, r2, i2 = this.zip64EndOfCentralSize - 44; 0 < i2; )
            t2 = this.reader.readInt(2), e2 = this.reader.readInt(4), r2 = this.reader.readData(e2), this.zip64ExtensibleData[t2] = { id: t2, length: e2, value: r2 };
        }, readBlockZip64EndOfCentralLocator: function() {
          if (this.diskWithZip64CentralDirStart = this.reader.readInt(4), this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8), this.disksCount = this.reader.readInt(4), 1 < this.disksCount)
            throw new Error("Multi-volumes zip are not supported");
        }, readLocalFiles: function() {
          var t2, e2;
          for (t2 = 0; t2 < this.files.length; t2++)
            e2 = this.files[t2], this.reader.setIndex(e2.localHeaderOffset), this.checkSignature(s2.LOCAL_FILE_HEADER), e2.readLocalPart(this.reader), e2.handleUTF8(), e2.processAttributes();
        }, readCentralDir: function() {
          var t2;
          for (this.reader.setIndex(this.centralDirOffset); this.reader.readAndCheckSignature(s2.CENTRAL_FILE_HEADER); )
            (t2 = new a({ zip64: this.zip64 }, this.loadOptions)).readCentralPart(this.reader), this.files.push(t2);
          if (this.centralDirRecords !== this.files.length && this.centralDirRecords !== 0 && this.files.length === 0)
            throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
        }, readEndOfCentral: function() {
          var t2 = this.reader.lastIndexOfSignature(s2.CENTRAL_DIRECTORY_END);
          if (t2 < 0)
            throw !this.isSignature(0, s2.LOCAL_FILE_HEADER) ? new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html") : new Error("Corrupted zip: can't find end of central directory");
          this.reader.setIndex(t2);
          var e2 = t2;
          if (this.checkSignature(s2.CENTRAL_DIRECTORY_END), this.readBlockEndOfCentral(), this.diskNumber === n.MAX_VALUE_16BITS || this.diskWithCentralDirStart === n.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === n.MAX_VALUE_16BITS || this.centralDirRecords === n.MAX_VALUE_16BITS || this.centralDirSize === n.MAX_VALUE_32BITS || this.centralDirOffset === n.MAX_VALUE_32BITS) {
            if (this.zip64 = true, (t2 = this.reader.lastIndexOfSignature(s2.ZIP64_CENTRAL_DIRECTORY_LOCATOR)) < 0)
              throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");
            if (this.reader.setIndex(t2), this.checkSignature(s2.ZIP64_CENTRAL_DIRECTORY_LOCATOR), this.readBlockZip64EndOfCentralLocator(), !this.isSignature(this.relativeOffsetEndOfZip64CentralDir, s2.ZIP64_CENTRAL_DIRECTORY_END) && (this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(s2.ZIP64_CENTRAL_DIRECTORY_END), this.relativeOffsetEndOfZip64CentralDir < 0))
              throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");
            this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir), this.checkSignature(s2.ZIP64_CENTRAL_DIRECTORY_END), this.readBlockZip64EndOfCentral();
          }
          var r2 = this.centralDirOffset + this.centralDirSize;
          this.zip64 && (r2 += 20, r2 += 12 + this.zip64EndOfCentralSize);
          var i2 = e2 - r2;
          if (0 < i2)
            this.isSignature(e2, s2.CENTRAL_FILE_HEADER) || (this.reader.zero = i2);
          else if (i2 < 0)
            throw new Error("Corrupted zip: missing " + Math.abs(i2) + " bytes.");
        }, prepareReader: function(t2) {
          this.reader = i(t2);
        }, load: function(t2) {
          this.prepareReader(t2), this.readEndOfCentral(), this.readCentralDir(), this.readLocalFiles();
        } }, e.exports = h2;
      }, { "./reader/readerFor": 22, "./signature": 23, "./support": 30, "./utf8": 31, "./utils": 32, "./zipEntry": 34 }], 34: [function(t, e, r) {
        var i = t("./reader/readerFor"), s2 = t("./utils"), n = t("./compressedObject"), a = t("./crc32"), o = t("./utf8"), h2 = t("./compressions"), u = t("./support");
        function l(t2, e2) {
          this.options = t2, this.loadOptions = e2;
        }
        l.prototype = { isEncrypted: function() {
          return (1 & this.bitFlag) == 1;
        }, useUTF8: function() {
          return (2048 & this.bitFlag) == 2048;
        }, readLocalPart: function(t2) {
          var e2, r2;
          if (t2.skip(22), this.fileNameLength = t2.readInt(2), r2 = t2.readInt(2), this.fileName = t2.readData(this.fileNameLength), t2.skip(r2), this.compressedSize === -1 || this.uncompressedSize === -1)
            throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");
          if ((e2 = function(t3) {
            for (var e3 in h2)
              if (h2.hasOwnProperty(e3) && h2[e3].magic === t3)
                return h2[e3];
            return null;
          }(this.compressionMethod)) === null)
            throw new Error("Corrupted zip : compression " + s2.pretty(this.compressionMethod) + " unknown (inner file : " + s2.transformTo("string", this.fileName) + ")");
          this.decompressed = new n(this.compressedSize, this.uncompressedSize, this.crc32, e2, t2.readData(this.compressedSize));
        }, readCentralPart: function(t2) {
          this.versionMadeBy = t2.readInt(2), t2.skip(2), this.bitFlag = t2.readInt(2), this.compressionMethod = t2.readString(2), this.date = t2.readDate(), this.crc32 = t2.readInt(4), this.compressedSize = t2.readInt(4), this.uncompressedSize = t2.readInt(4);
          var e2 = t2.readInt(2);
          if (this.extraFieldsLength = t2.readInt(2), this.fileCommentLength = t2.readInt(2), this.diskNumberStart = t2.readInt(2), this.internalFileAttributes = t2.readInt(2), this.externalFileAttributes = t2.readInt(4), this.localHeaderOffset = t2.readInt(4), this.isEncrypted())
            throw new Error("Encrypted zip are not supported");
          t2.skip(e2), this.readExtraFields(t2), this.parseZIP64ExtraField(t2), this.fileComment = t2.readData(this.fileCommentLength);
        }, processAttributes: function() {
          this.unixPermissions = null, this.dosPermissions = null;
          var t2 = this.versionMadeBy >> 8;
          this.dir = !!(16 & this.externalFileAttributes), t2 == 0 && (this.dosPermissions = 63 & this.externalFileAttributes), t2 == 3 && (this.unixPermissions = this.externalFileAttributes >> 16 & 65535), this.dir || this.fileNameStr.slice(-1) !== "/" || (this.dir = true);
        }, parseZIP64ExtraField: function(t2) {
          if (this.extraFields[1]) {
            var e2 = i(this.extraFields[1].value);
            this.uncompressedSize === s2.MAX_VALUE_32BITS && (this.uncompressedSize = e2.readInt(8)), this.compressedSize === s2.MAX_VALUE_32BITS && (this.compressedSize = e2.readInt(8)), this.localHeaderOffset === s2.MAX_VALUE_32BITS && (this.localHeaderOffset = e2.readInt(8)), this.diskNumberStart === s2.MAX_VALUE_32BITS && (this.diskNumberStart = e2.readInt(4));
          }
        }, readExtraFields: function(t2) {
          var e2, r2, i2, n2 = t2.index + this.extraFieldsLength;
          for (this.extraFields || (this.extraFields = {}); t2.index + 4 < n2; )
            e2 = t2.readInt(2), r2 = t2.readInt(2), i2 = t2.readData(r2), this.extraFields[e2] = { id: e2, length: r2, value: i2 };
          t2.setIndex(n2);
        }, handleUTF8: function() {
          var t2 = u.uint8array ? "uint8array" : "array";
          if (this.useUTF8())
            this.fileNameStr = o.utf8decode(this.fileName), this.fileCommentStr = o.utf8decode(this.fileComment);
          else {
            var e2 = this.findExtraFieldUnicodePath();
            if (e2 !== null)
              this.fileNameStr = e2;
            else {
              var r2 = s2.transformTo(t2, this.fileName);
              this.fileNameStr = this.loadOptions.decodeFileName(r2);
            }
            var i2 = this.findExtraFieldUnicodeComment();
            if (i2 !== null)
              this.fileCommentStr = i2;
            else {
              var n2 = s2.transformTo(t2, this.fileComment);
              this.fileCommentStr = this.loadOptions.decodeFileName(n2);
            }
          }
        }, findExtraFieldUnicodePath: function() {
          var t2 = this.extraFields[28789];
          if (t2) {
            var e2 = i(t2.value);
            return e2.readInt(1) !== 1 ? null : a(this.fileName) !== e2.readInt(4) ? null : o.utf8decode(e2.readData(t2.length - 5));
          }
          return null;
        }, findExtraFieldUnicodeComment: function() {
          var t2 = this.extraFields[25461];
          if (t2) {
            var e2 = i(t2.value);
            return e2.readInt(1) !== 1 ? null : a(this.fileComment) !== e2.readInt(4) ? null : o.utf8decode(e2.readData(t2.length - 5));
          }
          return null;
        } }, e.exports = l;
      }, { "./compressedObject": 2, "./compressions": 3, "./crc32": 4, "./reader/readerFor": 22, "./support": 30, "./utf8": 31, "./utils": 32 }], 35: [function(t, e, r) {
        function i(t2, e2, r2) {
          this.name = t2, this.dir = r2.dir, this.date = r2.date, this.comment = r2.comment, this.unixPermissions = r2.unixPermissions, this.dosPermissions = r2.dosPermissions, this._data = e2, this._dataBinary = r2.binary, this.options = { compression: r2.compression, compressionOptions: r2.compressionOptions };
        }
        var s2 = t("./stream/StreamHelper"), n = t("./stream/DataWorker"), a = t("./utf8"), o = t("./compressedObject"), h2 = t("./stream/GenericWorker");
        i.prototype = { internalStream: function(t2) {
          var e2 = null, r2 = "string";
          try {
            if (!t2)
              throw new Error("No output type specified.");
            var i2 = (r2 = t2.toLowerCase()) === "string" || r2 === "text";
            r2 !== "binarystring" && r2 !== "text" || (r2 = "string"), e2 = this._decompressWorker();
            var n2 = !this._dataBinary;
            n2 && !i2 && (e2 = e2.pipe(new a.Utf8EncodeWorker())), !n2 && i2 && (e2 = e2.pipe(new a.Utf8DecodeWorker()));
          } catch (t3) {
            (e2 = new h2("error")).error(t3);
          }
          return new s2(e2, r2, "");
        }, async: function(t2, e2) {
          return this.internalStream(t2).accumulate(e2);
        }, nodeStream: function(t2, e2) {
          return this.internalStream(t2 || "nodebuffer").toNodejsStream(e2);
        }, _compressWorker: function(t2, e2) {
          if (this._data instanceof o && this._data.compression.magic === t2.magic)
            return this._data.getCompressedWorker();
          var r2 = this._decompressWorker();
          return this._dataBinary || (r2 = r2.pipe(new a.Utf8EncodeWorker())), o.createWorkerFrom(r2, t2, e2);
        }, _decompressWorker: function() {
          return this._data instanceof o ? this._data.getContentWorker() : this._data instanceof h2 ? this._data : new n(this._data);
        } };
        for (var u = ["asText", "asBinary", "asNodeBuffer", "asUint8Array", "asArrayBuffer"], l = function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, f = 0; f < u.length; f++)
          i.prototype[u[f]] = l;
        e.exports = i;
      }, { "./compressedObject": 2, "./stream/DataWorker": 27, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31 }], 36: [function(t, l, e) {
        (function(e2) {
          var r, i, t2 = e2.MutationObserver || e2.WebKitMutationObserver;
          if (t2) {
            var n = 0, s2 = new t2(u), a = e2.document.createTextNode("");
            s2.observe(a, { characterData: true }), r = function() {
              a.data = n = ++n % 2;
            };
          } else if (e2.setImmediate || e2.MessageChannel === void 0)
            r = "document" in e2 && "onreadystatechange" in e2.document.createElement("script") ? function() {
              var t3 = e2.document.createElement("script");
              t3.onreadystatechange = function() {
                u(), t3.onreadystatechange = null, t3.parentNode.removeChild(t3), t3 = null;
              }, e2.document.documentElement.appendChild(t3);
            } : function() {
              setTimeout(u, 0);
            };
          else {
            var o = new e2.MessageChannel();
            o.port1.onmessage = u, r = function() {
              o.port2.postMessage(0);
            };
          }
          var h2 = [];
          function u() {
            var t3, e3;
            i = true;
            for (var r2 = h2.length; r2; ) {
              for (e3 = h2, h2 = [], t3 = -1; ++t3 < r2; )
                e3[t3]();
              r2 = h2.length;
            }
            i = false;
          }
          l.exports = function(t3) {
            h2.push(t3) !== 1 || i || r();
          };
        }).call(this, typeof commonjsGlobal != "undefined" ? commonjsGlobal : typeof self != "undefined" ? self : typeof window != "undefined" ? window : {});
      }, {}], 37: [function(t, e, r) {
        var n = t("immediate");
        function u() {
        }
        var l = {}, s2 = ["REJECTED"], a = ["FULFILLED"], i = ["PENDING"];
        function o(t2) {
          if (typeof t2 != "function")
            throw new TypeError("resolver must be a function");
          this.state = i, this.queue = [], this.outcome = void 0, t2 !== u && c(this, t2);
        }
        function h2(t2, e2, r2) {
          this.promise = t2, typeof e2 == "function" && (this.onFulfilled = e2, this.callFulfilled = this.otherCallFulfilled), typeof r2 == "function" && (this.onRejected = r2, this.callRejected = this.otherCallRejected);
        }
        function f(e2, r2, i2) {
          n(function() {
            var t2;
            try {
              t2 = r2(i2);
            } catch (t3) {
              return l.reject(e2, t3);
            }
            t2 === e2 ? l.reject(e2, new TypeError("Cannot resolve promise with itself")) : l.resolve(e2, t2);
          });
        }
        function d2(t2) {
          var e2 = t2 && t2.then;
          if (t2 && (typeof t2 == "object" || typeof t2 == "function") && typeof e2 == "function")
            return function() {
              e2.apply(t2, arguments);
            };
        }
        function c(e2, t2) {
          var r2 = false;
          function i2(t3) {
            r2 || (r2 = true, l.reject(e2, t3));
          }
          function n2(t3) {
            r2 || (r2 = true, l.resolve(e2, t3));
          }
          var s3 = p(function() {
            t2(n2, i2);
          });
          s3.status === "error" && i2(s3.value);
        }
        function p(t2, e2) {
          var r2 = {};
          try {
            r2.value = t2(e2), r2.status = "success";
          } catch (t3) {
            r2.status = "error", r2.value = t3;
          }
          return r2;
        }
        (e.exports = o).prototype.finally = function(e2) {
          if (typeof e2 != "function")
            return this;
          var r2 = this.constructor;
          return this.then(function(t2) {
            return r2.resolve(e2()).then(function() {
              return t2;
            });
          }, function(t2) {
            return r2.resolve(e2()).then(function() {
              throw t2;
            });
          });
        }, o.prototype.catch = function(t2) {
          return this.then(null, t2);
        }, o.prototype.then = function(t2, e2) {
          if (typeof t2 != "function" && this.state === a || typeof e2 != "function" && this.state === s2)
            return this;
          var r2 = new this.constructor(u);
          this.state !== i ? f(r2, this.state === a ? t2 : e2, this.outcome) : this.queue.push(new h2(r2, t2, e2));
          return r2;
        }, h2.prototype.callFulfilled = function(t2) {
          l.resolve(this.promise, t2);
        }, h2.prototype.otherCallFulfilled = function(t2) {
          f(this.promise, this.onFulfilled, t2);
        }, h2.prototype.callRejected = function(t2) {
          l.reject(this.promise, t2);
        }, h2.prototype.otherCallRejected = function(t2) {
          f(this.promise, this.onRejected, t2);
        }, l.resolve = function(t2, e2) {
          var r2 = p(d2, e2);
          if (r2.status === "error")
            return l.reject(t2, r2.value);
          var i2 = r2.value;
          if (i2)
            c(t2, i2);
          else {
            t2.state = a, t2.outcome = e2;
            for (var n2 = -1, s3 = t2.queue.length; ++n2 < s3; )
              t2.queue[n2].callFulfilled(e2);
          }
          return t2;
        }, l.reject = function(t2, e2) {
          t2.state = s2, t2.outcome = e2;
          for (var r2 = -1, i2 = t2.queue.length; ++r2 < i2; )
            t2.queue[r2].callRejected(e2);
          return t2;
        }, o.resolve = function(t2) {
          if (t2 instanceof this)
            return t2;
          return l.resolve(new this(u), t2);
        }, o.reject = function(t2) {
          var e2 = new this(u);
          return l.reject(e2, t2);
        }, o.all = function(t2) {
          var r2 = this;
          if (Object.prototype.toString.call(t2) !== "[object Array]")
            return this.reject(new TypeError("must be an array"));
          var i2 = t2.length, n2 = false;
          if (!i2)
            return this.resolve([]);
          var s3 = new Array(i2), a2 = 0, e2 = -1, o2 = new this(u);
          for (; ++e2 < i2; )
            h3(t2[e2], e2);
          return o2;
          function h3(t3, e3) {
            r2.resolve(t3).then(function(t4) {
              s3[e3] = t4, ++a2 !== i2 || n2 || (n2 = true, l.resolve(o2, s3));
            }, function(t4) {
              n2 || (n2 = true, l.reject(o2, t4));
            });
          }
        }, o.race = function(t2) {
          var e2 = this;
          if (Object.prototype.toString.call(t2) !== "[object Array]")
            return this.reject(new TypeError("must be an array"));
          var r2 = t2.length, i2 = false;
          if (!r2)
            return this.resolve([]);
          var n2 = -1, s3 = new this(u);
          for (; ++n2 < r2; )
            a2 = t2[n2], e2.resolve(a2).then(function(t3) {
              i2 || (i2 = true, l.resolve(s3, t3));
            }, function(t3) {
              i2 || (i2 = true, l.reject(s3, t3));
            });
          var a2;
          return s3;
        };
      }, { immediate: 36 }], 38: [function(t, e, r) {
        var i = {};
        (0, t("./lib/utils/common").assign)(i, t("./lib/deflate"), t("./lib/inflate"), t("./lib/zlib/constants")), e.exports = i;
      }, { "./lib/deflate": 39, "./lib/inflate": 40, "./lib/utils/common": 41, "./lib/zlib/constants": 44 }], 39: [function(t, e, r) {
        var a = t("./zlib/deflate"), o = t("./utils/common"), h2 = t("./utils/strings"), n = t("./zlib/messages"), s2 = t("./zlib/zstream"), u = Object.prototype.toString, l = 0, f = -1, d2 = 0, c = 8;
        function p(t2) {
          if (!(this instanceof p))
            return new p(t2);
          this.options = o.assign({ level: f, method: c, chunkSize: 16384, windowBits: 15, memLevel: 8, strategy: d2, to: "" }, t2 || {});
          var e2 = this.options;
          e2.raw && 0 < e2.windowBits ? e2.windowBits = -e2.windowBits : e2.gzip && 0 < e2.windowBits && e2.windowBits < 16 && (e2.windowBits += 16), this.err = 0, this.msg = "", this.ended = false, this.chunks = [], this.strm = new s2(), this.strm.avail_out = 0;
          var r2 = a.deflateInit2(this.strm, e2.level, e2.method, e2.windowBits, e2.memLevel, e2.strategy);
          if (r2 !== l)
            throw new Error(n[r2]);
          if (e2.header && a.deflateSetHeader(this.strm, e2.header), e2.dictionary) {
            var i2;
            if (i2 = typeof e2.dictionary == "string" ? h2.string2buf(e2.dictionary) : u.call(e2.dictionary) === "[object ArrayBuffer]" ? new Uint8Array(e2.dictionary) : e2.dictionary, (r2 = a.deflateSetDictionary(this.strm, i2)) !== l)
              throw new Error(n[r2]);
            this._dict_set = true;
          }
        }
        function i(t2, e2) {
          var r2 = new p(e2);
          if (r2.push(t2, true), r2.err)
            throw r2.msg || n[r2.err];
          return r2.result;
        }
        p.prototype.push = function(t2, e2) {
          var r2, i2, n2 = this.strm, s3 = this.options.chunkSize;
          if (this.ended)
            return false;
          i2 = e2 === ~~e2 ? e2 : e2 === true ? 4 : 0, typeof t2 == "string" ? n2.input = h2.string2buf(t2) : u.call(t2) === "[object ArrayBuffer]" ? n2.input = new Uint8Array(t2) : n2.input = t2, n2.next_in = 0, n2.avail_in = n2.input.length;
          do {
            if (n2.avail_out === 0 && (n2.output = new o.Buf8(s3), n2.next_out = 0, n2.avail_out = s3), (r2 = a.deflate(n2, i2)) !== 1 && r2 !== l)
              return this.onEnd(r2), !(this.ended = true);
            n2.avail_out !== 0 && (n2.avail_in !== 0 || i2 !== 4 && i2 !== 2) || (this.options.to === "string" ? this.onData(h2.buf2binstring(o.shrinkBuf(n2.output, n2.next_out))) : this.onData(o.shrinkBuf(n2.output, n2.next_out)));
          } while ((0 < n2.avail_in || n2.avail_out === 0) && r2 !== 1);
          return i2 === 4 ? (r2 = a.deflateEnd(this.strm), this.onEnd(r2), this.ended = true, r2 === l) : i2 !== 2 || (this.onEnd(l), !(n2.avail_out = 0));
        }, p.prototype.onData = function(t2) {
          this.chunks.push(t2);
        }, p.prototype.onEnd = function(t2) {
          t2 === l && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = o.flattenChunks(this.chunks)), this.chunks = [], this.err = t2, this.msg = this.strm.msg;
        }, r.Deflate = p, r.deflate = i, r.deflateRaw = function(t2, e2) {
          return (e2 = e2 || {}).raw = true, i(t2, e2);
        }, r.gzip = function(t2, e2) {
          return (e2 = e2 || {}).gzip = true, i(t2, e2);
        };
      }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/deflate": 46, "./zlib/messages": 51, "./zlib/zstream": 53 }], 40: [function(t, e, r) {
        var d2 = t("./zlib/inflate"), c = t("./utils/common"), p = t("./utils/strings"), m2 = t("./zlib/constants"), i = t("./zlib/messages"), n = t("./zlib/zstream"), s2 = t("./zlib/gzheader"), _ = Object.prototype.toString;
        function a(t2) {
          if (!(this instanceof a))
            return new a(t2);
          this.options = c.assign({ chunkSize: 16384, windowBits: 0, to: "" }, t2 || {});
          var e2 = this.options;
          e2.raw && 0 <= e2.windowBits && e2.windowBits < 16 && (e2.windowBits = -e2.windowBits, e2.windowBits === 0 && (e2.windowBits = -15)), !(0 <= e2.windowBits && e2.windowBits < 16) || t2 && t2.windowBits || (e2.windowBits += 32), 15 < e2.windowBits && e2.windowBits < 48 && (15 & e2.windowBits) == 0 && (e2.windowBits |= 15), this.err = 0, this.msg = "", this.ended = false, this.chunks = [], this.strm = new n(), this.strm.avail_out = 0;
          var r2 = d2.inflateInit2(this.strm, e2.windowBits);
          if (r2 !== m2.Z_OK)
            throw new Error(i[r2]);
          this.header = new s2(), d2.inflateGetHeader(this.strm, this.header);
        }
        function o(t2, e2) {
          var r2 = new a(e2);
          if (r2.push(t2, true), r2.err)
            throw r2.msg || i[r2.err];
          return r2.result;
        }
        a.prototype.push = function(t2, e2) {
          var r2, i2, n2, s3, a2, o2, h2 = this.strm, u = this.options.chunkSize, l = this.options.dictionary, f = false;
          if (this.ended)
            return false;
          i2 = e2 === ~~e2 ? e2 : e2 === true ? m2.Z_FINISH : m2.Z_NO_FLUSH, typeof t2 == "string" ? h2.input = p.binstring2buf(t2) : _.call(t2) === "[object ArrayBuffer]" ? h2.input = new Uint8Array(t2) : h2.input = t2, h2.next_in = 0, h2.avail_in = h2.input.length;
          do {
            if (h2.avail_out === 0 && (h2.output = new c.Buf8(u), h2.next_out = 0, h2.avail_out = u), (r2 = d2.inflate(h2, m2.Z_NO_FLUSH)) === m2.Z_NEED_DICT && l && (o2 = typeof l == "string" ? p.string2buf(l) : _.call(l) === "[object ArrayBuffer]" ? new Uint8Array(l) : l, r2 = d2.inflateSetDictionary(this.strm, o2)), r2 === m2.Z_BUF_ERROR && f === true && (r2 = m2.Z_OK, f = false), r2 !== m2.Z_STREAM_END && r2 !== m2.Z_OK)
              return this.onEnd(r2), !(this.ended = true);
            h2.next_out && (h2.avail_out !== 0 && r2 !== m2.Z_STREAM_END && (h2.avail_in !== 0 || i2 !== m2.Z_FINISH && i2 !== m2.Z_SYNC_FLUSH) || (this.options.to === "string" ? (n2 = p.utf8border(h2.output, h2.next_out), s3 = h2.next_out - n2, a2 = p.buf2string(h2.output, n2), h2.next_out = s3, h2.avail_out = u - s3, s3 && c.arraySet(h2.output, h2.output, n2, s3, 0), this.onData(a2)) : this.onData(c.shrinkBuf(h2.output, h2.next_out)))), h2.avail_in === 0 && h2.avail_out === 0 && (f = true);
          } while ((0 < h2.avail_in || h2.avail_out === 0) && r2 !== m2.Z_STREAM_END);
          return r2 === m2.Z_STREAM_END && (i2 = m2.Z_FINISH), i2 === m2.Z_FINISH ? (r2 = d2.inflateEnd(this.strm), this.onEnd(r2), this.ended = true, r2 === m2.Z_OK) : i2 !== m2.Z_SYNC_FLUSH || (this.onEnd(m2.Z_OK), !(h2.avail_out = 0));
        }, a.prototype.onData = function(t2) {
          this.chunks.push(t2);
        }, a.prototype.onEnd = function(t2) {
          t2 === m2.Z_OK && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = c.flattenChunks(this.chunks)), this.chunks = [], this.err = t2, this.msg = this.strm.msg;
        }, r.Inflate = a, r.inflate = o, r.inflateRaw = function(t2, e2) {
          return (e2 = e2 || {}).raw = true, o(t2, e2);
        }, r.ungzip = o;
      }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/constants": 44, "./zlib/gzheader": 47, "./zlib/inflate": 49, "./zlib/messages": 51, "./zlib/zstream": 53 }], 41: [function(t, e, r) {
        var i = typeof Uint8Array != "undefined" && typeof Uint16Array != "undefined" && typeof Int32Array != "undefined";
        r.assign = function(t2) {
          for (var e2 = Array.prototype.slice.call(arguments, 1); e2.length; ) {
            var r2 = e2.shift();
            if (r2) {
              if (typeof r2 != "object")
                throw new TypeError(r2 + "must be non-object");
              for (var i2 in r2)
                r2.hasOwnProperty(i2) && (t2[i2] = r2[i2]);
            }
          }
          return t2;
        }, r.shrinkBuf = function(t2, e2) {
          return t2.length === e2 ? t2 : t2.subarray ? t2.subarray(0, e2) : (t2.length = e2, t2);
        };
        var n = { arraySet: function(t2, e2, r2, i2, n2) {
          if (e2.subarray && t2.subarray)
            t2.set(e2.subarray(r2, r2 + i2), n2);
          else
            for (var s3 = 0; s3 < i2; s3++)
              t2[n2 + s3] = e2[r2 + s3];
        }, flattenChunks: function(t2) {
          var e2, r2, i2, n2, s3, a;
          for (e2 = i2 = 0, r2 = t2.length; e2 < r2; e2++)
            i2 += t2[e2].length;
          for (a = new Uint8Array(i2), e2 = n2 = 0, r2 = t2.length; e2 < r2; e2++)
            s3 = t2[e2], a.set(s3, n2), n2 += s3.length;
          return a;
        } }, s2 = { arraySet: function(t2, e2, r2, i2, n2) {
          for (var s3 = 0; s3 < i2; s3++)
            t2[n2 + s3] = e2[r2 + s3];
        }, flattenChunks: function(t2) {
          return [].concat.apply([], t2);
        } };
        r.setTyped = function(t2) {
          t2 ? (r.Buf8 = Uint8Array, r.Buf16 = Uint16Array, r.Buf32 = Int32Array, r.assign(r, n)) : (r.Buf8 = Array, r.Buf16 = Array, r.Buf32 = Array, r.assign(r, s2));
        }, r.setTyped(i);
      }, {}], 42: [function(t, e, r) {
        var h2 = t("./common"), n = true, s2 = true;
        try {
          String.fromCharCode.apply(null, [0]);
        } catch (t2) {
          n = false;
        }
        try {
          String.fromCharCode.apply(null, new Uint8Array(1));
        } catch (t2) {
          s2 = false;
        }
        for (var u = new h2.Buf8(256), i = 0; i < 256; i++)
          u[i] = 252 <= i ? 6 : 248 <= i ? 5 : 240 <= i ? 4 : 224 <= i ? 3 : 192 <= i ? 2 : 1;
        function l(t2, e2) {
          if (e2 < 65537 && (t2.subarray && s2 || !t2.subarray && n))
            return String.fromCharCode.apply(null, h2.shrinkBuf(t2, e2));
          for (var r2 = "", i2 = 0; i2 < e2; i2++)
            r2 += String.fromCharCode(t2[i2]);
          return r2;
        }
        u[254] = u[254] = 1, r.string2buf = function(t2) {
          var e2, r2, i2, n2, s3, a = t2.length, o = 0;
          for (n2 = 0; n2 < a; n2++)
            (64512 & (r2 = t2.charCodeAt(n2))) == 55296 && n2 + 1 < a && (64512 & (i2 = t2.charCodeAt(n2 + 1))) == 56320 && (r2 = 65536 + (r2 - 55296 << 10) + (i2 - 56320), n2++), o += r2 < 128 ? 1 : r2 < 2048 ? 2 : r2 < 65536 ? 3 : 4;
          for (e2 = new h2.Buf8(o), n2 = s3 = 0; s3 < o; n2++)
            (64512 & (r2 = t2.charCodeAt(n2))) == 55296 && n2 + 1 < a && (64512 & (i2 = t2.charCodeAt(n2 + 1))) == 56320 && (r2 = 65536 + (r2 - 55296 << 10) + (i2 - 56320), n2++), r2 < 128 ? e2[s3++] = r2 : (r2 < 2048 ? e2[s3++] = 192 | r2 >>> 6 : (r2 < 65536 ? e2[s3++] = 224 | r2 >>> 12 : (e2[s3++] = 240 | r2 >>> 18, e2[s3++] = 128 | r2 >>> 12 & 63), e2[s3++] = 128 | r2 >>> 6 & 63), e2[s3++] = 128 | 63 & r2);
          return e2;
        }, r.buf2binstring = function(t2) {
          return l(t2, t2.length);
        }, r.binstring2buf = function(t2) {
          for (var e2 = new h2.Buf8(t2.length), r2 = 0, i2 = e2.length; r2 < i2; r2++)
            e2[r2] = t2.charCodeAt(r2);
          return e2;
        }, r.buf2string = function(t2, e2) {
          var r2, i2, n2, s3, a = e2 || t2.length, o = new Array(2 * a);
          for (r2 = i2 = 0; r2 < a; )
            if ((n2 = t2[r2++]) < 128)
              o[i2++] = n2;
            else if (4 < (s3 = u[n2]))
              o[i2++] = 65533, r2 += s3 - 1;
            else {
              for (n2 &= s3 === 2 ? 31 : s3 === 3 ? 15 : 7; 1 < s3 && r2 < a; )
                n2 = n2 << 6 | 63 & t2[r2++], s3--;
              1 < s3 ? o[i2++] = 65533 : n2 < 65536 ? o[i2++] = n2 : (n2 -= 65536, o[i2++] = 55296 | n2 >> 10 & 1023, o[i2++] = 56320 | 1023 & n2);
            }
          return l(o, i2);
        }, r.utf8border = function(t2, e2) {
          var r2;
          for ((e2 = e2 || t2.length) > t2.length && (e2 = t2.length), r2 = e2 - 1; 0 <= r2 && (192 & t2[r2]) == 128; )
            r2--;
          return r2 < 0 ? e2 : r2 === 0 ? e2 : r2 + u[t2[r2]] > e2 ? r2 : e2;
        };
      }, { "./common": 41 }], 43: [function(t, e, r) {
        e.exports = function(t2, e2, r2, i) {
          for (var n = 65535 & t2 | 0, s2 = t2 >>> 16 & 65535 | 0, a = 0; r2 !== 0; ) {
            for (r2 -= a = 2e3 < r2 ? 2e3 : r2; s2 = s2 + (n = n + e2[i++] | 0) | 0, --a; )
              ;
            n %= 65521, s2 %= 65521;
          }
          return n | s2 << 16 | 0;
        };
      }, {}], 44: [function(t, e, r) {
        e.exports = { Z_NO_FLUSH: 0, Z_PARTIAL_FLUSH: 1, Z_SYNC_FLUSH: 2, Z_FULL_FLUSH: 3, Z_FINISH: 4, Z_BLOCK: 5, Z_TREES: 6, Z_OK: 0, Z_STREAM_END: 1, Z_NEED_DICT: 2, Z_ERRNO: -1, Z_STREAM_ERROR: -2, Z_DATA_ERROR: -3, Z_BUF_ERROR: -5, Z_NO_COMPRESSION: 0, Z_BEST_SPEED: 1, Z_BEST_COMPRESSION: 9, Z_DEFAULT_COMPRESSION: -1, Z_FILTERED: 1, Z_HUFFMAN_ONLY: 2, Z_RLE: 3, Z_FIXED: 4, Z_DEFAULT_STRATEGY: 0, Z_BINARY: 0, Z_TEXT: 1, Z_UNKNOWN: 2, Z_DEFLATED: 8 };
      }, {}], 45: [function(t, e, r) {
        var o = function() {
          for (var t2, e2 = [], r2 = 0; r2 < 256; r2++) {
            t2 = r2;
            for (var i = 0; i < 8; i++)
              t2 = 1 & t2 ? 3988292384 ^ t2 >>> 1 : t2 >>> 1;
            e2[r2] = t2;
          }
          return e2;
        }();
        e.exports = function(t2, e2, r2, i) {
          var n = o, s2 = i + r2;
          t2 ^= -1;
          for (var a = i; a < s2; a++)
            t2 = t2 >>> 8 ^ n[255 & (t2 ^ e2[a])];
          return -1 ^ t2;
        };
      }, {}], 46: [function(t, e, r) {
        var h2, d2 = t("../utils/common"), u = t("./trees"), c = t("./adler32"), p = t("./crc32"), i = t("./messages"), l = 0, f = 4, m2 = 0, _ = -2, g = -1, b = 4, n = 2, v = 8, y2 = 9, s2 = 286, a = 30, o = 19, w = 2 * s2 + 1, k = 15, x = 3, S = 258, z = S + x + 1, C = 42, E = 113, A = 1, I = 2, O = 3, B = 4;
        function R(t2, e2) {
          return t2.msg = i[e2], e2;
        }
        function T(t2) {
          return (t2 << 1) - (4 < t2 ? 9 : 0);
        }
        function D(t2) {
          for (var e2 = t2.length; 0 <= --e2; )
            t2[e2] = 0;
        }
        function F(t2) {
          var e2 = t2.state, r2 = e2.pending;
          r2 > t2.avail_out && (r2 = t2.avail_out), r2 !== 0 && (d2.arraySet(t2.output, e2.pending_buf, e2.pending_out, r2, t2.next_out), t2.next_out += r2, e2.pending_out += r2, t2.total_out += r2, t2.avail_out -= r2, e2.pending -= r2, e2.pending === 0 && (e2.pending_out = 0));
        }
        function N(t2, e2) {
          u._tr_flush_block(t2, 0 <= t2.block_start ? t2.block_start : -1, t2.strstart - t2.block_start, e2), t2.block_start = t2.strstart, F(t2.strm);
        }
        function U(t2, e2) {
          t2.pending_buf[t2.pending++] = e2;
        }
        function P(t2, e2) {
          t2.pending_buf[t2.pending++] = e2 >>> 8 & 255, t2.pending_buf[t2.pending++] = 255 & e2;
        }
        function L(t2, e2) {
          var r2, i2, n2 = t2.max_chain_length, s3 = t2.strstart, a2 = t2.prev_length, o2 = t2.nice_match, h3 = t2.strstart > t2.w_size - z ? t2.strstart - (t2.w_size - z) : 0, u2 = t2.window, l2 = t2.w_mask, f2 = t2.prev, d3 = t2.strstart + S, c2 = u2[s3 + a2 - 1], p2 = u2[s3 + a2];
          t2.prev_length >= t2.good_match && (n2 >>= 2), o2 > t2.lookahead && (o2 = t2.lookahead);
          do {
            if (u2[(r2 = e2) + a2] === p2 && u2[r2 + a2 - 1] === c2 && u2[r2] === u2[s3] && u2[++r2] === u2[s3 + 1]) {
              s3 += 2, r2++;
              do {
              } while (u2[++s3] === u2[++r2] && u2[++s3] === u2[++r2] && u2[++s3] === u2[++r2] && u2[++s3] === u2[++r2] && u2[++s3] === u2[++r2] && u2[++s3] === u2[++r2] && u2[++s3] === u2[++r2] && u2[++s3] === u2[++r2] && s3 < d3);
              if (i2 = S - (d3 - s3), s3 = d3 - S, a2 < i2) {
                if (t2.match_start = e2, o2 <= (a2 = i2))
                  break;
                c2 = u2[s3 + a2 - 1], p2 = u2[s3 + a2];
              }
            }
          } while ((e2 = f2[e2 & l2]) > h3 && --n2 != 0);
          return a2 <= t2.lookahead ? a2 : t2.lookahead;
        }
        function j(t2) {
          var e2, r2, i2, n2, s3, a2, o2, h3, u2, l2, f2 = t2.w_size;
          do {
            if (n2 = t2.window_size - t2.lookahead - t2.strstart, t2.strstart >= f2 + (f2 - z)) {
              for (d2.arraySet(t2.window, t2.window, f2, f2, 0), t2.match_start -= f2, t2.strstart -= f2, t2.block_start -= f2, e2 = r2 = t2.hash_size; i2 = t2.head[--e2], t2.head[e2] = f2 <= i2 ? i2 - f2 : 0, --r2; )
                ;
              for (e2 = r2 = f2; i2 = t2.prev[--e2], t2.prev[e2] = f2 <= i2 ? i2 - f2 : 0, --r2; )
                ;
              n2 += f2;
            }
            if (t2.strm.avail_in === 0)
              break;
            if (a2 = t2.strm, o2 = t2.window, h3 = t2.strstart + t2.lookahead, u2 = n2, l2 = void 0, l2 = a2.avail_in, u2 < l2 && (l2 = u2), r2 = l2 === 0 ? 0 : (a2.avail_in -= l2, d2.arraySet(o2, a2.input, a2.next_in, l2, h3), a2.state.wrap === 1 ? a2.adler = c(a2.adler, o2, l2, h3) : a2.state.wrap === 2 && (a2.adler = p(a2.adler, o2, l2, h3)), a2.next_in += l2, a2.total_in += l2, l2), t2.lookahead += r2, t2.lookahead + t2.insert >= x)
              for (s3 = t2.strstart - t2.insert, t2.ins_h = t2.window[s3], t2.ins_h = (t2.ins_h << t2.hash_shift ^ t2.window[s3 + 1]) & t2.hash_mask; t2.insert && (t2.ins_h = (t2.ins_h << t2.hash_shift ^ t2.window[s3 + x - 1]) & t2.hash_mask, t2.prev[s3 & t2.w_mask] = t2.head[t2.ins_h], t2.head[t2.ins_h] = s3, s3++, t2.insert--, !(t2.lookahead + t2.insert < x)); )
                ;
          } while (t2.lookahead < z && t2.strm.avail_in !== 0);
        }
        function Z(t2, e2) {
          for (var r2, i2; ; ) {
            if (t2.lookahead < z) {
              if (j(t2), t2.lookahead < z && e2 === l)
                return A;
              if (t2.lookahead === 0)
                break;
            }
            if (r2 = 0, t2.lookahead >= x && (t2.ins_h = (t2.ins_h << t2.hash_shift ^ t2.window[t2.strstart + x - 1]) & t2.hash_mask, r2 = t2.prev[t2.strstart & t2.w_mask] = t2.head[t2.ins_h], t2.head[t2.ins_h] = t2.strstart), r2 !== 0 && t2.strstart - r2 <= t2.w_size - z && (t2.match_length = L(t2, r2)), t2.match_length >= x)
              if (i2 = u._tr_tally(t2, t2.strstart - t2.match_start, t2.match_length - x), t2.lookahead -= t2.match_length, t2.match_length <= t2.max_lazy_match && t2.lookahead >= x) {
                for (t2.match_length--; t2.strstart++, t2.ins_h = (t2.ins_h << t2.hash_shift ^ t2.window[t2.strstart + x - 1]) & t2.hash_mask, r2 = t2.prev[t2.strstart & t2.w_mask] = t2.head[t2.ins_h], t2.head[t2.ins_h] = t2.strstart, --t2.match_length != 0; )
                  ;
                t2.strstart++;
              } else
                t2.strstart += t2.match_length, t2.match_length = 0, t2.ins_h = t2.window[t2.strstart], t2.ins_h = (t2.ins_h << t2.hash_shift ^ t2.window[t2.strstart + 1]) & t2.hash_mask;
            else
              i2 = u._tr_tally(t2, 0, t2.window[t2.strstart]), t2.lookahead--, t2.strstart++;
            if (i2 && (N(t2, false), t2.strm.avail_out === 0))
              return A;
          }
          return t2.insert = t2.strstart < x - 1 ? t2.strstart : x - 1, e2 === f ? (N(t2, true), t2.strm.avail_out === 0 ? O : B) : t2.last_lit && (N(t2, false), t2.strm.avail_out === 0) ? A : I;
        }
        function W(t2, e2) {
          for (var r2, i2, n2; ; ) {
            if (t2.lookahead < z) {
              if (j(t2), t2.lookahead < z && e2 === l)
                return A;
              if (t2.lookahead === 0)
                break;
            }
            if (r2 = 0, t2.lookahead >= x && (t2.ins_h = (t2.ins_h << t2.hash_shift ^ t2.window[t2.strstart + x - 1]) & t2.hash_mask, r2 = t2.prev[t2.strstart & t2.w_mask] = t2.head[t2.ins_h], t2.head[t2.ins_h] = t2.strstart), t2.prev_length = t2.match_length, t2.prev_match = t2.match_start, t2.match_length = x - 1, r2 !== 0 && t2.prev_length < t2.max_lazy_match && t2.strstart - r2 <= t2.w_size - z && (t2.match_length = L(t2, r2), t2.match_length <= 5 && (t2.strategy === 1 || t2.match_length === x && 4096 < t2.strstart - t2.match_start) && (t2.match_length = x - 1)), t2.prev_length >= x && t2.match_length <= t2.prev_length) {
              for (n2 = t2.strstart + t2.lookahead - x, i2 = u._tr_tally(t2, t2.strstart - 1 - t2.prev_match, t2.prev_length - x), t2.lookahead -= t2.prev_length - 1, t2.prev_length -= 2; ++t2.strstart <= n2 && (t2.ins_h = (t2.ins_h << t2.hash_shift ^ t2.window[t2.strstart + x - 1]) & t2.hash_mask, r2 = t2.prev[t2.strstart & t2.w_mask] = t2.head[t2.ins_h], t2.head[t2.ins_h] = t2.strstart), --t2.prev_length != 0; )
                ;
              if (t2.match_available = 0, t2.match_length = x - 1, t2.strstart++, i2 && (N(t2, false), t2.strm.avail_out === 0))
                return A;
            } else if (t2.match_available) {
              if ((i2 = u._tr_tally(t2, 0, t2.window[t2.strstart - 1])) && N(t2, false), t2.strstart++, t2.lookahead--, t2.strm.avail_out === 0)
                return A;
            } else
              t2.match_available = 1, t2.strstart++, t2.lookahead--;
          }
          return t2.match_available && (i2 = u._tr_tally(t2, 0, t2.window[t2.strstart - 1]), t2.match_available = 0), t2.insert = t2.strstart < x - 1 ? t2.strstart : x - 1, e2 === f ? (N(t2, true), t2.strm.avail_out === 0 ? O : B) : t2.last_lit && (N(t2, false), t2.strm.avail_out === 0) ? A : I;
        }
        function M(t2, e2, r2, i2, n2) {
          this.good_length = t2, this.max_lazy = e2, this.nice_length = r2, this.max_chain = i2, this.func = n2;
        }
        function H() {
          this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = v, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new d2.Buf16(2 * w), this.dyn_dtree = new d2.Buf16(2 * (2 * a + 1)), this.bl_tree = new d2.Buf16(2 * (2 * o + 1)), D(this.dyn_ltree), D(this.dyn_dtree), D(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new d2.Buf16(k + 1), this.heap = new d2.Buf16(2 * s2 + 1), D(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new d2.Buf16(2 * s2 + 1), D(this.depth), this.l_buf = 0, this.lit_bufsize = 0, this.last_lit = 0, this.d_buf = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
        }
        function G(t2) {
          var e2;
          return t2 && t2.state ? (t2.total_in = t2.total_out = 0, t2.data_type = n, (e2 = t2.state).pending = 0, e2.pending_out = 0, e2.wrap < 0 && (e2.wrap = -e2.wrap), e2.status = e2.wrap ? C : E, t2.adler = e2.wrap === 2 ? 0 : 1, e2.last_flush = l, u._tr_init(e2), m2) : R(t2, _);
        }
        function K(t2) {
          var e2 = G(t2);
          return e2 === m2 && function(t3) {
            t3.window_size = 2 * t3.w_size, D(t3.head), t3.max_lazy_match = h2[t3.level].max_lazy, t3.good_match = h2[t3.level].good_length, t3.nice_match = h2[t3.level].nice_length, t3.max_chain_length = h2[t3.level].max_chain, t3.strstart = 0, t3.block_start = 0, t3.lookahead = 0, t3.insert = 0, t3.match_length = t3.prev_length = x - 1, t3.match_available = 0, t3.ins_h = 0;
          }(t2.state), e2;
        }
        function Y(t2, e2, r2, i2, n2, s3) {
          if (!t2)
            return _;
          var a2 = 1;
          if (e2 === g && (e2 = 6), i2 < 0 ? (a2 = 0, i2 = -i2) : 15 < i2 && (a2 = 2, i2 -= 16), n2 < 1 || y2 < n2 || r2 !== v || i2 < 8 || 15 < i2 || e2 < 0 || 9 < e2 || s3 < 0 || b < s3)
            return R(t2, _);
          i2 === 8 && (i2 = 9);
          var o2 = new H();
          return (t2.state = o2).strm = t2, o2.wrap = a2, o2.gzhead = null, o2.w_bits = i2, o2.w_size = 1 << o2.w_bits, o2.w_mask = o2.w_size - 1, o2.hash_bits = n2 + 7, o2.hash_size = 1 << o2.hash_bits, o2.hash_mask = o2.hash_size - 1, o2.hash_shift = ~~((o2.hash_bits + x - 1) / x), o2.window = new d2.Buf8(2 * o2.w_size), o2.head = new d2.Buf16(o2.hash_size), o2.prev = new d2.Buf16(o2.w_size), o2.lit_bufsize = 1 << n2 + 6, o2.pending_buf_size = 4 * o2.lit_bufsize, o2.pending_buf = new d2.Buf8(o2.pending_buf_size), o2.d_buf = 1 * o2.lit_bufsize, o2.l_buf = 3 * o2.lit_bufsize, o2.level = e2, o2.strategy = s3, o2.method = r2, K(t2);
        }
        h2 = [new M(0, 0, 0, 0, function(t2, e2) {
          var r2 = 65535;
          for (r2 > t2.pending_buf_size - 5 && (r2 = t2.pending_buf_size - 5); ; ) {
            if (t2.lookahead <= 1) {
              if (j(t2), t2.lookahead === 0 && e2 === l)
                return A;
              if (t2.lookahead === 0)
                break;
            }
            t2.strstart += t2.lookahead, t2.lookahead = 0;
            var i2 = t2.block_start + r2;
            if ((t2.strstart === 0 || t2.strstart >= i2) && (t2.lookahead = t2.strstart - i2, t2.strstart = i2, N(t2, false), t2.strm.avail_out === 0))
              return A;
            if (t2.strstart - t2.block_start >= t2.w_size - z && (N(t2, false), t2.strm.avail_out === 0))
              return A;
          }
          return t2.insert = 0, e2 === f ? (N(t2, true), t2.strm.avail_out === 0 ? O : B) : (t2.strstart > t2.block_start && (N(t2, false), t2.strm.avail_out), A);
        }), new M(4, 4, 8, 4, Z), new M(4, 5, 16, 8, Z), new M(4, 6, 32, 32, Z), new M(4, 4, 16, 16, W), new M(8, 16, 32, 32, W), new M(8, 16, 128, 128, W), new M(8, 32, 128, 256, W), new M(32, 128, 258, 1024, W), new M(32, 258, 258, 4096, W)], r.deflateInit = function(t2, e2) {
          return Y(t2, e2, v, 15, 8, 0);
        }, r.deflateInit2 = Y, r.deflateReset = K, r.deflateResetKeep = G, r.deflateSetHeader = function(t2, e2) {
          return t2 && t2.state ? t2.state.wrap !== 2 ? _ : (t2.state.gzhead = e2, m2) : _;
        }, r.deflate = function(t2, e2) {
          var r2, i2, n2, s3;
          if (!t2 || !t2.state || 5 < e2 || e2 < 0)
            return t2 ? R(t2, _) : _;
          if (i2 = t2.state, !t2.output || !t2.input && t2.avail_in !== 0 || i2.status === 666 && e2 !== f)
            return R(t2, t2.avail_out === 0 ? -5 : _);
          if (i2.strm = t2, r2 = i2.last_flush, i2.last_flush = e2, i2.status === C)
            if (i2.wrap === 2)
              t2.adler = 0, U(i2, 31), U(i2, 139), U(i2, 8), i2.gzhead ? (U(i2, (i2.gzhead.text ? 1 : 0) + (i2.gzhead.hcrc ? 2 : 0) + (i2.gzhead.extra ? 4 : 0) + (i2.gzhead.name ? 8 : 0) + (i2.gzhead.comment ? 16 : 0)), U(i2, 255 & i2.gzhead.time), U(i2, i2.gzhead.time >> 8 & 255), U(i2, i2.gzhead.time >> 16 & 255), U(i2, i2.gzhead.time >> 24 & 255), U(i2, i2.level === 9 ? 2 : 2 <= i2.strategy || i2.level < 2 ? 4 : 0), U(i2, 255 & i2.gzhead.os), i2.gzhead.extra && i2.gzhead.extra.length && (U(i2, 255 & i2.gzhead.extra.length), U(i2, i2.gzhead.extra.length >> 8 & 255)), i2.gzhead.hcrc && (t2.adler = p(t2.adler, i2.pending_buf, i2.pending, 0)), i2.gzindex = 0, i2.status = 69) : (U(i2, 0), U(i2, 0), U(i2, 0), U(i2, 0), U(i2, 0), U(i2, i2.level === 9 ? 2 : 2 <= i2.strategy || i2.level < 2 ? 4 : 0), U(i2, 3), i2.status = E);
            else {
              var a2 = v + (i2.w_bits - 8 << 4) << 8;
              a2 |= (2 <= i2.strategy || i2.level < 2 ? 0 : i2.level < 6 ? 1 : i2.level === 6 ? 2 : 3) << 6, i2.strstart !== 0 && (a2 |= 32), a2 += 31 - a2 % 31, i2.status = E, P(i2, a2), i2.strstart !== 0 && (P(i2, t2.adler >>> 16), P(i2, 65535 & t2.adler)), t2.adler = 1;
            }
          if (i2.status === 69)
            if (i2.gzhead.extra) {
              for (n2 = i2.pending; i2.gzindex < (65535 & i2.gzhead.extra.length) && (i2.pending !== i2.pending_buf_size || (i2.gzhead.hcrc && i2.pending > n2 && (t2.adler = p(t2.adler, i2.pending_buf, i2.pending - n2, n2)), F(t2), n2 = i2.pending, i2.pending !== i2.pending_buf_size)); )
                U(i2, 255 & i2.gzhead.extra[i2.gzindex]), i2.gzindex++;
              i2.gzhead.hcrc && i2.pending > n2 && (t2.adler = p(t2.adler, i2.pending_buf, i2.pending - n2, n2)), i2.gzindex === i2.gzhead.extra.length && (i2.gzindex = 0, i2.status = 73);
            } else
              i2.status = 73;
          if (i2.status === 73)
            if (i2.gzhead.name) {
              n2 = i2.pending;
              do {
                if (i2.pending === i2.pending_buf_size && (i2.gzhead.hcrc && i2.pending > n2 && (t2.adler = p(t2.adler, i2.pending_buf, i2.pending - n2, n2)), F(t2), n2 = i2.pending, i2.pending === i2.pending_buf_size)) {
                  s3 = 1;
                  break;
                }
                s3 = i2.gzindex < i2.gzhead.name.length ? 255 & i2.gzhead.name.charCodeAt(i2.gzindex++) : 0, U(i2, s3);
              } while (s3 !== 0);
              i2.gzhead.hcrc && i2.pending > n2 && (t2.adler = p(t2.adler, i2.pending_buf, i2.pending - n2, n2)), s3 === 0 && (i2.gzindex = 0, i2.status = 91);
            } else
              i2.status = 91;
          if (i2.status === 91)
            if (i2.gzhead.comment) {
              n2 = i2.pending;
              do {
                if (i2.pending === i2.pending_buf_size && (i2.gzhead.hcrc && i2.pending > n2 && (t2.adler = p(t2.adler, i2.pending_buf, i2.pending - n2, n2)), F(t2), n2 = i2.pending, i2.pending === i2.pending_buf_size)) {
                  s3 = 1;
                  break;
                }
                s3 = i2.gzindex < i2.gzhead.comment.length ? 255 & i2.gzhead.comment.charCodeAt(i2.gzindex++) : 0, U(i2, s3);
              } while (s3 !== 0);
              i2.gzhead.hcrc && i2.pending > n2 && (t2.adler = p(t2.adler, i2.pending_buf, i2.pending - n2, n2)), s3 === 0 && (i2.status = 103);
            } else
              i2.status = 103;
          if (i2.status === 103 && (i2.gzhead.hcrc ? (i2.pending + 2 > i2.pending_buf_size && F(t2), i2.pending + 2 <= i2.pending_buf_size && (U(i2, 255 & t2.adler), U(i2, t2.adler >> 8 & 255), t2.adler = 0, i2.status = E)) : i2.status = E), i2.pending !== 0) {
            if (F(t2), t2.avail_out === 0)
              return i2.last_flush = -1, m2;
          } else if (t2.avail_in === 0 && T(e2) <= T(r2) && e2 !== f)
            return R(t2, -5);
          if (i2.status === 666 && t2.avail_in !== 0)
            return R(t2, -5);
          if (t2.avail_in !== 0 || i2.lookahead !== 0 || e2 !== l && i2.status !== 666) {
            var o2 = i2.strategy === 2 ? function(t3, e3) {
              for (var r3; ; ) {
                if (t3.lookahead === 0 && (j(t3), t3.lookahead === 0)) {
                  if (e3 === l)
                    return A;
                  break;
                }
                if (t3.match_length = 0, r3 = u._tr_tally(t3, 0, t3.window[t3.strstart]), t3.lookahead--, t3.strstart++, r3 && (N(t3, false), t3.strm.avail_out === 0))
                  return A;
              }
              return t3.insert = 0, e3 === f ? (N(t3, true), t3.strm.avail_out === 0 ? O : B) : t3.last_lit && (N(t3, false), t3.strm.avail_out === 0) ? A : I;
            }(i2, e2) : i2.strategy === 3 ? function(t3, e3) {
              for (var r3, i3, n3, s4, a3 = t3.window; ; ) {
                if (t3.lookahead <= S) {
                  if (j(t3), t3.lookahead <= S && e3 === l)
                    return A;
                  if (t3.lookahead === 0)
                    break;
                }
                if (t3.match_length = 0, t3.lookahead >= x && 0 < t3.strstart && (i3 = a3[n3 = t3.strstart - 1]) === a3[++n3] && i3 === a3[++n3] && i3 === a3[++n3]) {
                  s4 = t3.strstart + S;
                  do {
                  } while (i3 === a3[++n3] && i3 === a3[++n3] && i3 === a3[++n3] && i3 === a3[++n3] && i3 === a3[++n3] && i3 === a3[++n3] && i3 === a3[++n3] && i3 === a3[++n3] && n3 < s4);
                  t3.match_length = S - (s4 - n3), t3.match_length > t3.lookahead && (t3.match_length = t3.lookahead);
                }
                if (t3.match_length >= x ? (r3 = u._tr_tally(t3, 1, t3.match_length - x), t3.lookahead -= t3.match_length, t3.strstart += t3.match_length, t3.match_length = 0) : (r3 = u._tr_tally(t3, 0, t3.window[t3.strstart]), t3.lookahead--, t3.strstart++), r3 && (N(t3, false), t3.strm.avail_out === 0))
                  return A;
              }
              return t3.insert = 0, e3 === f ? (N(t3, true), t3.strm.avail_out === 0 ? O : B) : t3.last_lit && (N(t3, false), t3.strm.avail_out === 0) ? A : I;
            }(i2, e2) : h2[i2.level].func(i2, e2);
            if (o2 !== O && o2 !== B || (i2.status = 666), o2 === A || o2 === O)
              return t2.avail_out === 0 && (i2.last_flush = -1), m2;
            if (o2 === I && (e2 === 1 ? u._tr_align(i2) : e2 !== 5 && (u._tr_stored_block(i2, 0, 0, false), e2 === 3 && (D(i2.head), i2.lookahead === 0 && (i2.strstart = 0, i2.block_start = 0, i2.insert = 0))), F(t2), t2.avail_out === 0))
              return i2.last_flush = -1, m2;
          }
          return e2 !== f ? m2 : i2.wrap <= 0 ? 1 : (i2.wrap === 2 ? (U(i2, 255 & t2.adler), U(i2, t2.adler >> 8 & 255), U(i2, t2.adler >> 16 & 255), U(i2, t2.adler >> 24 & 255), U(i2, 255 & t2.total_in), U(i2, t2.total_in >> 8 & 255), U(i2, t2.total_in >> 16 & 255), U(i2, t2.total_in >> 24 & 255)) : (P(i2, t2.adler >>> 16), P(i2, 65535 & t2.adler)), F(t2), 0 < i2.wrap && (i2.wrap = -i2.wrap), i2.pending !== 0 ? m2 : 1);
        }, r.deflateEnd = function(t2) {
          var e2;
          return t2 && t2.state ? (e2 = t2.state.status) !== C && e2 !== 69 && e2 !== 73 && e2 !== 91 && e2 !== 103 && e2 !== E && e2 !== 666 ? R(t2, _) : (t2.state = null, e2 === E ? R(t2, -3) : m2) : _;
        }, r.deflateSetDictionary = function(t2, e2) {
          var r2, i2, n2, s3, a2, o2, h3, u2, l2 = e2.length;
          if (!t2 || !t2.state)
            return _;
          if ((s3 = (r2 = t2.state).wrap) === 2 || s3 === 1 && r2.status !== C || r2.lookahead)
            return _;
          for (s3 === 1 && (t2.adler = c(t2.adler, e2, l2, 0)), r2.wrap = 0, l2 >= r2.w_size && (s3 === 0 && (D(r2.head), r2.strstart = 0, r2.block_start = 0, r2.insert = 0), u2 = new d2.Buf8(r2.w_size), d2.arraySet(u2, e2, l2 - r2.w_size, r2.w_size, 0), e2 = u2, l2 = r2.w_size), a2 = t2.avail_in, o2 = t2.next_in, h3 = t2.input, t2.avail_in = l2, t2.next_in = 0, t2.input = e2, j(r2); r2.lookahead >= x; ) {
            for (i2 = r2.strstart, n2 = r2.lookahead - (x - 1); r2.ins_h = (r2.ins_h << r2.hash_shift ^ r2.window[i2 + x - 1]) & r2.hash_mask, r2.prev[i2 & r2.w_mask] = r2.head[r2.ins_h], r2.head[r2.ins_h] = i2, i2++, --n2; )
              ;
            r2.strstart = i2, r2.lookahead = x - 1, j(r2);
          }
          return r2.strstart += r2.lookahead, r2.block_start = r2.strstart, r2.insert = r2.lookahead, r2.lookahead = 0, r2.match_length = r2.prev_length = x - 1, r2.match_available = 0, t2.next_in = o2, t2.input = h3, t2.avail_in = a2, r2.wrap = s3, m2;
        }, r.deflateInfo = "pako deflate (from Nodeca project)";
      }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./messages": 51, "./trees": 52 }], 47: [function(t, e, r) {
        e.exports = function() {
          this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = false;
        };
      }, {}], 48: [function(t, e, r) {
        e.exports = function(t2, e2) {
          var r2, i, n, s2, a, o, h2, u, l, f, d2, c, p, m2, _, g, b, v, y2, w, k, x, S, z, C;
          r2 = t2.state, i = t2.next_in, z = t2.input, n = i + (t2.avail_in - 5), s2 = t2.next_out, C = t2.output, a = s2 - (e2 - t2.avail_out), o = s2 + (t2.avail_out - 257), h2 = r2.dmax, u = r2.wsize, l = r2.whave, f = r2.wnext, d2 = r2.window, c = r2.hold, p = r2.bits, m2 = r2.lencode, _ = r2.distcode, g = (1 << r2.lenbits) - 1, b = (1 << r2.distbits) - 1;
          t:
            do {
              p < 15 && (c += z[i++] << p, p += 8, c += z[i++] << p, p += 8), v = m2[c & g];
              e:
                for (; ; ) {
                  if (c >>>= y2 = v >>> 24, p -= y2, (y2 = v >>> 16 & 255) === 0)
                    C[s2++] = 65535 & v;
                  else {
                    if (!(16 & y2)) {
                      if ((64 & y2) == 0) {
                        v = m2[(65535 & v) + (c & (1 << y2) - 1)];
                        continue e;
                      }
                      if (32 & y2) {
                        r2.mode = 12;
                        break t;
                      }
                      t2.msg = "invalid literal/length code", r2.mode = 30;
                      break t;
                    }
                    w = 65535 & v, (y2 &= 15) && (p < y2 && (c += z[i++] << p, p += 8), w += c & (1 << y2) - 1, c >>>= y2, p -= y2), p < 15 && (c += z[i++] << p, p += 8, c += z[i++] << p, p += 8), v = _[c & b];
                    r:
                      for (; ; ) {
                        if (c >>>= y2 = v >>> 24, p -= y2, !(16 & (y2 = v >>> 16 & 255))) {
                          if ((64 & y2) == 0) {
                            v = _[(65535 & v) + (c & (1 << y2) - 1)];
                            continue r;
                          }
                          t2.msg = "invalid distance code", r2.mode = 30;
                          break t;
                        }
                        if (k = 65535 & v, p < (y2 &= 15) && (c += z[i++] << p, (p += 8) < y2 && (c += z[i++] << p, p += 8)), h2 < (k += c & (1 << y2) - 1)) {
                          t2.msg = "invalid distance too far back", r2.mode = 30;
                          break t;
                        }
                        if (c >>>= y2, p -= y2, (y2 = s2 - a) < k) {
                          if (l < (y2 = k - y2) && r2.sane) {
                            t2.msg = "invalid distance too far back", r2.mode = 30;
                            break t;
                          }
                          if (S = d2, (x = 0) === f) {
                            if (x += u - y2, y2 < w) {
                              for (w -= y2; C[s2++] = d2[x++], --y2; )
                                ;
                              x = s2 - k, S = C;
                            }
                          } else if (f < y2) {
                            if (x += u + f - y2, (y2 -= f) < w) {
                              for (w -= y2; C[s2++] = d2[x++], --y2; )
                                ;
                              if (x = 0, f < w) {
                                for (w -= y2 = f; C[s2++] = d2[x++], --y2; )
                                  ;
                                x = s2 - k, S = C;
                              }
                            }
                          } else if (x += f - y2, y2 < w) {
                            for (w -= y2; C[s2++] = d2[x++], --y2; )
                              ;
                            x = s2 - k, S = C;
                          }
                          for (; 2 < w; )
                            C[s2++] = S[x++], C[s2++] = S[x++], C[s2++] = S[x++], w -= 3;
                          w && (C[s2++] = S[x++], 1 < w && (C[s2++] = S[x++]));
                        } else {
                          for (x = s2 - k; C[s2++] = C[x++], C[s2++] = C[x++], C[s2++] = C[x++], 2 < (w -= 3); )
                            ;
                          w && (C[s2++] = C[x++], 1 < w && (C[s2++] = C[x++]));
                        }
                        break;
                      }
                  }
                  break;
                }
            } while (i < n && s2 < o);
          i -= w = p >> 3, c &= (1 << (p -= w << 3)) - 1, t2.next_in = i, t2.next_out = s2, t2.avail_in = i < n ? n - i + 5 : 5 - (i - n), t2.avail_out = s2 < o ? o - s2 + 257 : 257 - (s2 - o), r2.hold = c, r2.bits = p;
        };
      }, {}], 49: [function(t, e, r) {
        var I = t("../utils/common"), O = t("./adler32"), B = t("./crc32"), R = t("./inffast"), T = t("./inftrees"), D = 1, F = 2, N = 0, U = -2, P = 1, i = 852, n = 592;
        function L(t2) {
          return (t2 >>> 24 & 255) + (t2 >>> 8 & 65280) + ((65280 & t2) << 8) + ((255 & t2) << 24);
        }
        function s2() {
          this.mode = 0, this.last = false, this.wrap = 0, this.havedict = false, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new I.Buf16(320), this.work = new I.Buf16(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
        }
        function a(t2) {
          var e2;
          return t2 && t2.state ? (e2 = t2.state, t2.total_in = t2.total_out = e2.total = 0, t2.msg = "", e2.wrap && (t2.adler = 1 & e2.wrap), e2.mode = P, e2.last = 0, e2.havedict = 0, e2.dmax = 32768, e2.head = null, e2.hold = 0, e2.bits = 0, e2.lencode = e2.lendyn = new I.Buf32(i), e2.distcode = e2.distdyn = new I.Buf32(n), e2.sane = 1, e2.back = -1, N) : U;
        }
        function o(t2) {
          var e2;
          return t2 && t2.state ? ((e2 = t2.state).wsize = 0, e2.whave = 0, e2.wnext = 0, a(t2)) : U;
        }
        function h2(t2, e2) {
          var r2, i2;
          return t2 && t2.state ? (i2 = t2.state, e2 < 0 ? (r2 = 0, e2 = -e2) : (r2 = 1 + (e2 >> 4), e2 < 48 && (e2 &= 15)), e2 && (e2 < 8 || 15 < e2) ? U : (i2.window !== null && i2.wbits !== e2 && (i2.window = null), i2.wrap = r2, i2.wbits = e2, o(t2))) : U;
        }
        function u(t2, e2) {
          var r2, i2;
          return t2 ? (i2 = new s2(), (t2.state = i2).window = null, (r2 = h2(t2, e2)) !== N && (t2.state = null), r2) : U;
        }
        var l, f, d2 = true;
        function j(t2) {
          if (d2) {
            var e2;
            for (l = new I.Buf32(512), f = new I.Buf32(32), e2 = 0; e2 < 144; )
              t2.lens[e2++] = 8;
            for (; e2 < 256; )
              t2.lens[e2++] = 9;
            for (; e2 < 280; )
              t2.lens[e2++] = 7;
            for (; e2 < 288; )
              t2.lens[e2++] = 8;
            for (T(D, t2.lens, 0, 288, l, 0, t2.work, { bits: 9 }), e2 = 0; e2 < 32; )
              t2.lens[e2++] = 5;
            T(F, t2.lens, 0, 32, f, 0, t2.work, { bits: 5 }), d2 = false;
          }
          t2.lencode = l, t2.lenbits = 9, t2.distcode = f, t2.distbits = 5;
        }
        function Z(t2, e2, r2, i2) {
          var n2, s3 = t2.state;
          return s3.window === null && (s3.wsize = 1 << s3.wbits, s3.wnext = 0, s3.whave = 0, s3.window = new I.Buf8(s3.wsize)), i2 >= s3.wsize ? (I.arraySet(s3.window, e2, r2 - s3.wsize, s3.wsize, 0), s3.wnext = 0, s3.whave = s3.wsize) : (i2 < (n2 = s3.wsize - s3.wnext) && (n2 = i2), I.arraySet(s3.window, e2, r2 - i2, n2, s3.wnext), (i2 -= n2) ? (I.arraySet(s3.window, e2, r2 - i2, i2, 0), s3.wnext = i2, s3.whave = s3.wsize) : (s3.wnext += n2, s3.wnext === s3.wsize && (s3.wnext = 0), s3.whave < s3.wsize && (s3.whave += n2))), 0;
        }
        r.inflateReset = o, r.inflateReset2 = h2, r.inflateResetKeep = a, r.inflateInit = function(t2) {
          return u(t2, 15);
        }, r.inflateInit2 = u, r.inflate = function(t2, e2) {
          var r2, i2, n2, s3, a2, o2, h3, u2, l2, f2, d3, c, p, m2, _, g, b, v, y2, w, k, x, S, z, C = 0, E = new I.Buf8(4), A = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
          if (!t2 || !t2.state || !t2.output || !t2.input && t2.avail_in !== 0)
            return U;
          (r2 = t2.state).mode === 12 && (r2.mode = 13), a2 = t2.next_out, n2 = t2.output, h3 = t2.avail_out, s3 = t2.next_in, i2 = t2.input, o2 = t2.avail_in, u2 = r2.hold, l2 = r2.bits, f2 = o2, d3 = h3, x = N;
          t:
            for (; ; )
              switch (r2.mode) {
                case P:
                  if (r2.wrap === 0) {
                    r2.mode = 13;
                    break;
                  }
                  for (; l2 < 16; ) {
                    if (o2 === 0)
                      break t;
                    o2--, u2 += i2[s3++] << l2, l2 += 8;
                  }
                  if (2 & r2.wrap && u2 === 35615) {
                    E[r2.check = 0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0), l2 = u2 = 0, r2.mode = 2;
                    break;
                  }
                  if (r2.flags = 0, r2.head && (r2.head.done = false), !(1 & r2.wrap) || (((255 & u2) << 8) + (u2 >> 8)) % 31) {
                    t2.msg = "incorrect header check", r2.mode = 30;
                    break;
                  }
                  if ((15 & u2) != 8) {
                    t2.msg = "unknown compression method", r2.mode = 30;
                    break;
                  }
                  if (l2 -= 4, k = 8 + (15 & (u2 >>>= 4)), r2.wbits === 0)
                    r2.wbits = k;
                  else if (k > r2.wbits) {
                    t2.msg = "invalid window size", r2.mode = 30;
                    break;
                  }
                  r2.dmax = 1 << k, t2.adler = r2.check = 1, r2.mode = 512 & u2 ? 10 : 12, l2 = u2 = 0;
                  break;
                case 2:
                  for (; l2 < 16; ) {
                    if (o2 === 0)
                      break t;
                    o2--, u2 += i2[s3++] << l2, l2 += 8;
                  }
                  if (r2.flags = u2, (255 & r2.flags) != 8) {
                    t2.msg = "unknown compression method", r2.mode = 30;
                    break;
                  }
                  if (57344 & r2.flags) {
                    t2.msg = "unknown header flags set", r2.mode = 30;
                    break;
                  }
                  r2.head && (r2.head.text = u2 >> 8 & 1), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0)), l2 = u2 = 0, r2.mode = 3;
                case 3:
                  for (; l2 < 32; ) {
                    if (o2 === 0)
                      break t;
                    o2--, u2 += i2[s3++] << l2, l2 += 8;
                  }
                  r2.head && (r2.head.time = u2), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, E[2] = u2 >>> 16 & 255, E[3] = u2 >>> 24 & 255, r2.check = B(r2.check, E, 4, 0)), l2 = u2 = 0, r2.mode = 4;
                case 4:
                  for (; l2 < 16; ) {
                    if (o2 === 0)
                      break t;
                    o2--, u2 += i2[s3++] << l2, l2 += 8;
                  }
                  r2.head && (r2.head.xflags = 255 & u2, r2.head.os = u2 >> 8), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0)), l2 = u2 = 0, r2.mode = 5;
                case 5:
                  if (1024 & r2.flags) {
                    for (; l2 < 16; ) {
                      if (o2 === 0)
                        break t;
                      o2--, u2 += i2[s3++] << l2, l2 += 8;
                    }
                    r2.length = u2, r2.head && (r2.head.extra_len = u2), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0)), l2 = u2 = 0;
                  } else
                    r2.head && (r2.head.extra = null);
                  r2.mode = 6;
                case 6:
                  if (1024 & r2.flags && (o2 < (c = r2.length) && (c = o2), c && (r2.head && (k = r2.head.extra_len - r2.length, r2.head.extra || (r2.head.extra = new Array(r2.head.extra_len)), I.arraySet(r2.head.extra, i2, s3, c, k)), 512 & r2.flags && (r2.check = B(r2.check, i2, c, s3)), o2 -= c, s3 += c, r2.length -= c), r2.length))
                    break t;
                  r2.length = 0, r2.mode = 7;
                case 7:
                  if (2048 & r2.flags) {
                    if (o2 === 0)
                      break t;
                    for (c = 0; k = i2[s3 + c++], r2.head && k && r2.length < 65536 && (r2.head.name += String.fromCharCode(k)), k && c < o2; )
                      ;
                    if (512 & r2.flags && (r2.check = B(r2.check, i2, c, s3)), o2 -= c, s3 += c, k)
                      break t;
                  } else
                    r2.head && (r2.head.name = null);
                  r2.length = 0, r2.mode = 8;
                case 8:
                  if (4096 & r2.flags) {
                    if (o2 === 0)
                      break t;
                    for (c = 0; k = i2[s3 + c++], r2.head && k && r2.length < 65536 && (r2.head.comment += String.fromCharCode(k)), k && c < o2; )
                      ;
                    if (512 & r2.flags && (r2.check = B(r2.check, i2, c, s3)), o2 -= c, s3 += c, k)
                      break t;
                  } else
                    r2.head && (r2.head.comment = null);
                  r2.mode = 9;
                case 9:
                  if (512 & r2.flags) {
                    for (; l2 < 16; ) {
                      if (o2 === 0)
                        break t;
                      o2--, u2 += i2[s3++] << l2, l2 += 8;
                    }
                    if (u2 !== (65535 & r2.check)) {
                      t2.msg = "header crc mismatch", r2.mode = 30;
                      break;
                    }
                    l2 = u2 = 0;
                  }
                  r2.head && (r2.head.hcrc = r2.flags >> 9 & 1, r2.head.done = true), t2.adler = r2.check = 0, r2.mode = 12;
                  break;
                case 10:
                  for (; l2 < 32; ) {
                    if (o2 === 0)
                      break t;
                    o2--, u2 += i2[s3++] << l2, l2 += 8;
                  }
                  t2.adler = r2.check = L(u2), l2 = u2 = 0, r2.mode = 11;
                case 11:
                  if (r2.havedict === 0)
                    return t2.next_out = a2, t2.avail_out = h3, t2.next_in = s3, t2.avail_in = o2, r2.hold = u2, r2.bits = l2, 2;
                  t2.adler = r2.check = 1, r2.mode = 12;
                case 12:
                  if (e2 === 5 || e2 === 6)
                    break t;
                case 13:
                  if (r2.last) {
                    u2 >>>= 7 & l2, l2 -= 7 & l2, r2.mode = 27;
                    break;
                  }
                  for (; l2 < 3; ) {
                    if (o2 === 0)
                      break t;
                    o2--, u2 += i2[s3++] << l2, l2 += 8;
                  }
                  switch (r2.last = 1 & u2, l2 -= 1, 3 & (u2 >>>= 1)) {
                    case 0:
                      r2.mode = 14;
                      break;
                    case 1:
                      if (j(r2), r2.mode = 20, e2 !== 6)
                        break;
                      u2 >>>= 2, l2 -= 2;
                      break t;
                    case 2:
                      r2.mode = 17;
                      break;
                    case 3:
                      t2.msg = "invalid block type", r2.mode = 30;
                  }
                  u2 >>>= 2, l2 -= 2;
                  break;
                case 14:
                  for (u2 >>>= 7 & l2, l2 -= 7 & l2; l2 < 32; ) {
                    if (o2 === 0)
                      break t;
                    o2--, u2 += i2[s3++] << l2, l2 += 8;
                  }
                  if ((65535 & u2) != (u2 >>> 16 ^ 65535)) {
                    t2.msg = "invalid stored block lengths", r2.mode = 30;
                    break;
                  }
                  if (r2.length = 65535 & u2, l2 = u2 = 0, r2.mode = 15, e2 === 6)
                    break t;
                case 15:
                  r2.mode = 16;
                case 16:
                  if (c = r2.length) {
                    if (o2 < c && (c = o2), h3 < c && (c = h3), c === 0)
                      break t;
                    I.arraySet(n2, i2, s3, c, a2), o2 -= c, s3 += c, h3 -= c, a2 += c, r2.length -= c;
                    break;
                  }
                  r2.mode = 12;
                  break;
                case 17:
                  for (; l2 < 14; ) {
                    if (o2 === 0)
                      break t;
                    o2--, u2 += i2[s3++] << l2, l2 += 8;
                  }
                  if (r2.nlen = 257 + (31 & u2), u2 >>>= 5, l2 -= 5, r2.ndist = 1 + (31 & u2), u2 >>>= 5, l2 -= 5, r2.ncode = 4 + (15 & u2), u2 >>>= 4, l2 -= 4, 286 < r2.nlen || 30 < r2.ndist) {
                    t2.msg = "too many length or distance symbols", r2.mode = 30;
                    break;
                  }
                  r2.have = 0, r2.mode = 18;
                case 18:
                  for (; r2.have < r2.ncode; ) {
                    for (; l2 < 3; ) {
                      if (o2 === 0)
                        break t;
                      o2--, u2 += i2[s3++] << l2, l2 += 8;
                    }
                    r2.lens[A[r2.have++]] = 7 & u2, u2 >>>= 3, l2 -= 3;
                  }
                  for (; r2.have < 19; )
                    r2.lens[A[r2.have++]] = 0;
                  if (r2.lencode = r2.lendyn, r2.lenbits = 7, S = { bits: r2.lenbits }, x = T(0, r2.lens, 0, 19, r2.lencode, 0, r2.work, S), r2.lenbits = S.bits, x) {
                    t2.msg = "invalid code lengths set", r2.mode = 30;
                    break;
                  }
                  r2.have = 0, r2.mode = 19;
                case 19:
                  for (; r2.have < r2.nlen + r2.ndist; ) {
                    for (; g = (C = r2.lencode[u2 & (1 << r2.lenbits) - 1]) >>> 16 & 255, b = 65535 & C, !((_ = C >>> 24) <= l2); ) {
                      if (o2 === 0)
                        break t;
                      o2--, u2 += i2[s3++] << l2, l2 += 8;
                    }
                    if (b < 16)
                      u2 >>>= _, l2 -= _, r2.lens[r2.have++] = b;
                    else {
                      if (b === 16) {
                        for (z = _ + 2; l2 < z; ) {
                          if (o2 === 0)
                            break t;
                          o2--, u2 += i2[s3++] << l2, l2 += 8;
                        }
                        if (u2 >>>= _, l2 -= _, r2.have === 0) {
                          t2.msg = "invalid bit length repeat", r2.mode = 30;
                          break;
                        }
                        k = r2.lens[r2.have - 1], c = 3 + (3 & u2), u2 >>>= 2, l2 -= 2;
                      } else if (b === 17) {
                        for (z = _ + 3; l2 < z; ) {
                          if (o2 === 0)
                            break t;
                          o2--, u2 += i2[s3++] << l2, l2 += 8;
                        }
                        l2 -= _, k = 0, c = 3 + (7 & (u2 >>>= _)), u2 >>>= 3, l2 -= 3;
                      } else {
                        for (z = _ + 7; l2 < z; ) {
                          if (o2 === 0)
                            break t;
                          o2--, u2 += i2[s3++] << l2, l2 += 8;
                        }
                        l2 -= _, k = 0, c = 11 + (127 & (u2 >>>= _)), u2 >>>= 7, l2 -= 7;
                      }
                      if (r2.have + c > r2.nlen + r2.ndist) {
                        t2.msg = "invalid bit length repeat", r2.mode = 30;
                        break;
                      }
                      for (; c--; )
                        r2.lens[r2.have++] = k;
                    }
                  }
                  if (r2.mode === 30)
                    break;
                  if (r2.lens[256] === 0) {
                    t2.msg = "invalid code -- missing end-of-block", r2.mode = 30;
                    break;
                  }
                  if (r2.lenbits = 9, S = { bits: r2.lenbits }, x = T(D, r2.lens, 0, r2.nlen, r2.lencode, 0, r2.work, S), r2.lenbits = S.bits, x) {
                    t2.msg = "invalid literal/lengths set", r2.mode = 30;
                    break;
                  }
                  if (r2.distbits = 6, r2.distcode = r2.distdyn, S = { bits: r2.distbits }, x = T(F, r2.lens, r2.nlen, r2.ndist, r2.distcode, 0, r2.work, S), r2.distbits = S.bits, x) {
                    t2.msg = "invalid distances set", r2.mode = 30;
                    break;
                  }
                  if (r2.mode = 20, e2 === 6)
                    break t;
                case 20:
                  r2.mode = 21;
                case 21:
                  if (6 <= o2 && 258 <= h3) {
                    t2.next_out = a2, t2.avail_out = h3, t2.next_in = s3, t2.avail_in = o2, r2.hold = u2, r2.bits = l2, R(t2, d3), a2 = t2.next_out, n2 = t2.output, h3 = t2.avail_out, s3 = t2.next_in, i2 = t2.input, o2 = t2.avail_in, u2 = r2.hold, l2 = r2.bits, r2.mode === 12 && (r2.back = -1);
                    break;
                  }
                  for (r2.back = 0; g = (C = r2.lencode[u2 & (1 << r2.lenbits) - 1]) >>> 16 & 255, b = 65535 & C, !((_ = C >>> 24) <= l2); ) {
                    if (o2 === 0)
                      break t;
                    o2--, u2 += i2[s3++] << l2, l2 += 8;
                  }
                  if (g && (240 & g) == 0) {
                    for (v = _, y2 = g, w = b; g = (C = r2.lencode[w + ((u2 & (1 << v + y2) - 1) >> v)]) >>> 16 & 255, b = 65535 & C, !(v + (_ = C >>> 24) <= l2); ) {
                      if (o2 === 0)
                        break t;
                      o2--, u2 += i2[s3++] << l2, l2 += 8;
                    }
                    u2 >>>= v, l2 -= v, r2.back += v;
                  }
                  if (u2 >>>= _, l2 -= _, r2.back += _, r2.length = b, g === 0) {
                    r2.mode = 26;
                    break;
                  }
                  if (32 & g) {
                    r2.back = -1, r2.mode = 12;
                    break;
                  }
                  if (64 & g) {
                    t2.msg = "invalid literal/length code", r2.mode = 30;
                    break;
                  }
                  r2.extra = 15 & g, r2.mode = 22;
                case 22:
                  if (r2.extra) {
                    for (z = r2.extra; l2 < z; ) {
                      if (o2 === 0)
                        break t;
                      o2--, u2 += i2[s3++] << l2, l2 += 8;
                    }
                    r2.length += u2 & (1 << r2.extra) - 1, u2 >>>= r2.extra, l2 -= r2.extra, r2.back += r2.extra;
                  }
                  r2.was = r2.length, r2.mode = 23;
                case 23:
                  for (; g = (C = r2.distcode[u2 & (1 << r2.distbits) - 1]) >>> 16 & 255, b = 65535 & C, !((_ = C >>> 24) <= l2); ) {
                    if (o2 === 0)
                      break t;
                    o2--, u2 += i2[s3++] << l2, l2 += 8;
                  }
                  if ((240 & g) == 0) {
                    for (v = _, y2 = g, w = b; g = (C = r2.distcode[w + ((u2 & (1 << v + y2) - 1) >> v)]) >>> 16 & 255, b = 65535 & C, !(v + (_ = C >>> 24) <= l2); ) {
                      if (o2 === 0)
                        break t;
                      o2--, u2 += i2[s3++] << l2, l2 += 8;
                    }
                    u2 >>>= v, l2 -= v, r2.back += v;
                  }
                  if (u2 >>>= _, l2 -= _, r2.back += _, 64 & g) {
                    t2.msg = "invalid distance code", r2.mode = 30;
                    break;
                  }
                  r2.offset = b, r2.extra = 15 & g, r2.mode = 24;
                case 24:
                  if (r2.extra) {
                    for (z = r2.extra; l2 < z; ) {
                      if (o2 === 0)
                        break t;
                      o2--, u2 += i2[s3++] << l2, l2 += 8;
                    }
                    r2.offset += u2 & (1 << r2.extra) - 1, u2 >>>= r2.extra, l2 -= r2.extra, r2.back += r2.extra;
                  }
                  if (r2.offset > r2.dmax) {
                    t2.msg = "invalid distance too far back", r2.mode = 30;
                    break;
                  }
                  r2.mode = 25;
                case 25:
                  if (h3 === 0)
                    break t;
                  if (c = d3 - h3, r2.offset > c) {
                    if ((c = r2.offset - c) > r2.whave && r2.sane) {
                      t2.msg = "invalid distance too far back", r2.mode = 30;
                      break;
                    }
                    p = c > r2.wnext ? (c -= r2.wnext, r2.wsize - c) : r2.wnext - c, c > r2.length && (c = r2.length), m2 = r2.window;
                  } else
                    m2 = n2, p = a2 - r2.offset, c = r2.length;
                  for (h3 < c && (c = h3), h3 -= c, r2.length -= c; n2[a2++] = m2[p++], --c; )
                    ;
                  r2.length === 0 && (r2.mode = 21);
                  break;
                case 26:
                  if (h3 === 0)
                    break t;
                  n2[a2++] = r2.length, h3--, r2.mode = 21;
                  break;
                case 27:
                  if (r2.wrap) {
                    for (; l2 < 32; ) {
                      if (o2 === 0)
                        break t;
                      o2--, u2 |= i2[s3++] << l2, l2 += 8;
                    }
                    if (d3 -= h3, t2.total_out += d3, r2.total += d3, d3 && (t2.adler = r2.check = r2.flags ? B(r2.check, n2, d3, a2 - d3) : O(r2.check, n2, d3, a2 - d3)), d3 = h3, (r2.flags ? u2 : L(u2)) !== r2.check) {
                      t2.msg = "incorrect data check", r2.mode = 30;
                      break;
                    }
                    l2 = u2 = 0;
                  }
                  r2.mode = 28;
                case 28:
                  if (r2.wrap && r2.flags) {
                    for (; l2 < 32; ) {
                      if (o2 === 0)
                        break t;
                      o2--, u2 += i2[s3++] << l2, l2 += 8;
                    }
                    if (u2 !== (4294967295 & r2.total)) {
                      t2.msg = "incorrect length check", r2.mode = 30;
                      break;
                    }
                    l2 = u2 = 0;
                  }
                  r2.mode = 29;
                case 29:
                  x = 1;
                  break t;
                case 30:
                  x = -3;
                  break t;
                case 31:
                  return -4;
                case 32:
                default:
                  return U;
              }
          return t2.next_out = a2, t2.avail_out = h3, t2.next_in = s3, t2.avail_in = o2, r2.hold = u2, r2.bits = l2, (r2.wsize || d3 !== t2.avail_out && r2.mode < 30 && (r2.mode < 27 || e2 !== 4)) && Z(t2, t2.output, t2.next_out, d3 - t2.avail_out) ? (r2.mode = 31, -4) : (f2 -= t2.avail_in, d3 -= t2.avail_out, t2.total_in += f2, t2.total_out += d3, r2.total += d3, r2.wrap && d3 && (t2.adler = r2.check = r2.flags ? B(r2.check, n2, d3, t2.next_out - d3) : O(r2.check, n2, d3, t2.next_out - d3)), t2.data_type = r2.bits + (r2.last ? 64 : 0) + (r2.mode === 12 ? 128 : 0) + (r2.mode === 20 || r2.mode === 15 ? 256 : 0), (f2 == 0 && d3 === 0 || e2 === 4) && x === N && (x = -5), x);
        }, r.inflateEnd = function(t2) {
          if (!t2 || !t2.state)
            return U;
          var e2 = t2.state;
          return e2.window && (e2.window = null), t2.state = null, N;
        }, r.inflateGetHeader = function(t2, e2) {
          var r2;
          return t2 && t2.state ? (2 & (r2 = t2.state).wrap) == 0 ? U : ((r2.head = e2).done = false, N) : U;
        }, r.inflateSetDictionary = function(t2, e2) {
          var r2, i2 = e2.length;
          return t2 && t2.state ? (r2 = t2.state).wrap !== 0 && r2.mode !== 11 ? U : r2.mode === 11 && O(1, e2, i2, 0) !== r2.check ? -3 : Z(t2, e2, i2, i2) ? (r2.mode = 31, -4) : (r2.havedict = 1, N) : U;
        }, r.inflateInfo = "pako inflate (from Nodeca project)";
      }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./inffast": 48, "./inftrees": 50 }], 50: [function(t, e, r) {
        var D = t("../utils/common"), F = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0], N = [16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78], U = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0], P = [16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64];
        e.exports = function(t2, e2, r2, i, n, s2, a, o) {
          var h2, u, l, f, d2, c, p, m2, _, g = o.bits, b = 0, v = 0, y2 = 0, w = 0, k = 0, x = 0, S = 0, z = 0, C = 0, E = 0, A = null, I = 0, O = new D.Buf16(16), B = new D.Buf16(16), R = null, T = 0;
          for (b = 0; b <= 15; b++)
            O[b] = 0;
          for (v = 0; v < i; v++)
            O[e2[r2 + v]]++;
          for (k = g, w = 15; 1 <= w && O[w] === 0; w--)
            ;
          if (w < k && (k = w), w === 0)
            return n[s2++] = 20971520, n[s2++] = 20971520, o.bits = 1, 0;
          for (y2 = 1; y2 < w && O[y2] === 0; y2++)
            ;
          for (k < y2 && (k = y2), b = z = 1; b <= 15; b++)
            if (z <<= 1, (z -= O[b]) < 0)
              return -1;
          if (0 < z && (t2 === 0 || w !== 1))
            return -1;
          for (B[1] = 0, b = 1; b < 15; b++)
            B[b + 1] = B[b] + O[b];
          for (v = 0; v < i; v++)
            e2[r2 + v] !== 0 && (a[B[e2[r2 + v]]++] = v);
          if (c = t2 === 0 ? (A = R = a, 19) : t2 === 1 ? (A = F, I -= 257, R = N, T -= 257, 256) : (A = U, R = P, -1), b = y2, d2 = s2, S = v = E = 0, l = -1, f = (C = 1 << (x = k)) - 1, t2 === 1 && 852 < C || t2 === 2 && 592 < C)
            return 1;
          for (; ; ) {
            for (p = b - S, _ = a[v] < c ? (m2 = 0, a[v]) : a[v] > c ? (m2 = R[T + a[v]], A[I + a[v]]) : (m2 = 96, 0), h2 = 1 << b - S, y2 = u = 1 << x; n[d2 + (E >> S) + (u -= h2)] = p << 24 | m2 << 16 | _ | 0, u !== 0; )
              ;
            for (h2 = 1 << b - 1; E & h2; )
              h2 >>= 1;
            if (h2 !== 0 ? (E &= h2 - 1, E += h2) : E = 0, v++, --O[b] == 0) {
              if (b === w)
                break;
              b = e2[r2 + a[v]];
            }
            if (k < b && (E & f) !== l) {
              for (S === 0 && (S = k), d2 += y2, z = 1 << (x = b - S); x + S < w && !((z -= O[x + S]) <= 0); )
                x++, z <<= 1;
              if (C += 1 << x, t2 === 1 && 852 < C || t2 === 2 && 592 < C)
                return 1;
              n[l = E & f] = k << 24 | x << 16 | d2 - s2 | 0;
            }
          }
          return E !== 0 && (n[d2 + E] = b - S << 24 | 64 << 16 | 0), o.bits = k, 0;
        };
      }, { "../utils/common": 41 }], 51: [function(t, e, r) {
        e.exports = { 2: "need dictionary", 1: "stream end", 0: "", "-1": "file error", "-2": "stream error", "-3": "data error", "-4": "insufficient memory", "-5": "buffer error", "-6": "incompatible version" };
      }, {}], 52: [function(t, e, r) {
        var n = t("../utils/common"), o = 0, h2 = 1;
        function i(t2) {
          for (var e2 = t2.length; 0 <= --e2; )
            t2[e2] = 0;
        }
        var s2 = 0, a = 29, u = 256, l = u + 1 + a, f = 30, d2 = 19, _ = 2 * l + 1, g = 15, c = 16, p = 7, m2 = 256, b = 16, v = 17, y2 = 18, w = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0], k = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13], x = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7], S = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15], z = new Array(2 * (l + 2));
        i(z);
        var C = new Array(2 * f);
        i(C);
        var E = new Array(512);
        i(E);
        var A = new Array(256);
        i(A);
        var I = new Array(a);
        i(I);
        var O, B, R, T = new Array(f);
        function D(t2, e2, r2, i2, n2) {
          this.static_tree = t2, this.extra_bits = e2, this.extra_base = r2, this.elems = i2, this.max_length = n2, this.has_stree = t2 && t2.length;
        }
        function F(t2, e2) {
          this.dyn_tree = t2, this.max_code = 0, this.stat_desc = e2;
        }
        function N(t2) {
          return t2 < 256 ? E[t2] : E[256 + (t2 >>> 7)];
        }
        function U(t2, e2) {
          t2.pending_buf[t2.pending++] = 255 & e2, t2.pending_buf[t2.pending++] = e2 >>> 8 & 255;
        }
        function P(t2, e2, r2) {
          t2.bi_valid > c - r2 ? (t2.bi_buf |= e2 << t2.bi_valid & 65535, U(t2, t2.bi_buf), t2.bi_buf = e2 >> c - t2.bi_valid, t2.bi_valid += r2 - c) : (t2.bi_buf |= e2 << t2.bi_valid & 65535, t2.bi_valid += r2);
        }
        function L(t2, e2, r2) {
          P(t2, r2[2 * e2], r2[2 * e2 + 1]);
        }
        function j(t2, e2) {
          for (var r2 = 0; r2 |= 1 & t2, t2 >>>= 1, r2 <<= 1, 0 < --e2; )
            ;
          return r2 >>> 1;
        }
        function Z(t2, e2, r2) {
          var i2, n2, s3 = new Array(g + 1), a2 = 0;
          for (i2 = 1; i2 <= g; i2++)
            s3[i2] = a2 = a2 + r2[i2 - 1] << 1;
          for (n2 = 0; n2 <= e2; n2++) {
            var o2 = t2[2 * n2 + 1];
            o2 !== 0 && (t2[2 * n2] = j(s3[o2]++, o2));
          }
        }
        function W(t2) {
          var e2;
          for (e2 = 0; e2 < l; e2++)
            t2.dyn_ltree[2 * e2] = 0;
          for (e2 = 0; e2 < f; e2++)
            t2.dyn_dtree[2 * e2] = 0;
          for (e2 = 0; e2 < d2; e2++)
            t2.bl_tree[2 * e2] = 0;
          t2.dyn_ltree[2 * m2] = 1, t2.opt_len = t2.static_len = 0, t2.last_lit = t2.matches = 0;
        }
        function M(t2) {
          8 < t2.bi_valid ? U(t2, t2.bi_buf) : 0 < t2.bi_valid && (t2.pending_buf[t2.pending++] = t2.bi_buf), t2.bi_buf = 0, t2.bi_valid = 0;
        }
        function H(t2, e2, r2, i2) {
          var n2 = 2 * e2, s3 = 2 * r2;
          return t2[n2] < t2[s3] || t2[n2] === t2[s3] && i2[e2] <= i2[r2];
        }
        function G(t2, e2, r2) {
          for (var i2 = t2.heap[r2], n2 = r2 << 1; n2 <= t2.heap_len && (n2 < t2.heap_len && H(e2, t2.heap[n2 + 1], t2.heap[n2], t2.depth) && n2++, !H(e2, i2, t2.heap[n2], t2.depth)); )
            t2.heap[r2] = t2.heap[n2], r2 = n2, n2 <<= 1;
          t2.heap[r2] = i2;
        }
        function K(t2, e2, r2) {
          var i2, n2, s3, a2, o2 = 0;
          if (t2.last_lit !== 0)
            for (; i2 = t2.pending_buf[t2.d_buf + 2 * o2] << 8 | t2.pending_buf[t2.d_buf + 2 * o2 + 1], n2 = t2.pending_buf[t2.l_buf + o2], o2++, i2 === 0 ? L(t2, n2, e2) : (L(t2, (s3 = A[n2]) + u + 1, e2), (a2 = w[s3]) !== 0 && P(t2, n2 -= I[s3], a2), L(t2, s3 = N(--i2), r2), (a2 = k[s3]) !== 0 && P(t2, i2 -= T[s3], a2)), o2 < t2.last_lit; )
              ;
          L(t2, m2, e2);
        }
        function Y(t2, e2) {
          var r2, i2, n2, s3 = e2.dyn_tree, a2 = e2.stat_desc.static_tree, o2 = e2.stat_desc.has_stree, h3 = e2.stat_desc.elems, u2 = -1;
          for (t2.heap_len = 0, t2.heap_max = _, r2 = 0; r2 < h3; r2++)
            s3[2 * r2] !== 0 ? (t2.heap[++t2.heap_len] = u2 = r2, t2.depth[r2] = 0) : s3[2 * r2 + 1] = 0;
          for (; t2.heap_len < 2; )
            s3[2 * (n2 = t2.heap[++t2.heap_len] = u2 < 2 ? ++u2 : 0)] = 1, t2.depth[n2] = 0, t2.opt_len--, o2 && (t2.static_len -= a2[2 * n2 + 1]);
          for (e2.max_code = u2, r2 = t2.heap_len >> 1; 1 <= r2; r2--)
            G(t2, s3, r2);
          for (n2 = h3; r2 = t2.heap[1], t2.heap[1] = t2.heap[t2.heap_len--], G(t2, s3, 1), i2 = t2.heap[1], t2.heap[--t2.heap_max] = r2, t2.heap[--t2.heap_max] = i2, s3[2 * n2] = s3[2 * r2] + s3[2 * i2], t2.depth[n2] = (t2.depth[r2] >= t2.depth[i2] ? t2.depth[r2] : t2.depth[i2]) + 1, s3[2 * r2 + 1] = s3[2 * i2 + 1] = n2, t2.heap[1] = n2++, G(t2, s3, 1), 2 <= t2.heap_len; )
            ;
          t2.heap[--t2.heap_max] = t2.heap[1], function(t3, e3) {
            var r3, i3, n3, s4, a3, o3, h4 = e3.dyn_tree, u3 = e3.max_code, l2 = e3.stat_desc.static_tree, f2 = e3.stat_desc.has_stree, d3 = e3.stat_desc.extra_bits, c2 = e3.stat_desc.extra_base, p2 = e3.stat_desc.max_length, m3 = 0;
            for (s4 = 0; s4 <= g; s4++)
              t3.bl_count[s4] = 0;
            for (h4[2 * t3.heap[t3.heap_max] + 1] = 0, r3 = t3.heap_max + 1; r3 < _; r3++)
              p2 < (s4 = h4[2 * h4[2 * (i3 = t3.heap[r3]) + 1] + 1] + 1) && (s4 = p2, m3++), h4[2 * i3 + 1] = s4, u3 < i3 || (t3.bl_count[s4]++, a3 = 0, c2 <= i3 && (a3 = d3[i3 - c2]), o3 = h4[2 * i3], t3.opt_len += o3 * (s4 + a3), f2 && (t3.static_len += o3 * (l2[2 * i3 + 1] + a3)));
            if (m3 !== 0) {
              do {
                for (s4 = p2 - 1; t3.bl_count[s4] === 0; )
                  s4--;
                t3.bl_count[s4]--, t3.bl_count[s4 + 1] += 2, t3.bl_count[p2]--, m3 -= 2;
              } while (0 < m3);
              for (s4 = p2; s4 !== 0; s4--)
                for (i3 = t3.bl_count[s4]; i3 !== 0; )
                  u3 < (n3 = t3.heap[--r3]) || (h4[2 * n3 + 1] !== s4 && (t3.opt_len += (s4 - h4[2 * n3 + 1]) * h4[2 * n3], h4[2 * n3 + 1] = s4), i3--);
            }
          }(t2, e2), Z(s3, u2, t2.bl_count);
        }
        function X(t2, e2, r2) {
          var i2, n2, s3 = -1, a2 = e2[1], o2 = 0, h3 = 7, u2 = 4;
          for (a2 === 0 && (h3 = 138, u2 = 3), e2[2 * (r2 + 1) + 1] = 65535, i2 = 0; i2 <= r2; i2++)
            n2 = a2, a2 = e2[2 * (i2 + 1) + 1], ++o2 < h3 && n2 === a2 || (o2 < u2 ? t2.bl_tree[2 * n2] += o2 : n2 !== 0 ? (n2 !== s3 && t2.bl_tree[2 * n2]++, t2.bl_tree[2 * b]++) : o2 <= 10 ? t2.bl_tree[2 * v]++ : t2.bl_tree[2 * y2]++, s3 = n2, u2 = (o2 = 0) === a2 ? (h3 = 138, 3) : n2 === a2 ? (h3 = 6, 3) : (h3 = 7, 4));
        }
        function V(t2, e2, r2) {
          var i2, n2, s3 = -1, a2 = e2[1], o2 = 0, h3 = 7, u2 = 4;
          for (a2 === 0 && (h3 = 138, u2 = 3), i2 = 0; i2 <= r2; i2++)
            if (n2 = a2, a2 = e2[2 * (i2 + 1) + 1], !(++o2 < h3 && n2 === a2)) {
              if (o2 < u2)
                for (; L(t2, n2, t2.bl_tree), --o2 != 0; )
                  ;
              else
                n2 !== 0 ? (n2 !== s3 && (L(t2, n2, t2.bl_tree), o2--), L(t2, b, t2.bl_tree), P(t2, o2 - 3, 2)) : o2 <= 10 ? (L(t2, v, t2.bl_tree), P(t2, o2 - 3, 3)) : (L(t2, y2, t2.bl_tree), P(t2, o2 - 11, 7));
              s3 = n2, u2 = (o2 = 0) === a2 ? (h3 = 138, 3) : n2 === a2 ? (h3 = 6, 3) : (h3 = 7, 4);
            }
        }
        i(T);
        var q = false;
        function J(t2, e2, r2, i2) {
          P(t2, (s2 << 1) + (i2 ? 1 : 0), 3), function(t3, e3, r3, i3) {
            M(t3), i3 && (U(t3, r3), U(t3, ~r3)), n.arraySet(t3.pending_buf, t3.window, e3, r3, t3.pending), t3.pending += r3;
          }(t2, e2, r2, true);
        }
        r._tr_init = function(t2) {
          q || (function() {
            var t3, e2, r2, i2, n2, s3 = new Array(g + 1);
            for (i2 = r2 = 0; i2 < a - 1; i2++)
              for (I[i2] = r2, t3 = 0; t3 < 1 << w[i2]; t3++)
                A[r2++] = i2;
            for (A[r2 - 1] = i2, i2 = n2 = 0; i2 < 16; i2++)
              for (T[i2] = n2, t3 = 0; t3 < 1 << k[i2]; t3++)
                E[n2++] = i2;
            for (n2 >>= 7; i2 < f; i2++)
              for (T[i2] = n2 << 7, t3 = 0; t3 < 1 << k[i2] - 7; t3++)
                E[256 + n2++] = i2;
            for (e2 = 0; e2 <= g; e2++)
              s3[e2] = 0;
            for (t3 = 0; t3 <= 143; )
              z[2 * t3 + 1] = 8, t3++, s3[8]++;
            for (; t3 <= 255; )
              z[2 * t3 + 1] = 9, t3++, s3[9]++;
            for (; t3 <= 279; )
              z[2 * t3 + 1] = 7, t3++, s3[7]++;
            for (; t3 <= 287; )
              z[2 * t3 + 1] = 8, t3++, s3[8]++;
            for (Z(z, l + 1, s3), t3 = 0; t3 < f; t3++)
              C[2 * t3 + 1] = 5, C[2 * t3] = j(t3, 5);
            O = new D(z, w, u + 1, l, g), B = new D(C, k, 0, f, g), R = new D(new Array(0), x, 0, d2, p);
          }(), q = true), t2.l_desc = new F(t2.dyn_ltree, O), t2.d_desc = new F(t2.dyn_dtree, B), t2.bl_desc = new F(t2.bl_tree, R), t2.bi_buf = 0, t2.bi_valid = 0, W(t2);
        }, r._tr_stored_block = J, r._tr_flush_block = function(t2, e2, r2, i2) {
          var n2, s3, a2 = 0;
          0 < t2.level ? (t2.strm.data_type === 2 && (t2.strm.data_type = function(t3) {
            var e3, r3 = 4093624447;
            for (e3 = 0; e3 <= 31; e3++, r3 >>>= 1)
              if (1 & r3 && t3.dyn_ltree[2 * e3] !== 0)
                return o;
            if (t3.dyn_ltree[18] !== 0 || t3.dyn_ltree[20] !== 0 || t3.dyn_ltree[26] !== 0)
              return h2;
            for (e3 = 32; e3 < u; e3++)
              if (t3.dyn_ltree[2 * e3] !== 0)
                return h2;
            return o;
          }(t2)), Y(t2, t2.l_desc), Y(t2, t2.d_desc), a2 = function(t3) {
            var e3;
            for (X(t3, t3.dyn_ltree, t3.l_desc.max_code), X(t3, t3.dyn_dtree, t3.d_desc.max_code), Y(t3, t3.bl_desc), e3 = d2 - 1; 3 <= e3 && t3.bl_tree[2 * S[e3] + 1] === 0; e3--)
              ;
            return t3.opt_len += 3 * (e3 + 1) + 5 + 5 + 4, e3;
          }(t2), n2 = t2.opt_len + 3 + 7 >>> 3, (s3 = t2.static_len + 3 + 7 >>> 3) <= n2 && (n2 = s3)) : n2 = s3 = r2 + 5, r2 + 4 <= n2 && e2 !== -1 ? J(t2, e2, r2, i2) : t2.strategy === 4 || s3 === n2 ? (P(t2, 2 + (i2 ? 1 : 0), 3), K(t2, z, C)) : (P(t2, 4 + (i2 ? 1 : 0), 3), function(t3, e3, r3, i3) {
            var n3;
            for (P(t3, e3 - 257, 5), P(t3, r3 - 1, 5), P(t3, i3 - 4, 4), n3 = 0; n3 < i3; n3++)
              P(t3, t3.bl_tree[2 * S[n3] + 1], 3);
            V(t3, t3.dyn_ltree, e3 - 1), V(t3, t3.dyn_dtree, r3 - 1);
          }(t2, t2.l_desc.max_code + 1, t2.d_desc.max_code + 1, a2 + 1), K(t2, t2.dyn_ltree, t2.dyn_dtree)), W(t2), i2 && M(t2);
        }, r._tr_tally = function(t2, e2, r2) {
          return t2.pending_buf[t2.d_buf + 2 * t2.last_lit] = e2 >>> 8 & 255, t2.pending_buf[t2.d_buf + 2 * t2.last_lit + 1] = 255 & e2, t2.pending_buf[t2.l_buf + t2.last_lit] = 255 & r2, t2.last_lit++, e2 === 0 ? t2.dyn_ltree[2 * r2]++ : (t2.matches++, e2--, t2.dyn_ltree[2 * (A[r2] + u + 1)]++, t2.dyn_dtree[2 * N(e2)]++), t2.last_lit === t2.lit_bufsize - 1;
        }, r._tr_align = function(t2) {
          P(t2, 2, 3), L(t2, m2, z), function(t3) {
            t3.bi_valid === 16 ? (U(t3, t3.bi_buf), t3.bi_buf = 0, t3.bi_valid = 0) : 8 <= t3.bi_valid && (t3.pending_buf[t3.pending++] = 255 & t3.bi_buf, t3.bi_buf >>= 8, t3.bi_valid -= 8);
          }(t2);
        };
      }, { "../utils/common": 41 }], 53: [function(t, e, r) {
        e.exports = function() {
          this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
        };
      }, {}], 54: [function(t, e, r) {
        e.exports = typeof setImmediate == "function" ? setImmediate : function() {
          var t2 = [].slice.apply(arguments);
          t2.splice(1, 0, 0), setTimeout.apply(null, t2);
        };
      }, {}] }, {}, [10])(10);
    });
  })(jszip_min);
  function escapeClassName(className) {
    return className === null || className === void 0 ? void 0 : className.replace(/[ .]+/g, "-").replace(/[&]+/g, "and").toLowerCase();
  }
  function splitPath(path) {
    var si = path.lastIndexOf("/") + 1;
    var folder = si == 0 ? "" : path.substring(0, si);
    var fileName = si == 0 ? path : path.substring(si);
    return [folder, fileName];
  }
  function resolvePath(path, base) {
    try {
      var prefix = "http://docx/";
      var url = new URL(path, prefix + base).toString();
      return url.substring(prefix.length);
    } catch (_a) {
      return "".concat(base).concat(path);
    }
  }
  function keyBy(array, by) {
    return array.reduce(function(a, x) {
      a[by(x)] = x;
      return a;
    }, {});
  }
  function blobToBase64(blob) {
    return new Promise(function(resolve, _) {
      var reader = new FileReader();
      reader.onloadend = function() {
        return resolve(reader.result.replace(/application\/octet\-stream;/, "image/png;"));
      };
      reader.readAsDataURL(blob);
    });
  }
  function isObject(item) {
    return item && typeof item === "object" && !Array.isArray(item);
  }
  function mergeDeep(target) {
    var _a;
    var sources = [];
    for (var _i = 1; _i < arguments.length; _i++) {
      sources[_i - 1] = arguments[_i];
    }
    if (!sources.length)
      return target;
    var source = sources.shift();
    if (isObject(target) && isObject(source)) {
      for (var key in source) {
        if (isObject(source[key])) {
          var val = (_a = target[key]) !== null && _a !== void 0 ? _a : target[key] = {};
          mergeDeep(val, source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
    return mergeDeep.apply(void 0, __spreadArray([target], sources, false));
  }
  var OpenXmlPackage = function() {
    function OpenXmlPackage2(_zip, options) {
      Object.defineProperty(this, "_zip", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: _zip
      });
      Object.defineProperty(this, "options", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: options
      });
      Object.defineProperty(this, "xmlParser", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: new XmlParser()
      });
    }
    Object.defineProperty(OpenXmlPackage2.prototype, "get", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(path) {
        return this._zip.files[normalizePath(path)];
      }
    });
    Object.defineProperty(OpenXmlPackage2.prototype, "update", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(path, content) {
        this._zip.file(path, content);
      }
    });
    Object.defineProperty(OpenXmlPackage2, "load", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(input, options) {
        return jszip_min.exports.loadAsync(input).then(function(zip) {
          return new OpenXmlPackage2(zip, options);
        });
      }
    });
    Object.defineProperty(OpenXmlPackage2.prototype, "save", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(type) {
        if (type === void 0) {
          type = "blob";
        }
        return this._zip.generateAsync({ type });
      }
    });
    Object.defineProperty(OpenXmlPackage2.prototype, "load", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(path, type) {
        var _a, _b;
        if (type === void 0) {
          type = "string";
        }
        return (_b = (_a = this.get(path)) === null || _a === void 0 ? void 0 : _a.async(type)) !== null && _b !== void 0 ? _b : Promise.resolve(null);
      }
    });
    Object.defineProperty(OpenXmlPackage2.prototype, "loadRelationships", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(path) {
        var _this = this;
        if (path === void 0) {
          path = null;
        }
        var relsPath = "_rels/.rels";
        if (path != null) {
          var _a = splitPath(path), f = _a[0], fn = _a[1];
          relsPath = "".concat(f, "_rels/").concat(fn, ".rels");
        }
        return this.load(relsPath).then(function(txt) {
          return txt ? parseRelationships(_this.parseXmlDocument(txt).firstElementChild, _this.xmlParser) : null;
        });
      }
    });
    Object.defineProperty(OpenXmlPackage2.prototype, "parseXmlDocument", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(txt) {
        return parseXmlString(txt, this.options.trimXmlDeclaration);
      }
    });
    return OpenXmlPackage2;
  }();
  function normalizePath(path) {
    return path.startsWith("/") ? path.substr(1) : path;
  }
  var DocumentPart = function(_super) {
    __extends(DocumentPart2, _super);
    function DocumentPart2(pkg, path, parser) {
      var _this = _super.call(this, pkg, path) || this;
      Object.defineProperty(_this, "_documentParser", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(_this, "body", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      _this._documentParser = parser;
      return _this;
    }
    Object.defineProperty(DocumentPart2.prototype, "parseXml", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(root) {
        this.body = this._documentParser.parseDocumentFile(root);
      }
    });
    return DocumentPart2;
  }(Part);
  function parseBorder(elem, xml) {
    return {
      type: xml.attr(elem, "val"),
      color: xml.attr(elem, "color"),
      size: xml.lengthAttr(elem, "sz", LengthUsage.Border),
      offset: xml.lengthAttr(elem, "space", LengthUsage.Point),
      frame: xml.boolAttr(elem, "frame"),
      shadow: xml.boolAttr(elem, "shadow")
    };
  }
  function parseBorders(elem, xml) {
    var result = {};
    for (var _i = 0, _a = xml.elements(elem); _i < _a.length; _i++) {
      var e = _a[_i];
      switch (e.localName) {
        case "left":
          result.left = parseBorder(e, xml);
          break;
        case "top":
          result.top = parseBorder(e, xml);
          break;
        case "right":
          result.right = parseBorder(e, xml);
          break;
        case "bottom":
          result.bottom = parseBorder(e, xml);
          break;
      }
    }
    return result;
  }
  var SectionType;
  (function(SectionType2) {
    SectionType2["Continuous"] = "continuous";
    SectionType2["NextPage"] = "nextPage";
    SectionType2["NextColumn"] = "nextColumn";
    SectionType2["EvenPage"] = "evenPage";
    SectionType2["OddPage"] = "oddPage";
  })(SectionType || (SectionType = {}));
  function parseSectionProperties(elem, xml) {
    var _a, _b;
    if (xml === void 0) {
      xml = globalXmlParser;
    }
    var section = {};
    for (var _i = 0, _c = xml.elements(elem); _i < _c.length; _i++) {
      var e = _c[_i];
      switch (e.localName) {
        case "pgSz":
          section.pageSize = {
            width: xml.lengthAttr(e, "w"),
            height: xml.lengthAttr(e, "h"),
            orientation: xml.attr(e, "orient")
          };
          break;
        case "type":
          section.type = xml.attr(e, "val");
          break;
        case "pgMar":
          section.pageMargins = {
            left: xml.lengthAttr(e, "left"),
            right: xml.lengthAttr(e, "right"),
            top: xml.lengthAttr(e, "top"),
            bottom: xml.lengthAttr(e, "bottom"),
            header: xml.lengthAttr(e, "header"),
            footer: xml.lengthAttr(e, "footer"),
            gutter: xml.lengthAttr(e, "gutter")
          };
          break;
        case "cols":
          section.columns = parseColumns(e, xml);
          break;
        case "headerReference":
          ((_a = section.headerRefs) !== null && _a !== void 0 ? _a : section.headerRefs = []).push(parseFooterHeaderReference(e, xml));
          break;
        case "footerReference":
          ((_b = section.footerRefs) !== null && _b !== void 0 ? _b : section.footerRefs = []).push(parseFooterHeaderReference(e, xml));
          break;
        case "titlePg":
          section.titlePage = xml.boolAttr(e, "val", true);
          break;
        case "pgBorders":
          section.pageBorders = parseBorders(e, xml);
          break;
        case "pgNumType":
          section.pageNumber = parsePageNumber(e, xml);
          break;
      }
    }
    return section;
  }
  function parseColumns(elem, xml) {
    return {
      numberOfColumns: xml.intAttr(elem, "num"),
      space: xml.lengthAttr(elem, "space"),
      separator: xml.boolAttr(elem, "sep"),
      equalWidth: xml.boolAttr(elem, "equalWidth", true),
      columns: xml.elements(elem, "col").map(function(e) {
        return {
          width: xml.lengthAttr(e, "w"),
          space: xml.lengthAttr(e, "space")
        };
      })
    };
  }
  function parsePageNumber(elem, xml) {
    return {
      chapSep: xml.attr(elem, "chapSep"),
      chapStyle: xml.attr(elem, "chapStyle"),
      format: xml.attr(elem, "fmt"),
      start: xml.intAttr(elem, "start")
    };
  }
  function parseFooterHeaderReference(elem, xml) {
    return {
      id: xml.attr(elem, "id"),
      type: xml.attr(elem, "type")
    };
  }
  function parseLineSpacing(elem, xml) {
    return {
      before: xml.lengthAttr(elem, "before"),
      after: xml.lengthAttr(elem, "after"),
      line: xml.intAttr(elem, "line"),
      lineRule: xml.attr(elem, "lineRule")
    };
  }
  function parseRunProperties(elem, xml) {
    var result = {};
    for (var _i = 0, _a = xml.elements(elem); _i < _a.length; _i++) {
      var el = _a[_i];
      parseRunProperty(el, result, xml);
    }
    return result;
  }
  function parseRunProperty(elem, props, xml) {
    if (parseCommonProperty(elem, props, xml))
      return true;
    return false;
  }
  function parseParagraphProperties(elem, xml) {
    var result = {};
    for (var _i = 0, _a = xml.elements(elem); _i < _a.length; _i++) {
      var el = _a[_i];
      parseParagraphProperty(el, result, xml);
    }
    return result;
  }
  function parseParagraphProperty(elem, props, xml) {
    if (elem.namespaceURI != ns.wordml)
      return false;
    if (parseCommonProperty(elem, props, xml))
      return true;
    switch (elem.localName) {
      case "tabs":
        props.tabs = parseTabs(elem, xml);
        break;
      case "sectPr":
        props.sectionProps = parseSectionProperties(elem, xml);
        break;
      case "numPr":
        props.numbering = parseNumbering$1(elem, xml);
        break;
      case "spacing":
        props.lineSpacing = parseLineSpacing(elem, xml);
        return false;
      case "textAlignment":
        props.textAlignment = xml.attr(elem, "val");
        return false;
      case "keepNext":
        props.keepLines = xml.boolAttr(elem, "val", true);
        break;
      case "pageBreakBefore":
        props.pageBreakBefore = xml.boolAttr(elem, "val", true);
        break;
      case "outlineLvl":
        props.outlineLevel = xml.intAttr(elem, "val");
        break;
      case "pStyle":
        props.styleName = xml.attr(elem, "val");
        break;
      case "rPr":
        props.runProps = parseRunProperties(elem, xml);
        break;
      default:
        return false;
    }
    return true;
  }
  function parseTabs(elem, xml) {
    return xml.elements(elem, "tab").map(function(e) {
      return {
        position: xml.lengthAttr(e, "pos"),
        leader: xml.attr(e, "leader"),
        style: xml.attr(e, "val")
      };
    });
  }
  function parseNumbering$1(elem, xml) {
    var result = {};
    for (var _i = 0, _a = xml.elements(elem); _i < _a.length; _i++) {
      var e = _a[_i];
      switch (e.localName) {
        case "numId":
          result.id = xml.attr(e, "val");
          break;
        case "ilvl":
          result.level = xml.intAttr(e, "val");
          break;
      }
    }
    return result;
  }
  function parseNumberingPart(elem, xml) {
    var result = {
      numberings: [],
      abstractNumberings: [],
      bulletPictures: []
    };
    for (var _i = 0, _a = xml.elements(elem); _i < _a.length; _i++) {
      var e = _a[_i];
      switch (e.localName) {
        case "num":
          result.numberings.push(parseNumbering(e, xml));
          break;
        case "abstractNum":
          result.abstractNumberings.push(parseAbstractNumbering(e, xml));
          break;
        case "numPicBullet":
          result.bulletPictures.push(parseNumberingBulletPicture(e, xml));
          break;
      }
    }
    return result;
  }
  function parseNumbering(elem, xml) {
    var result = {
      id: xml.attr(elem, "numId"),
      overrides: []
    };
    for (var _i = 0, _a = xml.elements(elem); _i < _a.length; _i++) {
      var e = _a[_i];
      switch (e.localName) {
        case "abstractNumId":
          result.abstractId = xml.attr(e, "val");
          break;
        case "lvlOverride":
          result.overrides.push(parseNumberingLevelOverrride(e, xml));
          break;
      }
    }
    return result;
  }
  function parseAbstractNumbering(elem, xml) {
    var result = {
      id: xml.attr(elem, "abstractNumId"),
      levels: []
    };
    for (var _i = 0, _a = xml.elements(elem); _i < _a.length; _i++) {
      var e = _a[_i];
      switch (e.localName) {
        case "name":
          result.name = xml.attr(e, "val");
          break;
        case "multiLevelType":
          result.multiLevelType = xml.attr(e, "val");
          break;
        case "numStyleLink":
          result.numberingStyleLink = xml.attr(e, "val");
          break;
        case "styleLink":
          result.styleLink = xml.attr(e, "val");
          break;
        case "lvl":
          result.levels.push(parseNumberingLevel(e, xml));
          break;
      }
    }
    return result;
  }
  function parseNumberingLevel(elem, xml) {
    var result = {
      level: xml.intAttr(elem, "ilvl")
    };
    for (var _i = 0, _a = xml.elements(elem); _i < _a.length; _i++) {
      var e = _a[_i];
      switch (e.localName) {
        case "start":
          result.start = xml.attr(e, "val");
          break;
        case "lvlRestart":
          result.restart = xml.intAttr(e, "val");
          break;
        case "numFmt":
          result.format = xml.attr(e, "val");
          break;
        case "lvlText":
          result.text = xml.attr(e, "val");
          break;
        case "lvlJc":
          result.justification = xml.attr(e, "val");
          break;
        case "lvlPicBulletId":
          result.bulletPictureId = xml.attr(e, "val");
          break;
        case "pStyle":
          result.paragraphStyle = xml.attr(e, "val");
          break;
        case "pPr":
          result.paragraphProps = parseParagraphProperties(e, xml);
          break;
        case "rPr":
          result.runProps = parseRunProperties(e, xml);
          break;
      }
    }
    return result;
  }
  function parseNumberingLevelOverrride(elem, xml) {
    var result = {
      level: xml.intAttr(elem, "ilvl")
    };
    for (var _i = 0, _a = xml.elements(elem); _i < _a.length; _i++) {
      var e = _a[_i];
      switch (e.localName) {
        case "startOverride":
          result.start = xml.intAttr(e, "val");
          break;
        case "lvl":
          result.numberingLevel = parseNumberingLevel(e, xml);
          break;
      }
    }
    return result;
  }
  function parseNumberingBulletPicture(elem, xml) {
    var pict = xml.element(elem, "pict");
    var shape = pict && xml.element(pict, "shape");
    var imagedata = shape && xml.element(shape, "imagedata");
    return imagedata ? {
      id: xml.attr(elem, "numPicBulletId"),
      referenceId: xml.attr(imagedata, "id"),
      style: xml.attr(shape, "style")
    } : null;
  }
  var NumberingPart = function(_super) {
    __extends(NumberingPart2, _super);
    function NumberingPart2(pkg, path, parser) {
      var _this = _super.call(this, pkg, path) || this;
      Object.defineProperty(_this, "_documentParser", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(_this, "numberings", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(_this, "abstractNumberings", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(_this, "bulletPictures", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(_this, "domNumberings", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      _this._documentParser = parser;
      return _this;
    }
    Object.defineProperty(NumberingPart2.prototype, "parseXml", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(root) {
        Object.assign(this, parseNumberingPart(root, this._package.xmlParser));
        this.domNumberings = this._documentParser.parseNumberingFile(root);
      }
    });
    return NumberingPart2;
  }(Part);
  var StylesPart = function(_super) {
    __extends(StylesPart2, _super);
    function StylesPart2(pkg, path, parser) {
      var _this = _super.call(this, pkg, path) || this;
      Object.defineProperty(_this, "styles", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(_this, "_documentParser", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      _this._documentParser = parser;
      return _this;
    }
    Object.defineProperty(StylesPart2.prototype, "parseXml", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(root) {
        this.styles = this._documentParser.parseStylesFile(root);
      }
    });
    return StylesPart2;
  }(Part);
  var DomType;
  (function(DomType2) {
    DomType2["Document"] = "document";
    DomType2["Paragraph"] = "paragraph";
    DomType2["Run"] = "run";
    DomType2["Break"] = "break";
    DomType2["NoBreakHyphen"] = "noBreakHyphen";
    DomType2["Table"] = "table";
    DomType2["Row"] = "row";
    DomType2["Cell"] = "cell";
    DomType2["Hyperlink"] = "hyperlink";
    DomType2["Drawing"] = "drawing";
    DomType2["Image"] = "image";
    DomType2["Text"] = "text";
    DomType2["Tab"] = "tab";
    DomType2["Symbol"] = "symbol";
    DomType2["BookmarkStart"] = "bookmarkStart";
    DomType2["BookmarkEnd"] = "bookmarkEnd";
    DomType2["Footer"] = "footer";
    DomType2["Header"] = "header";
    DomType2["FootnoteReference"] = "footnoteReference";
    DomType2["EndnoteReference"] = "endnoteReference";
    DomType2["Footnote"] = "footnote";
    DomType2["Endnote"] = "endnote";
    DomType2["SimpleField"] = "simpleField";
    DomType2["ComplexField"] = "complexField";
    DomType2["Instruction"] = "instruction";
  })(DomType || (DomType = {}));
  var WmlHeader = function() {
    function WmlHeader2() {
      Object.defineProperty(this, "type", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: DomType.Header
      });
      Object.defineProperty(this, "children", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: []
      });
      Object.defineProperty(this, "cssStyle", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: {}
      });
      Object.defineProperty(this, "className", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "parent", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
    }
    return WmlHeader2;
  }();
  var WmlFooter = function() {
    function WmlFooter2() {
      Object.defineProperty(this, "type", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: DomType.Footer
      });
      Object.defineProperty(this, "children", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: []
      });
      Object.defineProperty(this, "cssStyle", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: {}
      });
      Object.defineProperty(this, "className", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "parent", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
    }
    return WmlFooter2;
  }();
  var BaseHeaderFooterPart = function(_super) {
    __extends(BaseHeaderFooterPart2, _super);
    function BaseHeaderFooterPart2(pkg, path, parser) {
      var _this = _super.call(this, pkg, path) || this;
      Object.defineProperty(_this, "rootElement", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(_this, "_documentParser", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      _this._documentParser = parser;
      return _this;
    }
    Object.defineProperty(BaseHeaderFooterPart2.prototype, "parseXml", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(root) {
        this.rootElement = this.createRootElement();
        this.rootElement.children = this._documentParser.parseBodyElements(root);
      }
    });
    return BaseHeaderFooterPart2;
  }(Part);
  var HeaderPart = function(_super) {
    __extends(HeaderPart2, _super);
    function HeaderPart2() {
      return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(HeaderPart2.prototype, "createRootElement", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function() {
        return new WmlHeader();
      }
    });
    return HeaderPart2;
  }(BaseHeaderFooterPart);
  var FooterPart = function(_super) {
    __extends(FooterPart2, _super);
    function FooterPart2() {
      return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(FooterPart2.prototype, "createRootElement", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function() {
        return new WmlFooter();
      }
    });
    return FooterPart2;
  }(BaseHeaderFooterPart);
  function parseExtendedProps(root, xmlParser) {
    var result = {};
    for (var _i = 0, _a = xmlParser.elements(root); _i < _a.length; _i++) {
      var el = _a[_i];
      switch (el.localName) {
        case "Template":
          result.template = el.textContent;
          break;
        case "Pages":
          result.pages = safeParseToInt(el.textContent);
          break;
        case "Words":
          result.words = safeParseToInt(el.textContent);
          break;
        case "Characters":
          result.characters = safeParseToInt(el.textContent);
          break;
        case "Application":
          result.application = el.textContent;
          break;
        case "Lines":
          result.lines = safeParseToInt(el.textContent);
          break;
        case "Paragraphs":
          result.paragraphs = safeParseToInt(el.textContent);
          break;
        case "Company":
          result.company = el.textContent;
          break;
        case "AppVersion":
          result.appVersion = el.textContent;
          break;
      }
    }
    return result;
  }
  function safeParseToInt(value) {
    if (typeof value === "undefined")
      return;
    return parseInt(value);
  }
  var ExtendedPropsPart = function(_super) {
    __extends(ExtendedPropsPart2, _super);
    function ExtendedPropsPart2() {
      var _this = _super !== null && _super.apply(this, arguments) || this;
      Object.defineProperty(_this, "props", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      return _this;
    }
    Object.defineProperty(ExtendedPropsPart2.prototype, "parseXml", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(root) {
        this.props = parseExtendedProps(root, this._package.xmlParser);
      }
    });
    return ExtendedPropsPart2;
  }(Part);
  function parseCoreProps(root, xmlParser) {
    var result = {};
    for (var _i = 0, _a = xmlParser.elements(root); _i < _a.length; _i++) {
      var el = _a[_i];
      switch (el.localName) {
        case "title":
          result.title = el.textContent;
          break;
        case "description":
          result.description = el.textContent;
          break;
        case "subject":
          result.subject = el.textContent;
          break;
        case "creator":
          result.creator = el.textContent;
          break;
        case "keywords":
          result.keywords = el.textContent;
          break;
        case "language":
          result.language = el.textContent;
          break;
        case "lastModifiedBy":
          result.lastModifiedBy = el.textContent;
          break;
        case "revision":
          el.textContent && (result.revision = parseInt(el.textContent));
          break;
      }
    }
    return result;
  }
  var CorePropsPart = function(_super) {
    __extends(CorePropsPart2, _super);
    function CorePropsPart2() {
      var _this = _super !== null && _super.apply(this, arguments) || this;
      Object.defineProperty(_this, "props", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      return _this;
    }
    Object.defineProperty(CorePropsPart2.prototype, "parseXml", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(root) {
        this.props = parseCoreProps(root, this._package.xmlParser);
      }
    });
    return CorePropsPart2;
  }(Part);
  var DmlTheme = function() {
    function DmlTheme2() {
      Object.defineProperty(this, "colorScheme", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "fontScheme", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
    }
    return DmlTheme2;
  }();
  function parseTheme(elem, xml) {
    var result = new DmlTheme();
    var themeElements = xml.element(elem, "themeElements");
    for (var _i = 0, _a = xml.elements(themeElements); _i < _a.length; _i++) {
      var el = _a[_i];
      switch (el.localName) {
        case "clrScheme":
          result.colorScheme = parseColorScheme(el, xml);
          break;
        case "fontScheme":
          result.fontScheme = parseFontScheme(el, xml);
          break;
      }
    }
    return result;
  }
  function parseColorScheme(elem, xml) {
    var result = {
      name: xml.attr(elem, "name"),
      colors: {}
    };
    for (var _i = 0, _a = xml.elements(elem); _i < _a.length; _i++) {
      var el = _a[_i];
      var srgbClr = xml.element(el, "srgbClr");
      var sysClr = xml.element(el, "sysClr");
      if (srgbClr) {
        result.colors[el.localName] = xml.attr(srgbClr, "val");
      } else if (sysClr) {
        result.colors[el.localName] = xml.attr(sysClr, "lastClr");
      }
    }
    return result;
  }
  function parseFontScheme(elem, xml) {
    var result = {
      name: xml.attr(elem, "name")
    };
    for (var _i = 0, _a = xml.elements(elem); _i < _a.length; _i++) {
      var el = _a[_i];
      switch (el.localName) {
        case "majorFont":
          result.majorFont = parseFontInfo(el, xml);
          break;
        case "minorFont":
          result.minorFont = parseFontInfo(el, xml);
          break;
      }
    }
    return result;
  }
  function parseFontInfo(elem, xml) {
    return {
      latinTypeface: xml.elementAttr(elem, "latin", "typeface"),
      eaTypeface: xml.elementAttr(elem, "ea", "typeface"),
      csTypeface: xml.elementAttr(elem, "cs", "typeface")
    };
  }
  var ThemePart = function(_super) {
    __extends(ThemePart2, _super);
    function ThemePart2(pkg, path) {
      var _this = _super.call(this, pkg, path) || this;
      Object.defineProperty(_this, "theme", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      return _this;
    }
    Object.defineProperty(ThemePart2.prototype, "parseXml", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(root) {
        this.theme = parseTheme(root, this._package.xmlParser);
      }
    });
    return ThemePart2;
  }(Part);
  var WmlBaseNote = function() {
    function WmlBaseNote2() {
      Object.defineProperty(this, "id", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "type", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "noteType", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "children", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: []
      });
      Object.defineProperty(this, "cssStyle", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: {}
      });
      Object.defineProperty(this, "className", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "parent", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
    }
    return WmlBaseNote2;
  }();
  var WmlFootnote = function(_super) {
    __extends(WmlFootnote2, _super);
    function WmlFootnote2() {
      var _this = _super !== null && _super.apply(this, arguments) || this;
      Object.defineProperty(_this, "type", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: DomType.Footnote
      });
      return _this;
    }
    return WmlFootnote2;
  }(WmlBaseNote);
  var WmlEndnote = function(_super) {
    __extends(WmlEndnote2, _super);
    function WmlEndnote2() {
      var _this = _super !== null && _super.apply(this, arguments) || this;
      Object.defineProperty(_this, "type", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: DomType.Endnote
      });
      return _this;
    }
    return WmlEndnote2;
  }(WmlBaseNote);
  var BaseNotePart = function(_super) {
    __extends(BaseNotePart2, _super);
    function BaseNotePart2(pkg, path, parser) {
      var _this = _super.call(this, pkg, path) || this;
      Object.defineProperty(_this, "_documentParser", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(_this, "notes", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      _this._documentParser = parser;
      return _this;
    }
    return BaseNotePart2;
  }(Part);
  var FootnotesPart = function(_super) {
    __extends(FootnotesPart2, _super);
    function FootnotesPart2(pkg, path, parser) {
      return _super.call(this, pkg, path, parser) || this;
    }
    Object.defineProperty(FootnotesPart2.prototype, "parseXml", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(root) {
        this.notes = this._documentParser.parseNotes(root, "footnote", WmlFootnote);
      }
    });
    return FootnotesPart2;
  }(BaseNotePart);
  var EndnotesPart = function(_super) {
    __extends(EndnotesPart2, _super);
    function EndnotesPart2(pkg, path, parser) {
      return _super.call(this, pkg, path, parser) || this;
    }
    Object.defineProperty(EndnotesPart2.prototype, "parseXml", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(root) {
        this.notes = this._documentParser.parseNotes(root, "endnote", WmlEndnote);
      }
    });
    return EndnotesPart2;
  }(BaseNotePart);
  function parseSettings(elem, xml) {
    var result = {};
    for (var _i = 0, _a = xml.elements(elem); _i < _a.length; _i++) {
      var el = _a[_i];
      switch (el.localName) {
        case "defaultTabStop":
          result.defaultTabStop = xml.lengthAttr(el, "val");
          break;
        case "footnotePr":
          result.footnoteProps = parseNoteProperties(el, xml);
          break;
        case "endnotePr":
          result.endnoteProps = parseNoteProperties(el, xml);
          break;
        case "autoHyphenation":
          result.autoHyphenation = xml.boolAttr(el, "val");
          break;
      }
    }
    return result;
  }
  function parseNoteProperties(elem, xml) {
    var result = {
      defaultNoteIds: []
    };
    for (var _i = 0, _a = xml.elements(elem); _i < _a.length; _i++) {
      var el = _a[_i];
      switch (el.localName) {
        case "numFmt":
          result.nummeringFormat = xml.attr(el, "val");
          break;
        case "footnote":
        case "endnote":
          result.defaultNoteIds.push(xml.attr(el, "id"));
          break;
      }
    }
    return result;
  }
  var SettingsPart = function(_super) {
    __extends(SettingsPart2, _super);
    function SettingsPart2(pkg, path) {
      var _this = _super.call(this, pkg, path) || this;
      Object.defineProperty(_this, "settings", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      return _this;
    }
    Object.defineProperty(SettingsPart2.prototype, "parseXml", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(root) {
        this.settings = parseSettings(root, this._package.xmlParser);
      }
    });
    return SettingsPart2;
  }(Part);
  function parseCustomProps(root, xml) {
    return xml.elements(root, "property").map(function(e) {
      var firstChild = e.firstChild;
      return {
        formatId: xml.attr(e, "fmtid"),
        name: xml.attr(e, "name"),
        type: firstChild.nodeName,
        value: firstChild.textContent
      };
    });
  }
  var CustomPropsPart = function(_super) {
    __extends(CustomPropsPart2, _super);
    function CustomPropsPart2() {
      var _this = _super !== null && _super.apply(this, arguments) || this;
      Object.defineProperty(_this, "props", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      return _this;
    }
    Object.defineProperty(CustomPropsPart2.prototype, "parseXml", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(root) {
        this.props = parseCustomProps(root, this._package.xmlParser);
      }
    });
    return CustomPropsPart2;
  }(Part);
  var topLevelRels = [
    { type: RelationshipTypes.OfficeDocument, target: "word/document.xml" },
    { type: RelationshipTypes.ExtendedProperties, target: "docProps/app.xml" },
    { type: RelationshipTypes.CoreProperties, target: "docProps/core.xml" },
    { type: RelationshipTypes.CustomProperties, target: "docProps/custom.xml" }
  ];
  var WordDocument = function() {
    function WordDocument2() {
      Object.defineProperty(this, "_package", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "_parser", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "_options", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "rels", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "parts", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: []
      });
      Object.defineProperty(this, "partsMap", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: {}
      });
      Object.defineProperty(this, "documentPart", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "fontTablePart", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "numberingPart", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "stylesPart", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "footnotesPart", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "endnotesPart", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "themePart", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "corePropsPart", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "extendedPropsPart", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "settingsPart", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
    }
    Object.defineProperty(WordDocument2, "load", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(blob, parser, options) {
        var d2 = new WordDocument2();
        d2._options = options;
        d2._parser = parser;
        return OpenXmlPackage.load(blob, options).then(function(pkg) {
          d2._package = pkg;
          return d2._package.loadRelationships();
        }).then(function(rels) {
          d2.rels = rels;
          var tasks = topLevelRels.map(function(rel) {
            var _a;
            var r = (_a = rels.find(function(x) {
              return x.type === rel.type;
            })) !== null && _a !== void 0 ? _a : rel;
            return d2.loadRelationshipPart(r.target, r.type);
          });
          return Promise.all(tasks);
        }).then(function() {
          return d2;
        });
      }
    });
    Object.defineProperty(WordDocument2.prototype, "save", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(type) {
        if (type === void 0) {
          type = "blob";
        }
        return this._package.save(type);
      }
    });
    Object.defineProperty(WordDocument2.prototype, "loadRelationshipPart", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(path, type) {
        var _this = this;
        if (this.partsMap[path])
          return Promise.resolve(this.partsMap[path]);
        if (!this._package.get(path))
          return Promise.resolve(null);
        var part = null;
        switch (type) {
          case RelationshipTypes.OfficeDocument:
            this.documentPart = part = new DocumentPart(this._package, path, this._parser);
            break;
          case RelationshipTypes.FontTable:
            this.fontTablePart = part = new FontTablePart(this._package, path);
            break;
          case RelationshipTypes.Numbering:
            this.numberingPart = part = new NumberingPart(this._package, path, this._parser);
            break;
          case RelationshipTypes.Styles:
            this.stylesPart = part = new StylesPart(this._package, path, this._parser);
            break;
          case RelationshipTypes.Theme:
            this.themePart = part = new ThemePart(this._package, path);
            break;
          case RelationshipTypes.Footnotes:
            this.footnotesPart = part = new FootnotesPart(this._package, path, this._parser);
            break;
          case RelationshipTypes.Endnotes:
            this.endnotesPart = part = new EndnotesPart(this._package, path, this._parser);
            break;
          case RelationshipTypes.Footer:
            part = new FooterPart(this._package, path, this._parser);
            break;
          case RelationshipTypes.Header:
            part = new HeaderPart(this._package, path, this._parser);
            break;
          case RelationshipTypes.CoreProperties:
            this.corePropsPart = part = new CorePropsPart(this._package, path);
            break;
          case RelationshipTypes.ExtendedProperties:
            this.extendedPropsPart = part = new ExtendedPropsPart(this._package, path);
            break;
          case RelationshipTypes.CustomProperties:
            part = new CustomPropsPart(this._package, path);
            break;
          case RelationshipTypes.Settings:
            this.settingsPart = part = new SettingsPart(this._package, path);
            break;
        }
        if (part == null)
          return Promise.resolve(null);
        this.partsMap[path] = part;
        this.parts.push(part);
        return part.load().then(function() {
          if (part.rels == null || part.rels.length == 0)
            return part;
          var folder = splitPath(part.path)[0];
          var rels = part.rels.map(function(rel) {
            return _this.loadRelationshipPart(resolvePath(rel.target, folder), rel.type);
          });
          return Promise.all(rels).then(function() {
            return part;
          });
        });
      }
    });
    Object.defineProperty(WordDocument2.prototype, "loadDocumentImage", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(id, part) {
        var _this = this;
        return this.loadResource(part !== null && part !== void 0 ? part : this.documentPart, id, "blob").then(function(x) {
          return _this.blobToURL(x);
        });
      }
    });
    Object.defineProperty(WordDocument2.prototype, "loadNumberingImage", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(id) {
        var _this = this;
        return this.loadResource(this.numberingPart, id, "blob").then(function(x) {
          return _this.blobToURL(x);
        });
      }
    });
    Object.defineProperty(WordDocument2.prototype, "loadFont", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(id, key) {
        var _this = this;
        return this.loadResource(this.fontTablePart, id, "uint8array").then(function(x) {
          return x ? _this.blobToURL(new Blob([deobfuscate(x, key)])) : x;
        });
      }
    });
    Object.defineProperty(WordDocument2.prototype, "blobToURL", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(blob) {
        if (!blob)
          return null;
        if (this._options.useBase64URL) {
          return blobToBase64(blob);
        }
        return URL.createObjectURL(blob);
      }
    });
    Object.defineProperty(WordDocument2.prototype, "findPartByRelId", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(id, basePart) {
        var _a;
        if (basePart === void 0) {
          basePart = null;
        }
        var rel = ((_a = basePart.rels) !== null && _a !== void 0 ? _a : this.rels).find(function(r) {
          return r.id == id;
        });
        var folder = basePart ? splitPath(basePart.path)[0] : "";
        return rel ? this.partsMap[resolvePath(rel.target, folder)] : null;
      }
    });
    Object.defineProperty(WordDocument2.prototype, "getPathById", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(part, id) {
        var rel = part.rels.find(function(x) {
          return x.id == id;
        });
        var folder = splitPath(part.path)[0];
        return rel ? resolvePath(rel.target, folder) : null;
      }
    });
    Object.defineProperty(WordDocument2.prototype, "loadResource", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(part, id, outputType) {
        var path = this.getPathById(part, id);
        return path ? this._package.load(path, outputType) : Promise.resolve(null);
      }
    });
    return WordDocument2;
  }();
  function deobfuscate(data, guidKey) {
    var len = 16;
    var trimmed = guidKey.replace(/{|}|-/g, "");
    var numbers = new Array(len);
    for (var i = 0; i < len; i++)
      numbers[len - i - 1] = parseInt(trimmed.substr(i * 2, 2), 16);
    for (var i = 0; i < 32; i++)
      data[i] = data[i] ^ numbers[i % len];
    return data;
  }
  function parseBookmarkStart(elem, xml) {
    return {
      type: DomType.BookmarkStart,
      id: xml.attr(elem, "id"),
      name: xml.attr(elem, "name"),
      colFirst: xml.intAttr(elem, "colFirst"),
      colLast: xml.intAttr(elem, "colLast")
    };
  }
  function parseBookmarkEnd(elem, xml) {
    return {
      type: DomType.BookmarkEnd,
      id: xml.attr(elem, "id")
    };
  }
  var autos = {
    shd: "inherit",
    color: "black",
    borderColor: "black",
    highlight: "transparent"
  };
  var DocumentParser = function() {
    function DocumentParser2(options) {
      Object.defineProperty(this, "options", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      this.options = __assign({ ignoreWidth: false, debug: false }, options);
    }
    Object.defineProperty(DocumentParser2.prototype, "parseNotes", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(xmlDoc, elemName, elemClass) {
        var result = [];
        for (var _i = 0, _a = globalXmlParser.elements(xmlDoc, elemName); _i < _a.length; _i++) {
          var el = _a[_i];
          var node = new elemClass();
          node.id = globalXmlParser.attr(el, "id");
          node.noteType = globalXmlParser.attr(el, "type");
          node.children = this.parseBodyElements(el);
          result.push(node);
        }
        return result;
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseDocumentFile", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(xmlDoc) {
        var xbody = globalXmlParser.element(xmlDoc, "body");
        var background = globalXmlParser.element(xmlDoc, "background");
        var sectPr = globalXmlParser.element(xbody, "sectPr");
        return {
          type: DomType.Document,
          children: this.parseBodyElements(xbody),
          props: sectPr ? parseSectionProperties(sectPr, globalXmlParser) : null,
          cssStyle: background ? this.parseBackground(background) : {}
        };
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseBackground", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem) {
        var result = {};
        var color = xmlUtil.colorAttr(elem, "color");
        if (color) {
          result["background-color"] = color;
        }
        return result;
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseBodyElements", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(element) {
        var _this = this;
        var children = [];
        xmlUtil.foreach(element, function(elem) {
          switch (elem.localName) {
            case "p":
              children.push(_this.parseParagraph(elem));
              break;
            case "tbl":
              children.push(_this.parseTable(elem));
              break;
            case "sdt":
              _this.parseSdt(elem).forEach(function(el) {
                return children.push(el);
              });
              break;
          }
        });
        return children;
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseStylesFile", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(xstyles) {
        var _this = this;
        var result = [];
        xmlUtil.foreach(xstyles, function(n) {
          switch (n.localName) {
            case "style":
              result.push(_this.parseStyle(n));
              break;
            case "docDefaults":
              result.push(_this.parseDefaultStyles(n));
              break;
          }
        });
        return result;
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseDefaultStyles", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(node) {
        var _this = this;
        var result = {
          id: null,
          name: null,
          target: null,
          basedOn: null,
          styles: []
        };
        xmlUtil.foreach(node, function(c) {
          switch (c.localName) {
            case "rPrDefault":
              var rPr = globalXmlParser.element(c, "rPr");
              if (rPr)
                result.styles.push({
                  target: "span",
                  values: _this.parseDefaultProperties(rPr, {})
                });
              break;
            case "pPrDefault":
              var pPr = globalXmlParser.element(c, "pPr");
              if (pPr)
                result.styles.push({
                  target: "p",
                  values: _this.parseDefaultProperties(pPr, {})
                });
              break;
          }
        });
        return result;
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseStyle", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(node) {
        var _this = this;
        var result = {
          id: globalXmlParser.attr(node, "styleId"),
          isDefault: globalXmlParser.boolAttr(node, "default"),
          name: null,
          target: null,
          basedOn: null,
          styles: [],
          linked: null
        };
        switch (globalXmlParser.attr(node, "type")) {
          case "paragraph":
            result.target = "p";
            break;
          case "table":
            result.target = "table";
            break;
          case "character":
            result.target = "span";
            break;
        }
        xmlUtil.foreach(node, function(n) {
          switch (n.localName) {
            case "basedOn":
              result.basedOn = globalXmlParser.attr(n, "val");
              break;
            case "name":
              result.name = globalXmlParser.attr(n, "val");
              break;
            case "link":
              result.linked = globalXmlParser.attr(n, "val");
              break;
            case "next":
              result.next = globalXmlParser.attr(n, "val");
              break;
            case "aliases":
              result.aliases = globalXmlParser.attr(n, "val").split(",");
              break;
            case "pPr":
              result.styles.push({
                target: "p",
                values: _this.parseDefaultProperties(n, {})
              });
              result.paragraphProps = parseParagraphProperties(n, globalXmlParser);
              break;
            case "rPr":
              result.styles.push({
                target: "span",
                values: _this.parseDefaultProperties(n, {})
              });
              result.runProps = parseRunProperties(n, globalXmlParser);
              break;
            case "tblPr":
            case "tcPr":
              result.styles.push({
                target: "td",
                values: _this.parseDefaultProperties(n, {})
              });
              break;
            case "tblStylePr":
              for (var _i = 0, _a = _this.parseTableStyle(n); _i < _a.length; _i++) {
                var s2 = _a[_i];
                result.styles.push(s2);
              }
              break;
            case "rsid":
            case "qFormat":
            case "hidden":
            case "semiHidden":
            case "unhideWhenUsed":
            case "autoRedefine":
            case "uiPriority":
              break;
            default:
              _this.options.debug && console.warn("DOCX: Unknown style element: ".concat(n.localName));
          }
        });
        return result;
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseTableStyle", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(node) {
        var _this = this;
        var result = [];
        var type = globalXmlParser.attr(node, "type");
        var selector = "";
        var modificator = "";
        switch (type) {
          case "firstRow":
            modificator = ".first-row";
            selector = "tr.first-row td";
            break;
          case "lastRow":
            modificator = ".last-row";
            selector = "tr.last-row td";
            break;
          case "firstCol":
            modificator = ".first-col";
            selector = "td.first-col";
            break;
          case "lastCol":
            modificator = ".last-col";
            selector = "td.last-col";
            break;
          case "band1Vert":
            modificator = ":not(.no-vband)";
            selector = "td.odd-col";
            break;
          case "band2Vert":
            modificator = ":not(.no-vband)";
            selector = "td.even-col";
            break;
          case "band1Horz":
            modificator = ":not(.no-hband)";
            selector = "tr.odd-row";
            break;
          case "band2Horz":
            modificator = ":not(.no-hband)";
            selector = "tr.even-row";
            break;
          default:
            return [];
        }
        xmlUtil.foreach(node, function(n) {
          switch (n.localName) {
            case "pPr":
              result.push({
                target: "".concat(selector, " p"),
                mod: modificator,
                values: _this.parseDefaultProperties(n, {})
              });
              break;
            case "rPr":
              result.push({
                target: "".concat(selector, " span"),
                mod: modificator,
                values: _this.parseDefaultProperties(n, {})
              });
              break;
            case "tblPr":
            case "tcPr":
              result.push({
                target: selector,
                mod: modificator,
                values: _this.parseDefaultProperties(n, {})
              });
              break;
          }
        });
        return result;
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseNumberingFile", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(xnums) {
        var _this = this;
        var result = [];
        var mapping = {};
        var bullets = [];
        xmlUtil.foreach(xnums, function(n) {
          switch (n.localName) {
            case "abstractNum":
              _this.parseAbstractNumbering(n, bullets).forEach(function(x) {
                return result.push(x);
              });
              break;
            case "numPicBullet":
              bullets.push(_this.parseNumberingPicBullet(n));
              break;
            case "num":
              var numId = globalXmlParser.attr(n, "numId");
              var abstractNumId = globalXmlParser.elementAttr(n, "abstractNumId", "val");
              mapping[abstractNumId] = numId;
              break;
          }
        });
        result.forEach(function(x) {
          return x.id = mapping[x.id];
        });
        return result;
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseNumberingPicBullet", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem) {
        var pict = globalXmlParser.element(elem, "pict");
        var shape = pict && globalXmlParser.element(pict, "shape");
        var imagedata = shape && globalXmlParser.element(shape, "imagedata");
        return imagedata ? {
          id: globalXmlParser.intAttr(elem, "numPicBulletId"),
          src: globalXmlParser.attr(imagedata, "id"),
          style: globalXmlParser.attr(shape, "style")
        } : null;
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseAbstractNumbering", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(node, bullets) {
        var _this = this;
        var result = [];
        var id = globalXmlParser.attr(node, "abstractNumId");
        xmlUtil.foreach(node, function(n) {
          switch (n.localName) {
            case "lvl":
              result.push(_this.parseNumberingLevel(id, n, bullets));
              break;
          }
        });
        return result;
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseNumberingLevel", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(id, node, bullets) {
        var _this = this;
        var result = {
          id,
          level: globalXmlParser.intAttr(node, "ilvl"),
          pStyleName: void 0,
          pStyle: {},
          rStyle: {},
          suff: "tab"
        };
        xmlUtil.foreach(node, function(n) {
          switch (n.localName) {
            case "pPr":
              _this.parseDefaultProperties(n, result.pStyle);
              break;
            case "rPr":
              _this.parseDefaultProperties(n, result.rStyle);
              break;
            case "lvlPicBulletId":
              var id2 = globalXmlParser.intAttr(n, "val");
              result.bullet = bullets.find(function(x) {
                return x.id == id2;
              });
              break;
            case "lvlText":
              result.levelText = globalXmlParser.attr(n, "val");
              break;
            case "pStyle":
              result.pStyleName = globalXmlParser.attr(n, "val");
              break;
            case "numFmt":
              result.format = globalXmlParser.attr(n, "val");
              break;
            case "suff":
              result.suff = globalXmlParser.attr(n, "val");
              break;
          }
        });
        return result;
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseSdt", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(node) {
        var sdtContent = globalXmlParser.element(node, "sdtContent");
        return sdtContent ? this.parseBodyElements(sdtContent) : [];
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseParagraph", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(node) {
        var _this = this;
        var result = { type: DomType.Paragraph, children: [] };
        xmlUtil.foreach(node, function(c) {
          switch (c.localName) {
            case "r":
              result.children.push(_this.parseRun(c, result));
              break;
            case "hyperlink":
              result.children.push(_this.parseHyperlink(c, result));
              break;
            case "bookmarkStart":
              result.children.push(parseBookmarkStart(c, globalXmlParser));
              break;
            case "bookmarkEnd":
              result.children.push(parseBookmarkEnd(c, globalXmlParser));
              break;
            case "pPr":
              _this.parseParagraphProperties(c, result);
              break;
          }
        });
        return result;
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseParagraphProperties", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem, paragraph) {
        var _this = this;
        this.parseDefaultProperties(elem, paragraph.cssStyle = {}, null, function(c) {
          if (parseParagraphProperty(c, paragraph, globalXmlParser))
            return true;
          switch (c.localName) {
            case "pStyle":
              paragraph.styleName = globalXmlParser.attr(c, "val");
              break;
            case "cnfStyle":
              paragraph.className = values.classNameOfCnfStyle(c);
              break;
            case "framePr":
              _this.parseFrame(c, paragraph);
              break;
            case "rPr":
              break;
            default:
              return false;
          }
          return true;
        });
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseFrame", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(node, paragraph) {
        var dropCap = globalXmlParser.attr(node, "dropCap");
        if (dropCap == "drop")
          paragraph.cssStyle["float"] = "left";
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseHyperlink", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(node, parent) {
        var _this = this;
        var result = { type: DomType.Hyperlink, parent, children: [] };
        var anchor = globalXmlParser.attr(node, "anchor");
        if (anchor)
          result.href = "#" + anchor;
        xmlUtil.foreach(node, function(c) {
          switch (c.localName) {
            case "r":
              result.children.push(_this.parseRun(c, result));
              break;
          }
        });
        return result;
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseRun", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(node, parent) {
        var _this = this;
        var result = { type: DomType.Run, parent, children: [] };
        xmlUtil.foreach(node, function(c) {
          switch (c.localName) {
            case "t":
              result.children.push({
                type: DomType.Text,
                text: c.textContent
              });
              break;
            case "fldSimple":
              result.children.push({
                type: DomType.SimpleField,
                instruction: globalXmlParser.attr(c, "instr"),
                lock: globalXmlParser.boolAttr(c, "lock", false),
                dirty: globalXmlParser.boolAttr(c, "dirty", false)
              });
              break;
            case "instrText":
              result.fieldRun = true;
              result.children.push({
                type: DomType.Instruction,
                text: c.textContent
              });
              break;
            case "fldChar":
              result.fieldRun = true;
              result.children.push({
                type: DomType.ComplexField,
                charType: globalXmlParser.attr(c, "fldCharType"),
                lock: globalXmlParser.boolAttr(c, "lock", false),
                dirty: globalXmlParser.boolAttr(c, "dirty", false)
              });
              break;
            case "noBreakHyphen":
              result.children.push({ type: DomType.NoBreakHyphen });
              break;
            case "br":
              result.children.push({
                type: DomType.Break,
                break: globalXmlParser.attr(c, "type") || "textWrapping"
              });
              break;
            case "lastRenderedPageBreak":
              result.children.push({
                type: DomType.Break,
                break: "lastRenderedPageBreak"
              });
              break;
            case "sym":
              result.children.push({
                type: DomType.Symbol,
                font: Math.ceil(parseInt(globalXmlParser.attr(c, "font")) * 4 / 3) + "px",
                char: globalXmlParser.attr(c, "char")
              });
              break;
            case "tab":
              result.children.push({ type: DomType.Tab });
              break;
            case "footnoteReference":
              result.children.push({
                type: DomType.FootnoteReference,
                id: globalXmlParser.attr(c, "id")
              });
              break;
            case "endnoteReference":
              result.children.push({
                type: DomType.EndnoteReference,
                id: globalXmlParser.attr(c, "id")
              });
              break;
            case "drawing":
              var d2 = _this.parseDrawing(c);
              if (d2)
                result.children = [d2];
              break;
            case "rPr":
              _this.parseRunProperties(c, result);
              break;
          }
        });
        return result;
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseRunProperties", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem, run) {
        this.parseDefaultProperties(elem, run.cssStyle = {}, null, function(c) {
          switch (c.localName) {
            case "rStyle":
              run.styleName = globalXmlParser.attr(c, "val");
              break;
            case "vertAlign":
              run.verticalAlign = values.valueOfVertAlign(c, true);
              break;
            default:
              return false;
          }
          return true;
        });
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseDrawing", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(node) {
        for (var _i = 0, _a = globalXmlParser.elements(node); _i < _a.length; _i++) {
          var n = _a[_i];
          switch (n.localName) {
            case "inline":
            case "anchor":
              return this.parseDrawingWrapper(n);
          }
        }
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseDrawingWrapper", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(node) {
        var _a;
        var result = { type: DomType.Drawing, children: [], cssStyle: {} };
        var isAnchor = node.localName == "anchor";
        var wrapType = null;
        var simplePos = globalXmlParser.boolAttr(node, "simplePos");
        var posX = { relative: "page", align: "left", offset: "0" };
        var posY = { relative: "page", align: "top", offset: "0" };
        for (var _i = 0, _b = globalXmlParser.elements(node); _i < _b.length; _i++) {
          var n = _b[_i];
          switch (n.localName) {
            case "simplePos":
              if (simplePos) {
                posX.offset = globalXmlParser.lengthAttr(n, "x", LengthUsage.Emu);
                posY.offset = globalXmlParser.lengthAttr(n, "y", LengthUsage.Emu);
              }
              break;
            case "extent":
              result.cssStyle["width"] = globalXmlParser.lengthAttr(n, "cx", LengthUsage.Emu);
              result.cssStyle["height"] = globalXmlParser.lengthAttr(n, "cy", LengthUsage.Emu);
              break;
            case "positionH":
            case "positionV":
              if (!simplePos) {
                var pos = n.localName == "positionH" ? posX : posY;
                var alignNode = globalXmlParser.element(n, "align");
                var offsetNode = globalXmlParser.element(n, "posOffset");
                pos.relative = (_a = globalXmlParser.attr(n, "relativeFrom")) !== null && _a !== void 0 ? _a : pos.relative;
                if (alignNode)
                  pos.align = alignNode.textContent;
                if (offsetNode)
                  pos.offset = xmlUtil.sizeValue(offsetNode, LengthUsage.Emu);
              }
              break;
            case "wrapTopAndBottom":
              wrapType = "wrapTopAndBottom";
              break;
            case "wrapNone":
              wrapType = "wrapNone";
              break;
            case "graphic":
              var g = this.parseGraphic(n);
              if (g)
                result.children.push(g);
              break;
          }
        }
        if (wrapType == "wrapTopAndBottom") {
          result.cssStyle["display"] = "block";
          if (posX.align) {
            result.cssStyle["text-align"] = posX.align;
            result.cssStyle["width"] = "100%";
          }
        } else if (wrapType == "wrapNone") {
          result.cssStyle["display"] = "block";
          result.cssStyle["position"] = "relative";
          result.cssStyle["width"] = "0px";
          result.cssStyle["height"] = "0px";
          if (posX.offset)
            result.cssStyle["left"] = posX.offset;
          if (posY.offset)
            result.cssStyle["top"] = posY.offset;
        } else if (isAnchor && (posX.align == "left" || posX.align == "right")) {
          result.cssStyle["float"] = posX.align;
        }
        return result;
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseGraphic", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem) {
        var graphicData = globalXmlParser.element(elem, "graphicData");
        for (var _i = 0, _a = globalXmlParser.elements(graphicData); _i < _a.length; _i++) {
          var n = _a[_i];
          switch (n.localName) {
            case "pic":
              return this.parsePicture(n);
          }
        }
        return null;
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parsePicture", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem) {
        var result = { type: DomType.Image, src: "", cssStyle: {} };
        var blipFill = globalXmlParser.element(elem, "blipFill");
        var blip = globalXmlParser.element(blipFill, "blip");
        result.src = globalXmlParser.attr(blip, "embed");
        var spPr = globalXmlParser.element(elem, "spPr");
        var xfrm = globalXmlParser.element(spPr, "xfrm");
        result.cssStyle["position"] = "relative";
        for (var _i = 0, _a = globalXmlParser.elements(xfrm); _i < _a.length; _i++) {
          var n = _a[_i];
          switch (n.localName) {
            case "ext":
              result.cssStyle["width"] = globalXmlParser.lengthAttr(n, "cx", LengthUsage.Emu);
              result.cssStyle["height"] = globalXmlParser.lengthAttr(n, "cy", LengthUsage.Emu);
              break;
            case "off":
              result.cssStyle["left"] = globalXmlParser.lengthAttr(n, "x", LengthUsage.Emu);
              result.cssStyle["top"] = globalXmlParser.lengthAttr(n, "y", LengthUsage.Emu);
              break;
          }
        }
        return result;
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseTable", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(node) {
        var _this = this;
        var result = { type: DomType.Table, children: [] };
        xmlUtil.foreach(node, function(c) {
          switch (c.localName) {
            case "tr":
              result.children.push(_this.parseTableRow(c));
              break;
            case "tblGrid":
              result.columns = _this.parseTableColumns(c);
              break;
            case "tblPr":
              _this.parseTableProperties(c, result);
              break;
          }
        });
        return result;
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseTableColumns", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(node) {
        var result = [];
        xmlUtil.foreach(node, function(n) {
          switch (n.localName) {
            case "gridCol":
              result.push({ width: globalXmlParser.lengthAttr(n, "w") });
              break;
          }
        });
        return result;
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseTableProperties", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem, table) {
        var _this = this;
        table.cssStyle = {};
        table.cellStyle = {};
        this.parseDefaultProperties(elem, table.cssStyle, table.cellStyle, function(c) {
          switch (c.localName) {
            case "tblStyle":
              table.styleName = globalXmlParser.attr(c, "val");
              break;
            case "tblLook":
              table.className = values.classNameOftblLook(c);
              break;
            case "tblpPr":
              _this.parseTablePosition(c, table);
              break;
            case "tblStyleColBandSize":
              table.colBandSize = globalXmlParser.intAttr(c, "val");
              break;
            case "tblStyleRowBandSize":
              table.rowBandSize = globalXmlParser.intAttr(c, "val");
              break;
            default:
              return false;
          }
          return true;
        });
        switch (table.cssStyle["text-align"]) {
          case "center":
            delete table.cssStyle["text-align"];
            table.cssStyle["margin-left"] = "auto";
            table.cssStyle["margin-right"] = "auto";
            break;
          case "right":
            delete table.cssStyle["text-align"];
            table.cssStyle["margin-left"] = "auto";
            break;
        }
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseTablePosition", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(node, table) {
        var topFromText = globalXmlParser.lengthAttr(node, "topFromText");
        var bottomFromText = globalXmlParser.lengthAttr(node, "bottomFromText");
        var rightFromText = globalXmlParser.lengthAttr(node, "rightFromText");
        var leftFromText = globalXmlParser.lengthAttr(node, "leftFromText");
        table.cssStyle["float"] = "left";
        table.cssStyle["margin-bottom"] = values.addSize(table.cssStyle["margin-bottom"], bottomFromText);
        table.cssStyle["margin-left"] = values.addSize(table.cssStyle["margin-left"], leftFromText);
        table.cssStyle["margin-right"] = values.addSize(table.cssStyle["margin-right"], rightFromText);
        table.cssStyle["margin-top"] = values.addSize(table.cssStyle["margin-top"], topFromText);
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseTableRow", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(node) {
        var _this = this;
        var result = { type: DomType.Row, children: [] };
        xmlUtil.foreach(node, function(c) {
          switch (c.localName) {
            case "tc":
              result.children.push(_this.parseTableCell(c));
              break;
            case "trPr":
              _this.parseTableRowProperties(c, result);
              break;
          }
        });
        return result;
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseTableRowProperties", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem, row) {
        row.cssStyle = this.parseDefaultProperties(elem, {}, null, function(c) {
          switch (c.localName) {
            case "cnfStyle":
              row.className = values.classNameOfCnfStyle(c);
              break;
            case "tblHeader":
              row.isHeader = globalXmlParser.boolAttr(c, "val");
              break;
            default:
              return false;
          }
          return true;
        });
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseTableCell", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(node) {
        var _this = this;
        var result = { type: DomType.Cell, children: [] };
        xmlUtil.foreach(node, function(c) {
          switch (c.localName) {
            case "tbl":
              result.children.push(_this.parseTable(c));
              break;
            case "p":
              result.children.push(_this.parseParagraph(c));
              break;
            case "tcPr":
              _this.parseTableCellProperties(c, result);
              break;
          }
        });
        return result;
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseTableCellProperties", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem, cell) {
        cell.cssStyle = this.parseDefaultProperties(elem, {}, null, function(c) {
          var _a;
          switch (c.localName) {
            case "gridSpan":
              cell.span = globalXmlParser.intAttr(c, "val", null);
              break;
            case "vMerge":
              cell.verticalMerge = (_a = globalXmlParser.attr(c, "val")) !== null && _a !== void 0 ? _a : "continue";
              break;
            case "cnfStyle":
              cell.className = values.classNameOfCnfStyle(c);
              break;
            default:
              return false;
          }
          return true;
        });
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseDefaultProperties", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem, style, childStyle, handler) {
        var _this = this;
        if (style === void 0) {
          style = null;
        }
        if (childStyle === void 0) {
          childStyle = null;
        }
        if (handler === void 0) {
          handler = null;
        }
        style = style || {};
        xmlUtil.foreach(elem, function(c) {
          if (handler === null || handler === void 0 ? void 0 : handler(c))
            return;
          switch (c.localName) {
            case "jc":
              style["text-align"] = values.valueOfJc(c);
              break;
            case "textAlignment":
              style["vertical-align"] = values.valueOfTextAlignment(c);
              break;
            case "color":
              style["color"] = xmlUtil.colorAttr(c, "val", null, autos.color);
              break;
            case "sz":
              style["font-size"] = style["min-height"] = Math.ceil(parseInt(globalXmlParser.lengthAttr(c, "val", LengthUsage.FontSize)) * 4 / 3) + "px";
              break;
            case "shd":
              style["background-color"] = xmlUtil.colorAttr(c, "fill", null, autos.shd);
              break;
            case "highlight":
              style["background-color"] = xmlUtil.colorAttr(c, "val", null, autos.highlight);
              break;
            case "vertAlign":
              break;
            case "position":
              style.verticalAlign = globalXmlParser.lengthAttr(c, "val", LengthUsage.FontSize);
              break;
            case "tcW":
              if (_this.options.ignoreWidth)
                break;
            case "tblW":
              style["width"] = values.valueOfSize(c, "w");
              break;
            case "trHeight":
              _this.parseTrHeight(c, style);
              break;
            case "strike":
              style["text-decoration"] = globalXmlParser.boolAttr(c, "val", true) ? "line-through" : "none";
              break;
            case "b":
              style["font-weight"] = globalXmlParser.boolAttr(c, "val", true) ? "bold" : "normal";
              break;
            case "i":
              style["font-style"] = globalXmlParser.boolAttr(c, "val", true) ? "italic" : "normal";
              break;
            case "caps":
              style["text-transform"] = globalXmlParser.boolAttr(c, "val", true) ? "uppercase" : "none";
              break;
            case "smallCaps":
              style["text-transform"] = globalXmlParser.boolAttr(c, "val", true) ? "lowercase" : "none";
              break;
            case "u":
              _this.parseUnderline(c, style);
              break;
            case "ind":
            case "tblInd":
              _this.parseIndentation(c, style);
              break;
            case "rFonts":
              _this.parseFont(c, style);
              break;
            case "tblBorders":
              _this.parseBorderProperties(c, childStyle || style);
              break;
            case "tblCellSpacing":
              style["border-spacing"] = values.valueOfMargin(c);
              style["border-collapse"] = "separate";
              break;
            case "pBdr":
              _this.parseBorderProperties(c, style);
              break;
            case "bdr":
              style["border"] = values.valueOfBorder(c);
              break;
            case "tcBorders":
              _this.parseBorderProperties(c, style);
              break;
            case "vanish":
              if (globalXmlParser.boolAttr(c, "val", true))
                style["display"] = "none";
              break;
            case "kern":
              break;
            case "noWrap":
              break;
            case "tblCellMar":
            case "tcMar":
              _this.parseMarginProperties(c, childStyle || style);
              break;
            case "tblLayout":
              style["table-layout"] = values.valueOfTblLayout(c);
              break;
            case "vAlign":
              style["vertical-align"] = values.valueOfTextAlignment(c);
              break;
            case "spacing":
              if (elem.localName == "pPr")
                _this.parseSpacing(c, style);
              break;
            case "wordWrap":
              if (globalXmlParser.boolAttr(c, "val"))
                style["overflow-wrap"] = "break-word";
              break;
            case "bCs":
            case "iCs":
            case "szCs":
            case "tabs":
            case "outlineLvl":
            case "contextualSpacing":
            case "tblStyleColBandSize":
            case "tblStyleRowBandSize":
            case "webHidden":
            case "pageBreakBefore":
            case "suppressLineNumbers":
            case "keepLines":
            case "keepNext":
            case "lang":
            case "widowControl":
            case "bidi":
            case "rtl":
            case "noProof":
              break;
            default:
              if (_this.options.debug)
                console.warn("DOCX: Unknown document element: ".concat(elem.localName, ".").concat(c.localName));
              break;
          }
        });
        return style;
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseUnderline", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(node, style) {
        var val = globalXmlParser.attr(node, "val");
        if (val == null)
          return;
        switch (val) {
          case "dash":
          case "dashDotDotHeavy":
          case "dashDotHeavy":
          case "dashedHeavy":
          case "dashLong":
          case "dashLongHeavy":
          case "dotDash":
          case "dotDotDash":
            style["text-decoration-style"] = "dashed";
            break;
          case "dotted":
          case "dottedHeavy":
            style["text-decoration-style"] = "dotted";
            break;
          case "double":
            style["text-decoration-style"] = "double";
            break;
          case "single":
          case "thick":
            style["text-decoration"] = "underline";
            break;
          case "wave":
          case "wavyDouble":
          case "wavyHeavy":
            style["text-decoration-style"] = "wavy";
            break;
          case "words":
            style["text-decoration"] = "underline";
            break;
          case "none":
            style["text-decoration"] = "none";
            break;
        }
        var col = xmlUtil.colorAttr(node, "color");
        if (col)
          style["text-decoration-color"] = col;
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseFont", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(node, style) {
        var ascii = globalXmlParser.attr(node, "ascii");
        var asciiTheme = values.themeValue(node, "asciiTheme");
        var fonts = [ascii, asciiTheme].filter(function(x) {
          return x;
        }).join(", ");
        if (fonts.length > 0)
          style["font-family"] = fonts;
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseIndentation", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(node, style) {
        var firstLine = globalXmlParser.lengthAttr(node, "firstLine");
        var hanging = globalXmlParser.lengthAttr(node, "hanging");
        var left = globalXmlParser.lengthAttr(node, "left");
        var start = globalXmlParser.lengthAttr(node, "start");
        var right = globalXmlParser.lengthAttr(node, "right");
        var end = globalXmlParser.lengthAttr(node, "end");
        if (firstLine)
          style["text-indent"] = firstLine;
        if (hanging)
          style["text-indent"] = "-".concat(hanging);
        if (left || start)
          style["margin-left"] = left || start;
        if (right || end)
          style["margin-right"] = right || end;
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseSpacing", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(node, style) {
        var before = globalXmlParser.lengthAttr(node, "before");
        var after = globalXmlParser.lengthAttr(node, "after");
        var line = globalXmlParser.intAttr(node, "line", null);
        var lineRule = globalXmlParser.attr(node, "lineRule");
        if (before)
          style["margin-top"] = before;
        if (after)
          style["margin-bottom"] = after;
        if (line !== null) {
          switch (lineRule) {
            case "auto":
              style["line-height"] = "".concat((line / 240).toFixed(2));
              break;
            case "atLeast":
              style["line-height"] = "calc(100% + ".concat(Math.ceil(line / 15), "px)");
              break;
            default:
              style["line-height"] = style["min-height"] = "".concat(Math.ceil(line / 15), "px");
              break;
          }
        }
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseMarginProperties", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(node, output) {
        xmlUtil.foreach(node, function(c) {
          switch (c.localName) {
            case "left":
              output["padding-left"] = values.valueOfMargin(c);
              break;
            case "right":
              output["padding-right"] = values.valueOfMargin(c);
              break;
            case "top":
              output["padding-top"] = values.valueOfMargin(c);
              break;
            case "bottom":
              output["padding-bottom"] = values.valueOfMargin(c);
              break;
          }
        });
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseTrHeight", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(node, output) {
        switch (globalXmlParser.attr(node, "hRule")) {
          case "exact":
            output["height"] = globalXmlParser.lengthAttr(node, "val");
            break;
          case "atLeast":
          default:
            output["height"] = globalXmlParser.lengthAttr(node, "val");
            break;
        }
      }
    });
    Object.defineProperty(DocumentParser2.prototype, "parseBorderProperties", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(node, output) {
        xmlUtil.foreach(node, function(c) {
          switch (c.localName) {
            case "start":
            case "left":
              output["border-left"] = values.valueOfBorder(c);
              break;
            case "end":
            case "right":
              output["border-right"] = values.valueOfBorder(c);
              break;
            case "top":
              output["border-top"] = values.valueOfBorder(c);
              break;
            case "bottom":
              output["border-bottom"] = values.valueOfBorder(c);
              break;
          }
        });
      }
    });
    return DocumentParser2;
  }();
  var knownColors = ["black", "blue", "cyan", "darkBlue", "darkCyan", "darkGray", "darkGreen", "darkMagenta", "darkRed", "darkYellow", "green", "lightGray", "magenta", "none", "red", "white", "yellow"];
  var xmlUtil = function() {
    function xmlUtil2() {
    }
    Object.defineProperty(xmlUtil2, "foreach", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(node, cb) {
        for (var i = 0; i < node.childNodes.length; i++) {
          var n = node.childNodes[i];
          if (n.nodeType == Node.ELEMENT_NODE)
            cb(n);
        }
      }
    });
    Object.defineProperty(xmlUtil2, "colorAttr", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(node, attrName, defValue, autoColor) {
        if (defValue === void 0) {
          defValue = null;
        }
        if (autoColor === void 0) {
          autoColor = "black";
        }
        var v = globalXmlParser.attr(node, attrName);
        if (v) {
          if (v == "auto") {
            return autoColor;
          } else if (knownColors.includes(v)) {
            return v;
          }
          return "#".concat(v);
        }
        var themeColor = globalXmlParser.attr(node, "themeColor");
        return themeColor ? "var(--docx-".concat(themeColor, "-color)") : defValue;
      }
    });
    Object.defineProperty(xmlUtil2, "sizeValue", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(node, type) {
        if (type === void 0) {
          type = LengthUsage.Dxa;
        }
        return convertLength(node.textContent, type);
      }
    });
    return xmlUtil2;
  }();
  var values = function() {
    function values2() {
    }
    Object.defineProperty(values2, "themeValue", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(c, attr) {
        var val = globalXmlParser.attr(c, attr);
        return val ? "var(--docx-".concat(val, "-font)") : null;
      }
    });
    Object.defineProperty(values2, "valueOfSize", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(c, attr) {
        var type = LengthUsage.Dxa;
        switch (globalXmlParser.attr(c, "type")) {
          case "dxa":
            break;
          case "pct":
            type = LengthUsage.Percent;
            break;
          case "auto":
            return "auto";
        }
        return globalXmlParser.lengthAttr(c, attr, type);
      }
    });
    Object.defineProperty(values2, "valueOfMargin", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(c) {
        return globalXmlParser.lengthAttr(c, "w");
      }
    });
    Object.defineProperty(values2, "valueOfBorder", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(c) {
        var type = globalXmlParser.attr(c, "val");
        if (type == "nil")
          return "none";
        var color = xmlUtil.colorAttr(c, "color");
        var size = globalXmlParser.lengthAttr(c, "sz", LengthUsage.Border);
        return "".concat(size, " solid ").concat(color == "auto" ? autos.borderColor : color);
      }
    });
    Object.defineProperty(values2, "valueOfTblLayout", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(c) {
        var type = globalXmlParser.attr(c, "val");
        return type == "fixed" ? "fixed" : "auto";
      }
    });
    Object.defineProperty(values2, "classNameOfCnfStyle", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(c) {
        var val = globalXmlParser.attr(c, "val");
        var classes = [
          "first-row",
          "last-row",
          "first-col",
          "last-col",
          "odd-col",
          "even-col",
          "odd-row",
          "even-row",
          "ne-cell",
          "nw-cell",
          "se-cell",
          "sw-cell"
        ];
        return classes.filter(function(_, i) {
          return val[i] == "1";
        }).join(" ");
      }
    });
    Object.defineProperty(values2, "valueOfJc", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(c) {
        var type = globalXmlParser.attr(c, "val");
        switch (type) {
          case "start":
          case "left":
            return "left";
          case "center":
            return "center";
          case "end":
          case "right":
            return "right";
          case "both":
            return "justify";
        }
        return type;
      }
    });
    Object.defineProperty(values2, "valueOfVertAlign", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(c, asTagName) {
        if (asTagName === void 0) {
          asTagName = false;
        }
        var type = globalXmlParser.attr(c, "val");
        switch (type) {
          case "subscript":
            return "sub";
          case "superscript":
            return asTagName ? "sup" : "super";
        }
        return asTagName ? null : type;
      }
    });
    Object.defineProperty(values2, "valueOfTextAlignment", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(c) {
        var type = globalXmlParser.attr(c, "val");
        switch (type) {
          case "auto":
          case "baseline":
            return "baseline";
          case "top":
            return "top";
          case "center":
            return "middle";
          case "bottom":
            return "bottom";
        }
        return type;
      }
    });
    Object.defineProperty(values2, "addSize", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(a, b) {
        if (a == null)
          return b;
        if (b == null)
          return a;
        return "calc(".concat(a, " + ").concat(b, ")");
      }
    });
    Object.defineProperty(values2, "classNameOftblLook", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(c) {
        var val = globalXmlParser.hexAttr(c, "val", 0);
        var className = "";
        if (globalXmlParser.boolAttr(c, "firstRow") || val & 32)
          className += " first-row";
        if (globalXmlParser.boolAttr(c, "lastRow") || val & 64)
          className += " last-row";
        if (globalXmlParser.boolAttr(c, "firstColumn") || val & 128)
          className += " first-col";
        if (globalXmlParser.boolAttr(c, "lastColumn") || val & 256)
          className += " last-col";
        if (globalXmlParser.boolAttr(c, "noHBand") || val & 512)
          className += " no-hband";
        if (globalXmlParser.boolAttr(c, "noVBand") || val & 1024)
          className += " no-vband";
        return className.trim();
      }
    });
    return values2;
  }();
  var defaultTab = { pos: 0, leader: "none", style: "left" };
  var maxTabs = 50;
  function computePixelToPoint(container) {
    if (container === void 0) {
      container = document.body;
    }
    var temp = document.createElement("div");
    temp.style.width = "100pt";
    container.appendChild(temp);
    var result = 100 / temp.offsetWidth;
    container.removeChild(temp);
    return result;
  }
  function updateTabStop(elem, tabs, defaultTabSize, pixelToPoint) {
    if (pixelToPoint === void 0) {
      pixelToPoint = 72 / 96;
    }
    var p = elem.closest("p");
    var ebb = elem.getBoundingClientRect();
    var pbb = p.getBoundingClientRect();
    var pcs = getComputedStyle(p);
    var tabStops = (tabs === null || tabs === void 0 ? void 0 : tabs.length) > 0 ? tabs.map(function(t) {
      return {
        pos: lengthToPoint(t.position),
        leader: t.leader,
        style: t.style
      };
    }).sort(function(a, b) {
      return a.pos - b.pos;
    }) : [defaultTab];
    var lastTab = tabStops[tabStops.length - 1];
    var pWidthPt = pbb.width * pixelToPoint;
    var size = lengthToPoint(defaultTabSize);
    var pos = lastTab.pos + size;
    if (pos < pWidthPt) {
      for (; pos < pWidthPt && tabStops.length < maxTabs; pos += size) {
        tabStops.push(__assign(__assign({}, defaultTab), { pos }));
      }
    }
    var marginLeft = parseFloat(pcs.marginLeft);
    var pOffset = pbb.left + marginLeft;
    var left = (ebb.left - pOffset) * pixelToPoint;
    var tab = tabStops.find(function(t) {
      return t.style != "clear" && t.pos > left;
    });
    if (tab == null)
      return;
    var width = 1;
    if (tab.style == "right" || tab.style == "center") {
      var tabStops_1 = Array.from(p.querySelectorAll(".".concat(elem.className)));
      var nextIdx = tabStops_1.indexOf(elem) + 1;
      var range = document.createRange();
      range.setStart(elem, 1);
      if (nextIdx < tabStops_1.length) {
        range.setEndBefore(tabStops_1[nextIdx]);
      } else {
        range.setEndAfter(p);
      }
      var mul = tab.style == "center" ? 0.5 : 1;
      var nextBB = range.getBoundingClientRect();
      var offset = nextBB.left + mul * nextBB.width - (pbb.left - marginLeft);
      width = tab.pos - offset * pixelToPoint;
    } else {
      width = tab.pos - left;
    }
    elem.innerHTML = "&nbsp;";
    elem.style.textDecoration = "inherit";
    elem.style.wordSpacing = "".concat(width.toFixed(0), "pt");
    switch (tab.leader) {
      case "dot":
      case "middleDot":
        elem.style.textDecoration = "underline";
        elem.style.textDecorationStyle = "dotted";
        break;
      case "hyphen":
      case "heavy":
      case "underscore":
        elem.style.textDecoration = "underline";
        break;
    }
  }
  function lengthToPoint(length) {
    return parseFloat(length);
  }
  var eventproxy$1 = { exports: {} };
  var browser = { exports: {} };
  var debug = { exports: {} };
  var s = 1e3;
  var m = s * 60;
  var h = m * 60;
  var d = h * 24;
  var y = d * 365.25;
  var ms = function(val, options) {
    options = options || {};
    var type = typeof val;
    if (type === "string" && val.length > 0) {
      return parse(val);
    } else if (type === "number" && isNaN(val) === false) {
      return options.long ? fmtLong(val) : fmtShort(val);
    }
    throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
  };
  function parse(str) {
    str = String(str);
    if (str.length > 100) {
      return;
    }
    var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);
    if (!match) {
      return;
    }
    var n = parseFloat(match[1]);
    var type = (match[2] || "ms").toLowerCase();
    switch (type) {
      case "years":
      case "year":
      case "yrs":
      case "yr":
      case "y":
        return n * y;
      case "days":
      case "day":
      case "d":
        return n * d;
      case "hours":
      case "hour":
      case "hrs":
      case "hr":
      case "h":
        return n * h;
      case "minutes":
      case "minute":
      case "mins":
      case "min":
      case "m":
        return n * m;
      case "seconds":
      case "second":
      case "secs":
      case "sec":
      case "s":
        return n * s;
      case "milliseconds":
      case "millisecond":
      case "msecs":
      case "msec":
      case "ms":
        return n;
      default:
        return void 0;
    }
  }
  function fmtShort(ms2) {
    if (ms2 >= d) {
      return Math.round(ms2 / d) + "d";
    }
    if (ms2 >= h) {
      return Math.round(ms2 / h) + "h";
    }
    if (ms2 >= m) {
      return Math.round(ms2 / m) + "m";
    }
    if (ms2 >= s) {
      return Math.round(ms2 / s) + "s";
    }
    return ms2 + "ms";
  }
  function fmtLong(ms2) {
    return plural(ms2, d, "day") || plural(ms2, h, "hour") || plural(ms2, m, "minute") || plural(ms2, s, "second") || ms2 + " ms";
  }
  function plural(ms2, n, name) {
    if (ms2 < n) {
      return;
    }
    if (ms2 < n * 1.5) {
      return Math.floor(ms2 / n) + " " + name;
    }
    return Math.ceil(ms2 / n) + " " + name + "s";
  }
  (function(module, exports) {
    exports = module.exports = createDebug.debug = createDebug["default"] = createDebug;
    exports.coerce = coerce;
    exports.disable = disable;
    exports.enable = enable;
    exports.enabled = enabled;
    exports.humanize = ms;
    exports.names = [];
    exports.skips = [];
    exports.formatters = {};
    var prevTime;
    function selectColor(namespace) {
      var hash = 0, i;
      for (i in namespace) {
        hash = (hash << 5) - hash + namespace.charCodeAt(i);
        hash |= 0;
      }
      return exports.colors[Math.abs(hash) % exports.colors.length];
    }
    function createDebug(namespace) {
      function debug2() {
        if (!debug2.enabled)
          return;
        var self2 = debug2;
        var curr = +new Date();
        var ms2 = curr - (prevTime || curr);
        self2.diff = ms2;
        self2.prev = prevTime;
        self2.curr = curr;
        prevTime = curr;
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        args[0] = exports.coerce(args[0]);
        if (typeof args[0] !== "string") {
          args.unshift("%O");
        }
        var index = 0;
        args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
          if (match === "%%")
            return match;
          index++;
          var formatter = exports.formatters[format];
          if (typeof formatter === "function") {
            var val = args[index];
            match = formatter.call(self2, val);
            args.splice(index, 1);
            index--;
          }
          return match;
        });
        exports.formatArgs.call(self2, args);
        var logFn = debug2.log || exports.log || console.log.bind(console);
        logFn.apply(self2, args);
      }
      debug2.namespace = namespace;
      debug2.enabled = exports.enabled(namespace);
      debug2.useColors = exports.useColors();
      debug2.color = selectColor(namespace);
      if (typeof exports.init === "function") {
        exports.init(debug2);
      }
      return debug2;
    }
    function enable(namespaces) {
      exports.save(namespaces);
      exports.names = [];
      exports.skips = [];
      var split = (typeof namespaces === "string" ? namespaces : "").split(/[\s,]+/);
      var len = split.length;
      for (var i = 0; i < len; i++) {
        if (!split[i])
          continue;
        namespaces = split[i].replace(/\*/g, ".*?");
        if (namespaces[0] === "-") {
          exports.skips.push(new RegExp("^" + namespaces.substr(1) + "$"));
        } else {
          exports.names.push(new RegExp("^" + namespaces + "$"));
        }
      }
    }
    function disable() {
      exports.enable("");
    }
    function enabled(name) {
      var i, len;
      for (i = 0, len = exports.skips.length; i < len; i++) {
        if (exports.skips[i].test(name)) {
          return false;
        }
      }
      for (i = 0, len = exports.names.length; i < len; i++) {
        if (exports.names[i].test(name)) {
          return true;
        }
      }
      return false;
    }
    function coerce(val) {
      if (val instanceof Error)
        return val.stack || val.message;
      return val;
    }
  })(debug, debug.exports);
  (function(module, exports) {
    exports = module.exports = debug.exports;
    exports.log = log;
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.storage = typeof chrome != "undefined" && typeof chrome.storage != "undefined" ? chrome.storage.local : localstorage();
    exports.colors = [
      "lightseagreen",
      "forestgreen",
      "goldenrod",
      "dodgerblue",
      "darkorchid",
      "crimson"
    ];
    function useColors() {
      if (typeof window !== "undefined" && window.process && window.process.type === "renderer") {
        return true;
      }
      return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    exports.formatters.j = function(v) {
      try {
        return JSON.stringify(v);
      } catch (err) {
        return "[UnexpectedJSONParseError]: " + err.message;
      }
    };
    function formatArgs(args) {
      var useColors2 = this.useColors;
      args[0] = (useColors2 ? "%c" : "") + this.namespace + (useColors2 ? " %c" : " ") + args[0] + (useColors2 ? "%c " : " ") + "+" + exports.humanize(this.diff);
      if (!useColors2)
        return;
      var c = "color: " + this.color;
      args.splice(1, 0, c, "color: inherit");
      var index = 0;
      var lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, function(match) {
        if (match === "%%")
          return;
        index++;
        if (match === "%c") {
          lastC = index;
        }
      });
      args.splice(lastC, 0, c);
    }
    function log() {
      return typeof console === "object" && console.log && Function.prototype.apply.call(console.log, console, arguments);
    }
    function save(namespaces) {
      try {
        if (namespaces == null) {
          exports.storage.removeItem("debug");
        } else {
          exports.storage.debug = namespaces;
        }
      } catch (e) {
      }
    }
    function load() {
      var r;
      try {
        r = exports.storage.debug;
      } catch (e) {
      }
      if (!r && typeof process !== "undefined" && "env" in process) {
        r = {}.DEBUG;
      }
      return r;
    }
    exports.enable(load());
    function localstorage() {
      try {
        return window.localStorage;
      } catch (e) {
      }
    }
  })(browser, browser.exports);
  (function(module) {
    !function(name, definition) {
      var hasExports = module.exports;
      if (hasExports) {
        module.exports = definition(browser.exports("eventproxy"));
      } else {
        this[name] = definition();
      }
    }("EventProxy", function(debug2) {
      debug2 = debug2 || function() {
      };
      var SLICE = Array.prototype.slice;
      var CONCAT = Array.prototype.concat;
      var ALL_EVENT = "__all__";
      var EventProxy = function() {
        if (!(this instanceof EventProxy)) {
          return new EventProxy();
        }
        this._callbacks = {};
        this._fired = {};
      };
      EventProxy.prototype.addListener = function(ev, callback) {
        debug2("Add listener for %s", ev);
        this._callbacks[ev] = this._callbacks[ev] || [];
        this._callbacks[ev].push(callback);
        return this;
      };
      EventProxy.prototype.bind = EventProxy.prototype.addListener;
      EventProxy.prototype.on = EventProxy.prototype.addListener;
      EventProxy.prototype.subscribe = EventProxy.prototype.addListener;
      EventProxy.prototype.headbind = function(ev, callback) {
        debug2("Add listener for %s", ev);
        this._callbacks[ev] = this._callbacks[ev] || [];
        this._callbacks[ev].unshift(callback);
        return this;
      };
      EventProxy.prototype.removeListener = function(eventname, callback) {
        var calls = this._callbacks;
        if (!eventname) {
          debug2("Remove all listeners");
          this._callbacks = {};
        } else {
          if (!callback) {
            debug2("Remove all listeners of %s", eventname);
            calls[eventname] = [];
          } else {
            var list = calls[eventname];
            if (list) {
              var l = list.length;
              for (var i = 0; i < l; i++) {
                if (callback === list[i]) {
                  debug2("Remove a listener of %s", eventname);
                  list[i] = null;
                }
              }
            }
          }
        }
        return this;
      };
      EventProxy.prototype.unbind = EventProxy.prototype.removeListener;
      EventProxy.prototype.removeAllListeners = function(event) {
        return this.unbind(event);
      };
      EventProxy.prototype.bindForAll = function(callback) {
        this.bind(ALL_EVENT, callback);
      };
      EventProxy.prototype.unbindForAll = function(callback) {
        this.unbind(ALL_EVENT, callback);
      };
      EventProxy.prototype.trigger = function(eventname, data) {
        var list, ev, callback, i, l;
        var both = 2;
        var calls = this._callbacks;
        debug2("Emit event %s with data %j", eventname, data);
        while (both--) {
          ev = both ? eventname : ALL_EVENT;
          list = calls[ev];
          if (list) {
            for (i = 0, l = list.length; i < l; i++) {
              if (!(callback = list[i])) {
                list.splice(i, 1);
                i--;
                l--;
              } else {
                var args = [];
                var start = both ? 1 : 0;
                for (var j = start; j < arguments.length; j++) {
                  args.push(arguments[j]);
                }
                callback.apply(this, args);
              }
            }
          }
        }
        return this;
      };
      EventProxy.prototype.emit = EventProxy.prototype.trigger;
      EventProxy.prototype.fire = EventProxy.prototype.trigger;
      EventProxy.prototype.once = function(ev, callback) {
        var self2 = this;
        var wrapper = function() {
          callback.apply(self2, arguments);
          self2.unbind(ev, wrapper);
        };
        this.bind(ev, wrapper);
        return this;
      };
      var later = typeof setImmediate !== "undefined" && setImmediate || typeof process !== "undefined" && process.nextTick || function(fn) {
        setTimeout(fn, 0);
      };
      EventProxy.prototype.emitLater = function() {
        var self2 = this;
        var args = arguments;
        later(function() {
          self2.trigger.apply(self2, args);
        });
      };
      EventProxy.prototype.immediate = function(ev, callback, data) {
        this.bind(ev, callback);
        this.trigger(ev, data);
        return this;
      };
      EventProxy.prototype.asap = EventProxy.prototype.immediate;
      var _assign = function(eventname1, eventname2, cb, once) {
        var proxy = this;
        var argsLength = arguments.length;
        var times = 0;
        var flag = {};
        if (argsLength < 3) {
          return this;
        }
        var events = SLICE.call(arguments, 0, -2);
        var callback = arguments[argsLength - 2];
        var isOnce = arguments[argsLength - 1];
        if (typeof callback !== "function") {
          return this;
        }
        debug2("Assign listener for events %j, once is %s", events, !!isOnce);
        var bind = function(key) {
          var method = isOnce ? "once" : "bind";
          proxy[method](key, function(data) {
            proxy._fired[key] = proxy._fired[key] || {};
            proxy._fired[key].data = data;
            if (!flag[key]) {
              flag[key] = true;
              times++;
            }
          });
        };
        var length = events.length;
        for (var index = 0; index < length; index++) {
          bind(events[index]);
        }
        var _all = function(event) {
          if (times < length) {
            return;
          }
          if (!flag[event]) {
            return;
          }
          var data = [];
          for (var index2 = 0; index2 < length; index2++) {
            data.push(proxy._fired[events[index2]].data);
          }
          if (isOnce) {
            proxy.unbindForAll(_all);
          }
          debug2("Events %j all emited with data %j", events, data);
          callback.apply(null, data);
        };
        proxy.bindForAll(_all);
      };
      EventProxy.prototype.all = function(eventname1, eventname2, callback) {
        var args = CONCAT.apply([], arguments);
        args.push(true);
        _assign.apply(this, args);
        return this;
      };
      EventProxy.prototype.assign = EventProxy.prototype.all;
      EventProxy.prototype.fail = function(callback) {
        var that = this;
        that.once("error", function() {
          that.unbind();
          callback.apply(null, arguments);
        });
        return this;
      };
      EventProxy.prototype.throw = function() {
        var that = this;
        that.emit.apply(that, ["error"].concat(SLICE.call(arguments)));
      };
      EventProxy.prototype.tail = function() {
        var args = CONCAT.apply([], arguments);
        args.push(false);
        _assign.apply(this, args);
        return this;
      };
      EventProxy.prototype.assignAll = EventProxy.prototype.tail;
      EventProxy.prototype.assignAlways = EventProxy.prototype.tail;
      EventProxy.prototype.after = function(eventname, times, callback) {
        if (times === 0) {
          callback.call(null, []);
          return this;
        }
        var proxy = this, firedData = [];
        this._after = this._after || {};
        var group = eventname + "_group";
        this._after[group] = {
          index: 0,
          results: []
        };
        debug2("After emit %s times, event %s's listenner will execute", times, eventname);
        var all = function(name, data) {
          if (name === eventname) {
            times--;
            firedData.push(data);
            if (times < 1) {
              debug2("Event %s was emit %s, and execute the listenner", eventname, times);
              proxy.unbindForAll(all);
              callback.apply(null, [firedData]);
            }
          }
          if (name === group) {
            times--;
            proxy._after[group].results[data.index] = data.result;
            if (times < 1) {
              debug2("Event %s was emit %s, and execute the listenner", eventname, times);
              proxy.unbindForAll(all);
              callback.call(null, proxy._after[group].results);
            }
          }
        };
        proxy.bindForAll(all);
        return this;
      };
      EventProxy.prototype.group = function(eventname, callback) {
        var that = this;
        var group = eventname + "_group";
        var index = that._after[group].index;
        that._after[group].index++;
        return function(err, data) {
          if (err) {
            return that.emit.apply(that, ["error"].concat(SLICE.call(arguments)));
          }
          that.emit(group, {
            index,
            result: callback ? callback.apply(null, SLICE.call(arguments, 1)) : data
          });
        };
      };
      EventProxy.prototype.any = function() {
        var proxy = this, callback = arguments[arguments.length - 1], events = SLICE.call(arguments, 0, -1), _eventname = events.join("_");
        debug2("Add listenner for Any of events %j emit", events);
        proxy.once(_eventname, callback);
        var _bind = function(key) {
          proxy.bind(key, function(data) {
            debug2("One of events %j emited, execute the listenner");
            proxy.trigger(_eventname, { "data": data, eventName: key });
          });
        };
        for (var index = 0; index < events.length; index++) {
          _bind(events[index]);
        }
      };
      EventProxy.prototype.not = function(eventname, callback) {
        var proxy = this;
        debug2("Add listenner for not event %s", eventname);
        proxy.bindForAll(function(name, data) {
          if (name !== eventname) {
            debug2("listenner execute of event %s emit, but not event %s.", name, eventname);
            callback(data);
          }
        });
      };
      EventProxy.prototype.done = function(handler, callback) {
        var that = this;
        return function(err, data) {
          if (err) {
            return that.emit.apply(that, ["error"].concat(SLICE.call(arguments)));
          }
          var args = SLICE.call(arguments, 1);
          if (typeof handler === "string") {
            if (callback) {
              return that.emit(handler, callback.apply(null, args));
            } else {
              return that.emit.apply(that, [handler].concat(args));
            }
          }
          if (arguments.length <= 2) {
            return handler(data);
          }
          handler.apply(null, args);
        };
      };
      EventProxy.prototype.doneLater = function(handler, callback) {
        var _doneHandler = this.done(handler, callback);
        return function(err, data) {
          var args = arguments;
          later(function() {
            _doneHandler.apply(null, args);
          });
        };
      };
      EventProxy.create = function() {
        var ep = new EventProxy();
        var args = CONCAT.apply([], arguments);
        if (args.length) {
          var errorHandler = args[args.length - 1];
          var callback = args[args.length - 2];
          if (typeof errorHandler === "function" && typeof callback === "function") {
            args.pop();
            ep.fail(errorHandler);
          }
          ep.assign.apply(ep, args);
        }
        return ep;
      };
      EventProxy.EventProxy = EventProxy;
      return EventProxy;
    });
  })(eventproxy$1);
  var eventproxy = eventproxy$1.exports;
  var HtmlRenderer = function() {
    function HtmlRenderer2(htmlDocument) {
      Object.defineProperty(this, "htmlDocument", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: htmlDocument
      });
      Object.defineProperty(this, "className", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: "docx"
      });
      Object.defineProperty(this, "document", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "options", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "styleMap", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: {}
      });
      Object.defineProperty(this, "currentPart", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: null
      });
      Object.defineProperty(this, "tableVerticalMerges", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: []
      });
      Object.defineProperty(this, "currentVerticalMerge", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: null
      });
      Object.defineProperty(this, "tableCellPositions", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: []
      });
      Object.defineProperty(this, "currentCellPosition", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: null
      });
      Object.defineProperty(this, "footnoteMap", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: {}
      });
      Object.defineProperty(this, "endnoteMap", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: {}
      });
      Object.defineProperty(this, "currentFootnoteIds", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "currentEndnoteIds", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: []
      });
      Object.defineProperty(this, "usedHederFooterParts", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: []
      });
      Object.defineProperty(this, "renderImageCount", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: 0
      });
      Object.defineProperty(this, "defaultTabSize", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "domNumberings", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: {}
      });
      Object.defineProperty(this, "ep2", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: new eventproxy()
      });
      Object.defineProperty(this, "currentTabs", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: []
      });
      Object.defineProperty(this, "tabsTimeout", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: 0
      });
      Object.defineProperty(this, "createElement", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: createElement
      });
    }
    Object.defineProperty(HtmlRenderer2.prototype, "render", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(document2, bodyContainer, styleContainer, options) {
        var _this = this;
        if (styleContainer === void 0) {
          styleContainer = null;
        }
        return new Promise(function(resolve) {
          var _a;
          _this.document = document2;
          _this.options = options;
          _this.className = options.className;
          _this.styleMap = null;
          _this.renderImageCount = 0;
          styleContainer = styleContainer || bodyContainer;
          removeAllElements(bodyContainer);
          if (document2.numberingPart) {
            _this.prodessNumberings(document2.numberingPart.domNumberings);
            document2.numberingPart.domNumberings.forEach(function(ele) {
              !_this.domNumberings[ele.id] && (_this.domNumberings[ele.id] = {});
              _this.domNumberings[ele.id][ele.level] = __assign(__assign({}, ele), { count: 1, pCount: 1 });
            });
          }
          if (document2.settingsPart) {
            _this.defaultTabSize = (_a = document2.settingsPart.settings) === null || _a === void 0 ? void 0 : _a.defaultTabStop;
          }
          if (!options.ignoreFonts && document2.fontTablePart)
            _this.renderFontTable(document2.fontTablePart, styleContainer);
          _this.countNum = 100;
          var sectionElements = _this.renderSections(document2.documentPart.body);
          appendChildren(bodyContainer, sectionElements);
          _this.refreshTabStops();
          _this.ep2.after("renderImage", _this.renderImageCount, function(data) {
            setTimeout(function() {
              resolve("ok");
            }, 200);
          });
        });
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "renderTheme", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(themePart, styleContainer) {
        var _a, _b;
        var variables = {};
        var fontScheme = (_a = themePart.theme) === null || _a === void 0 ? void 0 : _a.fontScheme;
        if (fontScheme) {
          if (fontScheme.majorFont) {
            variables["--docx-majorHAnsi-font"] = fontScheme.majorFont.latinTypeface;
          }
          if (fontScheme.minorFont) {
            variables["--docx-minorHAnsi-font"] = fontScheme.minorFont.latinTypeface;
          }
        }
        var colorScheme = (_b = themePart.theme) === null || _b === void 0 ? void 0 : _b.colorScheme;
        if (colorScheme) {
          for (var _i = 0, _c = Object.entries(colorScheme.colors); _i < _c.length; _i++) {
            var _d = _c[_i], k = _d[0], v = _d[1];
            variables["--docx-".concat(k, "-color")] = "#".concat(v);
          }
        }
        var cssText = this.styleToString(".".concat(this.className), variables);
        styleContainer.appendChild(createStyleElement(cssText));
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "renderFontTable", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(fontsPart, styleContainer) {
        var _this = this;
        var _loop_1 = function(f2) {
          var _loop_2 = function(ref2) {
            this_1.document.loadFont(ref2.id, ref2.key).then(function(fontData) {
              var cssValues = {
                "font-family": f2.name,
                "src": "url(".concat(fontData, ")")
              };
              if (ref2.type == "bold" || ref2.type == "boldItalic") {
                cssValues["font-weight"] = "bold";
              }
              if (ref2.type == "italic" || ref2.type == "boldItalic") {
                cssValues["font-style"] = "italic";
              }
              appendComment(styleContainer, "docxjs ".concat(f2.name, " font"));
              var cssText = _this.styleToString("@font-face", cssValues);
              styleContainer.appendChild(createStyleElement(cssText));
              _this.refreshTabStops();
            });
          };
          for (var _b = 0, _c = f2.embedFontRefs; _b < _c.length; _b++) {
            var ref = _c[_b];
            _loop_2(ref);
          }
        };
        var this_1 = this;
        for (var _i = 0, _a = fontsPart.fonts; _i < _a.length; _i++) {
          var f = _a[_i];
          _loop_1(f);
        }
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "processStyleName", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(className) {
        return className ? "".concat(this.className, "_").concat(escapeClassName(className)) : this.className;
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "processStyles", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(styles) {
        var stylesMap = keyBy(styles.filter(function(x) {
          return x.id != null;
        }), function(x) {
          return x.id;
        });
        for (var _i = 0, _a = styles.filter(function(x) {
          return x.basedOn;
        }); _i < _a.length; _i++) {
          var style = _a[_i];
          var baseStyle = stylesMap[style.basedOn];
          if (baseStyle) {
            style.paragraphProps = mergeDeep(style.paragraphProps, baseStyle.paragraphProps);
            style.runProps = mergeDeep(style.runProps, baseStyle.runProps);
            var _loop_3 = function(baseValues2) {
              var styleValues = style.styles.find(function(x) {
                return x.target == baseValues2.target;
              });
              if (styleValues) {
                this_2.copyStyleProperties(baseValues2.values, styleValues.values);
              } else {
                style.styles.push(__assign(__assign({}, baseValues2), { values: __assign({}, baseValues2.values) }));
              }
            };
            var this_2 = this;
            for (var _b = 0, _c = baseStyle.styles; _b < _c.length; _b++) {
              var baseValues = _c[_b];
              _loop_3(baseValues);
            }
          } else if (this.options.debug)
            console.warn("Can't find base style ".concat(style.basedOn));
        }
        for (var _d = 0, styles_1 = styles; _d < styles_1.length; _d++) {
          var style = styles_1[_d];
          style.cssName = this.processStyleName(style.id);
        }
        return stylesMap;
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "prodessNumberings", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(numberings) {
        var _a;
        for (var _i = 0, _b = numberings.filter(function(n) {
          return n.pStyleName;
        }); _i < _b.length; _i++) {
          var num = _b[_i];
          var style = this.findStyle(num.pStyleName);
          if ((_a = style === null || style === void 0 ? void 0 : style.paragraphProps) === null || _a === void 0 ? void 0 : _a.numbering) {
            style.paragraphProps.numbering.level = num.level;
          }
        }
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "processElement", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(element) {
        if (element.children) {
          for (var _i = 0, _a = element.children; _i < _a.length; _i++) {
            var e = _a[_i];
            e.parent = element;
            if (e.type == DomType.Table) {
              this.processTable(e);
            } else {
              this.processElement(e);
            }
          }
        }
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "processTable", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(table) {
        for (var _i = 0, _a = table.children; _i < _a.length; _i++) {
          var r = _a[_i];
          for (var _b = 0, _c = r.children; _b < _c.length; _b++) {
            var c = _c[_b];
            c.cssStyle = this.copyStyleProperties(table.cellStyle, c.cssStyle, [
              "border-left",
              "border-right",
              "border-top",
              "border-bottom",
              "padding-left",
              "padding-right",
              "padding-top",
              "padding-bottom"
            ]);
            this.processElement(c);
          }
        }
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "copyStyleProperties", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(input, output, attrs) {
        if (attrs === void 0) {
          attrs = null;
        }
        if (!input)
          return output;
        if (output == null)
          output = {};
        if (attrs == null)
          attrs = Object.getOwnPropertyNames(input);
        for (var _i = 0, attrs_1 = attrs; _i < attrs_1.length; _i++) {
          var key = attrs_1[_i];
          if (input.hasOwnProperty(key) && !output.hasOwnProperty(key))
            output[key] = input[key];
        }
        return output;
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "createSection", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(className, props) {
        var elem = this.createElement("div", { className });
        return elem;
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "renderSections", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(document2) {
        var result = [];
        this.processElement(document2);
        var sections = this.splitBySection(document2.children);
        var prevProps = null;
        for (var i = 0, l = sections.length; i < l; i++) {
          this.currentFootnoteIds = [];
          var section = sections[i];
          var props = section.sectProps || document2.props;
          var sectionElement = this.createSection(this.className + "-centent-body", props);
          this.options.renderHeaders && this.renderHeaderFooter(props.headerRefs, props, result.length, prevProps != props, sectionElement);
          var contentElement = this.createElement("div");
          this.renderElements(section.elements, contentElement);
          sectionElement.appendChild(contentElement);
          if (this.options.renderFootnotes) {
            this.renderNotes(this.currentFootnoteIds, this.footnoteMap, sectionElement);
          }
          if (this.options.renderEndnotes && i == l - 1) {
            this.renderNotes(this.currentEndnoteIds, this.endnoteMap, sectionElement);
          }
          this.options.renderFooters && this.renderHeaderFooter(props.footerRefs, props, result.length, prevProps != props, sectionElement);
          result.push(sectionElement);
          prevProps = props;
        }
        return result;
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "renderHeaderFooter", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(refs, props, page, firstOfSection, into) {
        var _a, _b;
        if (!refs)
          return;
        var ref = (_b = (_a = props.titlePage && firstOfSection ? refs.find(function(x) {
          return x.type == "first";
        }) : null) !== null && _a !== void 0 ? _a : page % 2 == 1 ? refs.find(function(x) {
          return x.type == "even";
        }) : null) !== null && _b !== void 0 ? _b : refs.find(function(x) {
          return x.type == "default";
        });
        var part = ref && this.document.findPartByRelId(ref.id, this.document.documentPart);
        if (part) {
          this.currentPart = part;
          if (!this.usedHederFooterParts.includes(part.path)) {
            this.processElement(part.rootElement);
            this.usedHederFooterParts.push(part.path);
          }
          this.renderElements([part.rootElement], into);
          this.currentPart = null;
        }
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "isPageBreakElement", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem) {
        if (elem.type != DomType.Break)
          return false;
        if (elem.break == "lastRenderedPageBreak")
          return !this.options.ignoreLastRenderedPageBreak;
        return elem.break == "page";
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "splitBySection", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elements) {
        var _this = this;
        var _a;
        var current = { sectProps: null, elements: [] };
        var result = [current];
        for (var _i = 0, elements_1 = elements; _i < elements_1.length; _i++) {
          var elem = elements_1[_i];
          if (elem.type == DomType.Paragraph) {
            var s2 = this.findStyle(elem.styleName);
            if ((_a = s2 === null || s2 === void 0 ? void 0 : s2.paragraphProps) === null || _a === void 0 ? void 0 : _a.pageBreakBefore) {
              current.sectProps = sectProps;
              current = { sectProps: null, elements: [] };
              result.push(current);
            }
          }
          current.elements.push(elem);
          if (elem.type == DomType.Paragraph) {
            var p = elem;
            var sectProps = p.sectionProps;
            var pBreakIndex = -1;
            var rBreakIndex = -1;
            if (this.options.breakPages && p.children) {
              pBreakIndex = p.children.findIndex(function(r) {
                var _a2, _b;
                rBreakIndex = (_b = (_a2 = r.children) === null || _a2 === void 0 ? void 0 : _a2.findIndex(_this.isPageBreakElement.bind(_this))) !== null && _b !== void 0 ? _b : -1;
                return rBreakIndex != -1;
              });
            }
            if (sectProps || pBreakIndex != -1) {
              current.sectProps = sectProps;
              current = { sectProps: null, elements: [] };
              result.push(current);
            }
            if (pBreakIndex != -1) {
              var breakRun = p.children[pBreakIndex];
              var splitRun = rBreakIndex < breakRun.children.length - 1;
              if (pBreakIndex < p.children.length - 1 || splitRun) {
                var children = elem.children;
                var newParagraph = __assign(__assign({}, elem), { children: children.slice(pBreakIndex) });
                elem.children = children.slice(0, pBreakIndex);
                current.elements.push(newParagraph);
                if (splitRun) {
                  var runChildren = breakRun.children;
                  var newRun = __assign(__assign({}, breakRun), { children: runChildren.slice(0, rBreakIndex) });
                  elem.children.push(newRun);
                  breakRun.children = runChildren.slice(rBreakIndex);
                }
              }
            }
          }
        }
        var currentSectProps = null;
        for (var i = result.length - 1; i >= 0; i--) {
          if (result[i].sectProps == null) {
            result[i].sectProps = currentSectProps;
          } else {
            currentSectProps = result[i].sectProps;
          }
        }
        return result;
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "renderWrapper", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(children) {
        return this.createElement("div", { className: "".concat(this.className, "-wrapper") }, children);
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "renderDefaultStyle", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function() {
        var c = this.className;
        var styleText = "\n.".concat(c, "-wrapper { background: gray; padding: 30px; padding-bottom: 0px; display: flex; flex-flow: column; align-items: center; } \n.").concat(c, "-wrapper>section.").concat(c, " { background: white; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5); margin-bottom: 30px; }\n.").concat(c, " { color: black; }\nsection.").concat(c, " { box-sizing: border-box; display: flex; flex-flow: column nowrap; position: relative; overflow: hidden; }\nsection.").concat(c, ">article { margin-bottom: auto; }\n.").concat(c, " table { border-collapse: collapse; }\n.").concat(c, " table td, .").concat(c, " table th { vertical-align: top; }\n.").concat(c, " p { margin: 0pt; min-height: 1em; }\n.").concat(c, " span { white-space: pre-wrap; overflow-wrap: break-word; }\n.").concat(c, " a { color: inherit; text-decoration: inherit; }\n");
        return createStyleElement(styleText);
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "renderNotes", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(noteIds, notesMap, into) {
        var notes = noteIds.map(function(id) {
          return notesMap[id];
        }).filter(function(x) {
          return x;
        });
        if (notes.length > 0) {
          var result = this.createElement("ol", null, this.renderElements(notes));
          into.appendChild(result);
        }
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "renderElement", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem) {
        switch (elem.type) {
          case DomType.Paragraph:
            return this.renderParagraph(elem);
          case DomType.BookmarkStart:
            return this.renderBookmarkStart(elem);
          case DomType.BookmarkEnd:
            return null;
          case DomType.Run:
            return this.renderRun(elem);
          case DomType.Table:
            return this.renderTable(elem);
          case DomType.Row:
            return this.renderTableRow(elem);
          case DomType.Cell:
            return this.renderTableCell(elem);
          case DomType.Hyperlink:
            return this.renderHyperlink(elem);
          case DomType.Drawing:
            return this.renderDrawing(elem);
          case DomType.Image:
            return this.renderImage(elem);
          case DomType.Text:
            return this.renderText(elem);
          case DomType.Tab:
            return this.renderTab(elem);
          case DomType.Symbol:
            return this.renderSymbol(elem);
          case DomType.Break:
            return this.renderBreak(elem);
          case DomType.Footer:
            return this.renderContainer(elem, "footer");
          case DomType.Header:
            return this.renderContainer(elem, "header");
          case DomType.Footnote:
          case DomType.Endnote:
            return this.renderContainer(elem, "li");
          case DomType.FootnoteReference:
            return this.renderFootnoteReference(elem);
          case DomType.EndnoteReference:
            return this.renderEndnoteReference(elem);
          case DomType.NoBreakHyphen:
            return this.createElement("wbr");
        }
        return null;
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "renderChildren", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem, into) {
        return this.renderElements(elem.children, into);
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "renderElements", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elems, into) {
        var _this = this;
        if (elems == null)
          return null;
        var result = elems.map(function(e) {
          return _this.renderElement(e);
        }).filter(function(e) {
          return e != null;
        });
        if (into)
          appendChildren(into, result);
        return result;
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "renderContainer", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem, tagName) {
        return this.createElement(tagName, null, this.renderChildren(elem));
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "renderParagraph", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem) {
        var _a, _b, _c, _d;
        var result = this.createElement("p");
        var style = this.findStyle(elem.styleName);
        (_a = elem.tabs) !== null && _a !== void 0 ? _a : elem.tabs = (_b = style === null || style === void 0 ? void 0 : style.paragraphProps) === null || _b === void 0 ? void 0 : _b.tabs;
        this.renderClass(elem, result);
        this.renderChildren(elem, result);
        this.renderStyleValues(elem.cssStyle, result);
        this.renderCommonProperties(result.style, elem);
        var numbering = (_c = elem.numbering) !== null && _c !== void 0 ? _c : (_d = style === null || style === void 0 ? void 0 : style.paragraphProps) === null || _d === void 0 ? void 0 : _d.numbering;
        if (numbering) {
          if (this.domNumberings[numbering.id] && this.domNumberings[numbering.id][numbering.level]) {
            var numberingData2 = this.domNumberings[numbering.id][numbering.level];
            if (result.firstChild && result.firstChild.innerHTML) {
              result.firstChild.innerHTML = this.numLevelTextToContent(numberingData2) + result.firstChild.innerHTML;
            } else {
              var numberSpan = this.createElement("span");
              numberSpan.innerHTML = this.numLevelTextToContent(numberingData2);
              result.appendChild(numberSpan);
            }
          }
          result.classList.add(this.numberingClass(numbering.id, numbering.level));
        }
        return result;
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "renderRunProperties", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(style, props) {
        this.renderCommonProperties(style, props);
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "renderCommonProperties", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(style, props) {
        if (props == null)
          return;
        if (props.color) {
          style["color"] = props.color;
        }
        if (props.fontSize) {
          style["font-size"] = props.fontSize;
        }
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "renderHyperlink", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem) {
        var result = this.createElement("a");
        this.renderChildren(elem, result);
        this.renderStyleValues(elem.cssStyle, result);
        if (elem.href)
          result.href = elem.href;
        return result;
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "renderDrawing", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem) {
        var _a;
        var result = this.createElement("p");
        result.style.display = "inline-block";
        if (elem.children && ((_a = elem.children[0]) === null || _a === void 0 ? void 0 : _a.type) !== "image") {
          result.style.position = "relative";
          result.style.textIndent = "0px";
        }
        this.renderChildren(elem, result);
        this.renderStyleValues(elem.cssStyle, result);
        return result;
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "renderImage", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem) {
        var _a, _b;
        var result = this.createElement("img");
        !elem.cssStyle["max-width"] && (elem.cssStyle["max-width"] = "100%");
        elem.cssStyle["width"] && (elem.cssStyle["width"] = parseFloat(elem.cssStyle["width"]) * 2 + "pt");
        elem.cssStyle["height"] && (elem.cssStyle["height"] = parseFloat(elem.cssStyle["height"]) * 2 + "pt");
        var align = "";
        ((_b = (_a = elem.parent) === null || _a === void 0 ? void 0 : _a.parent) === null || _b === void 0 ? void 0 : _b.parent) && elem.parent.parent.parent.cssStyle && (align = elem.parent.parent.parent.cssStyle["text-align"]);
        align == "right" && (elem.cssStyle["float"] = "right", elem.cssStyle["height"].replace(/pt$/, "px"));
        align == "center" && (elem.cssStyle["display"] = "block", elem.cssStyle["margin-left"] = "auto", elem.cssStyle["margin-right"] = "auto");
        this.renderStyleValues(elem.cssStyle, result);
        var that = this;
        that.renderImageCount++;
        result.setAttribute("data-tp-src", elem.src);
        if (this.document) {
          this.document.loadDocumentImage(elem.src, this.currentPart).then(function(x) {
            that.ep2.emit("renderImage", { status: "ok", src: x, rId: elem.src });
            result.parentNode.style.width = "100%";
            result.parentNode.style.height = null;
            result.parentNode.style.display = "inline-block";
            result.src = x;
          });
        }
        return result;
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "renderText", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem) {
        return this.htmlDocument.createTextNode(elem.text);
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "renderBreak", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem) {
        if (elem.break == "textWrapping") {
          return this.createElement("br");
        }
        return null;
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "renderSymbol", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem) {
        var span = this.createElement("span");
        span.style.fontFamily = elem.font;
        span.innerHTML = "&#x".concat(elem.char, ";");
        return span;
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "renderFootnoteReference", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem) {
        var result = this.createElement("sup");
        this.currentFootnoteIds.push(elem.id);
        result.textContent = "".concat(this.currentFootnoteIds.length);
        return result;
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "renderEndnoteReference", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem) {
        var result = this.createElement("sup");
        this.currentEndnoteIds.push(elem.id);
        result.textContent = "".concat(this.currentEndnoteIds.length);
        return result;
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "renderTab", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem) {
        var _a;
        var tabSpan = this.createElement("span");
        tabSpan.innerHTML = "&emsp;";
        if (this.options.experimental) {
          tabSpan.className = this.tabStopClass();
          var stops = (_a = findParent(elem, DomType.Paragraph)) === null || _a === void 0 ? void 0 : _a.tabs;
          this.currentTabs.push({ stops, span: tabSpan });
        }
        return tabSpan;
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "renderBookmarkStart", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem) {
        var result = this.createElement("span");
        result.id = elem.name;
        return result;
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "renderRun", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem) {
        if (elem.fieldRun)
          return null;
        var result = this.createElement("span");
        if (elem.id)
          result.id = elem.id;
        this.renderClass(elem, result);
        this.renderStyleValues(elem.cssStyle, result);
        if (elem.verticalAlign) {
          var wrapper = this.createElement(elem.verticalAlign);
          this.renderChildren(elem, wrapper);
          result.appendChild(wrapper);
        } else {
          this.renderChildren(elem, result);
        }
        return result;
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "renderTable", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem) {
        var result = this.createElement("table");
        this.tableCellPositions.push(this.currentCellPosition);
        this.tableVerticalMerges.push(this.currentVerticalMerge);
        this.currentVerticalMerge = {};
        this.currentCellPosition = { col: 0, row: 0 };
        if (elem.columns)
          result.appendChild(this.renderTableColumns(elem.columns));
        !elem.cssStyle["border-collapse"] && (elem.cssStyle["border-collapse"] = "collapse");
        this.renderClass(elem, result);
        this.renderChildren(elem, result);
        this.renderStyleValues(elem.cssStyle, result);
        this.currentVerticalMerge = this.tableVerticalMerges.pop();
        this.currentCellPosition = this.tableCellPositions.pop();
        return result;
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "renderTableColumns", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(columns) {
        var result = this.createElement("colgroup");
        for (var _i = 0, columns_1 = columns; _i < columns_1.length; _i++) {
          var col = columns_1[_i];
          var colElem = this.createElement("col");
          if (col.width)
            colElem.style.width = col.width;
          result.appendChild(colElem);
        }
        return result;
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "renderTableRow", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem) {
        var result = this.createElement("tr");
        this.currentCellPosition.col = 0;
        this.renderClass(elem, result);
        this.renderChildren(elem, result);
        this.renderStyleValues(elem.cssStyle, result);
        this.currentCellPosition.row++;
        return result;
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "renderTableCell", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(elem) {
        var result = this.createElement("td");
        if (elem.verticalMerge) {
          var key = this.currentCellPosition.col;
          if (elem.verticalMerge == "restart") {
            this.currentVerticalMerge[key] = result;
            result.rowSpan = 1;
          } else if (this.currentVerticalMerge[key]) {
            this.currentVerticalMerge[key].rowSpan += 1;
            result.style.display = "none";
          }
        }
        this.renderClass(elem, result);
        this.renderChildren(elem, result);
        this.renderStyleValues(elem.cssStyle, result);
        if (elem.span)
          result.colSpan = elem.span;
        this.currentCellPosition.col++;
        return result;
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "renderStyleValues", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(style, ouput) {
        style && Object.keys(style).forEach(function(key) {
          ouput.style[key] = typeof style[key] == "string" ? style[key].replace(/pt/g, "px") : style[key];
        });
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "renderClass", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(input, ouput) {
        if (input.className)
          ouput.className = input.className;
        if (input.styleName)
          ouput.classList.add(this.processStyleName(input.styleName));
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "findStyle", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(styleName) {
        var _a;
        return styleName && ((_a = this.styleMap) === null || _a === void 0 ? void 0 : _a[styleName]);
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "numberingClass", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(id, lvl) {
        return "".concat(this.className, "-num-").concat(id, "-").concat(lvl);
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "tabStopClass", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function() {
        return "".concat(this.className, "-tab-stop");
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "styleToString", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(selectors, values2, cssText) {
        if (cssText === void 0) {
          cssText = null;
        }
        var result = "".concat(selectors, " {\r\n");
        for (var key in values2) {
          result += "  ".concat(key, ": ").concat(values2[key], ";\r\n");
        }
        if (cssText)
          result += cssText;
        return result + "}\r\n";
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "styleInlineToString", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(values2, cssText) {
        if (cssText === void 0) {
          cssText = null;
        }
        var result = 'style="';
        !values2["font-style"] && (values2["font-style"] = "normal");
        for (var key in values2) {
          result += "".concat(key, ": ").concat(values2[key], "; ");
        }
        if (cssText)
          result += cssText;
        return result + '"';
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "numberingCounter", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(id, lvl) {
        return "".concat(this.className, "-num-").concat(id, "-").concat(lvl);
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "levelTextToContent", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(text, suff, id, numformat) {
        var _this = this;
        var _a;
        var suffMap = {
          "tab": "\\9",
          "space": "\\a0"
        };
        var result = text.replace(/%\d*/g, function(s2) {
          var lvl = parseInt(s2.substring(1), 10) - 1;
          return '"counter('.concat(_this.numberingCounter(id, lvl), ", ").concat(numformat, ')"');
        });
        return '"'.concat(result).concat((_a = suffMap[numberingData.suff]) !== null && _a !== void 0 ? _a : "", '"');
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "numLevelTextToContent", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(numberingData2) {
        var _this = this;
        var _a;
        var suffMap = {
          "tab": "&emsp;",
          "space": "&nbsp;"
        };
        var formatMap = {
          chineseCounting: ["\u96F6", "\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D", "\u4E03", "\u516B", "\u4E5D", "\u5341"],
          decimalEnclosedCircleChinese: ["\u24EA", "\u2460", "\u2461", "\u2462", "\u2463", "\u2464", "\u2465", "\u2466", "\u2467", "\u2468", "\u2469", "\u246A", "\u246B", "\u246C", "\u246D", "\u246E", "\u246F", "\u2470", "\u2471", "\u2472", "\u2473", "\u3251", "\u3252", "\u3253", "\u3254", "\u3255", "\u3256", "\u3257", "\u3258", "\u3259", "\u325A", "\u325B", "\u325C", "\u325D", "\u325E", "\u325F", "\u32B1", "\u32B2", "\u32B3", "\u32B4", "\u32B5", "\u32B6", "\u32B7", "\u32B8", "\u32B9", "\u32BA", "\u32BB", "\u32BC", "\u32BD", "\u32BE", "\u32BF"],
          upperLetter: ["", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"],
          lowerLetter: ["", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"],
          test1: [" ", "\u24B6", "\u24B7", "\u24B8", "\u24B9", "\u24BA", "\u24BB", "\u24BC", "\u24BD", "\u24BE", "\u24BF", "\u24C0", "\u24C1", "\u24C2", "\u24C3", "\u24C4", "\u24C5", "\u24C6", "\u24C7", "\u24C8", "\u24C9", "\u24CA", "\u24CB", "\u24CC", "\u24CD", "\u24CE", "\u24CF"],
          test2: [" ", "\u24D0", "\u24D1", "\u24D2", "\u24D3", "\u24D4", "\u24D5", "\u24D6", "\u24D7", "\u24D8", "\u24D9", "\u24DA", "\u24DB", "\u24DC", "\u24DD", "\u24DE", "\u24DF", "\u24E0", "\u24E1", "\u24E2", "\u24E3", "\u24E4", "\u24E5", "\u24E6", "\u24E7", "\u24E8", "\u24E9"],
          test3: [" ", "\u2776", "\u2777", "\u2778", "\u2779", "\u277A", "\u277B", "\u277C", "\u277D", "\u277E", "\u277F", "\u24EB", "\u24EC", "\u24ED", "\u24EE", "\u24EF", "\u24F0", "\u24F1", "\u24F2", "\u24F3", "\u24F4"],
          test4: [" ", "\u24F5", "\u24F6", "\u24F7", "\u24F8", "\u24F9", "\u24FA", "\u24FB", "\u24FC", "\u24FD", "\u24FE"],
          test5: [" ", "\u3280", "\u3281", "\u3282", "\u3283", "\u3284", "\u3285", "\u3286", "\u3287", "\u3288", "\u3289"],
          upperRoman: [" ", "\u2160", "\u2161", "\u2162", "\u2163", "\u2164", "\u2165", "\u2166", "\u2167", "\u2168", "\u2169", "\u216A", "\u216B"],
          lowerRoman: ["", "\u2170", "\u2171", "\u2172", "\u2173", "\u2174", "\u2175", "\u2176", "\u2177", "\u2178", "\u2179", "\u217A", "\u217B"]
        };
        var result = numberingData2.levelText.replace(/%\d*/g, function(s2) {
          var lvl = parseInt(s2.substring(1), 10) - 1;
          var count = 1;
          if (lvl == numberingData2.level) {
            count = numberingData2.count;
            _this.domNumberings[numberingData2.id][lvl].pCount = count;
            _this.domNumberings[numberingData2.id][lvl + 1] && (_this.domNumberings[numberingData2.id][lvl + 1].count = 1);
            numberingData2.count++;
          } else if (_this.domNumberings[numberingData2.id] && _this.domNumberings[numberingData2.id][lvl]) {
            count = _this.domNumberings[numberingData2.id][lvl].count - 1;
            count == 0 && (count = 1);
          }
          formatMap[numberingData2.format] && (count = formatMap[numberingData2.format][count]);
          return "".concat(count);
        });
        numberingData2.format == "bullet" && (result = "<em " + this.styleInlineToString(numberingData2.rStyle) + '">' + numberingData2.levelText + "</em>");
        return "".concat(result).concat((_a = suffMap[numberingData2.suff]) !== null && _a !== void 0 ? _a : "");
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "numFormatToCssValue", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(format) {
        var mapping = {
          "none": "none",
          "bullet": "disc",
          "decimal": "decimal",
          "lowerLetter": "lower-alpha",
          "upperLetter": "upper-alpha",
          "lowerRoman": "lower-roman",
          "upperRoman": "upper-roman"
        };
        return mapping[format] || format;
      }
    });
    Object.defineProperty(HtmlRenderer2.prototype, "refreshTabStops", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function() {
        var _this = this;
        if (!this.options.experimental)
          return;
        clearTimeout(this.tabsTimeout);
        this.tabsTimeout = setTimeout(function() {
          var pixelToPoint = computePixelToPoint();
          for (var _i = 0, _a = _this.currentTabs; _i < _a.length; _i++) {
            var tab = _a[_i];
            updateTabStop(tab.span, tab.stops, _this.defaultTabSize, pixelToPoint);
          }
        }, 500);
      }
    });
    return HtmlRenderer2;
  }();
  function createElement(tagName, props, children) {
    if (props === void 0) {
      props = void 0;
    }
    if (children === void 0) {
      children = void 0;
    }
    var result = Object.assign(document.createElement(tagName), props);
    children && appendChildren(result, children);
    return result;
  }
  function removeAllElements(elem) {
    elem.innerHTML = "";
  }
  function appendChildren(elem, children) {
    children.forEach(function(c) {
      return elem.appendChild(c);
    });
  }
  function createStyleElement(cssText) {
    return createElement("style", { innerHTML: cssText });
  }
  function appendComment(elem, comment) {
    elem.appendChild(document.createComment(comment));
  }
  function findParent(elem, type) {
    var parent = elem.parent;
    while (parent != null && parent.type != type)
      parent = parent.parent;
    return parent;
  }
  var defaultOptions = {
    ignoreHeight: false,
    ignoreWidth: false,
    ignoreFonts: false,
    breakPages: true,
    debug: false,
    experimental: true,
    className: "tp-importword",
    inWrapper: false,
    trimXmlDeclaration: true,
    ignoreLastRenderedPageBreak: true,
    renderHeaders: false,
    renderFooters: false,
    renderFootnotes: false,
    renderEndnotes: false,
    useBase64URL: false
  };
  function renderAsync(data, userOptions) {
    if (userOptions === void 0) {
      userOptions = null;
    }
    var ops = __assign(__assign({}, defaultOptions), userOptions);
    var bodyContainer = window.document.createElement("div");
    var renderer = new HtmlRenderer(window.document);
    return new Promise(function(resolve) {
      WordDocument.load(data, new DocumentParser(ops), ops).then(function(doc) {
        renderer.render(doc, bodyContainer, null, ops).then(function() {
          resolve({ html: bodyContainer.innerHTML });
        });
      });
    });
  }
  var global$1 = Promise;
  var global$2 = tinymce.util.Tools.resolve("tinymce.Env");
  var global$3 = tinymce.util.Tools.resolve("tinymce.util.Delay");
  var pickFile = function(a) {
    return new global$1(function(e) {
      var c = document.createElement("input");
      c.type = "file";
      c.style.position = "fixed";
      c.style.left = "0";
      c.style.top = "0";
      c.style.opacity = "0.001";
      document.body.appendChild(c);
      var b = function(f) {
        e(Array.prototype.slice.call(f.target.files));
      };
      c.addEventListener("change", b);
      var d2 = function(g) {
        var f = function(f_f) {
          try {
            e(Array.prototype.slice.call(f_f.target ? f_f.target.files : []));
          } catch (err) {
          }
          c.parentNode.removeChild(c);
        };
        if (global$2.os.isAndroid() && g.type !== "remove") {
          global$3.setEditorTimeout(a, f, 0);
        } else {
          f();
        }
        a.off("focusin remove", d2);
      };
      a.on("focusin remove", d2);
      c.click();
    });
  };
  var importword_filter = null;
  var importword_handler = null;
  function importFile(editor, files) {
    readFileInputEventAsArrayBuffer(files, function(arrayBuffer) {
      renderAsync(arrayBuffer).then(function(res) {
        displayResult(editor, res);
      });
    });
  }
  function displayResult(editor, result) {
    var resVal = result.html;
    if (typeof importword_filter == "function")
      ;
    else {
      editor.insertContent(resVal.replace(/\s\s\s/gi, "&nbsp; "));
      try {
        top.tinymce.activeEditor.notificationManager.close();
      } catch (error) {
        try {
          editor.notificationManager.close();
        } catch (error2) {
        }
      }
      editor.notificationManager.open({
        text: "Import to Word succeeded",
        type: "success",
        timeout: 2e3
      });
    }
  }
  function readFileInputEventAsArrayBuffer(files, callback) {
    var file = files[0];
    var reader = new FileReader();
    reader.onload = function(loadEvent) {
      var arrayBuffer = loadEvent.target.result;
      callback(arrayBuffer);
    };
    reader.readAsArrayBuffer(file);
  }
  var getParam = function(editor) {
    importword_filter = editor.getParam("tp_importword_filter", void 0, "function");
    importword_handler = editor.getParam("tp_importword_handler", void 0, "function");
  };
  var create = function(editor, data) {
    getParam(editor);
    pickFile(editor).then(function(files) {
      if (typeof importword_handler == "function") {
        var importword_handler_callback = function(files2) {
          importFile(editor, files2);
        };
        importword_handler(editor, files, importword_handler_callback);
      } else {
        var file_name = files[0].name || "defule.docx";
        if (file_name.substr(file_name.lastIndexOf(".") + 1) == "docx") {
          editor.notificationManager.open({
            text: "Converting...",
            type: "info",
            closeButton: false
          });
          importFile(editor, files);
        } else {
          editor.notificationManager.open({
            text: "Currently only supports docx file format, if it is doc format, please convert it to docx",
            type: "warning"
          });
        }
      }
    });
  };
  var setup = function(editor, opt2) {
    if (!editor.ui.registry.getAll().icons[opt2.registryName]) {
      editor.ui.registry.addIcon(opt2.registryName, opt2.icon);
    }
    editor.ui.registry.addButton(opt2.registryName, {
      icon: opt2.registryName,
      tooltip: opt2.title,
      onAction: function() {
        return create(editor);
      }
    });
    editor.ui.registry.addMenuItem(opt2.registryName, {
      icon: opt2.registryName,
      text: opt2.title,
      onAction: function() {
        return create(editor);
      }
    });
  };
  var register = function(editor, opt2) {
    editor.addCommand("mce".concat(opt2.registryName.substring(0, 1).toUpperCase() + opt2.registryName.substring(1)), function() {
      create(editor);
    });
  };
  var setupI18n = function(e, o) {
    tinymce.util.XHR.send({
      url: e.editorManager.PluginManager.urls[o.registryName] + "/langs/" + (e.settings.language || "en") + ".json",
      async: false,
      dataType: "json",
      success: function(text) {
        try {
          e.tp$.I18n.add(e.settings.language, JSON.parse(text));
        } catch (error) {
        }
      }
    });
  };
  var Plugin = function(opt2) {
    tinymce.PluginManager.add(opt2.registryName, function(editor, url) {
      setupI18n(editor, opt2);
      setup(editor, opt2);
      register(editor, opt2);
      return {
        getMetadata: function() {
          return {
            name: opt2.name,
            url: opt2.repo
          };
        }
      };
    });
  };
  var opt = {
    name: "Importword",
    registryName: "tpImportword",
    title: "import word document",
    repo: "https://github.com/Five-great/tinymce-plugin/tp-importword",
    icon: '<svg t="1604625110140" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="14669" width="24" height="24"><path d="M546.21184 76.9024a30.72 30.72 0 0 1 21.70368 8.9856l248.22784 247.75168a30.72 30.72 0 0 1 9.0112 21.74464v163.3792a10.24 10.24 0 0 1-10.24 10.24h-51.712a10.24 10.24 0 0 1-10.24-10.24v-109.568h-232.448a30.72 30.72 0 0 1-30.72-30.72v-229.888h-330.752v726.016h438.272a10.24 10.24 0 0 1 10.24 10.24v51.2a10.24 10.24 0 0 1-10.24 10.24h-478.72a30.72 30.72 0 0 1-30.72-30.72V107.6224a30.72 30.72 0 0 1 30.72-30.72h427.61728z m197.84192 531.712l-171.40736 141.43488a30.72 30.72 0 0 0 0 47.39072l171.40736 141.43488a10.24 10.24 0 0 0 14.2848-1.2288l36.01408-41.95328a10.24 10.24 0 0 0-1.6128-14.848l-94.68416-71.26016h232.43264a10.24 10.24 0 0 0 10.24-10.24v-51.2a10.24 10.24 0 0 0-10.24-10.24h-232.448l94.69952-71.26016a10.24 10.24 0 0 0 1.6128-14.848l-36.01408-41.95328a10.24 10.24 0 0 0-14.2848-1.2288z m-323.8912-224.512a10.24 10.24 0 0 1 10.24 10.24v51.2a10.24 10.24 0 0 1-10.24 10.24h-190.464a10.24 10.24 0 0 1-10.24-10.24v-51.2a10.24 10.24 0 0 1 10.24-10.24h190.464z m141.312-207.36v155.648a5.12 5.12 0 0 0 5.12 5.12h155.648l-160.768-160.768zM276.48 542.72l37.888 171.008 45.056-171.008h59.904l43.52 173.568 38.4-173.568h50.688l-60.928 248.832H437.76l-49.664-185.856-49.664 185.856H284.16L225.28 542.72h51.2z m143.68768-292.2496a10.24 10.24 0 0 1 10.24 10.24v51.2a10.24 10.24 0 0 1-10.24 10.24h-190.464a10.24 10.24 0 0 1-10.24-10.24v-51.2a10.24 10.24 0 0 1 10.24-10.24h190.464z" ></path></svg>'
  };
  Plugin(opt);
  var main = {
    opt
  };
  return main;
}());