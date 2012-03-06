window.BSource = Backbone.Model.extend({  
   
   initialize: function() {
      // var chart = new Scribl(undefined, rover.getWidthWithBuffers());
      var chart = new Scribl();
      
      chart.offset = 0;
      // chart.trackHooks.push( function(track) { 
      //    if (track.chart.ntsToPixels() > 70) {
      //       track.chart.previousDrawStyle = track.getDrawStyle();
      //       track.chart.drawStyle = 'line';            
      //    } else if (track.previousDrawStyle) {
      //       track.chart.drawStyle = track.chart.previousDrawStyle;
      //       track.chart.previousDrawStyle = undefined;
      //    }
      //    return false;
      // });
      chart.drawStyle = "collapse";
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
      this.set({scribl: chart});
//      this.set({trackId:trackId});
   },
    
   parse: function(response) {
       // see if no data
         if (response == "") {
            return;
         }         
         
         var scribl = this.get('scribl');

         // delete old scriblTracks
         delete scribl.tracks[0];

         // add new scriblTracks and set default drawStyle
         var scriblTrack = scribl.addTrack();    // here refers to Scribl::Track not Rover::Track

         var records = jQuery.parseJSON(response);

         for (var i=0; i < records.length; i++){
             // get record data
             var fullSeq = records[i]['queryBases'];
             var position = records[i]['position'];
             var orientation = undefined;
             var opts = [];

             // for bam records only
             var cigar = records[i]['cigar'];

             // for vcf records only
             var alt = records[i]['alt'];

             // bam specific data
             // expand cigar while deleting insertions
             if (cigar) { 
                orientation = '+';
                var re = /\d+[A-Z]/g;
                var seq = "";
                var insertions = [];
                var pos = 0;       
                var softClipping = 0;  
                for(var k=0; k< cigar.length; k++){
                   var op = parseInt(cigar[k].match(/\d+/)[0]);
                   var opLtr = cigar[k].match(/[A-Z]/)[0];
                   if (opLtr == 'M') {
                      seq += fullSeq.slice(pos,pos+op);
                      pos += op;
                   }
                   else if (opLtr == 'D') 
                      for(var j=0; j<op; j++) { seq += '-'; }                   
                   else if (opLtr == 'N') {
                      for(var j=0; j<op; j++) { seq += 'N'; }
                      var h = 1;
                   }
                   else if (opLtr == 'I') {
                      insertions.push( {'pos':pos-softClipping, 'seq':fullSeq.slice(pos,pos+op)} );
                      pos += op;
                   }
                   else if (opLtr == 'S' && pos == 0) {
                     softClipping = op;
                     pos += op;
                   }

                }
                opts['insertions'] = insertions;
                opts['seq'] = seq;
                opts['color'] = 'red';
             } else if (alt) { // vcf specific data
                opts['seq'] = alt;
                opts['ref'] = records[i]['ref'];
                if(records[i]['info'] && records[i]['info']['AF']){
                  opts['fraction'] = records[i]['info']['AF'];
               }
             }

             // add feature
             var ft;

             if (insertions && insertions[0] && insertions[0]['seq']) {   
                if (orientation)
                  ft = new BlockArrow( 'bam', position, opts['seq'].length, orientation, opts );
                else
                  ft = new Rect( 'bam', position, opts['seq'].length, opts );
                for (var j=0; j< insertions.length; j++) {
                   var offset = insertions[j]['seq'].length/2;
                   ft.addTooltip(insertions[j]['seq'],'below', 0, {'ntOffset': insertions[j]['pos']-offset});
                }
             }
             else {
                if (orientation)
                  ft = new BlockArrow( 'bam', position, opts['seq'].length, '+', opts );         
                else
                  ft = new Rect( 'bam', position, opts['seq'].length, opts );
             }

             if(alt)
               ft.addTooltip("Ref:"+opts['ref'] + "   Alt:" + opts['seq'] + ":" + opts['fraction'], 'below');

             scriblTrack.addFeature( ft );          
          }
          
          var track = rover.get('tracks').getByCid(this.get('trackId'));
          scribl.laneSizes = track.get('laneSizes');
          track.forceChange();
          return {};
      //       // check if response is no longer relevant to where the user is currently and if so don't waste time parsing it      
      //       if (xmlDoc.URL)
      //          var url = xmlDoc.URL
      //       else
      //          var url = xmlDoc.lastChild.nodeValue;
      //       var matches = url.match(/.*segment=\d:(\d+)\.*\d*,(\d+).*/);               
      //       var responseMin = matches[1];
      //       var responseMax = matches[2];                                  
      // 
      //       if (rover.max < responseMin || rover.min > responseMax)
      //          return;
      // 
      //       var scribl = this.get('scribl');
      //       var canvasId = this.id;
      // 
      //       var display = this.get('drawStyle');
      // 
      // // check if chart is still visible
      // if(!rover.tracks[canvasId]) {
      //    return;
      // }
      // 
      // var xmlFeatures = xmlDoc.getElementsByTagName('FEATURE');
      //        if (!xmlFeatures) {
      //           // TODO add an error fetching message
      //           return; 
      //        }
      // 
      //       // convert features to array and sort
      //       var features=[];
      //       for(var i=0,n; n=xmlFeatures[i]; ++i) features.push(n);
      //       features.sort( function(a,b){ return(a.getElementsByTagName('START')[0].textContent - b.getElementsByTagName('START')[0].textContent); } );
      // 
      // 
      //       // delete old tracks
      //       window.btracks.remove( window.btracks.getByCid(this.get('trackId')) );
      // 
      //       // add new tracks and set default drawStyle
      //       var track = scribl.addTrack();    // here refers to Scribl::Track not Rover::Track
      // 
      //       var numFeatures = features.length; 
      // for (var i=0; i < numFeatures; i++) {
      //    var f = features[i];
      //    var start = parseInt(f.getElementsByTagName('START')[0].textContent);
      //    var end = parseInt(f.getElementsByTagName('END')[0].textContent);
      //    var length = end - start;
      // 
      //    var orientation = f.getElementsByTagName('ORIENTATION')[0].textContent;
      //          var type = f.getElementsByTagName('TYPE')[0].textContent;                           
      // 
      //    if (orientation)
      //             var glyphT = track.addGene(start, length, orientation);
      //    else
      //       var glyphT = track.addFeature( new Rect( "rect", start, length) );
      // 
      //    if (type) {
      //       glyphT.name = type;
      //    }
      // }
      //       
      //       return {};
   },
   
   //url: "http://bioinformatics.bc.edu/ngsserver/json/bam/public/NA06985.chrom1.LS454.ssaha2.CEU.exon_targetted.20100311.bam?segment=1&min=800000&max=860000"
   //url: "http://0.0.0.0:4569/json/bam/data/NA06985.chrom1.LS454.ssaha2.CEU.exon_targetted.20100311.bam?segment=1&min=800000&max=860000",
   url: function() {
      var track = rover.get('tracks').getByCid(this.get('trackId'));
      //var fullurl = track.get('url')  + '/features?segment=' + track.get('chromosome') + ':'  + 20994399.5 + "," + 21023983.5 + ';type=' + track.get('typeFilter');
      var fullurl = track.get('url') + '?' + $.param({segment:track.get('chromosome'), min:track.get('min'), max:track.get('max')});

      return fullurl;
   },
});