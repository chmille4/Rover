(function($) {
   // Keep track of the original sync method so we can
   // delegate to it at the end of our new sync.
   var originalSync = Backbone.sync;

   // Our new overriding sync with dataType and ContentType
   // that override the default JSON configurations.
   // this is done so das sources which are XML can be used
   // also this sets the contentType to 'text/plain' so that a 
   // regular CORS request will work
   Backbone.sync = function(method, model, options){

     options = _.extend(options, {
       dataType: '',
       contentType: 'text/plain',
       processData: false
     });

     originalSync.apply(Backbone, [ method, model, options ]);
   };
   

    window.BTrack = Backbone.GSModel.extend({  
       
      initialize: function() {
         // setup scribl view up
         var chart = this.createScribl();        
         this.set({scribl: chart});         
         this.set({chromosome: rover.getChromosome() });

         // current view
         this.center = {};
//         this.center.chart = this.setupDefaultScribl( new Scribl(this.get('canvas'), this.get('canWidth')) );
         this.center.chart = new window.BSource( {trackId: this.cid} );    
         // this.center.chart = undefined;
         // right buffer
         this.right = {};
         this.right.chart = undefined; //new window.BSource( {trackId: this.cid} );
         // left buffer
         this.left = {};
         this.left.chart = undefined; //new window.BSource( {trackId: this.cid} );
         
      },    
      
      defaults: {
        laneSizes: 18,
        drawStyle: 'expand',
        textColor: 'white',
        edit: false,
        glyphColor: function(lineargradient) {
           lineargradient.addColorStop(0, 'rgb(125,125,125)');
           lineargradient.addColorStop(0.48, 'rgb(115,115,115)');
           lineargradient.addColorStop(0.51, 'rgb(90,90,90)');
           lineargradient.addColorStop(1, 'rgb(80,80,80)');
           return lineargradient;
        },
        changer: true
      }, 
      
      
      setters: {
         url: function(value) {            
            var newProtocol = this.getProtocol(value);
            var oldProtocol = this.getProtocol(this.get('url'));
            var sourceType;
            
            if (newProtocol == oldProtocol)
               return value;
            else if( newProtocol == 'json') {
               sourceType = window.BSourceJson;
            }
            else if ( newProtocol == 'das' )
               sourceType = window.BSourceDas;
            
            // create new chart but keep old callbacks
            var callbacks = this.center.chart._callbacks;
            delete this.center.chart
            this.center.chart = new sourceType({ trackId: this.cid });
            this.center.chart._callbacks = callbacks;
            this.left.chart = new sourceType({ trackId: this.cid });
            this.right.chart = new sourceType({ trackId: this.cid });
            
            return value;
         }
      },
       
      forceChange: function() {
        this.set( {changer: !this.get('changer')} );
      },
      
      createScribl: function() {
         // create new scribl;
         var chart = new Scribl();
         chart.offset = 0;
         chart.scale.off = true;
         chart.scale.pretty = false;
         var roverTrack = this;
         chart.trackHooks.push( function(track) { 
            if (track.chart.ntsToPixels() > 70) {
               track.chart.previousDrawStyle = track.getDrawStyle();
               track.chart.drawStyle = 'line';            
            } else if (roverTrack.format == 'vcf' && track.chart.ntsToPixels() > 16) {
               track.chart.previousDrawStyle = track.getDrawStyle();
               track.chart.drawStyle = 'line';
            } else if (track.previousDrawStyle) {
               track.chart.drawStyle = track.chart.previousDrawStyle;
               track.chart.previousDrawStyle = undefined;
            }
            return false;
         });
         
         return chart;
      },
      
      getProtocol: function(url) {
        if (url == undefined) return undefined;
        var a = document.createElement('a');
        a.href = url;
        var path = a.pathname;
        if (path.split("/")[1] == 'ngsserver')
           return path.split("/")[2];
        else
           return path.split("/")[1];
      },
      
      getThis: function(){
         var t = this;
         return(t);
      },
         
      // setSource: function(source) {
      //     this.source = source;      
      //     source.track = this;
      //     this.setName(source.name);
      //  },

       draw: function(min, max, widthPx, zooming) {                         
          var view = this.center.chart.get('scribl');
          view.scale.min = min;
          view.scale.max = max;
          alert('btrack darw');
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
   //       this.rover.updateLabelPositions();               
  //        this.hideErrorLabel();
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



       // createEditPanel: function(editDiv) {
       //    var track = this;
       // 
       //    // generate track menu html from template
       //    // template located in app/views/trackMenu.handlebars
       //    $('#templates').load("app/templates/editTrack.handlebars", function() {
       //       // create html
       //       var template = Handlebars.compile( $('#edit-track-template').html() );
       //       $(editDiv).html( template( {track:track} ) );
       // 
       //       // add functonality
       //       $('#' + track.id + '-edit-close').click([track], function(event) { 
       //          var track = event.data[0];
       //          track.hideEditPanel();
       //       });
       // 
       //       $('#' + track.id + '-edit-save').click([track], function(event) { 
       //          var track = event.data[0];
       //          track.saveEditPanel();
       //       });
       // 
       //       // track.$thousandGSelect.change([track], function(event) { 
       //       //    var track = event.data[0];
       //       //    track.updateNewTrackFrom(track);
       //       // });
       //       var t = '#' + track.id + "-edit-chromosome";
       //       $(t).attr('disabled','disabled');
       //    });
       // },

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

       // clickMenu: function() {
       //    $(this.menuDropdown).slideDown('fast').show(); //Drop down the subnav on click
       // 
       //    $(this.menuDropdown).mouseleave( function() {
       //       $(this.menuDropdown).slideUp('slow'); //When the mouse hovers out of the subnav, move it back up
       //    });
       // }, 

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
       }

       // setupDefaultScribl: function(chart) {
       //    chart.offset = 0;
       //    chart.trackHooks.push( function(track) { 
       //       if (track.chart.ntsToPixels() > 70) {
       //          track.chart.previousDrawStyle = track.getDrawStyle();
       //          track.chart.drawStyle = 'line';            
       //       } else if (track.previousDrawStyle) {
       //          track.chart.drawStyle = track.chart.previousDrawStyle;
       //          track.chart.previousDrawStyle = undefined;
       //       }
       //       return false;
       //    });
       //    chart.laneSizes = this.laneSizes;
       //    chart.glyph.text.color = 'white';
       //    chart.glyph.color = function(lineargradient) {
       //       lineargradient.addColorStop(0, 'rgb(125,125,125)');
       //       lineargradient.addColorStop(0.48, 'rgb(115,115,115)');
       //       lineargradient.addColorStop(0.51, 'rgb(90,90,90)');
       //       lineargradient.addColorStop(1, 'rgb(80,80,80)');
       //       return lineargradient
       //    };
       //    chart.scale.off = true;
       //    chart.scale.pretty = false;
       //    return chart;
       // }
      
    });
    
//    window.btrack = new window.BTrack();
    
//     window.BTracks = Backbone.Collection.extend({
//         model: BTrack,
// //        url: "/btracks"
//     });
//     
//     
//     window.btracks = new window.BTracks();

    
    window.BTrackView = Backbone.View.extend({
       className: 'rover-canvas-listable', 
       events: {
         'mouseenter'   : 'showControls',
         'mouseleave'   : 'hideControls',
         'click .rover-track-menu'  : 'dropdown',
         'mouseleave .rover-track-menu'   : 'hideSubMenu',
         'click .draw-style'  : 'changeDrawStyle',
         'click .edit' : 'showEdit',
         'click .track-edit-close': 'hideEdit',
         'click .track-edit-save': 'saveEdit',
         'click .rover-remove-track-button' : 'removeTrack',
         'change select' : 'thousandGChange'
       },
       
       initialize: function() {
          var trackView;
          _.bindAll(this, 'render', 'draw', 'edit', 'showSpinner', 'hideSpinner');
          var self = this;
          this.model.bind('change', this.draw);
          this.model.bind('change:name', function(){self.$('.track-edit-label').html(self.model.get('name'));});
          this.model.bind('change:edit', this.edit);
          this.model.bind('fetching', this.showSpinner);
          this.model.bind('fetched', this.hideSpinner)
          this.model.bind('change:chromosome', function() {
             self.model.center.chart.fetch({data: $.param({min:rover.get('min'), max:rover.get('max')})});
          });
          this.rover = this.options.rover;
          this.rover.bind('change', this.draw);
          this.model.center.chart.bind('change:features', this.draw);
          // create html
          this.template = Handlebars.compile( $('#track-template').html() );
       },
       
       render: function() {
          // var scribl = this.model.center.chart.get('scribl');          
          var scribl = this.model.get('scribl');          
          var renderedContent = this.template( $.extend(this.model.toJSON(), {thousandGSources:rover.thousandGSources}) );
          $(this.el).html(renderedContent);
          this.$('select').selectBox();
          scribl.setCanvas(this.$('canvas')[0]);
          scribl.canvas.width = rover.getWidth();

          return this;       
       },
       
       draw: function(model, changes,options,x,l) { 
             // test if rover attr min or max is changing
             if( model.cid == rover.cid && !("min" in model._changed) && !("max" in model._changed) )
               return

             var scribl = this.model.get('scribl');
             //if (scribl.getFeatures().length == 0 && this.model.center.chart != undefined) {
             if ( this.model.parsed ) {
               var scribl = this.model.get('scribl')
               scribl.setCanvas(this.$('canvas')[0]);
               if ( scribl.getFeatures().length > 0 ) {
                  scribl.removeEventListeners('mouseover');
                  delete this.model.get('scribl')
               
                  // create new scribl;
                  var scribl = this.model.createScribl();         
                  this.model.set({scribl: scribl}, {silent:true});
               }
//               scribl.removeEventListeners('mouseover');
               _.each(this.model.center.chart.get('features'), function(ft) { scribl.addFeature( ft ); });
               this.model.parsed = false;
             }

             scribl.laneSizes = this.model.get('laneSizes');
             scribl.drawStyle = this.model.get('drawStyle');
             scribl.glyph.text.color = this.model.get('textColor');
             scribl.glyph.color = this.model.get('glyphColor');
             
             var width = rover.getWidth();
             scribl.width = width;

             scribl.scale.min = rover.get('min');
             scribl.scale.max = rover.get('max');  

             scribl.setCanvas(this.$('canvas')[0]);          
             if (!rover.updatingLeft && !rover.updatingRight) { 
                scribl.canvas.width = width;                
             } else {
                rover.updatingLeft = false;
                rover.updatingRight = false;
             }
//             alert('canvas width = ' + scribl.canvas.width + ' wdith = ' + width);
             scribl.canvas.height = scribl.getHeight();
          
             scribl.draw();
             
             // trigger scrollLeft to ensure that the div has the correct scrollLeft value
             this.rover.trigger('scrollLeft');
         
//                   $('.rover-track-menu').trigger('mouseover');
       },
       
       showSpinner:function() {
          this.$('.spinner').css('display', 'inline');
       },
       
       hideSpinner:function() {
          this.$('.spinner').css('display', 'none');
       },
       
       dropdown: function() {
          this.$('.sub_menu').css('visibility', 'visible');
       },
       
       changeDrawStyle: function(e) {
          var track = this.model;
          var newDrawStyle = e.srcElement.getAttribute('data-drawstyle');          
          track.set( {drawStyle:newDrawStyle} );
       },
       
       hideSubMenu: function(e) {
          this.$('.sub_menu').css('visibility', 'hidden');
       },
       
       showControls: function(e) {
          this.$('.rover-track-menu').css('visibility', 'visible');
          this.$('.rover-remove-track-button').css('visibility', 'visible');
       },
       
       hideControls: function(e) {
          this.$('.rover-track-menu').css('visibility', 'hidden');
          this.$('.rover-remove-track-button').css('visibility', 'hidden');
       },
       
       removeTrack: function(e) {
          this.model.toRemove = this;
          rover.tracks.remove(this.model);
       },
       
       showEdit: function(e) {
         this.model.set({ edit:true }) 
       },
       
       hideEdit: function(e) {
          this.model.set({ edit:false });
          if(this.model.get('url') == undefined)
            this.removeTrack();
       },
       
       saveEdit: function(e) {
         this.model.set({
            name: this.$('.track-edit-name').val(),
            url: this.$('.track-edit-urlInput').val(),
            typefilter: this.$('.track-edit-typefilter').val(),
            segment: this.$('.track-edit-chromosome').val(),
            edit: false
         });
         
         this.model.center.chart.fetch({data: $.param({min:rover.get('min'), max:rover.get('max')})});
       },
       
       edit: function() {
          var scribl = this.model.get('scribl');
          if (this.model.get('edit')) {
             var $edit = this.$('.rover-track-edit-div');
             $edit.css('width', this.$el.width());
             this.$el.css('height', $edit.css('height'));
             $edit.css('visibility', 'visible');
             $(scribl.canvas).css('visibility', 'hidden');
          } else {
             $(scribl.canvas).css('visibility', 'visible');
             this.$el.css('height', '');
             this.$('.rover-track-edit-div').css('visibility', 'hidden');
          }
          
       },
       
       thousandGChange: function() {
          var name = this.$('select').val();
          var ext = /(^.+)\.((vcf.gz)?(bam)?)$/.exec(name);
          var exts = name.split('.');
          if (exts[ exts.length-1 ] == 'gz')
            exts.pop();
          ext = exts[ exts.length-1 ];
          var url = rover.thousandGUrl + '/json/' + ext + "/" + name;
          this.$('.track-edit-urlInput').val(url);
          this.$('.track-edit-name').val(name);
       }
    });
        
    window.BTracksView = Backbone.View.extend({
        id: 'rover-canvas-content',
        
        initialize: function() {
           this.el.dataset.uid = _.uniqueId();
           _.bindAll(this, 'render', 'add', 'scroll', 'scrollLeft');
           this.template = Handlebars.compile( $('#tracks-template').html() );
           this.collection.bind('reset', this.render);
           this.collection.bind('remove', this.remove);
           this.collection.bind('add', this.add);
           this.collection.bind('unshift', this.add);
         //  this.collection.bind('add', this.updateScroll);
           this.rover = this.options.rover;
           this.rover.bind('change', this.scroll);
           this.rover.bind('scrollLeft', this.scrollLeft);
           this.rover.canvasContentDiv = this.el;
        },
        
        testIt: function() {alert('testIt');},
        
        render: function() {

           var $tracks,
               collection = this.collection;
            
            // keeps displayMin and displayMax in sync as this
            // view scrolls
           $(this.el).html(this.template({}));
           this.$('#rover-canvas-list').scroll(function(event) {
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
           
           
           // tracks
           $tracks = this.$('#rover-canvas-list');
           collection.each(function(track){
              var view = new BTrackView({
                 model: track,
                 collection: collection,
                 rover: rover
              });
              $tracks.append(view.render().el);
           });
           return this;
        },
        
        add: function(track) {
           var collection = this.collection;
           var view = new BTrackView({
              model: track,
              collection: collection,
              rover: rover
           });
           
           this.$('#rover-canvas-list').prepend(view.render().el);                     
        },
        
        remove: function(track) {
           track.toRemove.$el.remove();
        },
        
        scrollLeft: function() {
           var sl = (rover.get('displayMin') - rover.get('min')) * ( rover.getDisplayWidth() / rover.getDisplayWidthNts() );
           sl = Math.round(sl*100) / 100;
           this.$('#rover-canvas-list')[0].scrollLeft = sl;           
        },
        
        scroll: function(model,options) {
           // check if this view is being scrolled by the user
           // if so, do nothing

           if (options && options.uid != this.el.dataset.uid) {
              if("displayMin" in model._changed || "displayMax" in model._changed || "min" in model._changed || "max" in model._changed) {
                 this.scrollLeft();
              }
           }
        },
        
     });
 

})(jQuery);


