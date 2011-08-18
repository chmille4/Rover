var RoverTrack = Class.extend({
   init: function(id, source, canvas, canWidth) {
      this.id = id;
      this.source = source;
      this.displayMin = undefined;
      this.displayMax = undefined;
      this.min = undefined;
      this.max = undefined;
      
      //default options
      this.drawStyle = 'collapsed';

      // current view
      this.center = {};
      this.center.chart = new Scribl(canvas, canWidth);
      this.center.chart.scale.off = true;

      // right buffer
      this.right = {};
      this.right.chart = new Scribl(canvas, canWidth);
      this.right.chart.scale.off = true;

      // left buffer
      this.left = {};
      this.left.chart = new Scribl(canvas, canWidth);
      this.left.chart.scale.off = true;            
      
      // html elements
      this.parentDiv = undefined;
      this.labelDiv  = undefined;
      this.menuDiv   = undefined;
      this.menuDropdown = undefined;
      
   },
   
   draw: function(min, max, widthPx) {                         
      var view = this.center.chart;
      
      if (widthPx) {
         view = view.slice(min, max);                        
         view.width = widthPx;
         view.canvas.width = widthPx;
      }
      
      view.scale.off = true;
      view.scale.pretty = false;
      view.laneSizes = 13;
      view.ctx.clearRect(0, 0, view.canvas.width, view.canvas.height);                
      view.scale.min = min;
      view.scale.max = max;
      view.draw();        
      rover.updateLabelPositions();               
    },
   
   initSource: function(response, track) {
      
      // update request status
      track.source.request.status = 'received'; 

      // handle response
      track.source.parse(response, track.center);

      // defaults
      track.center.chart.drawStyle = 'collapse';
      track.center.chart.laneSizes = 13; // set lanesizes so getHeight will be accurate
      track.center.chart.canvas.height = track.center.chart.getHeight();    				

      var canvasId = track.center.chart.canvas.id;
      // check track hasn't been deleted
      if(!rover.tracks.hasOwnProperty(canvasId))
         return;

      // keep track of tracks
      rover.tracks[canvasId] = track;

      // set max & min
      rover.max = track.max;
      rover.min = track.min;

      // turn spinner off
      // have to do it this way b\c there are spaces in the id
      $('[id=' + canvasId + '-label] .spinner').css('display', 'none');

      // draw chart
      track.draw(rover.min, rover.max);
   },
   
   updateSource: function(response, track, direction) {
      
      track.source.request.status = 'received';                              

      // process das response   
      track.source.parse(response, track[direction]);  

      // check if dasRequest needs to be drawn   
      if (track.source.request.drawOnResponse) {
         // hide spinner                  
         if (track.center.chart.canvas.height == 0) 
            track.center.chart.canvas.height = track.center.chart.getHeight();
         var canvasId = track.center.chart.canvas.id;
         // have to do it this way b\c there are spaces in the id
         $('[id=' + canvasId + '-label] .spinner').css('display', 'none');
         //$('.canvas-div').css('margin-left', 0);                  
         document.getElementById(canvasId + '-parentdiv').style.marginLeft = 0;
         track.center.chart.width = rover.getWidthWithBuffers();
         track.center.chart.canvas.width = rover.getWidthWithBuffers();

         track.draw(track.min, track.max);

         // reset request
         track.source.request.drawOnResponse = false;
      }
   },
   
   showMenu: function() {
      var top = $(this.labelDiv).position().top + 2;               
      this.menuDiv.style.top = top + 'px';               
      this.menuDiv.style.display = "inline";
   },
   
   hideMenu: function() {
      this.menuDiv.style.display = 'none'
   },
   
   clickMenu: function() {
      $(this.menuDropdown).slideDown('fast').show(); //Drop down the subnav on click

      $(this.menuDropdown).mouseleave( function() {
         $(this.menuDropdown).slideUp('slow'); //When the mouse hovers out of the subnav, move it back up
      });
   }
   
   
   
});