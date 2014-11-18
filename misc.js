//Run in head
$(function() {
	$( "#memberDialog" ).dialog({ autoOpen: false, width:900 });
});

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
