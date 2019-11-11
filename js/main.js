// http://ws.audioscrobbler.com/2.0/?method=user.getweeklytrackchart&user=drbradish&from=1546300800&to=1548979200&api_key=bc6906f6dbbbb6835e7cdbee6bc235e4&format=json 

window.onload = (e) => {document.querySelector("#search").onclick = searchButtonClicked};

//////////////////////////////////// VARIABLE DECLARATIONS ////////////////////////////////////

//============ MAIN VARIABLES ============

let user = "";
let displayTerm = "";
let images = document.querySelectorAll("img");
let artists = document.querySelectorAll(".artist");
let titles = document.querySelectorAll(".title");
let status = document.querySelector("#status");
let searchField = document.querySelector("#nameField");
let songResults = document.getElementById("showing");
let results = [];

let lastfm_key = "bc6906f6dbbbb6835e7cdbee6bc235e4"; 

//============ DATE CALC VARIABLES ============

let currentDate = new Date(); //Gets the current date
let currentYear = currentDate.getFullYear(); //Gets current year
let currentMonth = currentDate.getMonth(); //Gets the current month
let yearList = document.getElementById("year"); //Gets the year select tags list
let months = document.getElementById("month");  //Gets the month select tags list
months.selectedIndex = currentMonth.toString(); //Sets the current month select tag to the current month;
let dates = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];//Array containing amount of days in each month

let startMonth = 2; //Defaults to the month last.fm was made, which is March.
let startYear = 2002; //Defaults to the year last.fm was made, which is 2002.

let first = ""; //Variable used for holding the first day of the month
let last = ""; //Varaible used for holding the last day of the month

//============ STORAGE VARIABLES ============

const userName = document.querySelector("#nameField");
const limitSelect = document.querySelector("#limit");

const prefix = "ncs2738"; //ncs2738 for Nick's account
const nameKey = prefix + "username"
const monthKey = prefix + "month";
const yearKey = prefix + "year";
const limitKey = prefix + "limit";

const storedName = localStorage.getItem(nameKey);
const storedMonth = localStorage.getItem(monthKey);
const storedYear = localStorage.getItem(yearKey);
const storedLimit = localStorage.getItem(limitKey);

nameField.onchange = e=>{ localStorage.setItem(nameKey, e.target.value); };
months.onchange = e=>{ localStorage.setItem(monthKey, e.target.value); };
yearList.onchange = e=>{ localStorage.setItem(yearKey, e.target.value); };
limitSelect.onchange = e=>{ localStorage.setItem(limitKey, e.target.value); };

//============ BUTTON VARIABLES ============

//Adds event listener to create next/prev. buttons in footer
document.querySelector("#search").addEventListener("click", pageButtons);

let limits = document.getElementById("limit");  //Gets the limit chosen by user

let songCount = 0; //Total of songs displayed
let remainder = 0; //Remaining songs to be displayed
let total = 0; //Total of all the songs for the month
let limit = 5;

//######################################################################################### MAIN CODE #########################################################################################

function searchButtonClicked()
{
  //TimeCheck(changeYear);
  //TimeCheck(changeMonth);

  childCleaner(); //Removes all of the songs displayed

  user = searchField.value; //Gets searched user

  if(user == "") //If the user did not enter in anything to the search field...
  {
    status.innerHTML = "<b>Please enter a search term first!</b>"; //Display the status and return
    return;
  }

  userInfo(user);
  songCount = 0; //Resets songCount and remainder
  remainder = 0;

  status.innerHTML  = "<b>Searching for '" + user + "'s songs...</b><br>";
  songResults.innerHTML = "Searching...";
  let spinner = document.createElement("IMG");
  spinner.setAttribute('src', 'images/spinner.gif');
  status.appendChild(spinner);
}

function userInfo(user) //Used for getting user information; Primarily used to get the account's creation date
{
  const infoURL = "https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=";
  let userURL = infoURL + user + "&api_key=" + lastfm_key + "&format=json";
  getData(userURL, userDataLoaded);
}

function dataUrl(user) //Used for getting song information and rankings
{          
  const songURL = "https://ws.audioscrobbler.com/2.0/?method=user.getweeklytrackchart&user=";    
  let url = songURL + user + "&from=" + first + "&to=" + last + "&api_key=";    
  url += lastfm_key + "&format=json";    
  getData(url, dataLoaded);
}
  
function getData(url, loadFunction) //Loads the data of the url given and calls the function passed
{
  let xhr = new XMLHttpRequest();  
  xhr.onload = loadFunction;
  xhr.onerror = dataError;
  xhr.open("GET", url);
  xhr.send();

  xhr.onloadend = function() //Error catcher; If returned a bad status, return out of the search.
  {
    if(xhr.status != 200 || xhr.status != 304) 
    {
      return; 
      //We didn't know how to properly catch for error 404 in the console with our API, so this was the best we could do.
      //Whatever we tried failed, and it seems like a common trend with other sites using this API.
    }
  }
}

function userDataLoaded(e)//Calls for userInfo; Gets the date the searched account for was made
{
  let xhr = e.target;
  let userName = JSON.parse(xhr.responseText);

  if(!userName.user) 	//If there are no songs that month, escapes.
  {
    status.innerHTML = "<b>It doesn't look like '" + user + "' exists! Try searching again! </b>";
    songResults.innerHTML = "No results!";
    searchField.value = "";
    total = 0;
    return; //Quits the function
  }

  //Parses the accounts start month and start year.
  let unixDate = userName.user.registered.unixtime; 
  let date = new Date(unixDate * 1000);
  startYear = date.getFullYear();
  startMonth = date.getMonth();
  getMonths(months.value, yearList.value);
  dataUrl(user);
}


function dataLoaded(e) //Calls for dataURL
{
  let xhr = e.target;
  let obj = JSON.parse(xhr.responseText);
  results = obj.weeklytrackchart.track;

  if(!results || results.length == 0) 	//If there are no songs that month, escapes.
  {
    status.innerHTML  = "<b>No results found for '" + user + "'</b>";
    return; //Quits the function
  }

  total = results.length; //Sets the total amount of songs
  firstLoad(); //creates arrays of HTML objects
}

function firstLoad() //Displays the songs for the very first loading.
{
  if(total > 0) //If the user account exists + has listened to songs that month
  {
    let amount = total - songCount;
    if(amount - songCount >= limit) //And the user has listened to at least the amount of songs searched for that month
    {
      remainder = limit; 
    }
    else //The user has searched for more songs then they listened to that month.
    {
      remainder = 0;
      while(remainder < amount) //Gets the remainder of how many songs there are
      {
        remainder++;
      }
    } 
  setStatusResults(""); //Updates the status
  setSongResults(songCount + 1, remainder); //Updates the song results to be displayed in the footer
  loadSongs(); //Displays the songs
  }

  else //The user has listened to no songs / the account searched for does not exist
  {
    songResults.innerHTML = "No results!";
  }
}

function loadSongs() //Creates span elements and displays the songs in the "albums" div
{       
  document.getElementById("albums").innerHTML="";

  for(let i = 0; i < remainder; i++) //Reads in the song data from the dataURL
  {
    let offset = i + songCount; //The offset gives the song rank. The url gives a giant array of songs that must be indexed through.
    let image = results[offset].image[2]["#text"]; //Retrieves the image
    if(!image) image = "images/missing-art.png";

    let songlink = results[offset].url; //Gets the image url, so when the image is clicked, links to the song.
    if (!songlink) songlink = "https://www.last.fm/404";
                      
    let artist = results[offset].artist["#text"]; //gets the artist's name
    artist += "<br> (" + results[offset].playcount + " plays)"; //And adds the songs playcount to the name.
    if(!artist) artist += "No Artist Found";
                  
    let name = "#" + results[offset]["@attr"].rank + ": "; //Gets the song's ranking in how many times the song was played.
    name += results[offset].name;
    if(!name) name = "No Artist Found";

    let albums = document.getElementById("albums"); //Retrieves the album field and creates span element
    let albumSpan = document.createElement("span"); 
    albumSpan.className = "album";
    albums.appendChild(albumSpan);

    let a1 = ["a", "image", image, songlink];
    let a2 = ["p", "title", name, ""];
    let a3 = ["p", "artist", artist, ""];
    let albumArray = [a1,a2,a3];

    //Creates and appends all of the song data into the span.
    for(let i = 0; i < albumArray.length; i++)
    {
    createElement(albumSpan, albumArray[i]);
    }
  }
  songCount += remainder; //Adds to the songcount. Used for next/last page buttons.
}

function createElement(albumSpan, albumArray) //Creates each element of the song
{
  let elemName = albumArray[0];
  let class_Name = albumArray[1];
  let text = albumArray[2];
  let link = albumArray[3];

  let tag = document.createElement(elemName);
  tag.className = class_Name;

  if(elemName == "a") //If the element is a link, creates an image with the link.
  {
    tag.href = link;
    tag.appendChild(document.createElement("IMG")).src = text;
  }
  else //Else, hust writes as normal text.
  {
    tag.innerHTML = text;
  }
  albumSpan.appendChild(tag);
}

function dataError(e) //Error catcher
{
  console.log("An error occured!")
}

function childCleaner() //Used for removing elements; Takes in the id name and removes all of its children.
{
  let elem = document.getElementById("albums");
  while(elem.firstChild) //Does not remove the showing div in the footer
  {
    elem.removeChild(elem.firstChild);
  }
}

function setStatusResults(str) //used for updating the status results at the top of the page.
{
  status.innerHTML = "<b>Showing " + user + "'s songs for " + months[months.selectedIndex].text + " " +  yearList.value + "</b>"
  + str;
}

function setSongResults(val1, val2) //Used for updating the songResults within the footer. Displays how many songs the user has been shown.
{
  songResults.innerHTML = "Showing results " + val1 + "-" + val2 + " of " + total;
}

//######################################################################################### STORAGE CODE #########################################################################################

//Handles the last searched account name
if (storedName)
{
  nameField.value = storedName;
}
else
{
  nameField.value = "Enter a Last.FM Username!";
}

//Handles the last searched month
if (storedMonth)
{
  months.querySelector(`option[value='${storedMonth}']`).selected = true;
}
else
{
  let str = currentMonth.toString();
  months.selectedIndex = str;  
}

//Handles the last stored year
if (storedYear)
{
  yearList.selectedIndex = (currentYear - storedYear);

}
else
{
  yearList.selectedIndex = "1";
}


//Handles the last stored limit
if (storedLimit)
{
  limitSelect.querySelector(`option[value='${storedLimit}']`).selected = true;
  limit = parseInt(limitSelect.value,10);
}
else
{
  limitSelect.selectedIndex = "0";
  limit = parseInt(limitSelect.value,10);
}

//Both functions are called when the date is automatically changed by the client, not by the user.
//For example, if the user had entered a date into the future, the search terms adjusts to make the term searched either present day or the month searched of last year.
//Both store the adjusted term into memory.
function setStoredMonth(selectedMonth)
{
  localStorage.setItem(monthKey, selectedMonth);
}

function setStoredYear(selectedYear)
{
  localStorage.setItem(yearKey, selectedYear);
}

//######################################################################################### DATE CALC CODE #########################################################################################

let tmp = "";
let val = "";

for(let i = currentYear; i >= startYear; i--)//Decrements from current year to the year 2002
{
  tmp += "<option>"+ i +"</option>"; 
  val = i.toString(); //Sets the value as the current year
}
yearList.value = val; //Sets the year option's value
yearList.innerHTML = tmp; //Adds the year as an option in the lost
yearList.selectedIndex = (currentYear - storedYear); //Sets the year's index to the stored year.



//Checks to see if the user is searching for terms before the account searched was made, or if they are searching into the future.
function TimeCheck(funcCall)
{
  let num = parseInt(months.value, 10);
  //Checks to see if you are searching for a date in the future
  if(currentMonth < num && yearList.selectedIndex === 0) 
  {
    funcCall(); //if you are, makes the search results back to current day
  }

  num = parseInt(yearList.value, 10);
  if(num === startYear && months.selectedIndex < startMonth) //Checks to see if you are searching for a date before the account was made. By default, searches for the year last.fm was made.
  {
    months.selectedIndex = startMonth;  //If the user has not done a search yet, defaults to March; the month when last.fm was started in 2002
    setStoredMonth(months.value);
    status.innerHTML = "<b>There's no data here! The month being searched is now " + months[months.selectedIndex].text + "!<br>";
  }

  let chosenYear = parseInt(yearList.value,10); //Transfers the chosen year into an int value
  let chosenMonth = parseInt(months.value,10); //Reads in user input for the chosen month

  getMonths(chosenMonth, chosenYear); //gets the unix time for the dates searched
}

function changeYear() //Calls when the user searches for a month in the future
{
  yearList.selectedIndex = "1"; //Changes the year to last year
  setStoredYear(yearList.value); //Stores the adjusted year into memory
  setYearStatus();
}

function changeMonth() //Calls when the user changes the year to current year while the months search has a month in the future
{
  setMonthIndex(); //Sets the month select's value to the month the account searched was created
  setStoredMonth(months.value); //Saves the month into memory

  if(yearList.selectedIndex == 0)
  {
    yearList.selectedIndex = 1; //Changes the year to the last year
    setStoredYear(yearList.value); //Stores the adjusted year into memory
    setYearStatus();
  }
  else
  {
    status.innerHTML = "<b>We can't tell the future! The month being searched is now the current month of " + months[months.selectedIndex].text + "!<br>";
  }
}

function getMonths(chosenMonth, chosenYear) //Takes in the selected month and year, checks the dates, and transfers them into unix time.
{
  let cMonth = parseInt(chosenMonth, 10);
  let cYear = parseInt(chosenYear, 10);

  if(cYear < startYear) //Checks to see if the user entered a year before the searched account was created
  {
      yearList.selectedIndex = (currentYear - startYear); //if so, change to the year it was created
      setStoredYear(yearList.value); //Stores the year into memory
      chosenYear = startYear;

      if(cMonth < startMonth) //If the user also searched for a month prior to the searched account's creation, adjusts to it's creation date.
      {
        setMonthIndex(); //Sets the month select's value to the month the account searched was created
        chosenMonth = startMonth;
      }
      setStatus(); //Adjusts the status at the top
  }
  else if(cYear == startYear && cMonth < startMonth) //The user searched for an account in the same year, but the month searched is prior to the account's creation
  {
    setMonthIndex(); //Sets the month select's value to the month the account searched was created
    chosenMonth = startMonth;
    setStatus(); //Adjusts the status at the top
  }

  if(chosenYear/4) //Leap year check
  {
    dates[1] = 29;
  }
  else
  {
    dates[1] = 28;
  }

  first = new Date(chosenYear, chosenMonth, 1).getTime() / 1000; //Gets the first day of the month

  if(chosenMonth === currentMonth) //if the user is searching for info on the current day, makes the search range today to the first.
  {
    last = new Date(chosenYear, chosenMonth, currentDate.getDay()).getTime() / 1000;
    last = last.toString();
  }
  else //the user is searching for a month in the past; Uses the last day of the month searched.
  {
    last = new Date(chosenYear, chosenMonth, dates[chosenMonth]).getTime() / 1000;
    last = last.toString();
  }
}

function setMonthIndex() //Adjusts the month select bar's index to the month the account searched for was created.
{
  let str = startMonth.toString(); 
  months.selectedIndex = str; //Sets the month's value to the start month
  setStoredMonth(months.value); //Saves the month into memory
}

function setStatus() //Updates the status
{
  status.innerHTML = "<b>You have searched for a date prior to this account's creation! Setting search to the account's creation date.</b><br>";
}

function setYearStatus() //Updates the status to the last year
{
  status.innerHTML = "<b>We can't tell the future! The year being searched is now " + yearList.value + "!<br>";
}

//######################################################################################### BUTTONS CODE #########################################################################################

limits.addEventListener("change", function() //Adds event listener to the limit select field
{
  limit = parseInt(limits.value);
});
  
function pageButtons() //Creates 4 buttons for scrolling through the data
{
  let b2 = ["back", "Prev. Page", lastPage];
  let b3 = ["forward", "Next Page", nextPage];
  let b1 = ["lastMonth", "Last Month", lastMonth];
  let b4 = ["nextMonth", "Next Month", nextMonth];
  let buttons = [b1,b2,b3,b4];

  for(let i = 0; i < buttons.length; i++)
  {
    createButton(buttons[i]);
  }

	//Removes searchButtonClick listener so function only calls once
	document.querySelector("#search").removeEventListener("click", pageButtons);
}

function createButton(buttons) //Creates the buttons
{
  let name = document.createElement("BUTTON");
  name.setAttribute("id", buttons[0]);
  name.innerHTML = buttons[1];
  document.querySelector("#buttons").appendChild(name);
  document.querySelector("#" + buttons[0]).addEventListener("click", buttons[2]);
}


function lastPage() //Used for checking if there are songs on the previous page
{
  let amount = songCount - limit - remainder;

  if(total > 0) //If there are songs to begin with
  {
    if(amount >= 0)//If amount is greater than 0, there are still more songs to load
    {
      songCount = amount;
      remainder = limit;
      loadSongs(); //Displays the songs
      setStatusResults(""); //Adjusts the status results at the top of the page
      setSongResults(1+songCount-limit, amount + limit); //Adjusts the total amount of songs displayed in the footer
    }  
    else //The user has reached the begining of the songs to be shown
    {
      setStatusResults("<br><b>You have reached the start of the songs!</b>"); //Adjusts the search status results at the top of page
      songCount = limit; //songCount must be set to the limit; Once amount < 0, the user is on the first page, where regardless, the songCount == limit.
    }
  }
  else //There are no songs
  {
    setStatusResults("<br><b>There are no found songs for this month!</b>");
  }
}

function nextPage() //Used for checking to see if therer are more songs on the next page
{
  if(total != 0) //There are no songs at all
  {
    if(total > songCount) //If there are still more songs not displayed
    {
      let amount = total - songCount; 
      if(amount >= limit) //And the user has listened to at least the amount of songs searched for that month
      {
        remainder = limit; 
      }
      else //The user has searched for more songs then they listened to that month.
      {
      remainder = 0;
        while(remainder < amount) //Gets the remainder of how many songs there are
        {
          remainder++;
        }
      }
      loadSongs(); //Displays the songs
      setStatusResults(""); //Adjusts the results at the top of the page
      setSongResults(1+ songCount - remainder, songCount); //Adjusts the total amount of songs displayed in the footer
    }
    else //The user reached the end of the songs
    {
      setStatusResults("<br><b>You have reached the end of the songs!</b>");
    }
  }
  else //There are no songs to display
  {
    setStatusResults("<br><b>There are no found songs for this month!</b>");
  }
}

function lastMonth() //Searches for the last month and displays last months' songs.
{
  let lastMonth = parseInt(months.value, 10); 
  let lastYear = parseInt(yearList.value, 10);
  let yearIndex = yearList.selectedIndex;

  if(lastYear > startYear) //If the year is greater than the year the account was created, we can go back further in time
  {
    if(lastMonth >= 1) //If the month is past January
    {
      lastMonth = parseInt(lastMonth,10);
      lastMonth--;
      months.selectedIndex = lastMonth.toString();
      searchButtonClicked(); //Recalls the search process
    }
    else//If the month is January, decrement to the next year and set the month to December
    {
      yearIndex++;
      yearList.selectedIndex = yearIndex.toString();

      lastYear = yearList[yearIndex].value;

      lastMonth = 11;
      months.selectedIndex = lastMonth + "";

      searchButtonClicked(); //Recalls the search process
    }
    setStoredMonth(months.value); //Saves the dates into memory
    setStoredYear(yearList.value);
  }
  else if(lastYear == startYear && lastMonth > startMonth)//The year is the same as the year the account was created, but the month is not the same as the nmonth it was created
  {
    lastMonth = parseInt(lastMonth,10);
    lastMonth--;
    months.selectedIndex = lastMonth.toString();
    searchButtonClicked(); //Recalls the search process
    setStoredMonth(months.value); //Saves the dates into memory
    setStoredYear(yearList.value);
  }
  else //The user has reached the date the account was created
  {
    setStatusResults("<br><b>You have reached the month this account was created!</b>");
  }
}


function nextMonth() //Searches for the next month and displays next months' songs.
{
  let nextMonth = months.value; 
  let nextYear = yearList.value;
  let yearIndex = yearList.selectedIndex;

  if(nextYear < currentYear)//It is not the current year, so we can keep going forward in time
  {
    if(nextMonth <= 10) //The month is prior to December
    {
        nextMonth = parseInt(nextMonth,10);
        nextMonth++;
        months.selectedIndex = nextMonth.toString();
        searchButtonClicked(); //Recalls the search process
    }
    else //The month is December, so go onto the next year and set the month to January
    {
        nextYear = parseInt(nextYear,10);
        nextYear++;

        yearList.selectedIndex = nextYear.toString();

        yearIndex--;
        yearList.selectedIndex = yearIndex.toString();

        nextMonth = 0;
        months.selectedIndex = nextMonth.toString();
        
        searchButtonClicked();
    }
    setStoredMonth(months.value); //Saves the dates into memory
    setStoredYear(yearList.value);
  }
  else if(nextYear == currentYear && nextMonth != currentMonth) //It is the current year, but not up to the current month
  {
  nextMonth = parseInt(nextMonth, 10);
  nextMonth++;
  months.selectedIndex = nextMonth.toString();

  searchButtonClicked(); //Recalls the search process
  setStoredMonth(months.value); ///Saves the dates into memory
  setStoredYear(yearList.value);
  }
  else //The user has reached current day
  {
    setStatusResults("<br><b>You have reached current day! We can't tell the future!</b>");
  }
}
