#!/usr/bin/ruby -w

require 'rexml/document'

xml = REXML::Document.new(File.open(ARGV[0].to_s))
xml.elements.each("//meeting") { |el| puts "#{el}" }
