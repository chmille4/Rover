
(function($) {
   
   Object.keys=Object.keys||function(o,k,r){r=[];for(k in o)r.hasOwnProperty.call(o,k)&&r.push(k);return r}
   
   $.deparam = jq_deparam = function( params, coerce ) {
       var obj = {},
         coerce_types = { 'true': !0, 'false': !1, 'null': null };               
    
       // Iterate over all name=value pairs.
       $.each( params.replace( /\+/g, ' ' ).split( '&' ), function(j,v){
         var param = v.split( '=' ),
           key = decodeURIComponent( param[0] ),
           val,
           cur = obj,
           i = 0,
        
           // If key is more complex than 'foo', like 'a[]' or 'a[b][c]', split it
           // into its component parts.
           keys = key.split( '][' ),
           keys_last = keys.length - 1;
      
         // If the first keys part contains [ and the last ends with ], then []
         // are correctly balanced.
         if ( /\[/.test( keys[0] ) && /\]$/.test( keys[ keys_last ] ) ) {
           // Remove the trailing ] from the last keys part.
           keys[ keys_last ] = keys[ keys_last ].replace( /\]$/, '' );
        
           // Split first keys part into two parts on the [ and add them back onto
           // the beginning of the keys array.
           keys = keys.shift().split('[').concat( keys );
        
           keys_last = keys.length - 1;
         } else {
           // Basic 'foo' style key.
           keys_last = 0;
         }
      
         // Are we dealing with a name=value pair, or just a name?
         if ( param.length === 2 ) {
           val = decodeURIComponent( param[1] );
        
           // Coerce values.
           if ( coerce ) {
             val = val && !isNaN(val)            ? +val              // number
               : val === 'undefined'             ? undefined         // undefined
               : coerce_types[val] !== undefined ? coerce_types[val] // true, false, null
               : val;                                                // string
           }
        
           if ( keys_last ) {
             // Complex key, build deep object structure based on a few rules:
             // * The 'cur' pointer starts at the object top-level.
             // * [] = array push (n is set to array length), [n] = array if n is 
             //   numeric, otherwise object.
             // * If at the last keys part, set the value.
             // * For each keys part, if the current level is undefined create an
             //   object or array based on the type of the next keys part.
             // * Move the 'cur' pointer to the next level.
             // * Rinse & repeat.
             for ( ; i <= keys_last; i++ ) {
               key = keys[i] === '' ? cur.length : keys[i];
               cur = cur[key] = i < keys_last
                 ? cur[key] || ( keys[i+1] && isNaN( keys[i+1] ) ? {} : [] )
                 : val;
             }
          
           } else {
             // Simple key, even simpler rules, since only scalars and shallow
             // arrays are allowed.
          
             if ( $.isArray( obj[key] ) ) {
               // val is already an array, so push on the next value.
               obj[key].push( val );
            
             } else if ( obj[key] !== undefined ) {
               // val isn't an array, but since a second value has been specified,
               // convert val into an array.
               obj[key] = [ obj[key], val ];
            
             } else {
               // val is a scalar.
               obj[key] = val;
             }
           }
        
         } else if ( key ) {
           // No value was defined, so set something meaningful.
           obj[key] = coerce
             ? undefined
             : '';
         }
       });
    
       return obj;
     };
     
     /*! Copyright 2011, Ben Lin (http://dreamerslab.com/)
     * Licensed under the MIT License (LICENSE.txt).
     *
     * Version: 1.0.5
     *
     * Requires: jQuery 1.2.3+
     */
       $.fn.extend({
         actual : function( method, options ){
           var $hidden, $target, configs, css, tmp, actual, fix, restore;

           // check if the jQuery method exist
           if( !this[ method ]){
             throw '$.actual => The jQuery method "' + method + '" you called does not exist';
           }

           configs = $.extend({
             absolute : false,
             clone : false,
             includeMargin : undefined
           }, options );

           $target = this;

           if( configs.clone === true ){
             fix = function(){
               // this is useful with css3pie
               $target = $target.filter( ':first' ).clone().css({
                 position : 'absolute',
                 top : -1000
               }).appendTo( 'body' );
             };

             restore = function(){
               // remove DOM element after getting the width
               $target.remove();
             };
           }else{
             fix = function(){
               // get all hidden parents
               $hidden = $target.parents().andSelf().filter( ':hidden' );

               css = configs.absolute === true ?
                 { position : 'absolute', visibility: 'hidden', display: 'block' } :
                 { visibility: 'hidden', display: 'block' };

               tmp = [];

               // save the origin style props
               // set the hidden el css to be got the actual value later
               $hidden.each( function(){
                 var _tmp = {}, name;
                 for( name in css ){
                   // save current style
                   _tmp[ name ] = this.style[ name ];
                   // set current style to proper css style
                   this.style[ name ] = css[ name ];
                 }
                 tmp.push( _tmp );
               });
             };

             restore = function(){
               // restore origin style values
               $hidden.each( function( i ){
                 var _tmp = tmp[ i ], name;
                 for( name in css ){
                   this.style[ name ] = _tmp[ name ];
                 }
               });
             };
           }

           fix();
           // get the actual value with user specific methed
           // it can be 'width', 'height', 'outerWidth', 'innerWidth'... etc
           // configs.includeMargin only works for 'outerWidth
           actual = $target[ method ]( configs.includeMargin );

           restore();
           // IMPORTANT, this plugin only return the value of the first element
           return actual;
         }
       });
})(jQuery);
