//Global variables.
var xmlDoc; //At the moment this script is limited to a single xml doc.

var numTableMembers = 0; //Number of members displayed in the table

/* The start and end date for filtering motions. These should always be up to date after startFunction is called. */
//var state.startDateObj;
//var state.endDateObj;

var xmlMemberCount = 0; //Number of members found in our XML

var currentlyDisplayedMembers = []; //Array containing ids of members (ids are chosen in getMembers(based off the member's position in memberListEN/CN))

/* Lists of all member names (from XML) in English and Chinese */
var memberListEN = [];
var memberListCN = [];

/* State is:
 *
 * Start date and end date.
 * List of members. I'd use member IDs, but, they may not stay the same?
 * 
 */
 var state = {};
 state.startDateObj = new Date();
 state.endDateObj = new Date();
 state.memberList = [];

 var currentVarString = ""; //Everything past the '?' in the URL.



function startFunction(){
	pullXML();
	initCalendar();
	updateGlobalDateObjects();
	retrieveStatePreXML();
}

function retrieveStatePreXML()
{
	var i;
	if(getQueryVariable("startDate") && getQueryVariable("endDate")) {
		state.startDateObj = getQueryVariable("startDate")? new Date(parseInt(getQueryVariable("startDate"))) : state.startDateObj;
		state.endDateObj = getQueryVariable("endDate")? new Date(parseInt(getQueryVariable("endDate"))) : state.endDateObj;
		updateDateboxFromObjects();
		//Need to retrieve member list here.
	}
}

function retrieveStatePostXML()
{
	currentVarString = window.location.search.substring(1);
	if(getQueryVariable("members")) {
		state.memberList = JSON.parse(decodeURIComponent(getQueryVariable("members")));
		for(i = 0; i < state.memberList.length; i++) {
			// if(nameToNumAndCN(state.memberList[i]) != -1) {
			// 	addMember(nameToNumAndCN(state.memberList[i]), true);
			// } else if (nameToNumAndEN(state.memberList[i]) != -1) {
			// 	addMember(nameToNumAndEN(state.memberList[i]), false);
			// } else {
			// 	alert(state.memberList[i] + "=" + "invalid member.");
			// }
			if(nameToNum(state.memberList[i]) != -1) {
				currentlyDisplayedMembers.push(nameToNum(state.memberList[i]));
				checkMember(nameToNum(state.memberList[i]));
				numTableMembers++;
			} else {
				alert(state.memberList[i] + "=" + "invalid member.");
			}
		}
	}

	window.addEventListener("popstate", function(e) {
    	state.startDateObj = new Date(parseInt(e.state.startDateObj.getTime()));
		state.endDateObj = new Date(parseInt(e.state.endDateObj.getTime()));
		updateDateboxFromObjects();
		rebuildTable();
	});

}

function updateDateboxFromObjects(){
	var startDate = document.getElementById("startDate");
	startDate.value = state.startDateObj.getDate() + "/" + (state.startDateObj.getMonth() + 1) + "/" + state.startDateObj.getFullYear();
	var endDate = document.getElementById("endDate");
	endDate.value = state.endDateObj.getDate() + "/" + (state.endDateObj.getMonth() + 1) + "/" + state.endDateObj.getFullYear();
}

function getQueryVariable(variable)
{
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(false);
}

function changeVarString(variable, newValue)
{
	var i;
	var o;
	var found = false;
	var newString = "";
	var vars = currentVarString.split("&");
	for(i = 0; i < vars.length; i++) {
		var pair = vars[i].split("=");
		if(pair[0] == variable) {
			found = true;
			pair[1] = newValue;
			var depair = pair[0] + "=" + pair[1];
			for(o = 0; o < vars.length; o++){
				if(o != 0) newString += "&";
				if(o == i) { //Don't want to re-add the original one.
					newString += depair;
				} else {
					newString += vars[o];
				}
			}
			break; //Break out of for loop
		}
	}
	if(found == false) {
		if (currentVarString != "") currentVarString += "&";
		currentVarString = currentVarString + variable + "=" + newValue;
	} else {
		currentVarString = newString;
	}
	
}

function copyState(state)
{
	var newState = {};
	newState.startDateObj = new Date(state.startDateObj.getTime());
	newState.endDateObj = new Date(state.endDateObj.getTime());
	//TODO:Copy member list.
	return newState;
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

	xmlhttp.onprogress=function(evt)
	{
		if (evt.lengthComputable) 
		   {//evt.loaded the bytes browser receive
			//evt.total the total bytes seted by the header
			//
			 var percentComplete = (evt.loaded / evt.total)*100;  
			 $('#progressbar').progressbar("value", percentComplete );
		   } else {
			//alert("indeterminant");
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
	//makeTable();
	retrieveStatePostXML();
	rebuildTable();
	enablePage();
}

function xmlFail()
{
	alert("XML not found. Please contact system administrator.");
}

function getMembers()
{
	var i;
	xmlMemberCount = 0;
	var x=xmlDoc.getElementsByTagName("member");

	//This is simply used to avoid putting duplicates in out memberLists. It is used as a hashtable.
	var dedupedList = {};

	for(i = 0; i < x.length; i++){
		//If we haven't already put this member's english name in our hashtable. Then we should add both their english and chinese name to our respective lists.
		if (typeof dedupedList[x[i].getAttribute('name-en')] == 'undefined'){
			dedupedList[x[i].getAttribute('name-en')] = 1; //Just put something that isn't 'undefined' in that slot of the HT
			memberListEN[xmlMemberCount] = x[i].getAttribute('name-en');
			memberListCN[xmlMemberCount] = x[i].getAttribute('name-ch');
			xmlMemberCount++;
		}
	}
}

function populateSelectBox()
{
	//Make a list of all English and Chinese names.
	var availableMembers = memberListEN.concat(memberListCN);

	$( "#voterList" ).autocomplete({
		source: availableMembers,
		/* When the user selects an autocomplete option: */
		select: function( event, ui ) {
			//set the value of the textbox to the autocompletion
			$('#voterList').val(ui.item.value);
			var v = nameToNumAndEN(ui.item.value);
			//If the name is in the english list then it'll return the member number, otherwise -1.
			if(v != -1) {addMember(v, false);}
			else {
				//The name must be Chinese. Get the member number, and add that member.
				v = nameToNumAndCN(ui.item.value);
				if(v != -1) {addMember(v, true);}
				else {alert("This should never happen.");}
			}
		},
		close: function( event, ui ) {
			//Clear the voter selector when the autocomplete closes.
			$('#voterList').val("");
		}
	});

}

/* Return the id number of a member, if their name is English. If it's not then return -1 */
function nameToNumAndEN(name)
{
	var i;
	for(i = 0; i < memberListEN.length; i++){
		if(memberListEN[i] === name) {return i;}
	}
	return -1;
}

/* Return the id number of a member, if their name is Chinese. If it's not then return -1 */
function nameToNumAndCN(name)
{
	var i;
	for(i = 0; i < memberListCN.length; i++){
		if(memberListCN[i] === name) {return i;}
	}
	return -1;
}

function nameToNum(name)
{
	var a = nameToNumAndEN(name);
	if(a == -1) return nameToNumAndCN(name);
	return a;
}

function populateMemberDialog() 
{
	var memberDialog = document.getElementById("memberDialog");
	for(var i = 0; i < xmlMemberCount; i++){
		var child = document.createElement("DIV");
		var checkboxO = document.createElement("INPUT");
		checkboxO.id = i;
		var name = document.createElement("LABEL");
		name.innerHTML = memberListEN[i] + " --- " + memberListCN[i];
		checkboxO.type = "checkbox";

		/* I know that when making a function in a loop you have to be careful if depending on a value from the loop	*
		 * because you will pass a reference, and the value may change as the loop iterates.							*
		 * As far as I know, the function is just passed the onchange event, so I get all the needed info from that 	*/
		checkboxO.onchange = function(e){
			var innerCheckbox = e.target;
			if(innerCheckbox.checked){ //The box has *just* been checked. We need to add the member.
				addMember(innerCheckbox.id);
			} else {
				removeMemberByMemberNum(innerCheckbox.id);
			}
		};

		child.appendChild(checkboxO);
		child.appendChild(name);
		child.className = "memberDialogName"; 
		memberDialog.appendChild(child);
	}
}

function dateChange()
{
	updateGlobalDateObjects();
	changeVarString("startDate", state.startDateObj.getTime());
	changeVarString("endDate", state.endDateObj.getTime());
	history.pushState(copyState(state), "Legco Data Explorer", "?" + currentVarString);
	rebuildTable();
}
//Very similar to the add member function. This could probably be cleaned up to avoid duplicate code.
function rebuildTable(){
	var i,q,p,o;
	var newTable = document.createElement("TABLE");

	newTable.id = "mainTable";
	
	// Create an empty <tr> element and add it to the 1st position of the table:
	var row = newTable.insertRow(0);
	var currentRow = 1;

	var cell1 = row.insertCell(0);
	cell1.innerHTML = "Motion/Member: (Click to remove)";

	//Put all the members that were recently displayed back into the table
	for(i = 0; i < currentlyDisplayedMembers.length; i++)
	{
		var memberNameCell = row.insertCell(i + 1);

		memberNameCell.innerHTML = memberListEN[currentlyDisplayedMembers[i]]; //Breaks bilinguality. TODO:fix.

		//To remove a member
		memberNameCell.onclick = onTableMemberNameClick;
	}
	//Now make a new row for each motion:
	var meetings = xmlDoc.getElementsByTagName("meeting");

	for(i = 0; i < meetings.length; i++)
	{
		//The date of the specific meeting.
		var mDate = meetings[i].getAttribute('start-date').split("/");
		var mDateObj = new Date(mDate[2] + "/" + mDate[1] + "/" + mDate[0]);

		if(!(state.startDateObj.getTime() <= mDateObj.getTime() && mDateObj.getTime() <= state.endDateObj.getTime())) continue;

		var votes = meetings[i].childNodes;
		//For every vote in the meeting.
		for(o = 0; o < votes.length; o++)
		{

			if(votes[o].tagName != "vote") continue; //For some reason there are some text nodes here. We need to ignore these.

			var newMotionRow = newTable.insertRow(currentRow);
			var motionNameCell = newMotionRow.insertCell(0);
			//breaks bilinguality TODO:fix
			motionNameCell.innerHTML = votes[o].getElementsByTagName("motion-en")[0].innerHTML;

			var indivVotes = votes[o].getElementsByTagName("individual-votes")[0];
			var members = indivVotes.getElementsByTagName("member");

			for(p = 0; p < currentlyDisplayedMembers.length; p++)
			{
				var vote = newMotionRow.insertCell(p+1);
				vote.innerHTML = "Member not found.";

				// Things get relatively computationally intensive here. Improvements could be made.
				
				for(q = 0; q < members.length; q++)
				{
					/* It seems that members tend to be in the same order, but if someone leaves, or someone's name changes
					 * then we can't rely on that, so I do a linear search for the name. If these values are sorted (I haven't checked)
					 * then we could optimise this */
					if(members[q].getAttribute('name-en') == memberListEN[currentlyDisplayedMembers[p]]) //Once again breaks bilinguality. TODO:fix
					{
						vote.innerHTML = members[q].getElementsByTagName("vote")[0].innerHTML;
						break; 
					}
				}


			}
			currentRow++;
		}
	}
	//Get current table:
	var oldTable = document.getElementById("mainTable");

	//Add the main newTable to the page
	document.body.replaceChild(newTable, oldTable);
}

function updateGlobalDateObjects()
{
	var startDate = document.getElementById("startDate").value.split("/");

	state.startDateObj = new Date(startDate[2] + "/" + startDate[1] + "/" + startDate[0]);

	var endDate = document.getElementById("endDate").value.split("/");

	state.endDateObj = new Date(endDate[2] + "/" + endDate[1] + "/" + endDate[0]);
}

function enablePage(){
	document.getElementById("memberDialogButton").disabled = "";
	document.getElementById("startDate").disabled = "";
	document.getElementById("endDate").disabled = "";
}

function memberDisplayed(memberNum)
{
	//Jquery shortcut
	var found = $.inArray(memberNum, currentlyDisplayedMembers);
	if(found >= 0){
		return true;
	}
}

function removeMemberByMemberNum(memberNum)
{
	var i;
	var tableIndex = -1;
	//First find the table index. The table index of a member will always be their position in currentlyDisplayedMembers + 1.
	for(i = 0; i < currentlyDisplayedMembers.length; i++)
	{
		if(currentlyDisplayedMembers[i] == memberNum)
		{
			tableIndex = i+1;
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
	//Remove member from the currently displayed members list. Must keep the order.
	currentlyDisplayedMembers.splice((tableIndex-1), 1);
	deCheckMember(memberNum);
	if (removeMemberFromStateList(memberListEN[memberNum]) == -1 && removeMemberFromStateList(memberListCN[memberNum]) == -1){
		alert("Problem removing nonexistent member from state list.");
	}
	
	changeVarString("members", JSON.stringify(state.memberList));
	history.pushState(copyState(state), "Legco Data Explorer", "?" + currentVarString);
}

function removeMemberFromStateList(memberName) {
	var i;
	for(i = 0; i < state.memberList.length; i++){
		if(state.memberList[i] == memberName) {
			break;
		}
	}
	//i is the index of the member
	if(i < state.memberList.length) {state.memberList.splice(i,1);} else {return -1;}
	return 0;
}

function removeMemberByTableIndex(index) //Only to be used by removeMemberByMemberNum, because the arrays left must be spiced. 
{
	var mainTable = document.getElementById("mainTable");
	for(var i = 0; i < mainTable.rows.length; i++){
			mainTable.rows[i].deleteCell(index);
		 }
	numTableMembers--;
}

function deCheckMember(memberNum){
	//The id of each checkbox is the id of its associated member.
	var checkb = document.getElementById(memberNum);
	checkb.checked = "";
}

function checkMember(memberNum){
	var checkb = document.getElementById(memberNum);
	checkb.checked = "checked";
}

function onTableMemberNameClick(e){
	removeMemberByMemberNum(nameToNum(e.target.innerHTML));
	
}

function addMember(memberNum, inChinese)
{
	var mainTable = document.getElementById("mainTable");

	if(!memberDisplayed(memberNum))
	{
		var meetings = xmlDoc.getElementsByTagName("meeting");

		var memberNameCell = mainTable.rows[0].insertCell(numTableMembers+1);

		var memberName;
		if(!inChinese)
		{
			memberName = memberListEN[memberNum];
		} else 
		{
			memberName = memberListCN[memberNum];
		}
		
		memberNameCell.innerHTML = memberName;

		state.memberList.push(memberName);
		changeVarString("members", JSON.stringify(state.memberList));
		history.pushState(copyState(state), "Legco Data Explorer", "?" + currentVarString);

		//To remove a member
		memberNameCell.onclick = onTableMemberNameClick;

		var currentMotion = 1;

		for(var i = 0; i < meetings.length; i++)
		{
			var mDate = meetings[i].getAttribute('start-date').split("/");
			var mDateObj = new Date(mDate[2] + "/" + mDate[1] + "/" + mDate[0]);

			//There's room for optimisation here. Currently going through *all* motions, and just skipping ones that aren't in the date range.
			if(!(state.startDateObj.getTime() <= mDateObj.getTime() && mDateObj.getTime() <= state.endDateObj.getTime())) continue;

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