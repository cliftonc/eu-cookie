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
      applyStyles: function (element, styles) {
        if (element && element.style) {
          for (var prop in styles) {
            if (styles.hasOwnProperty(prop)) {
              element.style[prop] = styles[prop];
            }
          }
        }
      },
      createElement: function (id, className) {
        var element = Utils.newElement();
        if (arguments[0] !== "") {
          element.setAttribute("id", arguments[0]);
        }
        else if (arguments[1]) {
          this.addClassName(element, className);
        }
        return element;
      },
      newElement: function (type) {
        if (!type) type = "div";
        var element = document.createElement(type);      
        return element;
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
      addHover: function (element, overFn, outFn) {
        if (element.addEventListener) {
          element.addEventListener('mouseover', overFn, false);
          element.addEventListener('mouseout', outFn, false);
        }
        else if (element.attachEvent) {
          element.attachEvent('onmouseover', overFn);
          element.attachEvent('onmouseout', outFn);
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
      animate: function (element, props, duration, callback) {
        var prop,
          initialVal,
          finalVal,
          interval = 16,
          measureProp;
        for (prop in props) {
          switch (prop) {
            case "height": measureProp = "offsetHeight";
              break;
            case "width": measureProp = "offsetWidth";
              break;
          }
          initialVal = element[measureProp];
          finalVal = props[prop];
        }

        var delta = Math.abs(finalVal - initialVal),
          numFrames = Math.floor(duration / interval),
          increment = delta / numFrames;

          var shrinking = finalVal < initialVal;


          var frame = setInterval(function () {
            if (shrinking) {
              if ((element[measureProp] - increment) > finalVal) {
                var newVal = (element[measureProp] - increment) + "px";
                element.style[prop] = newVal;
              }
              else {
                element.style[prop] = finalVal + "px";
                clearInterval(frame);
                if (callback) {
                  callback();
                }
              }
            }
            else {
              if ((element[measureProp] + increment) < finalVal) {
                var newVal = (element[measureProp] + increment) + "px";
                element.style[prop] = newVal;
              }
              else {
                element.style[prop] = finalVal + "px";
                clearInterval(frame);
                if (callback) {
                  callback();
                }
              }
            }
          }, interval);
      }
    };


    var Main = {
      utils: Utils,
      createNotification: function(options) {
         
        UIRoot = options && options.elementId ? document.getElementById(options.elementID) : document.body;
        
        UIContainer = Utils.createElement('eu-directive-container');
        Utils.applyStyles(UIContainer,{
          position:options.position,
          bottom: options.topOrBottom === 'bottom' ? '-40px' : '',
          top: options.topOrBottom === 'top' ? '-40px' : '',
          left:'0px',         
          padding:'10px',
          margin:'0px',
          width:'100%',
          backgroundColor: options.color.background,
          fontFamily: "Arial, sans-serif",
          fontSize:'13px',
          fontWeight: "normal",
          color: options.color.text,
          letterSpacing: "0.5px",
          webkitUserSelect: "none", 
          mozUserSelect: "none",
          userSelect: "none",
          zIndex: '100'         
        });      

        var euText = Utils.newElement('span');
        Utils.setText(euText, options.copy.notice);  
        UIContainer.appendChild(euText);
              
        var euMoreInfo = Utils.newElement('a');
        Utils.setText(euMoreInfo, options.copy.info);
        Utils.addClickHandler(euMoreInfo, Main.infoFn);
        Utils.applyStyles(euMoreInfo,{
          marginLeft:'20px',
          color: options.color.link,
          cursor: 'pointer'
        });
        euMoreInfo.setAttribute('title',options.copy.infoTooltip);
        Utils.addHover(euMoreInfo,function() {
          Utils.applyStyles(this,{
            color:options.color.linkHover
          });
        },function() {
          Utils.applyStyles(this,{
            color:options.color.link
          });
        })
        UIContainer.appendChild(euMoreInfo);
        

        if(options.copy.accept) {
          var euAccept = Utils.newElement('a');        
          Utils.setText(euAccept, options.copy.accept);
          euAccept.setAttribute('title',options.copy.acceptTooltip);
          Utils.addClickHandler(euAccept, Main.acceptFn);
          Utils.applyStyles(euAccept,{
            marginLeft:'20px',
            paddingLeft:'20px',
            color: options.color.link,
            borderLeft:'solid 1px silver',
            cursor: 'pointer'
          });    
          Utils.addHover(euAccept,function() {
            Utils.applyStyles(this,{
              color: options.color.linkHover
            });
          },function() {
            Utils.applyStyles(this,{
              color: options.color.link
            });
          })
          UIContainer.appendChild(euAccept);
        }

        var euClose = Utils.newElement('a');
        Utils.setText(euClose, options.copy.close);
        euClose.setAttribute('title',options.copy.closeTooltip);
        Utils.applyStyles(euClose,{
          float:'right',
          marginRight:'20px',
          color: options.color.link,
          fontWeight:'bolder',
          cursor: 'pointer'
        });  
        Utils.addHover(euClose,function() {
          Utils.applyStyles(this,{
            color:options.color.linkHover
          });
        },function() {
          Utils.applyStyles(this,{
            color:options.color.link
          });
        })         
        Utils.addClickHandler(euClose, Main.closeFn);
        UIContainer.appendChild(euClose);

        // Append
        Utils.showElement(UIContainer);
        // If we are relative at top, try to animate in
        if(options.position === 'relative' && options.topOrBottom === 'top') {          
          UIRoot.insertBefore(UIContainer, UIRoot.firstChild);
          Utils.animate(UIContainer, {top:0}, 200);
        } else {
          // Just stick it in the dom
          UIRoot.appendChild(UIContainer); 
          if(options.topOrBottom === 'top') {
            Utils.animate(UIContainer, {top:0}, 200);     
          } else {
            Utils.animate(UIContainer, {bottom:0}, 200);     
          }
        }

        // Set the timeout for autoaccept
        if(options.acceptTimeout) setTimeout(Main.acceptFn, options.acceptTimeout*1000);

      },
      init: function(options) {
       // Create the notification if no cookie
       var cookieValue = Utils.cookies.getItem(options.cookie.key);
       if(cookieValue !== 'accepted') {
         var shownCount = cookieValue ? parseInt(cookieValue) : 0;
         if(options.frequencyCap && shownCount < options.frequencyCap) {
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
      },
      infoFn: function() {
        window.location = options.policyUrl;
      },
      closeFn: function() {
        Main.acceptFn(); // Just do the same as accept   
      }
    }

    return Main;

  })();

  var options = {
    elementId: '',
    acceptTimeout: 15,    
    frequencyCap: 3,
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
    position:'fixed'    
  }

  // Over ride defaults with options
  if(exports.EUCMOptions) {
    // TODO!
    EUCM.utils.copy(exports.EUCMOptions, options);
  }

 	// Automatically execute
  EUCM.init(options);

 })(window);