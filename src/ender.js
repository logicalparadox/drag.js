!function ($) {
  var drag = require('drag');
  
  drag.select = function (selector) {
    return $(selector)[0];
  };
  
  drag.value = function (el, prop, val) {
    if (!val) {
      return parseFloat($(el).css(prop));
    } else {
      $(el).css(prop, val);
    }
  };
  
  $.ender({
    drag: function () {
      return drag(this);
    }
  }, true);
}(ender);