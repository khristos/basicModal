//============================================================
// Modal popup function
var modal = {
    init: function (options, elem) {
        // Merge passed-in options with the default options
        this.options = $.extend({}, this.defaults, options);

        // Save the element reference, both as a jQuery
        // reference and a normal DOM reference
        this.elem = elem;
        this.$elem = $(elem);

        // Build the DOM's initial structure
        this._build();

        // Make chainable
        return this;
    },
    cache: {
        $window: $(window),
        $html: $('html'),
        $body: $('body'),
        winHeight: window.innerHeight ? window.innerHeight : $(window).height(),
        winWidth: window.innerWidth ? window.innerWidth : $(window).width(),
        bodyHasListener: false
    },
    helper: {
        $tag: function (tag, id, css) {
            var element = document.createElement(tag);
            if (id) {
                element.id = id;
            }
            if (css) {
                element.style.cssText = css;
            }
            return $(element);
        }
    },
    defaults: {
        prefix: 'gnModal',
        top: 'auto',
        autoOpen: true,
        overlayOpacity: 0.5,
        overlayColor: '#000',
        overlayClose: true,
        overlayParent: 'body',
        closeOnEscape: true,
        closeButtonClass: '.js-gnModal-close',
        modalContent: '.js-gnModal-content',
        onOpen: false,
        onClose: false,
        maxHeight: Math.round((window.innerHeight ? window.innerHeight * 0.92 : $(window).height() * 0.92)) + 'px',
        maxWidth: Math.round((window.innerWidth ? window.innerWidth * 0.9 : $(window).width() * 0.9)) + 'px',
        minWidth: 20 + '%'
    },
    _build: function () {
        var plugin = this,
        o = plugin.options,
        prefix = o.prefix,
        $overlay = $('<div class="' + prefix + '-overlay"></div>');

        $overlay.css({
            'display': 'none',
            'position': 'fixed',
            'z-index': 2000,
            'top': 0,
            'left': 0,
            'height': 100 + '%',
            'width': 100 + '%',
            'background': o.overlayColor,
            'opacity': o.overlayOpacity
        }).appendTo(o.overlayParent);

        var $content = plugin.$elem;
        var $modalBox = $content.clone();

        //IE7 bug: Using jQuery '.attr()' on cloned element fails
        $modalBox[0].setAttribute('id', prefix + '-' + $content.attr('id'));
        $overlay.after($modalBox);

        plugin.$overlay = $overlay;
        plugin.$modalBox = $modalBox;

        plugin._prepDOM();
        plugin._prepModal();
    },
    _prepModal: function () {
        var plugin = this,
        o = plugin.options,
        $modalBox = plugin.$modalBox,
        $modalContent = $modalBox.find(o.modalContent);
        $modalContentChildNode = $modalContent.children().first();

        //Assign element with these CSS rules to help with width
        //calculations. Probably not needed with newest jQuery, but
        //adding in case
        var css = {
            'position': 'absolute',
            'visibility': 'hidden',
            'display': 'block'
        };
        $modalBox.css(css);

        //change 'display' property in order to retrieve correct width
        $modalContentChildNode.css({
            'display': 'inline-block'
        });

        plugin._reCache();

        var $window = plugin.cache.$window,
        winWidth = plugin.cache.winWidth,
        winHeight = plugin.cache.winHeight,
        scrollTop = $window.scrollTop(),
        scrollLeft = $window.scrollLeft(),
        offSet = $modalBox.offset(),
        modalBoxHeight = $modalBox.outerHeight(true),
        contentWidth = o.width || $modalContentChildNode.outerWidth(true),
        contentHeight = $modalContent.outerHeight(true),
        top = scrollTop,
        left = scrollLeft,
        offSetLeft = offSet.left || 0,
        offSetTop = offSet.top || 0;

        left += Math.round(Math.max(winWidth - contentWidth, 0) / 2);
        left = (contentWidth >= winWidth * 0.9) ? 5 + '%' : left + 'px';
        //left = isNaN(left) ? 0 : left + 'px';
        top += Math.round(Math.max(winHeight - modalBoxHeight - offSetTop, 0) / 2);
        top = (modalBoxHeight >= winHeight * 0.9) ? 5 + '%' : top + 'px';

        /*
        window.console && console.log("plugin: ", plugin);
        window.console && console.log("$modalBox: ", $modalBox);
        window.console && console.log("scrollLeft: ", scrollLeft);
        window.console && console.log("scrollTop: ", scrollTop);
        window.console && console.log("offSet: ", offSet);
        window.console && console.log("Left: ", left);
        window.console && console.log("Top: ", top);
        window.console && console.log("winWidth: ", winWidth);
        window.console && console.log("winHeight: ", winHeight);
        window.console && console.log("contentWidth: ", contentWidth);
        window.console && console.log("contentHeight: ", contentHeight);
        window.console && console.log("modalBoxHeight: ", modalBoxHeight);
        */

        $modalBox.css({
            'z-index': 2001,
            'left': parseInt(o.left, 10) > -1 ? o.left + '%' : left,
            'top': parseInt(o.top, 10) > -1 ? o.top + 'px' : top,
            'max-height': o.maxHeight, //|| 100 + '%',
            'max-width': o.maxWidth,
            'min-width': o.minWidth,
            'width': o.width || contentWidth,
            'height': o.height
        });

        $modalContent.css({
            'height': o.height || (modalBoxHeight >= Math.round(winHeight * 0.92)) ? contentHeight + 'px' : 'auto'
        });
        plugin._addBindings();
       //plugin._prepIpad();
    },
    _onResize: function () {
        var plugin = this;
        plugin._reCache();
        plugin._prepModal();
    },
    _addBindings: function () {
        var plugin = this,
        o = plugin.options, timer,
        $overlay = plugin.$overlay,
        $modalBox = plugin.$modalBox,
        $window = plugin.cache.$window;

        $modalBox.bind('openModal.gnModal', function () {
            $modalBox.css({
                'visibility': 'visible',
                'display': 'block'
            });

            $overlay.fadeIn(0, function () {
                if (o.onOpen && typeof (o.onOpen) === 'function') {
                    // onOpen callback receives as argument the modal window
                    o.onOpen($modalBox[0]);
                }
            });
        });

        $modalBox.bind('closeModal.gnModal', function () {
            $modalBox.css('display', 'none');
            $overlay.fadeOut(200, function () {
                if (o.onClose && typeof (o.onClose) === 'function') {
                    // onClose callback receives as argument the modal window
                    o.onClose($modalBox[0]);
                }
                plugin._cleanDOM();
            });
        });

        // Close on overlay click
        $overlay.click(function () {
            if (o.overlayClose)
                $modalBox.trigger('closeModal.gnModal');
        });

        $(document).keydown(function (e) {
            // ESCAPE key pressed
            if (o.closeOnEscape && e.keyCode == 27) {
                $modalBox.trigger('closeModal.gnModal');
            }
        });

        // Close when clicked
        $modalBox.on('click', o.closeButtonClass, function (e) {
            $modalBox.trigger('closeModal.gnModal');
            e.preventDefault();
        });

        // Automatically open modal if option set
        if (o.autoOpen) {
            $modalBox.trigger('openModal.gnModal');
        }

        //reposition when browser window is resized
        /*$window.on('resize.gnModal', function () {
            if (timer) {
                clearTimeout(timer);
            }
            timer = setTimeout(function () {
                timer = null;
                plugin._onResize();
            }, 500);
        });*/

        $window.on('resize.gnModal', debounce(function () {
          plugin._onResize();
        }, 500));

        function debounce(fn, delay) {
          var timer = null;
          return function () {
            var context = this, args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function () {
              fn.apply(context, args);
            }, delay);
          };
        }

        //window.console && console.log($this);
    },
    _cleanDOM: function () {
        var plugin = this,
        $overlay = plugin.$overlay,
        $modalBox = plugin.$modalBox,
        $html = plugin.cache.$html,
        $body = plugin.cache.$body,
        $window = plugin.cache.$window;

        //$modalBox.unbind('click');
        $window.unbind('resize.gnModal');
        $modalBox.remove();
        $overlay.remove();
        $html.removeAttr('style');
        $body.removeAttr('style');

        /*if (plugin.cache.bodyHasListener) {
          document.body.removeEventListener('gesturestart', arguments.callee);
        }*/
    },
    _prepDOM: function () {
        var plugin = this,
        $html = plugin.cache.$html,
        $body = plugin.cache.$body;

        $html.css({
            'height': 100 + '%'
        });
        $body.css({
            'height': 100 + '%',
            'min-height': 100 + '%',
            'top': 0,
            'padding-bottom': 0
        });
    },
   /* _prepIpad: function () {
      //viewport hack to keep proper scaling on reorienting iPad
      if (/iPhone|iPad/.test(navigator.platform) && navigator.userAgent.indexOf("AppleWebKit") > -1) {
        var plugin = this,
            doc = document,
            head = doc.querySelector("head"),
            viewportmeta = doc.querySelector('meta[name="viewport"]');

        if (!viewportmeta) {
          viewportmeta = doc.createElement("meta");
          viewportmeta.name = 'viewport';
        }

        viewportmeta.content = 'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1';
        doc.body.addEventListener('gesturestart', function() {
          viewportmeta.content = 'width=device-width, minimum-scale=0.25, maximum-scale=1.6';
          plugin.cache.bodyHasListener = true;
        }, false);

       head.appendChild(viewportmeta);
      }
    },*/
    _reCache: function() {
      var plugin = this, $window = $(window);
      plugin.cache.winWidth = getWinWidth();
      plugin.cache.winHeight = getWinHeight();

      function getWinWidth() {
        var w = window.innerWidth ? window.innerWidth : $window.width();
        return w;
      }
      function getWinHeight() {
        var h = window.innerHeight ? window.innerHeight : $window.height();
        return h;
      }
    }
};

// Create a plugin based on a defined object
$.plugin = function (name, object) {
    $.fn[name] = function (options) {
        return this.each(function () {
            if (typeof options === 'object' || !options) {
                var instance = Object.create(object);
                instance.init(options, this);
                $.data(this, name, instance);
            } else {
                $.error('Plugin jQuery.' + name + " has not yet been instantiated.");
            }
        });
    };
};

$.plugin('basicModal', modal);

/** USAGE 
*    1. $(selector).basicModal();
*    2. jQueryObject.basicModal();
*    NOTE: 'selector' or jQuery Object references content
*
*    $('#elem').basicModal({property: "value"});
*    var inst = $('#elem').data('basicModal');
*    inst.myMethod('My method');
*
*  INSTANTIATE PLUGIN
*  $.plugin('basicModal', modal);
*/

// END basicModal