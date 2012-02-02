// (function($) {
// 
//     window.BTrack = Backbone.Model.extend({});
//     
//     window.BTracks = Backbone.Collection.extend({
//         model: BTrack,
//         url: "/btracks"
//     });
//     
//     window.btracks = new BTracks();
//     
//     window.BTrackView = Backbone.View.extend({
//        initialize: function() {
//           _.bindAll(this, 'render');
//           this.model.bind('change', this.render);
//           this.template = _.template($('#track-template').html());
//        },
//        
//        render: function() {
//           var renderedContent = this.template(this.model.toJSON());
//           $(this.el).html(renderedContent);          
//           return this;
//        }
//     });
//         
//     window.BTracksView = Backbone.View.extend({
//        tagName: 'section',
//        className: 'tracks',
//        
//        initialize: function() {
//           _.bindAll(this, 'render');
//           this.template = _.template($('#tracks-template').html());
//           this.collection.bind('reset', this.render);
//        },
//        
//        render: function() {
//           var $tracks,
//               collection = this.collection;
//                  
//           $(this.el).html(this.template({}));
//           $tracks = this.$('.tracks');
//           collection.each(function(track){
//              var view = new BTrackView({
//                 model: track,
//                 collection: collection
//              });
//              $tracks.append(view.render().el);
//           });
//           return this;
//        }
//        
//     });
// 
//     // window.Playlist = Albums.extend({
//     // 
//     //     isFirstAlbum: function(index) {
//     //         return (index == 0)
//     //     },
//     // 
//     //     isLastAlbum: function(index) {
//     //         return (index == (this.models.length - 1))
//     //     }
//     // 
//     // });
// 
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
//       // Backbone.history.start();
//        //Backbone.history.start({pushState:true});
//     });
// 
// })(jQuery);


