var DasSource = Class.extend({
   init: function(name, url, typeFilter, chromosome) {
      this.name = name;
      this.url = url.replace(/\/$/,''); // create base url
      this.typeFilter = typeFilter;
      this.chromosome = chromosome
      this.request = function() { 
         this.xhr=undefined; 
         this.min=undefined; 
         this.max=undefined; 
         this.status="waiting"; 
         this.error = false;
         this.drawOnResponse = false;
      };
      this.track = undefined;
   },

   fetch: function(min, max, callback, track, direction, drawOnResponse){
      
      // var request = new DasRequest;                
      // track.addDasRequest(request);
      this.newRequest();
      this.request.drawOnResponse = drawOnResponse || false;
      min = parseInt(Math.max(min, 1));
      max = parseInt(max);  
      var fullUrl = this.url + '/features?segment=' + this.chromosome + ':'  + min + "," + max + ';type=' + this.typeFilter;     

      this.request.xhr = JSDAS.features(fullUrl, function(response, track, direction) { callback(response, track, direction) }, function(){ track.handleError(); }, "", [track,direction]);
   },
   
   refetch: function() {
      this.track.showSpinner();
      this.fetch(this.track.rover.min, this.track.rover.max, this.track.updateSource, this.track, 'center', true);
   },
   
   parse: function(xmlDoc, view) {

      // check if response is no longer relevant to where the user is currently and if so don't waste time parsing it    	
      if (xmlDoc.URL)
         var url = xmlDoc.URL
      else
         var url = xmlDoc.lastChild.nodeValue;
      var matches = url.match(/.*segment=\d:(\d+)\.*\d*,(\d+).*/);    		      
      var responseMin = matches[1];
      var responseMax = matches[2];    		                  

      if (rover.max < responseMin || rover.min > responseMax)
         return;


      var canvasId = this.track.id;
      
      var display = this.track.drawStyle;

		// check if chart is still visible
		if(!rover.tracks[canvasId]) {
		   return;
		}

		var xmlFeatures = xmlDoc.getElementsByTagName('FEATURE');
       if (!xmlFeatures) {
          // TODO add an error fetching message
          return; 
       }

      // convert features to array and sort
      var features=[];
      for(var i=0,n; n=xmlFeatures[i]; ++i) features.push(n);
      features.sort( function(a,b){ return(a.getElementsByTagName('START')[0].textContent - b.getElementsByTagName('START')[0].textContent); } );


      // delete old tracks
      delete view.chart.tracks[0];

      // add new tracks and set default drawStyle
      var track = view.chart.addTrack();    // here refers to Scribl::Track not Rover::Track

      var numFeatures = features.length; 
		for (var i=0; i < numFeatures; i++) {
			var f = features[i];
			var start = parseInt(f.getElementsByTagName('START')[0].textContent);
			var end = parseInt(f.getElementsByTagName('END')[0].textContent);
			var length = end - start;

			var orientation = f.getElementsByTagName('ORIENTATION')[0].textContent;
         var type = f.getElementsByTagName('TYPE')[0].textContent;			    					

			if (orientation)
            var glyphT = track.addGene(start, length, orientation);
			else
				var glyphT = track.addFeature( new Rect( "rect", start, length) );

			if (type) {
			   glyphT.name = type;
			}
         // if(f.LINK && f.LINK[0] && f.LINK[0].href) { 
         //    //glyph.onMouseover = f.TYPE.textContent + "\n" + f.LINK[0].textContent || f.LINK[0].href;
         //    //glyph.onClick = f.LINK[0].href.replace(":8080", "");
         // }
		}
   },
   
   newRequest: function() {
      // var numDasRequests = this.dasRequests.length;
      // if (numDasRequests > 0)
      //    for ( var i=0; i<numDasRequests; i++)
      //       this.dasRequests[i].xhr.abort();
       if (this.request.xhr) this.request.xhr.abort();

      this.request.xhr=undefined; 
      this.request.min=undefined; 
      this.request.max=undefined; 
      this.request.status="waiting"; 
      this.request.drawOnResponse = false;
      
   },

});