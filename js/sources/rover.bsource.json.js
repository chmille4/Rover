window.BSourceJson = window.BSource.extend({
   url: function() {
      var track = rover.tracks.getByCid(this.get('trackId'));
     
      // trigger fetching event if main chart
//      if (track.center.chart.cid == this.cid)
//         track.trigger('fetching');

      return track.get('url') + '?' + $.param({segment:track.get('chromosome')});

   },
   
   parse: function(response) {
      // call classes parents parse method
      window.BSourceJson.__super__.parse.call(this, response);

      //         var scribl = this.get('scribl');

      // delete old scriblTracks
      //       delete scribl.tracks[0];

      // add new scriblTracks and set default drawStyle
      //     var scriblTrack = scribl.addTrack();    // here refers to Scribl::Track not Rover::Track
      var track = rover.tracks.getByCid(this.get('trackId'));
      var urlArray = track.get('url').split('.');
      var format = urlArray.pop()
      
      if (format == 'gz')
         format = urlArray.pop();
         
      track.format = format;

      if (format == 'bam')
         this.parseBam(response);
      else if (format == 'vcf')
         this.parseVcf(response);

      if (this.drawOnParse) {
         this.drawOnParse = false;
         track.center.chart.set({features: this.get('features')});
      }
      track.trigger('fetched');
      return {};
   },
   
   parseBam: function(response) {
      var features = [];
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

            //scriblTrack.addFeature( ft );          
            features.push( ft );
         }

       this.set({ features: features})

       return {};
   },
   
   parseVcf: function(response) {
      var features = [];
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

            //scriblTrack.addFeature( ft );          
            features.push( ft );
         }

       this.set({ features: features})

       return {};
      
   }
});