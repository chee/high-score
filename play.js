#!/usr/bin/env forever -w
/*global require:false*/
(function( express, _, fs, q, events ) {
'use strict';

var game = express();
game.set( 'title', 'Scores' );
game.set( 'scores file', 'scores' );
game.set( 'scores', undefined );
game.set( 'default scores', JSON.stringify({
	"1": "zero_cool",
	"2": "abigail",
	"3": "abbie",
	"5": "aby",
	"7": "abby",
	"9": "abbey",
	"13": "aby",
	"21": "abbie",
	"35": "abigail"
}));
game.set( 'event', new events.EventEmitter() );

game.use( express.bodyParser() );
game.use( express.static( __dirname + '/public' ) );


function watch() {
	try {
		fs.watch(game.get( 'scores file' ), function ( err ) {
			var oldScores = _.clone( game.get( 'scores' ) );
			freshScores().then( function ( scores ) {
				if ( !_.isEqual( oldScores, scores ) ) {
					game.get( 'event' ).emit( 'refresh', scores );
				}
				game.set( 'scores', scores );

			});
		});
	} catch ( error ) {
		console.warn( 'fuck, no scores file.' );
		fs.writeFile( game.get( 'scores file' ), game.get( 'default scores' ), watch );
	}
}
watch();

game.get( '/',  function ( request, response ) {
	response.redirect( '/index.html' );
});

game.get( '/longget',  function ( request, response ) {
	var oldScores;

	readScores().then(function ( text ) {
		oldScores = text;
	});

	response.header( 'Content-Type', 'text/event-stream' );
	response.header( 'Cache-Control', 'no-cache' );
	response.header( 'Connection', 'keep-alive' );

	function sendEvent ( text ) {
		response.write( 'id: ' + new Date().getTime() + '\n' );
		response.write( 'event: data\n' );
		response.write( 'data: ' + text + '\n\n' );
	}

	function newData ( scores ) {
		var amount = _.keys( JSON.parse( scores ) ).length - _.keys( JSON.parse( oldScores ) ).length;
		sendEvent( JSON.stringify( topScores( scores, 1 ) ) );
		oldScores = _.clone( scores );
	}

	game.get( 'event' ).on( 'refresh', newData );
});

game.get( '/get',  function ( request, response ) {
	var scoresFile = readScores();
	scoresFile.then( function ( text ) {
		response.header( 'Content-Type', 'application/json' );
		response.header( 'Cache-Control', 'no-cache' );
		response.send( 200, topScores( text ) );
	}).fail( function () {
		response.send( 200, game.get( 'default scores' ) );
	});
});

function topScores ( text, amount ) {
	var scores = {};
	var json = JSON.parse( text );
	amount = amount || 9;
	_( json ).keys().sort( function ( a, b ) {
		return b - a;
	}).each( function ( points, i ) {
		if ( i > ( amount - 1 ) ) {
			return;
		}
		var name = json[ points ];
		scores[ points ] = name;
	});

	return scores;
}

function readScores () {
	var scores = game.get( 'scores' );
	if ( scores ) {
		return q.fcall( function () {
			return scores;
		});
	} else {
		return freshScores();
	}
}

function freshScores () {
	var readFile = q.nfcall( fs.readFile, game.get( 'scores file' ), 'utf-8' );
	return readFile.then( function ( text ) {
		game.set( 'scores', text );
		return q.fcall( function () {
			return text;
		});
	});
}

game.post( '/put',  function ( request, response ) {
	var name = request.body.player;
	if ( name && name.length < 11 ) {
		compete( name, response ).then( function () {
			response.send( 200, 'yay' );
		});
	} else {
		response.send( 404, 'FUCK' );
	}
});

function compete ( name ) {
	return readScores().then( function ( text ) {
		var scores = JSON.parse( text );
		var points = Object.keys( scores );
		var highPoint = points[ points.length - 1 ];
		var score = +highPoint + _.random( 1, 24 );
		return addScore({
			score: +score,
			name: name
		});
	});
}

function addScore ( scoreObject ) {
	return readScores().then( function ( text ) {
		var scores = JSON.parse( text );
		scores[ scoreObject.score ] = scoreObject.name;
		return writeScores( JSON.stringify( scores ) );
	});
}

function writeScores ( scores ) {
	return q.nfcall( fs.writeFile, game.get( 'scores file' ), scores );
}

return game;

})(	require( 'express' ),
	require( 'lodash' ),
	require( 'fs' ),
	require( 'q' ),
	require( 'events' ) ).listen( 3000 );