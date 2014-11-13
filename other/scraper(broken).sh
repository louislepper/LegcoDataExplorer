YEARa=12
YEARb=13
i=0
while [ $i -lt 1 ]
do
wget http://www.legco.gov.hk/general/english/open-legco/cm-20$YEARa$YEARb.html
i=$?
YEARa=$(($YEARa + 1))
YEARb=$(($YEARb + 1))

done

#<a href=".*\.xml".*</a>