/*!
  * bean.js - copyright Jacob Thornton 2011
  * https://github.com/fat/bean
  * MIT License
  * special thanks to:
  * dean edwards: http://dean.edwards.name/
  * dperini: https://github.com/dperini/nwevents
  * the entire mootools team: github.com/mootools/mootools-core
  */
!function (context) {
  var __uid = 1,
      registry = {},
      collected = {},
      overOut = /over|out/,
      namespace = /[^\.]*(?=\..*)\.|.*/,
      stripName = /\..*/,
      addEvent = 'addEventListener',
      attachEvent = 'attachEvent',
      removeEvent = 'removeEventListener',
      detachEvent = 'detachEvent',
      doc = context.document || {},
      root = doc.documentElement || {},
      W3C_MODEL = root[addEvent],
      eventSupport = W3C_MODEL ? addEvent : attachEvent,

  isDescendant = function (parent, child) {
    var node = child.parentNode;
    while (node !== null) {
      if (node == parent) {
        return true;
      }
      node = node.parentNode;
    }
  },

  retrieveUid = function (obj, uid) {
    return (obj.__uid = uid && (uid + '::' + __uid++) || obj.__uid || __uid++);
  },

  retrieveEvents = function (element) {
    var uid = retrieveUid(element);
    return (registry[uid] = registry[uid] || {});
  },

  listener = W3C_MODEL ? function (element, type, fn, add) {
    element[add ? addEvent : removeEvent](type, fn, false);
  } : function (element, type, fn, add, custom) {
    custom && add && (element['_on' + custom] = element['_on' + custom] || 0);
    element[add ? attachEvent : detachEvent]('on' + type, fn);
  },

  nativeHandler = function (element, fn, args) {
    return function (event) {
      event = fixEvent(event || ((this.ownerDocument || this.document || this).parentWindow || context).event);
      return fn.apply(element, [event].concat(args));
    };
  },

  customHandler = function (element, fn, type, condition, args) {
    return function (e) {
      if (condition ? condition.apply(this, arguments) : W3C_MODEL ? true : e && e.propertyName == '_on' + type || !e) {
        fn.apply(element, Array.prototype.slice.call(arguments, e ? 0 : 1).concat(args));
      }
    };
  },

  addListener = function (element, orgType, fn, args) {
    var type = orgType.replace(stripName, ''),
        events = retrieveEvents(element),
        handlers = events[type] || (events[type] = {}),
        originalFn = fn,
        uid = retrieveUid(fn, orgType.replace(namespace, ''));
    if (handlers[uid]) {
      return element;
    }
    var custom = customEvents[type];
    if (custom) {
      fn = custom.condition ? customHandler(element, fn, type, custom.condition) : fn;
      type = custom.base || type;
    }
    var isNative = nativeEvents[type];
    fn = isNative ? nativeHandler(element, fn, args) : customHandler(element, fn, type, false, args);
    isNative = W3C_MODEL || isNative;
    if (type == 'unload') {
      var org = fn;
      fn = function () {
        removeListener(element, type, fn) && org();
      };
    }
    element[eventSupport] && listener(element, isNative ? type : 'propertychange', fn, true, !isNative && type);
    handlers[uid] = fn;
    fn.__uid = uid;
    fn.__originalFn = originalFn;
    return type == 'unload' ? element : (collected[retrieveUid(element)] = element);
  },

  removeListener = function (element, orgType, handler) {
    var uid, names, uids, i, events = retrieveEvents(element), type = orgType.replace(stripName, '');
    if (!events || !events[type]) {
      return element;
    }
    names = orgType.replace(namespace, '');
    uids = names ? names.split('.') : [handler.__uid];

    function destroyHandler(uid) {
      handler = events[type][uid];
      if (!handler) {
        return;
      }
      delete events[type][uid];
      if (element[eventSupport]) {
        type = customEvents[type] ? customEvents[type].base : type;
        var isNative = W3C_MODEL || nativeEvents[type];
        listener(element, isNative ? type : 'propertychange', handler, false, !isNative && type);
      }
    }

    destroyHandler(names); //get combos
    for (i = uids.length; i--; destroyHandler(uids[i])) {} //get singles

    return element;
  },

  del = function (selector, fn, $) {
    return function (e) {
      var array = typeof selector == 'string' ? $(selector, this) : selector;
      for (var target = e.target; target && target != this; target = target.parentNode) {
        for (var i = array.length; i--;) {
          if (array[i] == target) {
            return fn.apply(target, arguments);
          }
        }
      }
    };
  },

  add = function (element, events, fn, delfn, $) {
    if (typeof events == 'object' && !fn) {
      for (var type in events) {
        events.hasOwnProperty(type) && add(element, type, events[type]);
      }
    } else {
      var isDel = typeof fn == 'string', types = (isDel ? fn : events).split(' ');
      fn = isDel ? del(events, delfn, $) : fn;
      for (var i = types.length; i--;) {
        addListener(element, types[i], fn, Array.prototype.slice.call(arguments, isDel ? 4 : 3));
      }
    }
    return element;
  },

  remove = function (element, orgEvents, fn) {
    var k, m, type, events, i,
        isString = typeof(orgEvents) == 'string',
        names = isString && orgEvents.replace(namespace, ''),
        names = names && names.split('.'),
        rm = removeListener,
        attached = retrieveEvents(element);
    if (isString && /\s/.test(orgEvents)) {
      orgEvents = orgEvents.split(' ');
      i = orgEvents.length - 1;
      while (remove(element, orgEvents[i]) && i--) {}
      return element;
    }
    events = isString ? orgEvents.replace(stripName, '') : orgEvents;
    if (!attached || names || (isString && !attached[events])) {
      for (k in attached) {
        if (attached.hasOwnProperty(k)) {
          for (i in attached[k]) {
            for (m = names.length; m--;) {
              attached[k].hasOwnProperty(i) && new RegExp('^' + names[m] + '::\\d*(\\..*)?$').test(i) && rm(element, [k, i].join('.'));
            }
          }
        }
      }
      return element;
    }
    if (typeof fn == 'function') {
      rm(element, events, fn);
    } else if (names) {
      rm(element, orgEvents);
    } else {
      rm = events ? rm : remove;
      type = isString && events;
      events = events ? (fn || attached[events] || events) : attached;
      for (k in events) {
        if (events.hasOwnProperty(k)) {
          rm(element, type || k, events[k]);
          delete events[k]; // remove unused leaf keys
        }
      }
    }
    return element;
  },

  fire = function (element, type, args) {
    var evt, k, i, m, types = type.split(' ');
    for (i = types.length; i--;) {
      type = types[i].replace(stripName, '');
      var isNative = nativeEvents[type],
          isNamespace = types[i].replace(namespace, ''),
          handlers = retrieveEvents(element)[type];
      if (isNamespace) {
        isNamespace = isNamespace.split('.');
        for (k = isNamespace.length; k--;) {
          for (m in handlers) {
            handlers.hasOwnProperty(m) && new RegExp('^' + isNamespace[k] + '::\\d*(\\..*)?$').test(m) && handlers[m].apply(element, [false].concat(args));
          }
        }
      } else if (!args && element[eventSupport]) {
        fireListener(isNative, type, element);
      } else {
        for (k in handlers) {
          handlers.hasOwnProperty(k) && handlers[k].apply(element, [false].concat(args));
        }
      }
    }
    return element;
  },

  fireListener = W3C_MODEL ? function (isNative, type, element) {
    evt = document.createEvent(isNative ? "HTMLEvents" : "UIEvents");
    evt[isNative ? 'initEvent' : 'initUIEvent'](type, true, true, context, 1);
    element.dispatchEvent(evt);
  } : function (isNative, type, element) {
    isNative ? element.fireEvent('on' + type, document.createEventObject()) : element['_on' + type]++;
  },

  clone = function (element, from, type) {
    var events = retrieveEvents(from), obj, k;
    var uid = retrieveUid(element);
    obj = type ? events[type] : events;
    for (k in obj) {
      obj.hasOwnProperty(k) && (type ? add : clone)(element, type || from, type ? obj[k].__originalFn : k);
    }
    return element;
  },

  fixEvent = function (e) {
    var result = {};
    if (!e) {
      return result;
    }
    var type = e.type, target = e.target || e.srcElement;
    result.preventDefault = fixEvent.preventDefault(e);
    result.stopPropagation = fixEvent.stopPropagation(e);
    result.target = target && target.nodeType == 3 ? target.parentNode : target;
    if (~type.indexOf('key')) {
      result.keyCode = e.which || e.keyCode;
    } else if ((/click|mouse|menu/i).test(type)) {
      result.rightClick = e.which == 3 || e.button == 2;
      result.pos = { x: 0, y: 0 };
      if (e.pageX || e.pageY) {
        result.clientX = e.pageX;
        result.clientY = e.pageY;
      } else if (e.clientX || e.clientY) {
        result.clientX = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        result.clientY = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
      }
      overOut.test(type) && (result.relatedTarget = e.relatedTarget || e[(type == 'mouseover' ? 'from' : 'to') + 'Element']);
    }
    for (var k in e) {
      if (!(k in result)) {
        result[k] = e[k];
      }
    }
    return result;
  };

  fixEvent.preventDefault = function (e) {
    return function () {
      if (e.preventDefault) {
        e.preventDefault();
      }
      else {
        e.returnValue = false;
      }
    };
  };

  fixEvent.stopPropagation = function (e) {
    return function () {
      if (e.stopPropagation) {
        e.stopPropagation();
      } else {
        e.cancelBubble = true;
      }
    };
  };

  var nativeEvents = { click: 1, dblclick: 1, mouseup: 1, mousedown: 1, contextmenu: 1, //mouse buttons
    mousewheel: 1, DOMMouseScroll: 1, //mouse wheel
    mouseover: 1, mouseout: 1, mousemove: 1, selectstart: 1, selectend: 1, //mouse movement
    keydown: 1, keypress: 1, keyup: 1, //keyboard
    orientationchange: 1, // mobile
    touchstart: 1, touchmove: 1, touchend: 1, touchcancel: 1, // touch
    gesturestart: 1, gesturechange: 1, gestureend: 1, // gesture
    focus: 1, blur: 1, change: 1, reset: 1, select: 1, submit: 1, //form elements
    load: 1, unload: 1, beforeunload: 1, resize: 1, move: 1, DOMContentLoaded: 1, readystatechange: 1, //window
    error: 1, abort: 1, scroll: 1 }; //misc

  function check(event) {
    var related = event.relatedTarget;
    if (!related) {
      return related === null;
    }
    return (related != this && related.prefix != 'xul' && !/document/.test(this.toString()) && !isDescendant(this, related));
  }

  var customEvents = {
    mouseenter: { base: 'mouseover', condition: check },
    mouseleave: { base: 'mouseout', condition: check },
    mousewheel: { base: /Firefox/.test(navigator.userAgent) ? 'DOMMouseScroll' : 'mousewheel' }
  };

  var bean = { add: add, remove: remove, clone: clone, fire: fire };

  var clean = function (el) {
    var uid = remove(el).__uid;
    if (uid) {
      delete collected[uid];
      delete registry[uid];
    }
  };

  if (context[attachEvent]) {
    add(context, 'unload', function () {
      for (var k in collected) {
        collected.hasOwnProperty(k) && clean(collected[k]);
      }
      context.CollectGarbage && CollectGarbage();
    });
  }

  var oldBean = context.bean;
  bean.noConflict = function () {
    context.bean = oldBean;
    return this;
  };

  (typeof module !== 'undefined' && module.exports) ?
    (module.exports = bean) :
    (context['bean'] = bean);

}(this);
/*!
  * drag.js - copyright Jake Luer 2011
  * https://github.com/jakeluer/drag.js
  * MIT License
  */
!function (context, doc) {
  if ('undefined' == typeof bean) bean = require('bean');
  var b = bean;
  var current = getComputedStyle || currentStyle;
  var is_touch_device = ('ontouchstart' in doc.documentElement) ? true : false;
  drag = function (selector) {
    return new Drag(drag.select(selector));
  };
  drag.select = function (selector) {
    if ('string' == typeof selector) {
      return document.getElementById(selector) || document.querySelectorAll(selector)[0];
    } else {
      return selector;
    }
  };
  drag.value = function (el, prop, val) {
    if (!val) {
      return parseFloat(current(el).getPropertyValue(prop));
    }
    else {
      el.style[prop] = val;
    }
  };
  
  drag.evs = (function () {
    if (is_touch_device) {
      return {
        start: 'touchstart',
        move: 'touchmove',
        end: 'touchend'
      };
    }
    else {
      return {
        start: 'mousedown',
        move: 'mousemove',
        end: 'mouseup'
      };
    }
  }());
  
  Drag = function Drag(el) {
    if (!(this instanceof Drag)) return new Drag(el);
    this.el = el;
    this._axis = 'both';
    this._start = [];
    this._dragging = [];
    this._end = [];
    this.pos = {};
    return this;
  };
  Drag.prototype.current = function (prop) {
    return drag.value(this.el, prop);
  };
  Drag.prototype.axis = function (axis) {
    if (axis == 'x' || axis == 'y' || axis == 'both') this._axis = axis;
    return this;
  };
  Drag.prototype.container = function (selector) {
    this._container = drag.select(selector);
    return this;
  };
  Drag.prototype.handle = function (selector) {
    this._handle = drag.select(selector);
    return this;
  };
  Drag.prototype.start = function (fn) {
    if (fn && 'function' == typeof fn) this._start.push(fn);
    return this;
  };
  Drag.prototype.dragging = function (fn) {
    if (fn && 'function' == typeof fn) this._dragging.push(fn);
    return this;
  };
  Drag.prototype.end = function (fn) {
    if (fn && 'function' == typeof fn) this._end.push(fn);
    return this;
  };
  Drag.prototype.getPos = function (fn) {
    this.pos = {
      x: parseFloat(this.current('left')),
      y: parseFloat(this.current('top'))
    };
    if (fn && 'function' == typeof fn) fn.apply(this);
    return this;
  };
  Drag.prototype.bind = function () {
    var self = this;
    this.unbind();
    this._eventHandler = function (e) {
      var posX = parseFloat(self.current('left')),
          posY = parseFloat(self.current('top'));
      var moveHandler = function (e2) {
          var offsetX, offsetY, newX, newY;
          if (!is_touch_device) {
            offsetX = e2.clientX - e.clientX;
            offsetY = e2.clientY - e.clientY;
          } else {
            if (e.touches.length == 1) {
              offsetX = e2.touches[0].clientX - e.touches[0].clientX;
              offsetY = e2.touches[0].clientY - e.touches[0].clientY;
            }
          }
          newX = posX + offsetX;
          newY = posY + offsetY;
          if (self._container) {
            var c = self._container;
            if (newX < 0) newX = 0;
            else if (newX >= 0) {
              maxX = (drag.value(c, 'padding-left') + drag.value(c, 'width') + drag.value(c, 'padding-right')) - (drag.value(self.el, 'margin-left') + drag.value(self.el, 'border-left-width') + drag.value(self.el, 'padding-left') + drag.value(self.el, 'width') + drag.value(self.el, 'padding-right') + drag.value(self.el, 'border-right-width') + drag.value(self.el, 'margin-right'));
              if (newX > maxX) newX = maxX;
            }
            if (newY < 0) newY = 0;
            else if (newY >= 0) {
              maxY = (drag.value(c, 'padding-top') + drag.value(c, 'height') + drag.value(c, 'padding-bottom')) - (drag.value(self.el, 'margin-top') + drag.value(self.el, 'border-top-width') + drag.value(self.el, 'padding-top') + drag.value(self.el, 'height') + drag.value(self.el, 'padding-bottom') + drag.value(self.el, 'border-bottom-width') + drag.value(self.el, 'margin-bottom'));
              if (newY > maxY) newY = maxY;
            }
          }
          if (self._axis == 'x') {
            drag.value(self.el, 'left', newX + 'px');
          }
          else if (self._axis == 'y') {
            drag.value(self.el, 'top', newY + 'px');
          }
          else {
            drag.value(self.el, 'left', newX + 'px');
            drag.value(self.el, 'top', newY + 'px');
          }
          self.getPos();
          for (var func in self._dragging) {
            self._dragging[func].apply(self);
          }
          e2.preventDefault();
          e2.stopPropagation();
        };
          
      var cleanup = function () {
        b.remove(doc, drag.evs.move, moveHandler);
        b.remove(doc, drag.evs.end, endHandler);
        b.remove(doc, 'selectstart', prevDef);
        b.remove(self._handle, 'dragstart', prevDef);
      };
      
      var endHandler = function (e2) {
        for (var func in self._end) {
          self._end[func].apply(self);
        }
        cleanup();
      };
      
      var prevDef = function (e3) {
        e3.preventDefault();
        e3.stopPropagation();
      };
      
      for (var func in self._start) {
        self._start[func].apply(self);
      }
      
      doc.body.focus();
      b.add(doc, 'selectstart', prevDef);
      b.add(self._handle, 'dragstart', prevDef);
      
      b.add(doc, drag.evs.move, moveHandler);
      b.add(doc, drag.evs.end, endHandler);
    };
    this.getPos();
    if (!this._handle) this._handle = this.el;
    b.add(this._handle, drag.evs.start, this._eventHandler);
    return this;
  };
  Drag.prototype.unbind = function () {
    if (!this._eventHandler) return this;
    b.remove(this.el, drag.evs.start, this._eventHandler);
    b.remove(this._handle, drag.evs.start, this._eventHandler);
    return this;
  };
  var oldDrag = context.drag;
  drag.noConflict = function () {
    context.drag = oldDrag;
    return this;
  };
  (typeof module !== 'undefined' && module.exports && (module.exports = drag));
  context['drag'] = drag;
}(this, document);