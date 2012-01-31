// (function($) {
//     
//     window.Rover = new BTracks();
//          
//     window.RoverRouter = Backbone.Router.extend({
//        routes: {
//           '': 'home'
//        },
//        
//        initialize: function() {
//           this.tracksView = new BTracksView( {collection: window.btracks} );
//        },
//        
//        home: function() {
//           var $container = $('#bcontainer');
//           $container.empty();
//           $container.append(this.tracksView.render().el);
//        }
//        
//     });
//     
//     $(function() {
//        window.App = new RoverRouter();
//        Backbone.history.start();
//        //Backbone.history.start({pushState:true});
//     });
// 
// })(jQuery);
