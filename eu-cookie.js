/**
 * EU Directive Popup
 */
 (function(exports) {

 	var EUCM = (function() {

    var self = this, UIRoot, UIContainer;

    // Utility functions
    var Utils = {
        cookies: {
            //From https://developer.mozilla.org/en/DOM/document.cookie
          getItem: function (sKey) {
            if (!sKey || !this.hasItem(sKey)) { return null; }
            return unescape(document.cookie.replace(new RegExp("(?:^|.*;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*"), "$1"));
          },         
          setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
            if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/.test(sKey)) { return; }
            var sExpires = "";
            if (vEnd) {
              switch (typeof vEnd) {
                case "number": sExpires = "; max-age=" + vEnd; break;
                case "string": sExpires = "; expires=" + vEnd; break;
                case "object": if (vEnd.hasOwnProperty("toGMTString")) { sExpires = "; expires=" + vEnd.toGMTString(); } break;
              }
            }
            document.cookie = escape(sKey) + "=" + escape(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
          },
          removeItem: function (sKey) {
            if (!sKey || !this.hasItem(sKey)) { return; }
            var oExpDate = new Date();
            oExpDate.setDate(oExpDate.getDate() - 1);
            document.cookie = escape(sKey) + "=; expires=" + oExpDate.toGMTString() + "; path=/";
          },
          hasItem: function (sKey) { return (new RegExp("(?:^|;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie); }
      },
      setText: function (element, textString) {
        //remove existing textNode if there is one
        if (element) {
          Utils.removeChildren(element);
          element.appendChild(document.createTextNode(textString));
        }
      },
      addClickHandler: function (element, fn) {
        if (element.addEventListener) {
          element.addEventListener('click', fn, false);
        }
        else if (element.attachEvent) {
          element.attachEvent('onclick', fn);
        }
      },
      removeChildren: function (element) {
        while (element && element.childNodes.length) {
          element.removeChild(element.childNodes[0]);
        }
      },
      showElement: function (element) {
        Utils.applyStyles(element, {
          display: "block"
        });
      },
      copy: function(from, to) {
          if(from == null || typeof(from) != 'object') return from;    
          for(var key in from)
              to[key] = Utils.copy(from[key], to[key]);    
          return to;
      },
      template: function(text, data) {
        
        // Create a template

        // By default, Underscore uses ERB-style template delimiters, change the
        // following template settings to use alternative delimiters.
        var settings = {
          evaluate    : /<%([\s\S]+?)%>/g,
          interpolate : /<%=([\s\S]+?)%>/g,
          escape      : /<%-([\s\S]+?)%>/g
        };

        // When customizing `templateSettings`, if you don't want to define an
        // interpolation, evaluation or escaping regex, we need one that is
        // guaranteed not to match.
        var noMatch = /.^/;

        // Certain characters need to be escaped so that they can be put into a
        // string literal.
        var escapes = {
          '\\':   '\\',
          "'":    "'",
          r:      '\r',
          n:      '\n',
          t:      '\t',
          u2028:  '\u2028',
          u2029:  '\u2029'
        };

        for (var key in escapes) escapes[escapes[key]] = key;
        var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
        var unescaper = /\\(\\|'|r|n|t|u2028|u2029)/g;

        // Within an interpolation, evaluation, or escaping, remove HTML escaping
        // that had been previously added.
        var unescape = function(code) {
          return code.replace(unescaper, function(match, escape) {
            return escapes[escape];
          });
        };

        // Compile the template source, taking care to escape characters that
        // cannot be included in a string literal and then unescape them in code
        // blocks.
        var source = "__p+='" + text
          .replace(escaper, function(match) {
            return '\\' + escapes[match];
          })
          .replace(settings.escape || noMatch, function(match, code) {
            return "'+\n((__t=(" + unescape(code) + "))==null?'':_.escape(__t))+\n'";
          })
          .replace(settings.interpolate || noMatch, function(match, code) {
            return "'+\n((__t=(" + unescape(code) + "))==null?'':__t)+\n'";
          })
          .replace(settings.evaluate || noMatch, function(match, code) {
            return "';\n" + unescape(code) + "\n__p+='";
          }) + "';\n";

        // If a variable is not specified, place data values in local scope.
        if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

        source = "var __t,__p='',__j=Array.prototype.join," +
          "print=function(){__p+=__j.call(arguments,'')};\n" +
          source + "return __p;\n";

        var render = new Function(settings.variable || 'obj', '_', source);
        if (data) return render(data);
        var template = function(data) {
          return render.call(this, data);
        };

        // Provide the compiled function source as a convenience for precompilation.
        template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

        return template;

      }
    };

    /**
     * IDs are used for speed 
     */
    var Templates = {
      html:"\
        <style> \
           #<%= idPrefix %>container { \
              position: <%= position %>; \
              <%= topOrBottom === 'bottom' ? 'bottom: 0px;' : 'top: 0px' %>; \
              left: 0px; \
              padding: 10px; \
              width: 100%; \
              background-color: <%= color.background %>; \
              font-family: Arial, sans-serif; \
              font-size: 13px; \
              font-weight: normal; \
              color: <%= color.text %>; \
              letter-spacing: 0.5px; \
              webkit-user-select: none; \
              moz-user-select: none; \
              user-select: none; \
              z-index: 100;     \
           }  \
           #<%= idPrefix %>container a { \
              color: <%= color.link %>; \
              text-decoration: none; \
           }\
           #<%= idPrefix %>container a:hover { \
              color: <%= color.linkHover%>; \
           }\
           #<%= idPrefix %>info { \
              display: <%= copy.info ? 'inline' : 'none' %>;\
              margin-left: 20px;\
           }\
           #<%= idPrefix %>accept { \
              display: <%= copy.accept ? 'inline' : 'none' %>;\
              padding-left: 10px;\
              margin-left: 10px;\
           }\
           #<%= idPrefix %>close { \
              display: <%= copy.close ? 'inline' : 'none' %>;\
              font-weight: bold;\
              margin-right:20px; \
              float: right;\
           }\
        </style>\
        <div id='<%= idPrefix %>container'>\
          <span><%= copy.notice %></span>  \
          <a href='#' title='<%= copy.infoTooltip %>' id='<%= idPrefix %>info'><%= copy.info %></a> \
          <a href='#' title='<%= copy.acceptTooltip %>' id='<%= idPrefix %>accept'><%= copy.accept %></a> \
          <a href='#' title='<%= copy.closeTooltip %>' id='<%= idPrefix %>close'><%= copy.close %></a> \
        </div> \
      "
    }

    var Main = {
      utils: Utils,
      createNotification: function(options) {
         
        UIRoot = options && options.elementId ? document.getElementById(options.elementID) : document.body;

        var template = Utils.template(Templates.html),
            content = template(options);
        
        // Add the content to the page
        if(options.position === 'relative' && options.topOrBottom === 'top') {  
          
          // If we are relative at top, push down        
          UIRoot.innerHTML = content + UIRoot.innerHTML;
          UIContainer = document.getElementById(options.idPrefix+'container');

        } else {

          // Just add the content at the bottom     
          UIRoot.innerHTML += content;
          UIContainer = document.getElementById(options.idPrefix+'container');          
                    
        } 

        // Wire up our click handlers
        Utils.addClickHandler(document.getElementById(options.idPrefix+'accept'), Main.acceptFn);
        Utils.addClickHandler(document.getElementById(options.idPrefix+'close'), Main.closeFn);
        Utils.addClickHandler(document.getElementById(options.idPrefix+'info'), Main.infoFn);

        // Call callback
        if(typeof options.callbacks.onVisible === 'function') options.callbacks.onVisible();

        // Set the timeout for autoaccept
        if(options.acceptTimeout) setTimeout(Main.acceptFn, options.acceptTimeout*1000);

      },
      init: function(options) {
       // Create the notification if no cookie
       var cookieValue = Utils.cookies.getItem(options.cookie.key);
       if(cookieValue !== 'accepted') {
         var shownCount = cookieValue ? parseInt(cookieValue) : 0;
         if(!options.frequencyCap || options.frequencyCap && shownCount < options.frequencyCap) {
           Utils.cookies.setItem(options.cookie.key,(shownCount + 1), options.cookie.expires*24*60*60, options.cookie.path, options.cookie.domain, options.cookie.secureOnly);
           Main.createNotification(options);
         }
       } else {
         // Do nothing
       }
      },
      acceptFn: function() {  
        Utils.cookies.setItem(options.cookie.key, 'accepted', options.cookie.expires*24*60*60, options.cookie.path, options.cookie.domain, options.cookie.secureOnly);
        UIRoot.removeChild(UIContainer);
        if(typeof options.callbacks.onAccept === 'function') options.callbacks.onAccept();
      },
      infoFn: function() {
        if(typeof options.callbacks.onInfo === 'function') options.callbacks.onInfo();
        window.location = options.policyUrl;
      },
      closeFn: function() {
        if(typeof options.callbacks.onClose === 'function') options.callbacks.onClose();
        Main.acceptFn(); // Just do the same as accept   
      }
    }

    return Main;

  })();

  var options = {
    elementId: '',
    idPrefix:'eu-cookie-',
    acceptTimeout: 0,    
    frequencyCap: 0,
    policyUrl:'/privacypolicy',
    cookie: {
      key: 'eu-cookie-acceptance',
      expires: 30,
      path: '/',
      domain: '',
      secureOnly: false
    },
    copy: {
      notice:'This site uses cookies.  By continuing to browse the site you are agreeing to our use of cookies:',
      accept:'Accept and hide this notice',
      acceptTooltip:'Click here to accept this and close this notice ...',
      info:'Find out more information here',
      infoTooltip:'Click here to find out more information about how we use cookies ...',
      close:'X',
      closeTooltip:'Click here to accept this and close this notice'
    },
    color: {
      background:'#3F3F3F',      
      text:'#DFDFDF',
      link:'#FFFFFF',
      linkHover:'#EFEFAF'
    },
    topOrBottom:'bottom',
    position:'fixed',
    callbacks: {
      onVisible: function() {},
      onAccept: function() {},
      onClose: function() {},
      onInfo: function() {}
    }  
  }

  // Over ride defaults with options
  if(exports.EUCMOptions) {
    // TODO!
    EUCM.utils.copy(exports.EUCMOptions, options);
  }

 	// Automatically execute
  EUCM.init(options);

 })(window);