/* THIS CODE IS FUCKING NASTY. I NEED TO REWRITE IT */
/* WOW I CAN'T BELIEVE HOW MUCH HAS CHANGED SINCE SO FEW MONTHS AGO AGO */
/* THIS SHIT IS DREADFUL */
(function machine ( jQuery, _, undefined ) {
	"use strict";

	var chart = jQuery( ".scores" );
	var oldScore = jQuery( ".old-score" );
	var source;

	String.prototype.lpad = function( padWith, length ) {
		var string = this;
		while ( string.length < length ) {
			string = padWith + string;
		}
		return string;
	};

	var updateScores = function () {
		if ( window.EventSource && typeof EventSource === "function" && !source ) {
			jQuery.get( "/get", {}, processScores, "json" ).done(function() {
				console.log( 'did get, now doing longget');
				source = new window.EventSource( "/longget" );
				source.addEventListener( "data", function ( event ) {
					var data = JSON.parse( event.data );
					processScores( data );
				});
			});
			return;
		} else if ( !source ) {
			clearTimeout( updateScores.timeout );
			jQuery.get( "/get", {}, processScores, "json" );
			updateScores.timeout = setTimeout( updateScores, 5000 );
		}
	};

	function processScores ( data ) {
		var items = jQuery( "<ul>" );
		_( data ).keys().reverse().each(function ( points, i ) {
			var name = data[ points ];
			var item = jQuery( "<li>" );

			var nameSpan = jQuery( "<span>" ).addClass( "name" ).text( name );
			var scoreSpan = jQuery( "<span>" ).addClass( "score" ).text( points );

			item.append( nameSpan ).append( " " ).append( scoreSpan );

			items.append( item );
		});

		cleanScores( items );

		items = items.children();
		var amount = items.length;

		for ( var i = 0; i <= amount - 1; i++ ) {
			console.log( i );
			var chartChildren = chart.children();
			chartChildren.eq( chartChildren.length - i - 1 ).remove();
		}

		chart.prepend( items );
	}

	var cleanScores = function ( items ) {
		var scores = items.find( ".score" );
		var names = items.find( ".name" );

		scores.each(function() {
			var element = jQuery( this );
			var score = element.text();
			var padded = score.lpad( 0, 6 );

			if ( score > 999999 ) {
				score = 999999;
			}

			element.text( padded );
		});

		oldScore.text( scores.eq( 0 ).text() );

		names.each(function() {
			var element = jQuery( this );
			var score = element.text();
			var padded = score.lpad( " ", 10 );
			element.text( padded );
		});
		return items;
	};

	var articles = jQuery( "article" );
	var winning = articles.eq( 1 );
	var buttons = articles.find( "button" );
	var play = buttons.filter( ".play" );
	var win = buttons.filter( ".win" );
	var player = winning.find( ".player" );
	var max = 10;
	var min = 1;

	play.focus();

	player.keypress(function ( event ) {
		var playerName = player.val();
		if ( event.which === 13 ) {
			return;
		}
		if ( playerName.length > ( max -1 ) ) {
			playerName = playerName.substring( 0, (max -1) );
			player.val( playerName );
		}
	});

	player.keyup(function ( event ) {
		var returnKey = 13;

		if ( event.which === returnKey ) {
			submit();
		}

	});

	play.click(function () {
		articles.toggle();
		player.focus();
	});

	win.click( submit );

	function submit() {
		var playerName = player.val();

		if ( playerName.length > max ) {
			player.val( "" );
			player.attr( "placeholder", "TOO LONG" );
			return;
		} else if ( playerName.length < min ) {
			player.val( "" );
			return;
		} else {
			playerName = playerName.trim().replace( /\s+/g, " " );
			jQuery.post( "/put", { player: playerName }, postSuccess );
		}
	}

	function postSuccess() {
		articles.toggle();
		play.focus();
		player.attr( "placeholder", "INSERT NAME" ).val( "" );
		updateScores();
	}

	return updateScores;
})( window.jQuery, window._ )();
