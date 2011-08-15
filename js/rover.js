var Rover = Class.extend({
   init: function(div) {
      this.tracks = new Array();
      this.viewerDiv = div;
      
      // create container divs
      this.scaleDiv = document.createElement('div');
      this.scaleDiv.id = 'scaleDiv';
      this.viewerDiv.appendChild(this.scaleDiv);
      
      this.canvasListDiv = document.createElement('div');
      this.canvasListDiv.id = 'canvasList';
      this.viewerDiv.appendChild(this.canvasListDiv);
   },
   
   addTrack: function(id, source, display) {
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

      // associate elements
      canvasList.appendChild(parentDiv);
      this.viewerDiv.appendChild(optionDiv);
      this.viewerDiv.appendChild(label);
      parentDiv.appendChild(document.createElement('br'));
      parentDiv.appendChild(newCanvas);

      // source title label
      label.innerHTML = "<span class='spinner'> <img src='images/spinner.gif'/> retrieving from: </span>" + source.name;
      label.className = "canvas-label";

      // handle option menu
      parentDiv.onmouseover = function() {toggleOptionMenu(true, optionDiv)};
      parentDiv.onmouseout = function() {toggleOptionMenu(false, optionDiv)};
      optionDiv.onmouseover = function() {toggleOptionMenu(true, optionDiv)};
      optionDiv.onmouseout = function() {toggleOptionMenu(false, optionDiv)};
      var id = id;
      parentDiv.id = id + "-parentdiv";
      optionDiv.id = id + "-optiondiv"
      label.id = id + '-label';

      if (noScale) {
      initScale();
         noScale = false;               
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
      close.onclick = function() {removeCanvas(id);}
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
      gear.onclick = function() { handleOptionMenuClick(menuPanel); };   		      
      $(optionDiv).mouseleave(function() {$(menuPanel).slideUp('fast'); })

      newCanvas.width = canWidth;
      $(newCanvas).parent().width(canWidth);
      newCanvas.height = '20px';
      newCanvas.className = "canvas";   		      

      // place title/spinner
      var top = $(parentDiv).position().top;
      label.style.top = top + 'px';

      // make request
      //         		         var view = new View(newCanvas);

      var track = new RoverTrack(source, newCanvas, canWidth);
      track.parentDiv = parentDiv;
      track.labelDiv = label;
      track.menuDiv = optionDiv;
      
      track.min = scriblMin;
      track.max = scriblMax;
      //                        rover.tracks[newCanvas.id] = track;

      rover.tracks[newCanvas.id] = track;
      track.source.fetch(track.min, track.max, initializeSource, track, 'center');
      //makeDasRequest(track, scriblMin, scriblMax, 'center', initializeSource);
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
      updateLabelPositions();
   },
   
   fetchAll: function(min, max, direction) {
      var rover = this;
      for (var i in rover.tracks) {
         var view = rover.tracks[i];
         rover.tracks[i].source.fetch(min, max, updateSourcesResponse, view, direction);
//         makeDasRequest(view, min, max, direction, updateSourcesResponse)
      }   
      
   },
   
   isEmpty: function() {
      for (track in this.tracks) {
          if (this.tracks.hasOwnProperty(track)) return false;
      }
      return true;
   },
   
   shiftBufferToCenter: function(direction) {
      var rover = this;
      
      for (var i in rover.tracks) {
         rover.tracks[i][direction].chart.drawStyle = rover.tracks[i].center.chart.drawStyle;
         rover.tracks[i].center = rover.tracks[i][direction];
      }      
   }
   
});