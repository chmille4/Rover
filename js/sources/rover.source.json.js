var JsonSource = RoverSource.extend({
   init: function(name, url, chromosome) {
      this.url = url.replace(/\/$/,''); // create base url
      this._super(name, url, "", chromosome);
      
      this.request = function() {         
         this.xhr=undefined;
         this.min=undefined; 
         this.max=undefined; 
         this.status="waiting"; 
         this.error = false;
         this.drawOnResponse = false;
      };
      
      
   },
   
   fetch: function(min, max, callback, track, direction, drawOnResponse) {
      this.newRequest();
      this.request.drawOnResponse = drawOnResponse || false;
      this.request.min = min = parseInt(Math.max(min, 1));
      this.request.max = max = parseInt(max);        
      
      var fullUrl = this.url + '?segment=' + this.chromosome + '&min='  + this.request.min + "&max=" + this.request.max;  
      alert(fullUrl);   

      var xhr = new XMLHttpRequest();
      xhr.open('GET', fullUrl);
      xhr.onreadystatechange = function () {
        if (this.status == 200 && this.readyState == 4) {
          callback(this.responseText, track, direction);
        }
      };
      xhr.send();
   },
   
   parse: function(recordsStr, view) {
      
      // see if no data
      if (recordsStr == "") {
         return;
      }         
      
      // add some formatting to make string valid json
      if(recordsStr[0] != '[') {
         recordsStr = '[' + recordsStr;
         recordsStr = recordsStr.replace(/,\s*$/,']');
      }
      
      // delete old tracks
      delete view.chart.tracks[0];

      // add new tracks and set default drawStyle
      var track = view.chart.addTrack();    // here refers to Scribl::Track not Rover::Track
      
      var records = jQuery.parseJSON(recordsStr);

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
          
          track.addFeature( ft );          
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