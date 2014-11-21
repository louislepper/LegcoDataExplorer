//Global variables.
var xmlDoc; //At the moment this script is limited to a single xml doc.
var mainTable;
var numTableMembers = 0;
var startDateObj;
var endDateObj;
var memberCount = 0;

var currentlyDisplayedMembers = [];

var memberListEN = [];
var memberListCN = [];

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
			};

	xmlhttp.open("GET","./combined.xml",true);
	xmlhttp.send();			
}
function memberDialogOpen()
{
	$( "#memberDialog" ).dialog( "open" );
}

function xmlReady() 
{
	getMembers();
	populateSelectBox();
	populateMemberDialog();
	makeTable();
	enablePage();
}

function xmlFail()
{
	alert("XML not found.");
}

function getMembers()
{
  var i;
	memberCount = 0;
	var x=xmlDoc.getElementsByTagName("member");

	var dedupedList = {};

	for(i = 0; i < x.length; i++){
		if (typeof dedupedList[x[i].getAttribute('name-en')] == 'undefined')
		{
			dedupedList[x[i].getAttribute('name-en')] = 1;
			memberListEN[memberCount] = x[i].getAttribute('name-en');
			memberListCN[memberCount] = x[i].getAttribute('name-ch');
			memberCount++;

		}
	}

	// if ( window.console && window.console.log ) {
	// 	for(i = 0; i < memberCount; i++) {
	// 		console.log("Member " + (i+1) + ": " + memberListEN[i] + " --- " + memberListCN[i]);
	// 	}
	// }

}

function populateSelectBox()
{

	var availableMembers = memberListEN.concat(memberListCN);

	$( "#voterList" ).autocomplete({
		source: availableMembers
	});

	$( "#voterList" ).autocomplete({
		select: function( event, ui ) {
			$('#voterList').val(ui.item.value);
			var v = nameToNumAndEN(ui.item.value);
			if(v != -1) {addMember(v, false);}
			else {
				v = nameToNumAndCN(ui.item.value);
				if(v != -1) {addMember(v, true);}
				else {alert("This should never happen.");}
			}
			//Clear the voter selector
			//$('#voterList').val("");
		}
	});
	$( "#voterList" ).autocomplete({
		close: function( event, ui ) {
			//Clear the voter selector
			$('#voterList').val("");
		}
	});

}

function nameToNumAndEN(name){
	var i;
	for(i = 0; i < memberListEN.length; i++){
		if(memberListEN[i] === name) {return i;}
	}
	// for(i = 0; i < memberListCN.length; i++){
	// 	if(memberListCN[i] === name) {return i;}
	// }
	return -1;
}

function nameToNumAndCN(name){
	var i;
	// for(i = 0; i < memberListEN.length; i++){
	// 	if(memberListEN[i] === name) {return i;}
	// }
	for(i = 0; i < memberListCN.length; i++){
		if(memberListCN[i] === name) {return i;}
	}
	return -1;
}

function populateMemberDialog () 
{
	var memberDialog = document.getElementById("memberDialog");
	for(var i = 0; i < memberCount; i++){
		var child = document.createElement("DIV");
		var checkboxO = document.createElement("INPUT");
		checkboxO.id = i;
		var name = document.createElement("LABEL");
		name.innerHTML = memberListEN[i] + " --- " + memberListCN[i];
		checkboxO.type = "checkbox";
		//alert(i);
		checkboxO.onchange = function(e){
			var innerCheckbox = e.target;
			if(innerCheckbox.checked){ //The box has *just* been checked. We need to add the member.
				addMember(innerCheckbox.id);
			} else {
				removeMemberByMemberNum(innerCheckbox.id);
			}
			// alert(innerCheckbox.nextSibling);
			//checkboxChange(innerCheckbox.id);
		};
		child.appendChild(checkboxO);
		child.appendChild(name);
		child.className = "memberDialogName"; 
		memberDialog.appendChild(child);
	}
}

function checkboxChange(memberNum){
	addMember(memberNum);
}

function dateChange()
{
	updateGlobalDateObjects();
	rebuildTable();
	//Need to repopulate member's results.
}

function rebuildTable(){
	var i,q,p,o;
	var newTable = document.createElement("TABLE");

	newTable.id = "mainTable";
	
	// Create an empty <tr> element and add it to the 1st position of the table:
	var row = newTable.insertRow(0);
	var currentRow = 1;

	var cell1 = row.insertCell(0);
	cell1.innerHTML = "Motion/Member: (Click to remove)";
	for(i = 0; i < currentlyDisplayedMembers.length; i++)
	{
		var memberNameCell = row.insertCell(i + 1);

		memberNameCell.innerHTML = memberListEN[currentlyDisplayedMembers[i]]; //Breaks bilinguality. TODO:fix.
		memberNameCell.title = currentlyDisplayedMembers[i];

		//To remove a member
		memberNameCell.onclick = function(e) {
		 //This kind of works by a hack. We set the cell's title to its member number.
		 removeMemberByMemberNum(e.target.title);
		 }; 


	}
	//Now make a new row for each motion:
	var meetings = xmlDoc.getElementsByTagName("meeting");

	for(i = 0; i < meetings.length; i++)
	{
		var mDate = meetings[i].getAttribute('start-date').split("/");
		var mDateObj = new Date(mDate[2] + "/" + mDate[1] + "/" + mDate[0]);

		if(!(startDateObj.getTime() <= mDateObj.getTime() && mDateObj.getTime() <= endDateObj.getTime())) continue;

		var votes = meetings[i].childNodes;
		for(o = 0; o < votes.length; o++)
		{

			if(votes[o].tagName != "vote") continue; //For some reason there are some text nodes here.

			var newMotionRow = newTable.insertRow(currentRow);
			var motionNameCell = newMotionRow.insertCell(0);
			motionNameCell.innerHTML = votes[o].getElementsByTagName("motion-en")[0].innerHTML;

			var indivVotes = votes[o].getElementsByTagName("individual-votes")[0];
			var members = indivVotes.getElementsByTagName("member");

			for(p = 0; p < currentlyDisplayedMembers.length; p++)
			{
				var vote = newMotionRow.insertCell(p+1);
				vote.innerHTML = "Member not found.";

				// Terribly needless complexity, I know. The programmer should be shot:
				
				for(q = 0; q < members.length; q++)
				{
					if(members[q].getAttribute('name-en') == memberListEN[i]) //Once again breaks bilinguality. TODO:fix
					{
						vote.innerHTML = members[p].getElementsByTagName("vote")[0].innerHTML;
						break; 
					}
				}


			}
			currentRow++;
		}

		// var vote = mainTable.rows[currentMotion].insertCell(numTableMembers + 1);

		// 		voteResultCell.innerHTML = "Member not found.";

		// 		var indivVotes = votes[o].getElementsByTagName("individual-votes")[0];
		// 		var members = indivVotes.getElementsByTagName("member");
		// 		for(var p = 0; p < members.length; p++)
		// 		{
		// 			if(members[p].getAttribute('name-en') == memberName || members[p].getAttribute('name-ch') == memberName)
		// 			{
		// 				voteResultCell.innerHTML = members[p].getElementsByTagName("vote")[0].innerHTML;
		// 				break; 
		// 			}
		// 		}

	}
	//Get current table:
	var oldTable = document.getElementById("mainTable");

	mainTable = newTable;

	//Add the main newTable to the page
	document.body.replaceChild(newTable, oldTable);
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
	cell1.innerHTML = "Motion/Member: (Click to remove)";
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
	document.getElementById("memberDialogButton").disabled = "";
	document.getElementById("startDate").disabled = "";
	document.getElementById("endDate").disabled = "";
}

function memberDisplayed(memberNum)
{
	var found = $.inArray(memberNum, currentlyDisplayedMembers);
	if(found >= 0){
		return true;
	}
}

function removeMemberByMemberNum(memberNum)
{
	var i;
	var tableIndex = -1;
	//First find the table index.
	for(i = 0; i < currentlyDisplayedMembers.length; i++)
	{
		// alert(currentlyDisplayedMembers[i] + "(from list of memnum) -- (from input)" + memberNum);
		if(currentlyDisplayedMembers[i] == memberNum)
		{

			tableIndex = i+1;
			// alert(tableIndex);
		}
	} 
	if(tableIndex === -1) 
	{
			alert("Trying to remove a member that can't be found.");
			alert(memberNum);
			alert(memberListEN[memberNum]);
			alert(currentlyDisplayedMembers);

	}
	removeMemberByTableIndex(tableIndex);
	//Remove member from the currently displayed members list.
	currentlyDisplayedMembers.splice((tableIndex-1), 1);
	deCheckMember(memberNum);
}
function removeMemberByTableIndex(index) //Only to be used by removeMemberByMemberNum, because the arrays left must be spiced. 
{
	for(var i = 0; i < mainTable.rows.length; i++){
			mainTable.rows[i].deleteCell(index);
		 }
	numTableMembers--;
}

// function removeMemberFromArrays(memberNu)

function deCheckMember(memberNum){
	var checkb = document.getElementById(memberNum);
	checkb.checked = "";
}

function addMember(memberNum, inChinese)
{

	if(!memberDisplayed(memberNum))
	{
		// var voterSelector = document.getElementById("voterList");

		var meetings = xmlDoc.getElementsByTagName("meeting");

		var memberNameCell = mainTable.rows[0].insertCell(numTableMembers+1);


		// memberNameCell.innerHTML = voterSelector.value;
		var memberName;
		if(!inChinese)
		{
			memberName = memberListEN[memberNum];
		} else 
		{
			memberName = memberListCN[memberNum];
		}
		

		memberNameCell.innerHTML = memberName;
		memberNameCell.title = memberNum;

		//To remove a member
		memberNameCell.onclick = function(e) {
		 //This once again works kind of by hack. We just store the member number in the cell's title.
		 removeMemberByMemberNum(e.target.title);
		 }; 

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

				var voteResultCell = mainTable.rows[currentMotion].insertCell(numTableMembers + 1);

				voteResultCell.innerHTML = "Member not found.";

				var indivVotes = votes[o].getElementsByTagName("individual-votes")[0];
				var members = indivVotes.getElementsByTagName("member");
				for(var p = 0; p < members.length; p++)
				{
					if(members[p].getAttribute('name-en') == memberName || members[p].getAttribute('name-ch') == memberName)
					{
						voteResultCell.innerHTML = members[p].getElementsByTagName("vote")[0].innerHTML;
						break; 
					}
				}


				currentMotion++;
			}

		}
		var checkb = document.getElementById(memberNum);
		checkb.checked = "checked";
		currentlyDisplayedMembers.push(memberNum);
		numTableMembers++;
	} else alert("Member already displayed.");
}