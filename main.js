//Global variables.
var xmlDoc; //At the moment this script is limited to a single xml doc.
var mainTable;
var numMembers = 0;
var startDateObj;
var endDateObj;

function startFunction(){
	pullXML();
	initCalendar();
	updateGlobalDateObjects();
}


function pullXML()
{
	var xmlhttp; //I think declaring them here will limit the scope. (I hope?)

	if (window.XMLHttpRequest)
		{// code for IE7+, Firefox, Chrome, Opera, Safari
			xmlhttp=new XMLHttpRequest();
		}
	else
		{// code for IE6, IE5
			xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
		}

		xmlhttp.onreadystatechange=function()
			{
				if (xmlhttp.readyState==4)
				{
					if(xmlhttp.status==200 || xmlhttp.status==304) {
						xmlDoc=xmlhttp.responseXML;
						xmlReady();
					} else {
						xmlFail();
					}
				} 
			}

	xmlhttp.open("GET","./combined.xml",true);
	xmlhttp.send();			
}

function xmlReady() 
{
	populateSelectBox();
	makeTable();
	enablePage();
}

function xmlFail()
{
	alert("XML not found.");
}


function populateSelectBox()
{
	var indiv = xmlDoc.getElementsByTagName("individual-votes")[0];

	var x=indiv.getElementsByTagName("member");

	var selectBox = document.getElementById("voterList");
	//selectBox.multiple = true;

	for(var i = 0; i < x.length; i++){
		var optn = document.createElement("OPTION");
		optn.text = x[i].getAttribute('name-ch') + " --- " + x[i].getAttribute('name-en');
		optn.value = x[i].getAttribute('name-en');
		selectBox.options.add(optn);
	}
}

function dateChange()
{
	updateGlobalDateObjects();
	makeTable();
	//Need to repopulate member's results.
}

function updateGlobalDateObjects()
{
	var startDate = document.getElementById("startDate").value.split("/");

	startDateObj = new Date(startDate[2] + "/" + startDate[1] + "/" + startDate[0]);

	var endDate = document.getElementById("endDate").value.split("/");

	endDateObj = new Date(endDate[2] + "/" + endDate[1] + "/" + endDate[0]);
}

/*Fill the list of motions out */
function makeTable()
{
	mainTable = document.createElement("TABLE");

	mainTable.id = "mainTable";
	
	// Create an empty <tr> element and add it to the 1st position of the table:
	var row = mainTable.insertRow(0);
	var currentRow = 1;

	var cell1 = row.insertCell(0);
	cell1.innerHTML = "Motion/Member:";
	//Now make a new row for each motion:
	var meetings = xmlDoc.getElementsByTagName("meeting");

	for(var i = 0; i < meetings.length; i++)
	{
		var mDate = meetings[i].getAttribute('start-date').split("/");
		var mDateObj = new Date(mDate[2] + "/" + mDate[1] + "/" + mDate[0]);

		if(!(startDateObj.getTime() <= mDateObj.getTime() && mDateObj.getTime() <= endDateObj.getTime())) continue;

		var votes = meetings[i].childNodes;
		for(var o = 0; o < votes.length; o++){

			if(votes[o].tagName != "vote") continue; //For some reason there are some text nodes here.

			var newMotionRow = mainTable.insertRow(currentRow);
			var motionNameCell = newMotionRow.insertCell(0);
			motionNameCell.innerHTML = votes[o].getElementsByTagName("motion-en")[0].innerHTML;
			currentRow++;
		}

	}
	//Get current table:
	var oldTable = document.getElementById("mainTable");

	//Add the main mainTable to the page
	document.body.replaceChild(mainTable, oldTable);
}

function enablePage(){
	document.getElementById("addMemberButton").disabled = "";
	document.getElementById("startDate").disabled = "";
	document.getElementById("endDate").disabled = "";
}

function addMember()
{

	var voterSelector = document.getElementById("voterList");

	var meetings = xmlDoc.getElementsByTagName("meeting");

	var memberNameEN = voterSelector.value;

	var memberNameCell = mainTable.rows[0].insertCell(numMembers+1);

	memberNameCell.innerHTML = voterSelector.options[voterSelector.selectedIndex].text;

	var currentMotion = 1;

	for(var i = 0; i < meetings.length; i++)
	{
		var mDate = meetings[i].getAttribute('start-date').split("/");
		var mDateObj = new Date(mDate[2] + "/" + mDate[1] + "/" + mDate[0]);

		if(!(startDateObj.getTime() <= mDateObj.getTime() && mDateObj.getTime() <= endDateObj.getTime())) continue;

		var votes = meetings[i].childNodes;
		for(var o = 0; o < votes.length; o++){
			if(votes[o].tagName != "vote") continue;

			//Double check that the motion is correct.
			if(mainTable.rows[currentMotion].cells[0].innerHTML != votes[o].getElementsByTagName("motion-en")[0].innerHTML){
				alert("ERROR. Everything is wrong. Disregard all results...");
			}

			var voteResultCell = mainTable.rows[currentMotion].insertCell(numMembers + 1);

			voteResultCell.innerHTML = "Member not found.";

			var indivVotes = votes[o].getElementsByTagName("individual-votes")[0];
			var members = indivVotes.getElementsByTagName("member");
			for(var p = 0; p < members.length; p++)
			{
				if(members[p].getAttribute('name-en') == voterSelector.value)
				{
					voteResultCell.innerHTML = members[p].getElementsByTagName("vote")[0].innerHTML;
					break; 
				}
			}


			currentMotion++;
		}

	}
	numMembers++;
}