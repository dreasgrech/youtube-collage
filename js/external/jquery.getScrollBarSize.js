/*
 * Got this from http://stackoverflow.com/questions/3417139/how-do-i-calculate-the-height-of-toolbars-address-bars-and-other-navigation-too/3417992#3417992
 * Modified it slightly to return an object instead of an array
 */

jQuery.getScrollBarSize = function() {
   var inner = $('<p></p>').css({
      'width':'100%',
      'height':'100%'
   });
   var outer = $('<div></div>').css({
      'position':'absolute',
      'width':'100px',
      'height':'100px',
      'top':'0',
      'left':'0',
      'visibility':'hidden',
      'overflow':'hidden'
   }).append(inner);

   $(document.body).append(outer);

   var w1 = inner.width(), h1 = inner.height();
   outer.css('overflow','scroll');
   var w2 = inner.width(), h2 = inner.height();
   if (w1 == w2 && outer[0].clientWidth) {
      w2 = outer[0].clientWidth;
   }
   if (h1 == h2 && outer[0].clientHeight) {
      h2 = outer[0].clientHeight;
   }

   outer.detach();

   return {horizontal: (w1 - w2), vertical: (h1 - h2)};
};
