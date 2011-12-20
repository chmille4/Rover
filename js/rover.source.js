var RoverSource = Class.extend({
   init: function(name, uri, typeFilter, chromosome) {
      this.name = name;
      this.uri = uri;
      this.typeFilter = typeFilter;
      this.chromosome = chromosome
      this.track = undefined;
      
      this.request = function() {         
         this.xhr=undefined;
         this.min=undefined; 
         this.max=undefined; 
         this.status="waiting"; 
         this.error = false;
         this.drawOnResponse = false;
      };
      
      
   },
   
   refetch: function() {
      this.track.showSpinner();
      this.fetch(this.track.rover.min, this.track.rover.max, this.track.updateSource, this.track, 'center', true);
   },
   
});