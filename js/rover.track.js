var RoverTrack = Class.extend({
   init: function(canvas, canWidth) {
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
      this.center.chart = new Scribl(canvas, canWidth);
      this.center.chart.offset = 0;
      this.center.chart.laneSizes = this.laneSizes;
      this.center.chart.glyph.text.color = 'white';
      this.center.chart.glyph.color = function(lineargradient) {
         lineargradient.addColorStop(0, 'rgb(125,125,125)');
         lineargradient.addColorStop(0.48, 'rgb(115,115,115)');
         lineargradient.addColorStop(0.51, 'rgb(90,90,90)');
         lineargradient.addColorStop(1, 'rgb(80,80,80)');
         return lineargradient
      };
      this.center.chart.scale.off = true;
      this.center.chart.scale.pretty = false;      

      // right buffer
      this.right = {};
      this.right.chart = new Scribl(canvas, canWidth);
      this.right.chart.offset = 0;
      this.right.chart.laneSizes = this.laneSizes;
      this.right.chart.glyph.text.color = 'white';
      this.right.chart.glyph.color = function(lineargradient) {
         lineargradient.addColorStop(0, 'rgb(125,125,125)');
         lineargradient.addColorStop(0.48, 'rgb(115,115,115)');
         lineargradient.addColorStop(0.51, 'rgb(90,90,90)');
         lineargradient.addColorStop(1, 'rgb(80,80,80)');
         return lineargradient
      };		
      this.right.chart.scale.off = true;
      this.right.chart.scale.pretty = false;

      // left buffer
      this.left = {};
      this.left.chart = new Scribl(canvas, canWidth);
      this.left.chart.offset = 0;
      this.left.chart.laneSizes = this.laneSizes;
      this.left.chart.glyph.text.color = 'white';
      this.left.chart.glyph.color = function(lineargradient) {
         lineargradient.addColorStop(0, 'rgb(125,125,125)');
         lineargradient.addColorStop(0.48, 'rgb(115,115,115)');
         lineargradient.addColorStop(0.51, 'rgb(90,90,90)');
         lineargradient.addColorStop(1, 'rgb(80,80,80)');
         return lineargradient
      };		
      this.left.chart.scale.off = true; 
      this.left.chart.scale.pretty = false;           
      
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
      this.nameInput = undefined;
      this.urlInput = undefined;
      this.chromoInput = undefined;
      this.typeFilterInput = undefined;
   },
   
   setSource: function(source) {
      this.source = source;      
      source.track = this;
      this.setName(source.name);
   },
   
   draw: function(min, max, widthPx) {                         
      var view = this.center.chart;
      view.scale.min = min;
      view.scale.max = max;
      
      if (widthPx) {
         view = view.slice(min, max);                        
         view.width = widthPx;
         view.canvas.width = widthPx;
         // set events to already added
         //view.events.added = true;
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

      $(trackMenuDiv).html(' \
           <ul class="dropdown">                                                       \
           	<li><a style="margin-top:-4px; width: 32px"><img style="float:left" width="16" src="./images/gear_white.png"</img>   \
             	<div class="ui-icon ui-icon-triangle-1-s"></div></a>              \
           		<ul class="sub_menu" style="text-align: center">                                          			 \
                  <div id ="top-border"></div>                                                           \
           			 <li>                                                       \
           				<span style="padding-left:8px">View As ></span>                                     \
           				<ul>                                                              \
           					<li><a class="'+track.id+'-drawStyle" name="collapse">Collapsed</a></li>                                \
           					<li><a class="'+track.id+'-drawStyle" name="expand" >Expanded</a></li>                               \
                        <li><a class="'+track.id+'-drawStyle" name="line">Line Chart</a></li>                               \
           				</ul>                                                             \
           			 </li>                                                               \
           			 <li><a class="'+track.id+'-edit">Edit</a></li>                            \
           		</ul>                                                                   \
           	</li>                                                                      \
         </ul>                                                                         \
      ');
      
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
      
      
      
      
//      document.getElementById('collapsed').onclick = function() {alert('hi');};
      
      // set click and hover behavior
      $(trackMenuDiv).unbind('click').click( function(event) {
        $(trackMenuDiv).find('.sub_menu').css('visibility', 'visible');
      });
      
      $(trackMenuDiv).unbind('mouseleave').mouseleave( function(event){
         $(trackMenuDiv).find('.sub_menu').css('visibility', 'hidden');
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
      
      // create inputs
      track.nameInput = document.createElement('input');
      var nameLabel = document.createElement('span');
      nameLabel.innerHTML = 'Name';
      nameLabel.className = 'labels';
      
      track.urlInput = document.createElement('input');
      var urlLabel = document.createElement('span');
      urlLabel.innerHTML = 'Source URL'
      urlLabel.className = 'labels';
      
      track.fileInput = document.createElement('input');
      track.fileInput.type = 'file';
      track.fileInput.multiple = true;
      var fileLabel = document.createElement('span');
      fileLabel.innerHTML = 'Source File(s)'
      fileLabel.className = 'labels';
      
      
      // <form>
      // Select your favorite browser:
      // <select id="myList" onchange="favBrowser()">
      //   <option></option>
      //   <option>Google Chrome</option>
      //   <option>Firefox</option>  
      //   <option>Internet Explorer</option>
      //   <option>Safari</option>
      //   <option>Opera</option>
      // </select>
      // <p>Your favorite browser is: <input type="text" id="favorite" size="20"></p>
      // </form>

      track.thousandGForm = document.createElement('form');
      var thousandGLabel = document.createElement('span');
      thousandGLabel.innerHTML = "1000G Data";
      thousandGLabel.className = 'labels';
      track.thousandGSelect = document.createElement('select');
      track.thousandGSelect.onchange = function() {track.updateNewTrackFrom(track)};
      track.thousandGSelect.style.width = "130px";      
      $(track.thousandGSelect).append('<option></option>');
      for (var i=0; i<this.rover.thousandGSources.length; i++) {
         $(track.thousandGSelect).append('<option>' + this.rover.thousandGSources[i] + '</option');
      }
      $(track.thousandGForm).append(thousandGLabel,track.thousandGSelect);
      
      track.chromoInput = document.createElement('input');
      var chromoLabel = document.createElement('span');
      chromoLabel.innerHTML = 'Chromosome';
      chromoLabel.className = 'labels';
      
      track.typeFilterInput = document.createElement('input');
      var typeFilterLabel = document.createElement('span');
      typeFilterLabel.innerHTML = 'Type Filter';
      typeFilterLabel.className = 'labels';
      
      var helpDiv = document.createElement('div');
      helpDiv.innerHTML = 'More DAS sources can be found at the <a href="http://www.dasregistry.org/listSources.jsp?organism=any&CSName=any&CSTypes=any&capabilities=features&labels=any&spec=any&cmd=find">DAS registry</a>';
      helpDiv.style.fontSize = '10px';
      
      // create controls
      var cancelButton = document.createElement('button');
      cancelButton.innerHTML = 'X';
      cancelButton.onclick = function(e) { track.hideEditPanel(); };
      var saveButton = document.createElement('button');
      saveButton.innerHTML = 'Save';
      saveButton.onclick = function(e) {
         if ( !track.source && $(track.urlInput).val().match('das') )
            track.setSource( new DasSource("", "", "", "", ""))
         else if ( !track.source && $(track.urlInput).val().match('json') )
               track.setSource( new JsonSource("", "", "", "", ""))
         else if ( !track.source && track.fileInput.files.length > 0 )
            track.setSource( new BamSource("", "", "", "", ""));
         track.setName( $(track.nameInput).val() );
         
         var change = false;
         change = track.setUrl( $(track.urlInput).val() ) || change;
         change = track.setFiles( track.fileInput.files ) || change;
         change = track.setChromosome( $(track.chromoInput).val() ) || change;
         change = track.setTypeFilter( $(track.typeFilterInput).val() ) || change;
         
         // check if any attributes are changed that require seq data to be refetched
         if (change)
            track.source.refetch();
         
         track.hideEditPanel();
      }
      
      // columns
      var columnsDiv = document.createElement('div');
      columnsDiv.className = 'columns';
      var formColumn = document.createElement('div');
      formColumn.style.cssFloat = 'left';
      formColumn.style.textAlign = 'center';
      formColumn.style.width = '430px';
      var leftColumn = document.createElement('div');
      leftColumn.style.cssFloat = 'left';
      leftColumn.style.textAlign = 'right';
      var rightColumn = document.createElement('div');
      rightColumn.style.cssFloat = 'right';
      rightColumn.style.textAlign = 'right';
      var infoDiv = document.createElement('div');
      infoDiv.className = 'info-div';
      infoDiv.innerHTML = "\
         <div>\
            <span class='info-title'>Name</span><span>the display name for the track</span>\
         </div>\
         <div>\
            <span class='info-title'>Source Url</span><span>the url to the remote data via <a href='http://www.biodas.org/wiki/Main_Page'>DAS</a> or <a href='https://github.com/chmille4/Ngs_server'>Ngs Server</a></span>\
         </div>\
         <div>\
            <span class='info-title'>Source File(s)</span><span>Path to file. <a href='site/supportedFormats.html'>More Info</a></span>\
         </div>\
         <div>\
            <span class='info-title'>1000G</span><span>subset of the 1000G dataset - 1000genomes.org</span>\
         </div>\
         <div>\
            <span class='info-title'>Chromosome</span><span>the chromosome or segment</span>\
         </div>\
         <div>\
            <span class='info-title'>Type Filter</span><span>annotation types of biological significance that correspond roughly to EMBL/GenBank feature table tags (e.g. exon, refGene). However each database can use their own</span>\
         </div>"         
      
      
      // add elements
      $(leftColumn).append( $('<div></div>').append(this.thousandGForm),       
                            $('<div></div>').append(urlLabel, this.urlInput),
                            $('<div></div>').append(fileLabel, this.fileInput)
                           );
      $(rightColumn).append( 
                            $('<div></div>').append(nameLabel, this.nameInput),
                            $('<div></div>').append(chromoLabel, this.chromoInput), 
                            $('<div></div>').append(typeFilterLabel, this.typeFilterInput)
                           );
      formColumn.appendChild(leftColumn);
      formColumn.appendChild(rightColumn);
      $(formColumn).append( "<div style='clear:both'></div>", $("<div style='margin-top:5px'></div>").append(saveButton, cancelButton), helpDiv );
      columnsDiv.appendChild(formColumn);
      columnsDiv.appendChild(infoDiv);      
      editDiv.appendChild(columnsDiv);            
      
      
      this.chromoInput.disabled = true;      
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
      
      // set inputs
      $(this.chromoInput).val( $("#chromosome").val() );
      if (this.source) {
         $(this.nameInput).val(this.source.name);
         $(this.urlInput).val(this.source.url);         
         $(this.typeFilterInput).val(this.source.typeFilter);      
      }
      
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
      var select = this.thousandGSelect;
      var data = select.options[select.selectedIndex].text;
      var meta = /(^.+)\.((vcf.gz)?(bam)?)$/.exec(data);
      var filename = meta[1];
      var filetype = meta[2]
      if (filetype == 'vcf.gz') {filetype = 'vcf';}
      var url = this.rover.thousandGUrl + "/json/" + filetype + "/"
      url += data;
      this.urlInput.value = url;
      this.nameInput.value = filename;
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
});