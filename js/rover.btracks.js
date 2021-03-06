
window.BTracks = Backbone.Collection.extend({
    model: BTrack
});

   window.Rover = Backbone.Model.extend({
      
    defaults: {
      zoomMin: 100,
      zoomMax: 100000,
      maxScrollSpeed: 200,
      bufferMultiple: 5
      //width: 0 // in pixels
    },
 
    initialize: function(options) {
       var rover = this;
       this.tracks = new window.BTracks();
       // this.tracks.on("reset", this.updateCounts);

       this.roverDiv = options.viewer;
       this.zoomer = options.zoomer;
       this.scroller = options.scroller;
   //      this.minBufferSize = args['minBufferSize'] || 50000;

       //
       this.updatingLeft = false;
       this.updatingRight = false;
       this.scrollFunc = undefined;


       this.thousandGUrl = "http://bioinformatics.bc.edu/ngsserver";
    //   this.thousandGUrl = "http://0.0.0.0:4569";       
       this.thousandGSources = [];

       // create container divs
       this.scrollInitialized = false;
      // this.setupDivs();

       // setup zoom slider
       //this.setupZoomSlider()

       // setup scroll slider
       $(this.scroller ).slider({
            min: -100,
            max: 100,
            value: 0,
            start: function(event, ui) {
               rover.scrollFunc = setInterval( function() {
                  var scrollPixels = $(rover.scroller).slider('option', 'value') / 100 * rover.maxScrollSpeed;
                  rover.canvasContentDiv.scrollLeft += scrollPixels;
       		  },20)
            },
            stop: function() { window.clearInterval(rover.scrollFunc); $(rover.scroller ).slider('option', 'value', 0);},
        });

       // make tracks sortable
       // $(rover.canvasListDiv).sortable({
       //    update: function() { rover.updateLabelPositions(); }
       // });

       this.hideScrollBar();
       // see if browser is internet explorer and if so give alert
       this.testIE();

       var querys = rover.getUrlQuerys(location.href);
       
       if (querys != undefined) {
          var displayMin = parseInt(querys['min']);
          var displayMax = parseInt(querys['max']);
          
          // set value of bufferSize
          var bufferSize = (displayMax - displayMin) * rover.get('bufferMultiple');
//          bufferSize = 16000/2;
          var min = displayMin - bufferSize;
          var max = displayMax + bufferSize;
          var width = parseInt( (max - min) / (displayMax - displayMin) * this.getDisplayWidth() );
          // check size of canvas b\c of a bug with chrome
          // canvases over 16000 px do not display correctly
          // if (width > 16000) {
          //    var bufferWidthPx = (16000 - this.getDisplayWidth()) / 2;
          //    bufferSize = parseInt( bufferWidthPx / this.getDisplayWidth() * (displayMax - displayMin) ); 
          //    var bufferMultiple = bufferSize / (displayMax - displayMin);
          //    // rover.set({ 'bufferMultiple' : bufferMultiple });
          // }
          
          rover.set({ min: Math.max(displayMin - bufferSize,1),
                      max: parseInt(displayMax + bufferSize),
                      displayMin: displayMin,
                      displayMax: displayMax
                   });
       }
       
       //rover.set({ width: rover.getWidthWithBuffers() });
    },
    
    // getDisplayMin: function() {
    //   return this.get('min') + this.bufferSize; 
    // },
    // 
    // getDisplayMax: function() {
    //    return this.get('max') - this.bufferSize;
    // },

    newTrack: function() {
      var rover = this;
      var track = rover.addTrack("collapse");
      track.showEditPanel();
    },
    
    getBufferWidth: function() {
      return ( this.get('displayMax') - this.get('displayMin') ) * this.get('bufferMultiple');
    },

    addTrack: function(display) {

       // set up divs
       var rover = this;

       // get container divs
       var canvasList = this.canvasListDiv;

       // create elements
       var parentDiv = document.createElement('div');
       parentDiv.className = "rover-canvas-div";
       var trackMenuDiv = document.createElement('div');
       trackMenuDiv.className = "rover-track-menu";
       trackMenuDiv.style.display = 'none';

       var removeTrackDiv = document.createElement('div');
       removeTrackDiv.innerHTML = 'X';
       removeTrackDiv.className = "rover-remove-track-button";
   //      removeTrackDiv.style.display = 'none';

       var newCanvas = document.createElement("canvas");
       var label = document.createElement("span");


       // add meta-data editing capabilities
       var trackEditDiv = document.createElement("div");
       trackEditDiv.className = 'rover-track-edit-div';
       $(trackEditDiv).width( this.getDisplayWidth() );


       // create track
       //var track = new RoverTrack(newCanvas, rover.getWidthWithBuffers());
       var track = new window.BTrack({canvas:newCanvas, canWidth:rover.getWidthWithBuffers()});
       //newCanvas.id = track.id;
       track.rover = rover;
       track.drawStyle = display;


       // associate elements
       canvasList.appendChild(parentDiv);
       this.canvasContentDiv.appendChild(trackMenuDiv);
       this.canvasContentDiv.appendChild(removeTrackDiv);
       this.canvasContentDiv.appendChild(label);
       this.canvasContentDiv.appendChild(trackEditDiv);

       parentDiv.appendChild(document.createElement('br'));
       parentDiv.appendChild(newCanvas);

       // error label
       var errorLabel = document.createElement('a');
       errorLabel.className = 'rover-error';
       errorLabel.innerHTML = 'Error, Retry  '
       errorLabel.onclick = function() { track.hideErrorLabel(); track.source.refetch(); };
       label.appendChild(errorLabel);

       // source title label
       var spinner = document.createElement('span');
       spinner.className = 'spinner';
       spinner.innerHTML = " <img src='images/spinner.gif'/> retrieving from: ";
       var nameDiv = document.createElement('span');

       label.appendChild(spinner);
       label.appendChild(nameDiv);
       label.className = "rover-canvas-label";

       if (this.scaleDiv.childElementCount == 0) {
          rover.initScale();
       }

       // add track menu
       track.createMenu(trackMenuDiv, display);

       // add source edit panel
       track.createEditPanel(trackEditDiv);


       newCanvas.width = this.getWidthWithBuffers();
       $(newCanvas).parent().width(this.getWidthWithBuffers());
       newCanvas.height = '20px';
       newCanvas.className = "rover-canvas";   		      

       // place title/spinner
       var top = $(parentDiv).position().top;
       label.style.top = top + 'px';


       // associate html elements with track
       track.parentDiv = parentDiv;
       track.labelDiv = label;
       track.menuDiv = trackMenuDiv;
       track.removeDiv = removeTrackDiv;
       track.spinner = spinner;
       track.errorLabel = errorLabel;
       track.editDiv = trackEditDiv;
       track.nameDiv = nameDiv;

      // track.min = rover.min;
      // track.max = rover.max;

       // handle track menu
       parentDiv.onmouseover = function() { track.showMenu() };
       parentDiv.onmouseout  = function() { track.hideMenu() };
       trackMenuDiv.onmouseover = function() { track.showMenu() };
       removeTrackDiv.onmouseover = function() { track.showMenu() };
       removeTrackDiv.onclick = function() { rover.removeTrack( track.id ) };
   //     trackMenuDiv.onmouseout  = function() { track.hideMenu() };

       rover.tracks[track.id] = track;

       // call onAddTrack function if set
       if (rover.onAddTrack) rover.onAddTrack(track);      

       return track;   
    },

    removeTrack: function(id) {
       var rover = this;
       var track = rover.tracks[id];

   	   // delete divs associated with track
   	   $(track.parentDiv).remove();
       $(track.labelDiv).remove();
       $(track.menuDiv).remove(); 
       $(track.removeDiv).remove(); 


   	   // abort in progress das requests
   	   if (track.source.request.xhr) {track.source.request.xhr.abort();}

   	   // delete chart from list
   	   delete rover.tracks[id];

   	   // update labels/menus
       rover.updateLabelPositions();

       // call onRemoveTrack function hook if set
       if (rover.onRemoveTrack != undefined) rover.onRemoveTrack(id);
    },

    fetchAll: function(min, max, direction) {
       var rover = this;
       for (var i in rover.tracks) {
          var track = rover.tracks[i];
          rover.tracks[i].source.fetch(min, max, rover.tracks[i].updateSource, track, direction);
       }   

    },

    draw: function(min, max, widthPx, scrollLeftNts, zooming) {
       var rover = this;

       rover.set({width: widthPx});
       this.redrawScale(min, max, scrollLeftNts, zooming);
       var tracks = rover.tracks;
       // draw tracks
         for (var i=0; i < tracks.models.length; i++)  {
            tracks.models[i].draw(min, max, widthPx, zooming);
            
            // 
            // if (rover.tracks[i].source.request.status == 'received') {              
            //    //rover.tracks[i].draw(min, max, widthPx);
            //    rover.tracks[i].draw(min, max, widthPx, zooming);
            // } else {
            //    // show spinner
            //    if ( rover.tracks[i].source.request.error )
            //        rover.tracks[i].showErrorLabel();
            //    else
            //        rover.tracks[i].showSpinner();
            // 
            //    // clear canvas
            //    var chart = rover.tracks[i].center.chart;
            //    if (!zooming)
            //       chart.ctx.clearRect(0, 0, chart.canvas.width, chart.canvas.height);
            //    // set draw to happen when request is received
            //    rover.tracks[i].source.request.drawOnResponse = true;
            // }
         }
    },

    // initScale: function(canvas) {
    //   this.scale = new Scribl(undefined, rover.getWidth());
    //   this.scale.offset = 0;
    //   this.scale.scale.font.size = 11;
    //   this.scale.scale.font.color = 'rgb(220,220,220)';
    //   this.scale.tick.major.color = 'rgb(220,220,220)';
    //   this.scale.tick.minor.color = 'rgb(220,220,220)';
    //   this.scale.tick.halfColor = 'rgb(220,220,220)';
    //   this.scale.scale.size = 8;
    //   this.scale.scale.auto = false;
    //   this.scale.scale.min = rover.get('min'); 
    //   this.scale.scale.max = rover.get('max');
    // },

    // redrawScale: function(min, max, scrollLeftNts, zooming) {                
    // 
    //    // draw scale
    //    var width = this.getWidth();
    //    this.scale.width = width;
    //    this.scale.canvas.width = width;
    // 
    //    // hack to fix scale bug
    //    if (min == 1) min = 0;
    //    this.scale.scale.min = min;
    //    this.scale.scale.max = max;
    //    this.scale.draw();  
    //    var scrollLeft = (scrollLeftNts - min) / (max - min) * width;      
    //    if (zooming)                          
    //      $('.rover-canvas-div').css('margin-left', scrollLeft);
    //    //this.canvasContentDiv.scrollLeft = scrollLeft; 
    //    this.canvasContentDiv.scrollLeft = scrollLeft; 
    // },

    updateLabelPositions: function() {   
       for( var i in this.tracks ) {
          var canvasDiv = this.tracks[i].parentDiv;
          var top = $(canvasDiv).position().top;
          this.tracks[i].labelDiv.style.top = top + 'px';
          this.tracks[i].editDiv.style.top = top + 'px';
       }
    },

    isEmpty: function() {
       for (track in this.tracks) {
           if (this.tracks.hasOwnProperty(track)) return false;
       }
       return true;
    },

    getWidth: function() {
       return parseInt( (this.get('max') - this.get('min')) / (this.get('displayMax') - this.get('displayMin')) * this.getDisplayWidth() );
    },

    getDisplayWidth: function() {         
      return $(this.roverDiv).width();
    },
    
    getDisplayWidthNts: function() {
      return( this.get('displayMax') - this.get('displayMin') ); 
    },

    shiftBufferToCenter: function(direction) {
       var rover = this;

       for (var i in rover.tracks) {
          rover.tracks[i][direction].chart.drawStyle = rover.tracks[i].center.chart.drawStyle;         
          rover.tracks[i].center.chart.removeEventListeners('mouseover');
          var center = rover.tracks[i].center;         
          rover.tracks[i].center = rover.tracks[i][direction];
          rover.tracks[i][direction] = center;
       }      
    },

    // getDisplayMinNts: function() {
    //    var widthPx = this.getDisplayWidth();
    //    var totalPx = this.getWidthWithBuffers();
    //    var leftPx = this.canvasContentDiv.scrollLeft;
    //    var leftNts = leftPx / totalPx * (rover.max - rover.min) + rover.min;
    //    return leftNts;                
    // },
    // 
    // getDisplayMaxNts: function() {
    //    var widthPx = this.getDisplayWidth();
    //    var totalPx = this.getWidthWithBuffers();
    //    var leftPx = this.canvasContentDiv.scrollLeft;
    //    var rightNts = (leftPx+widthPx) / totalPx * (rover.max - rover.min) + rover.min;                
    //    return rightNts;
    // },

    hideScrollBar: function() {
       // set custom scrollbar position and width based on current users scrollbar width
       var scrollBarWidthPx = this.getScrollerWidth();
       $(this.coverScrollBarDiv).css('height', scrollBarWidthPx);
       $(this.coverScrollBarDiv).css('margin-top', -scrollBarWidthPx);      
    },

    getScrollerWidth: function() {
       var scr = null;
       var inn = null;
       var wNoScroll = 0;
       var wScroll = 0;

       // Outer scrolling div
       scr = document.createElement('div');
       scr.style.position = 'absolute';
       scr.style.top = '-1000px';
       scr.style.left = '-1000px';
       scr.style.width = '100px';
       scr.style.height = '50px';
       // Start with no scrollbar
       scr.style.overflow = 'hidden';

       // Inner content div
       inn = document.createElement('div');
       inn.style.width = '100%';
       inn.style.height = '200px';

       // Put the inner div in the scrolling div
       scr.appendChild(inn);
       // Append the scrolling div to the doc

       document.body.appendChild(scr);

       // Width of the inner div sans scrollbar
       wNoScroll = inn.offsetWidth;
       // Add the scrollbar
       scr.style.overflow = 'auto';
       // Width of the inner div width scrollbar
       wScroll = inn.offsetWidth;

       // Remove the scrolling div from the doc
       document.body.removeChild(
       document.body.lastChild);

       // Pixel width of the scroller
       return (wNoScroll - wScroll);
    },

    testIE: function() {
       if (navigator.appName == 'Microsoft Internet Explorer')
         alert("Rover takes advantage of the latest features on the web and therefore doesn't work with Internet Explorer. Please use Chrome, Safari, or Firefox");
    },

    // setupDivs: function() {
    //    var rover = this;
    // 
    //    this.canvasContentDiv = document.createElement('div');
    //    this.canvasContentDiv.id = 'rover-canvas-content';
    //    this.roverDiv.appendChild(this.canvasContentDiv);
    // 
    //    this.scaleDiv = document.createElement('div');
    //    this.scaleDiv.id = 'scaleDiv';
    //    this.canvasContentDiv.appendChild(this.scaleDiv);
    // 
    //    this.canvasListDiv = document.createElement('div');
    //    this.canvasListDiv.id = 'rover-canvas-list';
    //    this.canvasContentDiv.appendChild(this.canvasListDiv);
    // 
    //    this.coverScrollBarDiv = document.createElement('div');
    //    this.coverScrollBarDiv.id = 'rover-cover-scroll-bar';
    //    this.roverDiv.appendChild(this.coverScrollBarDiv);   
    // 
    //    $(this.canvasContentDiv).scroll(function(){
    //       if (!rover.scrollInitialized) {
    //          rover.scrollInitialized = true;
    //          return;
    //       }
    // 
    //       var scrollPos = $(rover.canvasContentDiv).scrollLeft(); 
    //       var canvasWidth = $('.rover-canvas-div canvas').width();
    //       if (canvasWidth == 0) canvasWidth = 14700;   
    //       var viewerWidth = $(rover.canvasContentDiv).width();
    // 
    //       // check for case when zooming and chartview has been shrunk to just viewable width for performance
    //       if (canvasWidth != viewerWidth) {
    // 
    //          if (rover.updatingRight && ( (scrollPos / canvasWidth + viewerWidth / canvasWidth) > .98 )) {
    //             rover.shiftBufferToCenter('right');
    //             var min = rover.max-rover.bufferSize;
    //             var max = rover.max+rover.bufferSize;             
    //             var scrollPos = $(rover.canvasContentDiv).scrollLeft();  
    //             var scrollLeftNts = scrollPos / canvasWidth * (rover.max - rover.min) + rover.min;                                               
    //             rover.draw(min, max, canvasWidth, scrollLeftNts);
    //             rover.updatingRight = false;
    //             rover.min = min;
    //             rover.max = max;                          
    //          } else if (rover.updatingLeft && ( scrollPos / canvasWidth < .02 ) && rover.min > 1 ) {
    //             rover.shiftBufferToCenter('left');
    //             var min = Math.max(rover.min-rover.bufferSize, 1);
    //             var max = rover.min+rover.bufferSize;
    //             var scrollPos = $(rover.canvasContentDiv).scrollLeft();  
    //             var scrollLeftNts = scrollPos / canvasWidth * (rover.max - rover.min) + rover.min;                              
    //             rover.draw(min, max, canvasWidth, scrollLeftNts);
    //             rover.updatingLeft = false;
    //             rover.min = min;
    //             rover.max = max;                          
    //          } else {
    //             if ( !rover.updatingRight && canvasWidth > 0 && ( (scrollPos / canvasWidth + viewerWidth / canvasWidth)  > .7 )) {
    //                 var scrollLeftNts = scrollPos / canvasWidth * (rover.max - rover.min) + rover.min;
    //                 rover.updatingRight = true;
    //                 rover.fetchAll( rover.max-rover.bufferSize, rover.max+rover.bufferSize, 'right');                              
    //             } else if ( !rover.updatingLeft && ( scrollPos / canvasWidth < .3 ) && rover.min > 1) {
    //                 var scrollLeftNts = scrollPos / canvasWidth * (rover.max - rover.min) + rover.min;
    //                 rover.updatingLeft = true;
    //                 var min = Math.max(rover.min-rover.bufferSize, 1);
    //                 var max = rover.min+rover.bufferSize;
    //                 rover.fetchAll(min, max, 'left');                       
    //             }
    // 
    //          }
    //      }
    //    });   
    // },

//     setupZoomSlider: function() {
//        var rover = this;
//     
//        var zoomValue = this.zoomValue || 1000; 
//        $(rover.zoomer).slider({
//           orientation: 'vertical',
//             min: rover.get("zoomMin"),
//             max: rover.get('zoomMax'),
//             value: zoomValue,
//             slide: function(event, ui) { 
//                 // flip value so slider looks like we are going from max to min;
//                var numNtsToShow = rover.get("zoomMax") - ui['value'] + rover.get("zoomMin");
//     
//                // redraw rover with the display being numNtsToShow nts wide
//                rover.zoom(numNtsToShow);
//              },
//             change: function(event,ui) {
//                // check if event was fired by user and if so, proceed
//                // this stops change from firing when programmatically changing value
//                if (event.originalEvent) {
//                    var bufferSize = (rover.scale.scale.max - rover.scale.scale.min) * rover.bufferMultiple;
//                    var newMin = Math.max(rover.scale.scale.min-bufferSize,1);
//                    var newMax = rover.scale.scale.max+bufferSize;
//                    var totalNts = newMax - newMin;
//                    var widthNts = rover.scale.scale.max - rover.scale.scale.min;
//                    var widthPx = $(rover.canvasContentDiv).width();
//                    var totalPx = widthPx / (widthNts / totalNts);
//                    var leftNts = rover.scale.scale.min;
//     
//                    if (newMin < rover.min || newMax > rover.max) {
//                       rover.fetchAll( parseInt(newMin), parseInt(newMax), 'center');
//                       rover.draw(newMin, newMax, totalPx, leftNts, true);
//                    } else
//                       rover.draw(newMin, newMax, totalPx, leftNts, false);
//                    rover.set({ min: newMin,
//                                max: newMax
//                             });
// //                   rover.setViewMinMax(newMin, newMax)
//                 }
//             }
//          });      
//     },

    zoom: function(numNtsToShow) {
        var rover = this;
        var totalNts = rover.get('max') - rover.get('min');
        var totalPx = this.getWidth();

       // get center
       var centerPx = this.canvasContentDiv.scrollLeft + this.getDisplayWidth()/2;
       var totalSliceNts = rover.scale.scale.max - rover.scale.scale.min;
       var centerNts = centerPx / totalPx * totalSliceNts + rover.scale.scale.min;               

       // get min max nt
       var minNts = centerNts - numNtsToShow/2;
       var maxNts = centerNts + numNtsToShow/2;

       rover.draw( minNts, maxNts, this.getDisplayWidth(), undefined, true );
    },

    toURLParams: function() {
       var rover = this;

       // get urls
       var sourceUrls = [];
       var sourceNames = [];
       var sourceTypes = [];
       var trackOptions = [];
       rover.tracks.each( function(track) {
          sourceUrls.push(   track.get('url')        );
          sourceNames.push(  track.get('name')       );
          sourceTypes.push(  track.get('typeFilter') );
          trackOptions.push( track.get('drawStyle')  );
       })

       // get min, max, chromosome      
       var min = rover.get('displayMin')
       var max = rover.get('displayMax')
       var chr = rover.getChromosome();

       // construct query string
       var queryStr = "?"
       queryStr += "urls=" + sourceUrls.join(',');
       queryStr += "&names=" + sourceNames.join(',');
       queryStr += "&min=" + min;
       queryStr += "&max=" + max;
       queryStr += "&display=" + trackOptions.join(',');
       queryStr += "&segment=" + chr;
       queryStr += "&types=" + sourceTypes.join(',');

       return queryStr;
    },

    toURL: function() {
       var url = location.href;  // entire url including querystring - also: window.location.href;
       var baseURL = url.split('?')[0]
       return baseURL + this.toURLParams();
    },

    toIframe: function(args) {
       var url = this.toURL();
       var args = args || {};
       var width = args['width'] || 500;
       var height = args['height'] || 315;
       var style = args['style'] ||
          'border:1px solid rgb(220,220,220); border-radius: 4px" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="';
       var description = args['description'] ||
          '<br/><small><a href="' + url + '" style="color:#0000FF;text-align:left">View Full Screen in Rover</a></small>';

       var iframeStr = '<iframe width="' + width + '" height="' + height + '" style="' + style + '"';
       iframeStr += url;
       iframeStr += '&embed=true"'
       iframeStr += '></iframe>';
       iframeStr += description;
       return iframeStr; 
    },

    loadFromURL: function(url) {
       var rover = this;
       var querys = rover.getUrlQuerys(url);
       if (querys == "" || Object.keys(querys).length <= 0 || Object.keys(querys)[0] == "" )
          return false; // failure

       // toggle splash
       splash = false;
       toggleSplashPage();

       // keep track of querys
       rover.urlQuerys = querys;

       // // set region
       // rover.displayMin = parseInt(querys['min']);
       // rover.displayMax = parseInt(querys['max']);
       // 
       // // set value of zoom slider
       // var zoomValue = rover.get('zoomMax') - (rover.get("displayMax")-rover.get("displayMin")) + rover.get('zoomMin') ;
       // rover.set({ 'zoomValue':zoomValue });
  //     $(rover.zoomer).slider("option", "value", zoomValue);
//       alert(zoomValue);
       // var zoomValue = rover.zoomMax - (rover.displayMax-rover.displayMin) + rover.zoomMin;
       // $(rover.zoomer).slider("option", "value", zoomValue);
       // rover.bufferSize = (rover.displayMax - rover.displayMin) * rover.bufferMultiple;
       // 
       // // set rover min/max
       // if(querys['min'] && querys['max']) {
       //    rover.min = Math.max(rover.displayMin - rover.bufferSize,1);
       //    rover.max = parseInt(rover.displayMax + rover.bufferSize);
       // }

       // add Das sources                   
       var urls = querys['urls'].split(',');
       var names = querys['names'].split(',');
       var types = querys['types'].split(',');
       var displays = querys['display'].split(',');
       var displayMin = querys['min'];
       var displayMax = querys['max'];
       var tracks = [];
       
       // set viewable region
       rover.set({
          displayMin: displayMin,
          displayMax: displayMax
       });

       // set display
       for (var i=0; i < displays.length; i++) {   
          if( /json/.exec(urls[i]) )
             var protocol = 'json';
          else
             var protocol = 'das';

          var display = displays[i].toLowerCase();
          if (display == 'none') display = 'collapse';
         // var track = rover.addTrack(display);      
         var track = new window.BTrack();
         track.set({
            url: urls[i],
            chromosome: querys['segment'],
            name: names[i],
            typefilter: types[i],
            drawStyle: display
          //  min: rover.get('min'),
          //  max: rover.get('max')
          });

          tracks.push( track )

          //track.center.chart.fetch( {data: $.param({min:rover.min, max:rover.max})} );
          //track.center.chart.fetch();

          // if (protocol == 'json')
          //    track.setSource(new JsonSource(names[i], urls[i], querys['segment']));
          // else
          //    track.setSource(new DasSource(names[i], urls[i], types[i], querys['segment']));
          // if ( track.source.url )
          //    track.source.fetch(rover.min, rover.max, track.initSource, track, 'center', true);         
       }       
       
       rover.tracks.reset( tracks );
       _.each(tracks, function(track) {
          track.center.chart.fetch({
                  data: $.param({min:rover.get('min'), max:rover.get('max')}),
                  error: function(chart){ chart.trigger('error'); }
             });
          });
       
       
       // success
       return true;
    },

    getUrlQuerys: function(url){
        url = url.replace('#', '');
        //get the parameters
        url.match(/\?(.+)$/);
        var params = RegExp.$1;
        // split up the query string and store in an
        // associative array
        var params = params.split("&");
        var queryStringList = {};

        for(var i=0;i<params.length;i++) {
            var tmp = params[i].split("=");
            queryStringList[tmp[0]] = unescape(tmp[1]);
        }
        return (queryStringList);
    },

    jumpTo: function(position) {
       var rover = this;

       // var canvasWidth = rover.getWidthWithBuffers();   
       // var viewerWidth = $(this.canvasContentDiv).width();
       // var viewerWidthNts = viewerWidth / canvasWidth * (rover.max - rover.min);
       var displayNts = rover.get('displayMax') - rover.get('displayMin');
       var dispMin = Math.max( position - displayNts/2, 1 );
       var dispMax = dispMin + displayNts;
       var bufferSize = rover.getBufferWidth();
      // var allNts = rover.get('max') - rover.get('min');
       var min = Math.max(dispMin - bufferSize, 1);
       var max = dispMax + bufferSize
       _.each(this.tracks.models, function(track) {
          track.center.chart.fetch({
             data: $.param({min:min, max:max}),
             error: function(chart){ chart.trigger('error') }
          });
       });               
       
       rover.set({
          displayMin: dispMin, 
          displayMax: dispMax,
          min: min,
          max: max
       });
       // var scrollLeftNts = position - viewerWidthNts/2;
       // rover.fetchAll( parseInt(min), parseInt(max), 'center');    
       // rover.draw(min, max, canvasWidth, scrollLeftNts);
       // rover.min = min;
       // rover.max = max;
    },   

    getChromosome: function() {
       if (rover.models)
         return rover.models[0].get('chromosome');
       else
         return 1;
       // for ( var i in this.tracks )
       //    return this.tracks[i].source.chromosome;
    },

    setViewMinMax: function(min, max) {
       var rover = this;
       var tracks = rover.tracks;
       for (var i in tracks){
          tracks[i].center.chart.scale.min = min;
          tracks[i].center.chart.scale.max = max;
       }
    },

    init1000GSources: function() {

       var types = [this.thousandGUrl + "/json/sources/bam", this.thousandGUrl + "/json/sources/vcf.gz"];
       var sources = this.thousandGSources;

       for (var i=0; i<types.length; i++) {
          var xhr = this.createCORSRequest('GET', types[i]);
             xhr.onload = function () {
                 var responseSources = jQuery.parseJSON(this.responseText);
                 sources = jQuery.merge(sources, responseSources);             
             };
             xhr.send();
       }
    },

    createCORSRequest: function(method, url) {
      var xhr = new XMLHttpRequest();
      if ("withCredentials" in xhr) {

        // Check if the XMLHttpRequest object has a "withCredentials" property.
        // "withCredentials" only exists on XMLHTTPRequest2 objects.
        xhr.open(method, url, true);
        //xhr.setRequestHeader('Accept', 'application/json,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
        //application/json;charset=utf-8

      } else if (typeof XDomainRequest != "undefined") {

        // Otherwise, check if XDomainRequest.
        // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
        xhr = new XDomainRequest();
        xhr.open(method, url);

      } else {

        // Otherwise, CORS is not supported by the browser.
        xhr = null;

      }
      return xhr;
    }


});    

// window.ViewerView = Backbone.View.extend({
//    initialize: function() {
//       _.bindAll(this, 'render');
//       this.model.bind('change', this.draw);
//    },
//    
//    render: function() {
//       var view = new BTracksView({ collection: this.model.tracks });
//       $('#rover').html(view.render().el);
//       return this;
//    },
//    
//    draw: function() {
//       
//    }
//    
// });

window.ScaleView = Backbone.View.extend({
   id: 'rover-scale',
   
   initialize: function() {
      this.el.dataset.uid = _.uniqueId();
      _.bindAll(this, 'render', 'draw', 'scroll');
      this.model.bind('change:min change:max', this.draw);
      this.model.bind('change:displayMin change:displayMax change:min change:max', this.scroll)
      this.template = Handlebars.compile( $('#scale-template').html() );
      this.scribl = new Scribl(undefined, rover.getWidth());
      this.scribl.offset = 0;
      this.scribl.scale.font.size = 11;
      this.scribl.scale.font.color = 'rgb(220,220,220)';
      this.scribl.tick.major.color = 'rgb(220,220,220)';
      this.scribl.tick.minor.color = 'rgb(220,220,220)';
      this.scribl.tick.halfColor = 'rgb(220,220,220)';
      this.scribl.scale.size = 8;
      this.scribl.scale.auto = false;
      
      // keeps displayMin and displayMax in sync as this
      // view scrolls
      this.$el.scroll( function(event) {
         var displayWidthNts = rover.get('displayMax') - rover.get('displayMin');
         var displayMin = (rover.get('max') - rover.get('min')) * this.scrollLeft / rover.getWidth() + rover.get('min');

         rover.set(
            { 
               displayMin: displayMin,
               displayMax: displayMin + displayWidthNts,
            },
            {
               uid: event.currentTarget.dataset.uid
         });
      });
      
   },
   
   render: function() {
     this.$el.html(this.template({})); 
     this.scribl.setCanvas( this.$('canvas')[0] );
     this.draw();
     return this;
   },
   
   draw: function() {
      var min = rover.get('min'); 
      var max = rover.get('max');   
      var width = rover.getWidth();
      this.scribl.width = width;
      this.scribl.canvas.width = width;      

      // hack to fix scale bug
      if (min == 1) min = 0;
      this.scribl.scale.min = min;
      this.scribl.scale.max = max;
      
      this.scribl.draw();  
      // var scrollLeft = (rover.get('displayMin') - rover.get('min')) / (rover.get("max") - rover.get('min')) * width;
      // this.$el.scrollLeft(scrollLeft);
   },
   
   scroll: function(model,changes,options) {
      // check if this view is being scrolled by the user
      // if so, do nothing
      if (options.uid != this.el.dataset.uid) {
         // the fetching and buffering logic needs to be refactored out of here. possible to the btracks model
         
         if ( rover.get('displayMin') != rover.get('min') && rover.get('displayMax') != rover.get('max')) {
            var sl = (rover.get('displayMin') - rover.get('min')) * ( rover.getDisplayWidth() / rover.getDisplayWidthNts() );
            sl = Math.round(sl*100) / 100;
            this.el.scrollLeft = sl;

            var bufferSize = rover.getBufferWidth();
            // buffer if getting close to left edge
            if ( !rover.updatingLeft && (rover.get('displayMin') - rover.get('min')) < ( bufferSize*0.20 ) ) {
               rover.updatingLeft = true;
               var newMin = Math.max( rover.get('min')-bufferSize, 1);
               var newMax = newMin + (rover.get('max')-rover.get('min'));
               _.each(rover.tracks.models, function(track) {
                  track.left.chart.fetch({
                     data: $.param({min:newMin, max:newMax}),
                     error: function(chart){ chart.trigger('error') }
                  });
               });               
            } 
            // buffer if getting close to right edge
            else if ( !rover.updatingRight && (rover.get('max')-rover.get('displayMax')) < ( bufferSize*0.20 ) ) {
               rover.updatingRight = true;
               var newMax = rover.get('max')+bufferSize;
               var newMin = newMax - (rover.get('max')-rover.get('min'));
               _.each(rover.tracks.models, function(track) {
                  track.right.chart.fetch({
                     data: $.param({min:newMin, max:newMax}),
                     error: function(chart){ chart.trigger('error') }
                  });
               });

            }
            // draw whats in left buffer
            else if( (rover.get('displayMin') - rover.get('min')) < ( bufferSize*0.05 )) {
               rover.tracks.each( function(track) {
                  if (track.parsed)
                     track.center.chart.set({features: track.left.chart.get('features')});
                  else {
                     track.left.chart.drawOnParse = true;
                     track.trigger('fetching');
                  }
               });
               var newMin = Math.max( rover.get('min')-bufferSize, 1);
               var newMax = newMin + (rover.get('max')-rover.get('min'));
               $('#rover-canvas-list').stop();
               rover.set({ 
                  min: newMin,
                  max: newMax
               });
               // rover.set({min:newMin}, {silent:true});
               // rover.set({max:newMax});
            } 
            // draw whats in right buffer
            else if( (rover.get('max')-rover.get('displayMax')) < ( bufferSize*0.05 ) ) {
               rover.tracks.each( function(track) {                  
                  if (track.parsed)
                     track.center.chart.set({features: track.right.chart.get('features')});
                  else {
                     track.right.chart.drawOnParse = true;
                     track.trigger('fetching');
                  }
               });
               var newMax = rover.get('max')+bufferSize;
               $('#rover-canvas-list').stop();
               rover.set({ 
                  max: newMax,
                  min: newMax - (rover.get('max')-rover.get('min'))
               });
            }
         }
      }
   }
});

window.ZoomView = Backbone.View.extend({
   initialize: function() {
      _.bindAll(this, 'render');
//      this.model.bind('change', this.update);
      
      var rover = this.model;
      // var zoomValue = rover.get('zoomValue') || 1000; 
      var zoomValue = rover.get('zoomMax') - (rover.get("displayMax")-rover.get("displayMin")) + rover.get('zoomMin') ;
      $(rover.zoomer).slider({
       orientation: 'vertical',
         min: rover.get("zoomMin"),
         max: rover.get('zoomMax'),
         value: zoomValue,
         start: function() {
            rover.oldMin = rover.get('min');
            rover.oldMax = rover.get('max');
         },
         slide: function(event, ui) { 
             // flip value so slider looks like we are going from max to min;
            var numNtsToShow = rover.get("zoomMax") - ui['value'] + rover.get("zoomMin");
            var middle = (rover.get('displayMax') - rover.get('displayMin'))/2 + rover.get('displayMin');
            var displayMin = Math.max( (middle - numNtsToShow/2), 1);
            var displayMax = middle + numNtsToShow/2;
            // keep track of current min and max
            rover.set({
               displayMin: displayMin,
               displayMax: displayMax,
               min: displayMin,
               max: displayMax
            });
            // 
            // // redraw rover with the display being numNtsToShow nts wide
            // rover.zoom(numNtsToShow);
          },
         change: function(event,ui) {
            if (!event.originalEvent) {
               $('#zoom-slider').slider('option', 'start').call($('#zoom-slider'));
               $('#zoom-slider').slider('option', 'slide').call($('#zoom-slider'), event, ui);
            }
             var bufferSize = rover.getBufferWidth();
             var newMin = Math.max( rover.get('displayMin') - bufferSize, 1 );
             var newMax = rover.get('displayMax') + bufferSize;

             if ( newMin < rover.oldMin || newMax > rover.oldMax ) {
                rover.set( {min:newMin, max:newMax} );
                _(rover.tracks.models).each( function(track) {
                   track.center.chart.fetch({
                      data: $.param({min:newMin, max:newMax}),
                      error: function(chart){ chart.trigger('error') }
                   });     
                   track.trigger('fetching');                 
                });
             } else {
                rover.set({ min:newMin, max:newMax });
             }
       
       
          }
      });      
      
      //this.template = Handlebars.compile( $('#zoom-template').html() );
      // change this so it uses this.el instead of rover.zoomer inside setupZoomSlider
      //rover.setupZoomSlider();
   },
   
   update: function() {
    //  var zoomValue = rover.get('zoomMax') - (rover.get("displayMax")-rover.get("displayMin")) + rover.get('zoomMin') ;      
   //   $(rover.zoomer).slider('value', zoomValue);
      
   //   return this;
   },
   
   // zoom: function(b,c,e,g,h,i) {
   //    rover.zoom(this.model.get('nucleotideWidth'));
   // },
   
});
