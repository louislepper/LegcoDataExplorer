#!/bin/bash

#mydir="$(dirname "$0")"


n=1
echo "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
echo "<legcohk-vote xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:noNamespaceSchemaLocation=\"/schema/legcohk-vote-schema.xsd\">"
while [ $# -gt 0 ] ;do
  #echo "$n: $1"
  >&2 echo "$n: $1"
  ./XMLMeetingTrimmer.rb $1
  shift
  n=$(( $n + 1 ))
done
echo "</legcohk-vote>"
