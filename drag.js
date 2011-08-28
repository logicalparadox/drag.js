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
    this.pos.x =this.current('left');
    this.pos.y =this.current('top');
    if (fn && 'function' == typeof fn) fn.apply(this);
    return this;
  };
  Drag.prototype.bind = function () {
    var self = this;
    this.unbind();
    this._eventHandler = function (e) {
      var posX = self.current('left'),
          posY = self.current('top');
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
          self.pos.dX = newX - self.current('left');
          self.pos.dY = newY - self.current('top');
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