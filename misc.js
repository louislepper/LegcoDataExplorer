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

	document.getElementById("startDate").value = "01/01/2012";

	var d = new Date();

	var month = d.getMonth()+1;
	var day = d.getDate();

	document.getElementById("endDate").value = (day<10 ? '0' : '') + day + '/' + (month<10 ? '0' : '') + month + '/' + d.getFullYear();

}
