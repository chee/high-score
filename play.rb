require 'sinatra'
require 'json'

def getScores
	database = "scores"
	if File.exists? database
		scores = JSON.parse( File.read database )
	end
	scores || {0 => :abi}
end

def addScore scores, score, name
	scores[ score ] = name
	scores
end

def saveScores scores
	database = "scores"
	File.open( database, 'w' ) { |file|
		file.write( JSON.fast_generate scores )
	}
	getScores
end

def topScores scores
	Hash[ scores.first 9 ]
end

def compete name
	scores = getScores
	chart = Hash[ scores.sort.reverse ]
	points = []

	chart.keys.each { |point|
		points.push point.to_i
	}

	lastScore = points.sort.last

	lastScore += ( (rand * 5).round + 1 )

	scores = addScore scores, lastScore, name
	saveScores scores
end

get '/get' do
	JSON.fast_generate( getScores )
end

post '/put' do
	name = params[ "player" ]
	unless name.is_a?( String ) && name.length < 11 && name.length > 0
		FUCK
		break
	end
	compete name
end
