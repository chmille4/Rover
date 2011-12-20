var BamSource = RoverSource.extend({
   init: function(name, paths, typeFilter, chromosome) {
      this._super(name, paths, typeFilter, chromosome);
      this.queue = [];
      this.bammed = false;
      this.paths = [];
   },
   
   initBam: function() {
      this.bammed = true;
      var source = this;
      makeBam(new BlobFetchable(this.paths['bam']), new BlobFetchable(this.paths['bai']), function(bam){ 
            source.bam = bam;
            if ( source.queue.length > 0 ) {
               for (var i=0; i < source.queue.length; i++) {
                  source.queue[i]();
               }
            }
         });
   },
   
   fetch: function(min, max, callback, track, direction, drawOnResponse){
      if (!this.bammed)
         this.initBam();
         
      this.newRequest();
      this.request.drawOnResponse = drawOnResponse || false;
      this.request.min = min = parseInt(Math.max(min, 1));
      this.request.max = max = parseInt(max);                 
         
      var source = this;
      this.bam.fetch(this.chromosome, min, max, function(r,e) {
         callback([r,e], source.track, direction)
      });

      // if(this.bam == undefined) {
      //    this.queue.push( function(min, max, callback, track, direction, drawOnResponse){
      //       source.fetch(min, max, callback, track, direction, drawOnResponse);
      //    });
      // } else {      
      //    this.bam.fetch(this.chromosome, min, max, callback(r, source.track) );
      // }
   },
   
   parse: function(response, view) {
      var r = response[0];
      var e = response[1];
      if (r) {
          for (var i = 0; i < r.length; i += 1) {
             view.chart.addFeature( new BlockArrow('bam', r[i].pos, r[i].lengthOnRef, '+', {'seq':r[i].seq}))
          }
      }
      if (e) {
          alert('error: ' + e);
      }         
   },
   
   newRequest: function() {
      this.request.xhr=undefined; 
      this.request.min=undefined; 
      this.request.max=undefined; 
      this.request.status="waiting"; 
      this.request.drawOnResponse = false;
      
   },
      
});