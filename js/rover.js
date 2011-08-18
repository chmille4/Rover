var Rover = Class.extend({
   init: function(roverDiv) {
      this.tracks = new Array();

      this.roverDiv = roverDiv;
      
      // max and min pixels including buffers
      this.max;
      this.min;
      
      // max and min pixels only for display i.e. what you see on screen
      this.displayMax;
      this.displayMin;
      
      // create container divs
      this.setupDivs();
      
      // make tracks sortable
      $('#canvasList').sortable({
         update: function() { rover.updateLabelPositions(); }
      });
      
      this.hideScrollBar();
      // see if browser is internet explorer and if so give alert
      this.testIE();
   },
   
   addTrack: function(name, url, type, display, chromosome) {
      var id = name;
      
      // create source
      var source = new DasSource(name, url, type, chromosome);
      
      // set up divs
      var rover = this;
      
      // get container divs
      var canvasList = this.canvasListDiv;

      // create elements
      var parentDiv = document.createElement('div');
      parentDiv.className = "canvas-div";
      var optionDiv = document.createElement('div');
      optionDiv.className = "option-control";
      optionDiv.style.display = 'none';
      var newCanvas = document.createElement("canvas");
      newCanvas.id = id; 
      var label = document.createElement("span");
      
      
      // create track
      var track = new RoverTrack(id, source, newCanvas, rover.getWidthWithBuffers());
      track.drawStyle = display;
      source.track = track;            

      // associate elements
      canvasList.appendChild(parentDiv);
      this.canvasContentDiv.appendChild(optionDiv);
      this.canvasContentDiv.appendChild(label);
      parentDiv.appendChild(document.createElement('br'));
      parentDiv.appendChild(newCanvas);

      // source title label
      label.innerHTML = "<span class='spinner'> <img src='images/spinner.gif'/> retrieving from: </span>" + source.name;
      label.className = "canvas-label";

      var id = id;
      parentDiv.id = id + "-parentdiv";
      optionDiv.id = id + "-optiondiv"
      label.id = id + '-label';

      if (this.scaleDiv.childElementCount == 0) {
         rover.initScale();
      }

      // option menu buttons
      // gear button
      var gear = document.createElement('span');
      gear.style.float = 'left';
      gear.innerHTML = "<a href='#'><span style='float:left' class='ui-icon ui-icon-gear'></a></span><span style='float:left' class='ui-icon ui-icon-triangle-1-s'></span>";
      gear.onmouseover = function() {$(gear).addClass('option-hover');};
      gear.onmouseout = function() {$(gear).removeClass('option-hover');}   		      
      optionDiv.appendChild(gear);


      // close button
      var close = document.createElement('span');
      close.style.float = 'left';
      close.innerHTML = "<a href='#'><span style='float:left; border-left: 1px solid white' class='ui-icon ui-icon-close'></span></a>";
      close.onmouseover = function() {$(close).addClass('option-hover');};
      close.onmouseout = function() {$(close).removeClass('option-hover');}
      close.onclick = function() {rover.removeTrack(id);}
      optionDiv.appendChild(close);
      optionDiv.appendChild(document.createElement('br'));

      // menu panel
      var menuPanel = document.createElement('ul');
      menuPanel.className = 'subnav';
      menuPanel.style.display = 'none';
      var li = document.createElement('li');
      li.id = newCanvas.id + '-expand-option'
      li.onclick = function() { toggleExpand(newCanvas.id, li);}
      if (display == 'Expand')
         li.innerHTML = "<a href='#'>Collapse</a>";
      else
         li.innerHTML = "<a href='#'>Expand</a>";
      menuPanel.appendChild(li);
      optionDiv.appendChild(menuPanel);       		          		      

      // handle additional events on menu
      gear.onclick = function() { track.clickMenu() };   		      
      $(optionDiv).mouseleave(function() {$(menuPanel).slideUp('fast'); })

      newCanvas.width = this.getWidthWithBuffers();
      $(newCanvas).parent().width(this.getWidthWithBuffers());
      newCanvas.height = '20px';
      newCanvas.className = "canvas";   		      

      // place title/spinner
      var top = $(parentDiv).position().top;
      label.style.top = top + 'px';

      // make request
      //         		         var view = new View(newCanvas);

      
      track.parentDiv = parentDiv;
      track.labelDiv = label;
      track.menuDiv = optionDiv;
      track.menuDropdown = menuPanel;
      
      track.min = rover.min;
      track.max = rover.max;
      
      // handle track menu
      parentDiv.onmouseover = function() { track.showMenu() };
      parentDiv.onmouseout  = function() { track.hideMenu() };
      optionDiv.onmouseover = function() { track.showMenu() };
      optionDiv.onmouseout  = function() { track.hideMenu() };

      rover.tracks[newCanvas.id] = track;
      track.source.fetch(track.min, track.max, track.initSource, track, 'center');
      //makeDasRequest(track, scriblMin, scriblMax, 'center', initializeSource);
      
      // call onAddTrack function if set
      rover.onAddTrack(track);      
   },
   
   removeTrack: function(id) {
      var rover = this;
      var track = rover.tracks[id];

 	   // delete divs associated with track
 	   $(track.parentDiv).remove();
      $(track.labelDiv).remove();
      $(track.menuDiv).remove();      

 	   // abort in progress das requests
 	   track.source.request.xhr.abort();
 	                   	   
 	   // delete chart from list
 	   delete rover.tracks[id];

 	   // update labels/menus
      rover.updateLabelPositions();
      
      // call onRemoveTrack function if set
      if (rover.onRemoveTrack != undefined) rover.onRemoveTrack(id);
   },
   
   fetchAll: function(min, max, direction) {
      var rover = this;
      for (var i in rover.tracks) {
         var view = rover.tracks[i];
         rover.tracks[i].source.fetch(min, max, rover.tracks[i].updateSource, view, direction);
      }   
      
   },
   
   draw: function(min, max, widthPx, scrollLeftNts, zooming) {
      var rover = this;
      
      rover.width = widthPx;
      this.redrawScale(min, max, scrollLeftNts, zooming);


      // draw tracks
        for (i in rover.tracks)  {
           if (rover.tracks[i].source.request.status == 'received') {
              rover.tracks[i].draw(min, max, widthPx);
           } else {
              // show spinner
              // have to do it this way b\c there are spaces in the id
              $('[id=' + i + '-label] .spinner').css('display', 'inherit');

              // clear canvas
              var chart = rover.tracks[i].center.chart;
              if (!zooming)
                 chart.ctx.clearRect(0, 0, chart.canvas.width, chart.canvas.height);

              // set draw to happen when request is received
              rover.tracks[i].source.request.drawOnResponse = true;                                             
           }
        }
   },
   
   initScale: function() {
       var canvas = document.createElement("canvas");
       canvas.id = 'scale';
       canvas.className = 'canvas';
       canvas.height = 20;
       canvas.width = this.getWidthWithBuffers();
       $(this.scaleDiv).prepend(canvas);

 	   this.scale = new Scribl(canvas, this.getWidthWithBuffers());
 	   this.scale.scale.font.size = 11;
      this.scale.scale.font.color = 'rgb(220,220,220)';
      this.scale.tick.major.color = 'rgb(220,220,220)';
      this.scale.tick.minor.color = 'rgb(220,220,220)';
      this.scale.tick.halfColor = 'rgb(220,220,220)';
      this.scale.scale.size = 8;
 	   this.scale.scale.auto = false;
		this.scale.scale.min = rover.min; //$('#slider-range').slider('values',0);
		this.scale.scale.max = rover.max;//$('#slider-range').slider('values',1);
		this.scale.draw();
		// set scroll
      var scrollLeft = (this.displayMin - rover.min) / (rover.max - rover.min) * this.getWidthWithBuffers();
      this.canvasContentDiv.scrollLeft = scrollLeft;
   },
   
   redrawScale: function(min, max, scrollLeftNts, zooming) {                
   
      // draw scale
      this.scale.width = rover.getWidthWithBuffers();
      this.scale.canvas.width = rover.getWidthWithBuffers();
   
      // hack to fix scale bug
      if (min == 1) min = 0;
      this.scale.scale.min = min;
      this.scale.scale.max = max;
      this.scale.draw();  
      var scrollLeft = (scrollLeftNts - min) / (max - min) * rover.getWidthWithBuffers();      
      if (zooming)                          
        $('.canvas-div').css('margin-left', scrollLeft);
      this.canvasContentDiv.scrollLeft = scrollLeft; 
   },
   
   updateLabelPositions: function() {      
      for( var i in this.tracks ) {
         var canvasDiv = this.tracks[i].parentDiv;
         var top = $(canvasDiv).position().top + $('#main').scrollTop();
         var labelId = canvasDiv.id.replace('parentdiv', 'label');                  
         document.getElementById(labelId).style.top = top + 'px';         
      }
   },
   
   isEmpty: function() {
      for (track in this.tracks) {
          if (this.tracks.hasOwnProperty(track)) return false;
      }
      return true;
   },
   
   getWidthWithBuffers: function() {
      // set canvas attributes
      if (this.width == undefined) 
         this.width = parseInt( (rover.max - rover.min) / ( (this.displayMax - this.displayMin) / $(this.canvasContentDiv).width() ) );

      return this.width;      
   },
   
   getDisplayWidth: function() {
     return $(this.canvasContentDiv).width(); 
   },
   
   shiftBufferToCenter: function(direction) {
      var rover = this;
      
      for (var i in rover.tracks) {
         rover.tracks[i][direction].chart.drawStyle = rover.tracks[i].center.chart.drawStyle;
         rover.tracks[i].center = rover.tracks[i][direction];
      }      
   },
   
   getDisplayMinNts: function() {
      var widthPx = this.getDisplayWidth();
      var totalPx = this.getWidthWithBuffers();
      var leftPx = this.canvasContentDiv.scrollLeft;
      var leftNts = leftPx / totalPx * (rover.max - rover.min) + rover.min;
      return leftNts;                
   },

   getDisplayMaxNts: function() {
      var widthPx = this.getDisplayWidth();
      var totalPx = this.getWidthWithBuffers();
      var leftPx = this.canvasContentDiv.scrollLeft;
      var rightNts = (leftPx+widthPx) / totalPx * (rover.max - rover.min) + rover.min;                
      return rightNts;
   },
   
   hideScrollBar: function() {
      // set custom scrollbar position and width based on current users scrollbar width
      var scrollBarWidthPx = this.getScrollerWidth();
      $('#cover-scroll-bar').css('height', scrollBarWidthPx);
      $('#cover-scroll-bar').css('margin-top', -scrollBarWidthPx);      
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
   
   setupDivs: function() {
      this.canvasContentDiv = document.createElement('div');
      this.canvasContentDiv.id = 'canvas-content';
      this.roverDiv.appendChild(this.canvasContentDiv);
      
      this.scaleDiv = document.createElement('div');
      this.scaleDiv.id = 'scaleDiv';
      this.canvasContentDiv.appendChild(this.scaleDiv);
      
      this.canvasListDiv = document.createElement('div');
      this.canvasListDiv.id = 'canvasList';
      this.canvasContentDiv.appendChild(this.canvasListDiv);
      
      this.coverScrollBarDiv = document.createElement('div');
      this.coverScrollBarDiv.id = 'cover-scroll-bar';
      this.roverDiv.appendChild(this.coverScrollBarDiv);      
   },
   
   zoom: function(numNtsToShow) {
       var totalNts = rover.max - rover.min;
       var totalPx = this.getWidthWithBuffers();

      // get center
      var centerPx = this.canvasContentDiv.scrollLeft + this.getDisplayWidth()/2;
      var totalSliceNts = rover.scale.scale.max - rover.scale.scale.min;
      var centerNts = centerPx / totalPx * totalSliceNts + rover.scale.scale.min;               

      // get min max nt
      var minNts = centerNts - numNtsToShow/2;
      var maxNts = centerNts + numNtsToShow/2;

      rover.draw( minNts, maxNts, this.getDisplayWidth() );
      
   },
   
   toURL: function() {
      var rover = this;
      
      // get urls
      var sourceUrls = [];
      for ( var i in rover.tracks )
         sourceUrls.push( rover.tracks[i].source.url );

      // get names
      var sourceNames = [];
      for ( var i in rover.tracks )
         sourceNames.push( rover.tracks[i].source.name );

      // get types
      var types = [];
      for ( var i in rover.tracks )
         types.push( rover.tracks[i].source.typeFilter );

      var trackOptions = [];
      for ( var i in rover.tracks )
           trackOptions.push( rover.tracks[i].drawStyle );                                    

      // get min, max, chromosome      
      var min = rover.getDisplayMinNts();
      var max = rover.getDisplayMaxNts();
      var chr = rover.getChromosome();

      // construct query string
      var queryStr = "?"
      queryStr += "urls=" + sourceUrls.join(',');
      queryStr += "&names=" + sourceNames.join(',');
      queryStr += "&min=" + min;
      queryStr += "&max=" + max;
      queryStr += "&display=" + trackOptions.join(',');
      queryStr += "&segment=" + chr;
      queryStr += "&types=" + types.join(',');

      return queryStr;
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
      
      // set region
      rover.displayMin = parseInt(querys['min']);
      rover.displayMax = parseInt(querys['max']);
      zoomValue = zoomMax - (rover.displayMax-rover.displayMin) + zoomMin;                  
      bufferSize = (rover.displayMax - rover.displayMin) * bufferMultiple;

      if(querys['min'] && querys['max']) {
         rover.min = Math.max(rover.displayMin - bufferSize,1);
         rover.max = parseInt(rover.displayMax + bufferSize);
      }

      // add Das sources                   
      var urls = querys['urls'].split(',');
      var names = querys['names'].split(',');
      var types = querys['types'].split(',');
      var displays = querys['display'].split(',');

      // set display
      for (var i=0; i < displays.length; i++) {                            
         if (displays[i] == 'Expand' || displays[i] == 'Collapse'){
            rover.addTrack(names[i], urls[i], types[i], displays[i], querys['segment']);
         }
      }
      
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
   
   getChromosome: function() {
      for ( var i in this.tracks )
         return this.tracks[i].source.chromosome;
   }
   
   
});