var DasSource = Class.extend({
   init: function(name, url, typeFilter) {
      this.name = name;
      this.url = url;
      this.typeFilter = typeFilter;
      this.request = function() { 
         this.xhr=undefined; 
         this.min=undefined; 
         this.max=undefined; 
         this.status="waiting"; 
         this.drawOnResponse = false;
      };
      
   },

   fetch: function(min, max, callback, view, direction){
      
      // var request = new DasRequest;                
      // view.addDasRequest(request);
      this.newRequest();
      view.min = Math.max(min, 1);
      view.max = max;                

       var cb = document.getElementById(view.center.chart.canvas.id+'-input');      
      // var url = cb.value + '/features?segment=' + $('#chromosome').val() + ':'  + min + "," + max + ';type=' + $(cb).attr('data-type');     
      var fullUrl = this.url + '/features?segment=' + $('#chromosome').val() + ':'  + min + "," + max + ';type=' + $(cb).attr('data-type');     

      this.request.xhr = JSDAS.features(fullUrl, function(response, view, direction) { callback(response, view, direction) }, function(){}, "", [view,direction]);
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