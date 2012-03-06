var RoverTrack = Class.extend({
   init: function(canvas, canWidth) {
      var track = this;
      this.id = _uniqueId('roverTrack');
      this.source = undefined;
      this.displayMin = undefined;
      this.displayMax = undefined;
      this.rover = undefined;
      this.canvas = canvas;
      this.laneSizes = 18;
      
      //default options
      this.drawStyle = 'collapsed';

      // current view
      this.center = {};
      this.center.chart = this.setupDefaultScribl( new Scribl(this.canvas, canWidth) );    
      // right buffer
      this.right = {};
      this.right.chart = this.setupDefaultScribl( new Scribl(this.canvas, canWidth) );
      // left buffer
      this.left = {};
      this.left.chart = this.setupDefaultScribl( new Scribl(this.canvas, canWidth) );
      
      // html elements
      this.parentDiv = undefined;
      this.labelDiv  = undefined;
      this.menuDiv   = undefined;
      this.removeDiv   = undefined;
      this.menuDropdown = undefined;
      this.spinner = undefined;
      this.errorLabel = undefined;
      this.nameDiv = undefined;
      this.editDiv = undefined;
      
      this.__defineGetter__("$thousandGSelect", function(){return $('#' +track.id+ "-edit-thousandG");});
      // inputs
      this.__defineGetter__("$nameInput", function(){return $('#' +track.id+ "-edit-name");});
      this.__defineGetter__("$urlInput", function(){return $('#' +track.id+ "-edit-urlInput");});
      this.__defineGetter__("$chromosomeInput", function(){return $('#' +track.id+ "-edit-chromosome");});
      this.__defineGetter__("$typeFilterInput", function(){return $('#' +track.id+ "-edit-typeFilter");});
   },
   
   setSource: function(source) {
      this.source = source;      
      source.track = this;
      this.setName(source.name);
   },
   
   draw: function(min, max, widthPx, zooming) {                         
      var view = this.center.chart;
      view.scale.min = min;
      view.scale.max = max;
      
      if (widthPx) {
         // TODO: figure out someway to move this slice to zoom only
         // so it doesn't cause all these copying problems!
         view = view.slice(min, max);
         view.scale.min = min;
         view.scale.max = max;
         view.width = widthPx;
         view.canvas.width = widthPx;
      }
      
      if (zooming) {
         // set events to already added
         // so mulitple Listeners don't get added to the canvas element
         view.events.added = true;
      }   
      
      view.ctx.clearRect(0, 0, view.canvas.width, view.canvas.height);                
      if(view.drawStyle != this.drawStyle) {
         view.drawStyle = this.drawStyle;
         view.canvas.height = view.getHeight();
      }
      view.draw();        
      this.rover.updateLabelPositions();               
      this.hideErrorLabel();
    },
   
   initSource: function(response, track) {
      
      // update request status
      track.source.request.status = 'received'; 

      // handle response
      track.source.parse(response, track.center);

      // defaults
      track.center.chart.drawStyle = 'collapse';
     // track.center.chart.laneSizes = 13; // set lanesizes so getHeight will be accurate
      track.center.chart.canvas.height = track.center.chart.getHeight();    				


      // check track hasn't been deleted
      if(!rover.tracks.hasOwnProperty(track.id))
         return;

      // keep track of tracks
      rover.tracks[track.id] = track;

      // set max & min
      rover.max = track.max;
      rover.min = track.min;

      // turn spinner off
      track.hideSpinner();

      // draw chart
      track.draw(rover.min, rover.max);
   },
   
   updateSource: function(response, track, direction) {
      
      track.source.request.status = 'received';                              

      // process das response   
      track.source.parse(response, track[direction]);  

      // check if dasRequest needs to be drawn   
      if (track.source.request.drawOnResponse) {                  
         if (track.center.chart.canvas.height == 0) 
            track.center.chart.canvas.height = track.center.chart.getHeight();
         
         // hide spinner
         track.hideSpinner();
         
         track.parentDiv.style.marginLeft = 0;
         track.center.chart.width = rover.getWidthWithBuffers();
         track.center.chart.canvas.width = rover.getWidthWithBuffers();

         track.draw(track.rover.min, track.rover.max);

         // reset request
         track.source.request.drawOnResponse = false;
      }
   },
   
   createMenu: function(trackMenuDiv, display) {
      var track = this;
      
      // generate track menu html from template
      $('#templates').load("app/templates/trackMenu.handlebars", function(){
          // handle everything after you have your templates loaded...

      var template = Handlebars.compile( $("#track-menu-template").html() );
      $(trackMenuDiv).html( template({ trackId : track.id }) );
      
      // set menu actions
      $('[class=' + track.id + '-drawStyle]').click([track], function(event) { 
         var track = event.data[0];
         var newDrawStyle = event.target.name;
         track.drawStyle = newDrawStyle;
         track.draw(track.rover.min, track.rover.max)
      });
      
      $('[class=' + track.id + '-edit]').click([track], function(event) { 
         var track = event.data[0];
         track.showEditPanel();
      });
      
      // set click and hover behavior
      $(trackMenuDiv).unbind('click').click( function(event) {
        $(trackMenuDiv).find('.sub_menu').css('visibility', 'visible');
      });
      
      $(trackMenuDiv).unbind('mouseleave').mouseleave( function(event){
         $(trackMenuDiv).find('.sub_menu').css('visibility', 'hidden');
      });
   });
   },
   
   showMenu: function() {
      var top = $(this.labelDiv).position().top + 2;               
      
      // go over all tracks and show this tracks menu while hiding all others
      // this has to be done b\c the extended menu wasn't triggering mouseout
      for ( var i in this.rover.tracks) {
         if (this.rover.tracks[i].id == this.id ) {
            this.menuDiv.style.top = top + 'px';               
            this.menuDiv.style.display = "inline";

            this.removeDiv.style.top = top + 'px';
            this.removeDiv.style.display = "inline";
         } else {
            this.rover.tracks[i].hideMenu();
         }
      }      
   },
   
   hideMenu: function() {
      this.menuDiv.style.display = 'none';
      this.removeDiv.style.display = 'none'
   },
   
   
   
   createEditPanel: function(editDiv) {
      var track = this;
      
      // generate track menu html from template
      // template located in app/views/trackMenu.handlebars
      $('#templates').load("app/templates/editTrack.handlebars", function() {
         // create html
         var template = Handlebars.compile( $('#edit-track-template').html() );
         $(editDiv).html( template( {track:track} ) );
         
         // add functonality
         $('#' + track.id + '-edit-close').click([track], function(event) { 
            var track = event.data[0];
            track.hideEditPanel();
         });
         
         $('#' + track.id + '-edit-save').click([track], function(event) { 
            var track = event.data[0];
            track.saveEditPanel();
         });
         
         track.$thousandGSelect.change([track], function(event) { 
            var track = event.data[0];
            track.updateNewTrackFrom(track);
         });
         var t = '#' + track.id + "-edit-chromosome";
         $(t).attr('disabled','disabled');
      });
   },
   
   showEditPanel: function() {
      // edit panel height
      var panelHeight = '130px';
      
      // update position
      var top = $(this.parentDiv).position().top + $('#main').scrollTop();
      this.editDiv.style.top = top + 'px';
      
      // change height
      $(this.parentDiv).height( panelHeight );
      $(this.editDiv).height( panelHeight );
      
      // show edit panel      
      $(this.editDiv).css('display', 'inline');
     
      this.rover.updateLabelPositions()
   },
   
   hideEditPanel: function() {
       // change height
       $(this.parentDiv).height( "" );

       // show edit panel      
       $(this.editDiv).css('display', 'none');

      this.rover.updateLabelPositions()
   },
   
   saveEditPanel: function() {
      var track = this;
      if ( !track.source && track.urlInput.val().match('das') )
          track.setSource( new DasSource("", "", "", "", ""))
       else if ( !track.source && $(track.urlInput).val().match('json') )
             track.setSource( new JsonSource("", "", "", "", ""))
       // else if ( !track.source && track.fileInput.files.length > 0 )
       //    track.setSource( new BamSource("", "", "", "", ""));
       
       track.setName( track.$nameInput.val() );
       
       var change = false;
       change = track.setUrl( track.$urlInput.val() ) || change;
       //change = track.setFiles( track.fileInput.files ) || change;
       change = track.setChromosome( track.$chromosomeInput.val() ) || change;
       change = track.setTypeFilter( track.$typeFilterInput.val() ) || change;
       
       // check if any attributes are changed that require seq data to be refetched
       if (change)
          track.source.refetch();
       
       track.hideEditPanel();
   },
   
   clickMenu: function() {
      $(this.menuDropdown).slideDown('fast').show(); //Drop down the subnav on click

      $(this.menuDropdown).mouseleave( function() {
         $(this.menuDropdown).slideUp('slow'); //When the mouse hovers out of the subnav, move it back up
      });
   }, 
   
   showSpinner: function() {
      $(this.spinner).css('display', 'inherit');
   },
   
   hideSpinner: function() {
      $(this.spinner).css('display', 'none');
   },
   
   setName: function(name) {
      this.nameDiv.innerHTML = name;
      
      if (this.source.name == name)
         return false;
      else {
         this.source.name = name;
         return true;
      }
   },
   
   setUrl: function(url) {
      if (!url || this.source.url == url)
         return false;
      else {
         this.source.url = url;
         return true;
      }
   },
   
   setFiles: function(files) {
      if (files.length == 0)
         return false;
      else {
         var fileType0 = /[^.]+$/.exec(files[0].name)[0];
         var fileType1 = /[^.]+$/.exec(files[1].name)[0];         
         this.source.paths[fileType0] = files[0];
         this.source.paths[fileType1] = files[1];
         return true;
      }
   },   
   
   
   setChromosome: function(chromosome) {
      if (!chromosome || this.source.chromosome == chromosome)
         return false;
      else {
         this.source.chromosome = chromosome;
         return true;
      }
   },
   
   setTypeFilter: function(typeFilter) {
      if (!typeFilter || this.source.typeFilter == typeFilter)
         return false;
      else {
         this.source.typeFilter = typeFilter;
         return true;
      }      
   },
   
   hideErrorLabel: function() {
      $(this.errorLabel).css('display', 'none');
      this.source.request.error = false;
   },
   
   showErrorLabel: function() {
      $(this.errorLabel).css('display', 'inline');
      this.source.request.error = false;      
   },
   
   updateNewTrackFrom: function() {
      var data = this.$thousandGSelect.find(":selected").text();
      var meta = /(^.+)\.((vcf.gz)?(bam)?)$/.exec(data);
      var filename = meta[1];
      var filetype = meta[2]
      if (filetype == 'vcf.gz') {filetype = 'vcf';}
      var url = this.rover.thousandGUrl + "/json/" + filetype + "/"
      url += data;
      this.$urlInput.val(url);
      this.$nameInput.val(filename);
   },
   
   handleError: function() {

      if (this.source.request.drawOnResponse) {
         // turn off spinner
         this.hideSpinner();
      
         // show error message
         this.showErrorLabel();
      }
      
      // update xhr request status
      this.source.request.error = true;
   },
   
   setupDefaultScribl: function(chart) {
      chart.offset = 0;
      chart.trackHooks.push( function(track) { 
         if (track.chart.ntsToPixels() > 70) {
            track.chart.previousDrawStyle = track.getDrawStyle();
            track.chart.drawStyle = 'line';            
         } else if (track.previousDrawStyle) {
            track.chart.drawStyle = track.chart.previousDrawStyle;
            track.chart.previousDrawStyle = undefined;
         }
         return false;
      });
      chart.laneSizes = this.laneSizes;
      chart.glyph.text.color = 'white';
      chart.glyph.color = function(lineargradient) {
         lineargradient.addColorStop(0, 'rgb(125,125,125)');
         lineargradient.addColorStop(0.48, 'rgb(115,115,115)');
         lineargradient.addColorStop(0.51, 'rgb(90,90,90)');
         lineargradient.addColorStop(1, 'rgb(80,80,80)');
         return lineargradient
      };
      chart.scale.off = true;
      chart.scale.pretty = false;
      return chart;
   }
});