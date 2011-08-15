var RoverTrack = Class.extend({
   init: function(source, canvas, canWidth) {
      this.source = source;

      this.displayMin = undefined;
      this.displayMax = undefined;
      this.min = undefined;
      this.max = undefined;

      this.center = {};
      this.center.chart = new Scribl(canvas, canWidth);
      this.center.chart.scale.off = true;

      // right buffer
      this.right = {};
      this.right.chart = new Scribl(canvas, canWidth);
      this.right.chart.scale.off = true;

      // left buffer
      this.left = {};
      this.left.chart = new Scribl(canvas, canWidth);
      this.left.chart.scale.off = true;            
   },
   
   
});