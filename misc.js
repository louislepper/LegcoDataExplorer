//Run in head
$(function() {
	$( "#memberDialog" ).dialog({ autoOpen: false, width:900 });
});

$(function() {
	var progressbar = $( "#progressbar" ),
	progressLabel = $( ".progress-label" );
 
    progressbar.progressbar({
	value: false,
	change: function() {
	progressLabel.text( progressbar.progressbar( "value" ) + "%" );
      },
      complete: function() {
	progressLabel.text( "Complete!" );
		//The jquery selector isn't working for me. I probably just don't understand something basic about it.
		var t = document.getElementById("progressbar");
		t.hidden = "hidden";

      }
    });});

function initCalendar()
{
	$( "#startDate" ).datepicker({ dateFormat: "dd/mm/yy" });
	$( "#endDate" ).datepicker({ dateFormat: "dd/mm/yy" });

	

	var d = new Date();
	var twoWeeksAgo = new Date();
	twoWeeksAgo.setDate(twoWeeksAgo.getDate()-14);

	document.getElementById("startDate").value = (twoWeeksAgo.getDate()<10 ? '0' : '') + twoWeeksAgo.getDate() + '/' + ((twoWeeksAgo.getMonth() + 1)<10 ? '0' : '') + (twoWeeksAgo.getMonth() + 1) + '/' + twoWeeksAgo.getFullYear();


	document.getElementById("endDate").value = (d.getDate()<10 ? '0' : '') + d.getDate() + '/' + ((d.getMonth() + 1)<10 ? '0' : '') + (d.getMonth() + 1) + '/' + d.getFullYear();

}
