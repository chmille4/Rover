require 'rubygems'
require 'sinatra'
require 'json'

set :public, '.'


get '/' do 
  send_file "bindex.html"
end

get '/b' do 
  send_file "bindex.html"
end


get '/btracks' do
  content_type "application/json"
  send_file "js/tracks.json"
end
