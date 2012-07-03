window.BSourceDas = window.BSource.extend({
   url: function(options) {
      var track = rover.tracks.getByCid(this.get('trackId'));
      var dataArr = options.data.split('&');
      var data = {};
      // parse min and max
      for ( var i in dataArr) {
         var pair = dataArr[i].split('=');
         data[pair[0]] = pair[1];
      }
      var fullUrl = track.get('url') + 
                    '/features?segment=' +
                    track.get('chromosome') +
                    ':'  + 
                    data.min +
                    "," +
                    data.max +
                    ';type=' + rover.get('typeFilter') || '';    

      return fullUrl;
   },
   
   parse: function(xmlDoc) {
      // call parents parse method
      window.BSourceDas.__super__.parse.call(this, xmlDoc);
      
       var segment = xmlDoc.getElementsByTagName('SEGMENT')[0];
       var responseMin = parseInt(segment.getAttribute('start'));
       var responseMax = parseInt(segment.getAttribute('stop'));
      
       if (rover.max < responseMin || rover.min > responseMax)
          return;

       var track = rover.tracks.getByCid(this.get('trackId'));
       var scribl = track.get('scribl');
       //var canvasId = this.id;

       var display = this.get('drawStyle');

       // check if chart is still visible
       // TODO find new way to see if track is still here
       // if(!rover.tracks[canvasId]) {
       //    return;         
       // }

       var xmlFeatures = xmlDoc.getElementsByTagName('FEATURE');
       if (!xmlFeatures) {
          // TODO add an error fetching message
          return; 
       }

       // convert features to array and sort
       var sortedFeatures=[];
       for(var i=0,n; n=xmlFeatures[i]; ++i) sortedFeatures.push(n);
       sortedFeatures.sort( function(a,b){ return(a.getElementsByTagName('START')[0].textContent - b.getElementsByTagName('START')[0].textContent); } );


       // delete old tracks 
      // _(scribl.tracks).each(function(track) {delete track;} );      

      // window.btracks.remove( window.btracks.getByCid(this.get('trackId')) );

       // add new tracks and set default drawStyle
       //var scriblTrack = scribl.addTrack();    // here refers to Scribl::Track not Rover::Track
       var features = [];

       var numFeatures = sortedFeatures.length; 
       for (var i=0; i < numFeatures; i++) {
          var f = sortedFeatures[i];
          var start = parseInt(f.getElementsByTagName('START')[0].textContent);
          var end = parseInt(f.getElementsByTagName('END')[0].textContent);
          var length = end - start;

          var orientation = f.getElementsByTagName('ORIENTATION')[0].textContent;
                var type = f.getElementsByTagName('TYPE')[0].textContent;                           

          if (orientation)
            var glyphT = new BlockArrow( "das", start, length, orientation);
          else
            var glyphT =  new Rect( "das", start, length);
             //var glyphT = scriblTrack.addFeature( new Rect( "rect", start, length) );

          if (type) {
             glyphT.name = type;
          }
          
          // add to features
          features.push( glyphT );
       }

       this.set({ features:features })
       if (this.drawOnParse) {
          this.drawOnParse = false;
          track.center.chart.set({features: features});
       }
       track.trigger('fetched');
      
       return {};
   }
});