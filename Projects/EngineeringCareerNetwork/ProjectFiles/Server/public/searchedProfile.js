const url = "https://ac.nau.edu/egrcn";

document.addEventListener('DOMContentLoaded', function () {
    if (sessionStorage.getItem('id') != null)
    {
        if (sessionStorage.getItem('type') == 'Admin')
        {
            adminBtn = document.querySelector('#adminTools');
            adminBtn.hidden = false;
            programBtn = document.querySelector('#progTools');
	    programBtn.hidden = false;
            profileBtn = document.querySelector('#profile');
            profileBtn.hidden = true;
        }
    }
    else
    {
        window.location.href = '/egrcn/signIn.html';
    }

    fetch(url + '/getUserById/' + sessionStorage.getItem('searchedUser'))
    .then(response => response.json())
    .then(data => loadUserData(data['data']['recordset']));
});

function loadUserData(userData) {
    fullName = userData[0]['first_name'] + ' ' + userData[0]['last_name'];
    const nameField = document.querySelector('#name-field');
    nameField.innerHTML = '<h2>' + fullName + '</h2>';

    userEmail = userData[0]['email'];
    const emailField = document.querySelector('#email-field');
    emailField.innerHTML = '<p>' + userEmail + '</p>';

    userProgram = userData[0]['program'];
    const progField = document.querySelector('#program-field');
    progField.innerHTML = '<p> Program: ' + userProgram + '</p>';

    if (sessionStorage.getItem('type') == 'Admin')
    {
        idDiv = document.querySelector('#id-field');
        idDiv.innerHTML = 'User ID: ' + userData[0]['id'];
        adminDiv = document.querySelector('#admin-div');
        adminDiv.hidden = false;
    }

    fetch(url + '/getMilestonesByUserId/' + sessionStorage.getItem('searchedUser'))
    .then(response => response.json())
    .then(data => loadMilestoneTable(data['data']['recordset']));
}

function loadMilestoneTable(milestoneData) {
    const table = document.querySelector('#milestone-table');

    shownMilestones = [];

    for (index = 0; index < milestoneData.length; index++) {
        if (milestoneData[index]['visibility'] == 'PRIVATE' && sessionStorage.getItem('type') != 'Admin') {
            continue;
        }
        shownMilestones.push(milestoneData[index]);
    }

    if (shownMilestones.length === 0) {
        table.innerHTML = '<tr><td class="no-data" colspan="5">No Public Milestones Found</td></tr>';
        return;
    }

    let tableHtml = '<thead><th>Company</th><th>Milestone Type</th>';

    if (sessionStorage.getItem('type') == 'Admin')
    {
        tableHtml += '<th>Visibility</th><th>Verified</th><th>Delete</th></thead><tbody>'
        shownMilestones.forEach(function ({company, type, visibility, verified, milestone_id}) {
            tableHtml += '<tr>';
            tableHtml += '<td>' + company + '</td>';
            tableHtml += '<td>' + type + '</td>';
            tableHtml += '<td>' + visibility + '</td>';
            tableHtml += '<td>' + verified + '</td>';
            tableHtml += '<td><button onclick=deleteMilestone(' + milestone_id + ')>Delete</button></td>';
            tableHtml += '</tr>';
        });
    }
    else
    {
        tableHtml += '</thead><tbody>'
        shownMilestones.forEach(function ({company, type}) {
            tableHtml += '<tr>';
            tableHtml += '<td>' + company + '</td>';
            tableHtml += '<td>' + type + '</td>';
            tableHtml += '</tr>';
        });
    }

    tableHtml += '</tbody>'

    table.innerHTML = tableHtml;
}

function deleteMilestone(milestoneId)
{
    fetch(url + '/deleteMilestone/' + milestoneId)
    .then(response => location.reload());;
}

function addMilestone() {
    company = document.querySelector('#company-name').value;

    if (company == "") {
	alert("No company name given!");
	return;
    }

    type = document.querySelector('#milestone-type').value;

    vis = document.querySelector('#vis-type').value;

    user_id = sessionStorage.getItem('searchedUser');

    document.querySelector('#company-name').value = "";

    fetch(url + '/insertMilestone', {
        headers: {
            'Content-type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({company:company, type: type, user_id: user_id, visibility: vis})
    })
    .then(response => location.reload());
}

// START LINKEDIN PART

function pullLinkedIn(attempt)
{
    targetId = sessionStorage.getItem('searchedUser');
    fetch(url + '/getUserById/' + targetId)
    .then(response => response.json())
    .then(data => scrapeHelper(data['data']['recordset'][0]['linkedin_url'], attempt));
}

function scrapeHelper(data, attempt) {
    profileUrl = data;

    if (profileUrl == "" || profileUrl == "Not Set")
    {
        alert("This user's LinkedIn URL is not set in our system!");
        return;
    }

    fetch(url + '/getLinkedInData/', {
        method: 'POST',
        headers: {
            'Content-type' : 'application/json'
        },
        body: JSON.stringify({
            inputUrl: profileUrl
        })
    })
    .then(response => response.json())
    .then(data => getUserMilestones(data), attempt);
}

// passes on the scraped milestones and the current user's milestones
function getUserMilestones(html, attempt)
{
    tgtId = sessionStorage.getItem('searchedUser');
    fetch(url + '/getMilestonesByUserId/' + tgtId)
    .then(response => response.json())
    .then(data => parseHTML(html, data['data'], attempt));
}

// takes the scraped html and parses it, then adds new milestones to the user
// milestones
function parseHTML(html, milestones, attempt) {
    let parser = new DOMParser();
    let parsedHTML = parser.parseFromString(html['pageHTML'], 'text/html');
    let experienceSection = parsedHTML.getElementById('experience-section');

    if(experienceSection == null)
    {
        if (attempt < 3) // will try again for a total of 3 attempts
        {
            scrapeLinkedIn(attempt+1);
        }
        else
        {
            alert("Scraping system returned null after multiple attempts. Try again soon.");
        }
        return;
    }

    let experiences = experienceSection.getElementsByClassName('pv-entity__summary-info');

    vis = "PRIVATE";
    user_id = sessionStorage.getItem('searchedUser');

    for( index = 0; index < experiences.length; index++ )
    {
        if( index > 10 ){break;} // hard coded so we never get a never ending loop of inserts for now
        positionE = experiences[index].getElementsByClassName('t-16 t-black t-bold');
        position = positionE[0].innerHTML;
        milestoneType = classifyType(position);

        companyE = experiences[index].getElementsByClassName('t-14 t-black t-normal');
        companyStr = companyE[0].innerHTML;
        companyPieces = companyStr.split('\n');
        company = companyPieces[1].trim();

        if( alreadyInDatabase(company, milestoneType, milestones) )
        {
            continue;
        }

        fetch(url + '/insertMilestone', {
            headers: {
                'Content-type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify({company: company, type: milestoneType, user_id: user_id, visibility: vis})
        });
    }

    location.reload();
}

// helper function to classify the job type
function classifyType(jobPosition)
{
    if( jobPosition.includes("intern") || jobPosition.includes("Intern") )
    {
        return "Internship";
    }
    else if( jobPosition.includes("offer") )
    {
        return "Job Offer";
    }
    else if( jobPosition.includes("research") )
    {
        return "Research";
    }
    else
    {
        return "Work Experience";
    }
}

// helper function to see if a milestone is already in the user milestones
function alreadyInDatabase(company, milestoneType, milestones)
{
    if( milestones.length == 0 )
    {
        return false;
    }
    for( newIndex = 0; newIndex < milestones.length; newIndex++ )
    {
        if( milestones[newIndex]['company'] == company )
        {
            if( milestones[newIndex]['type'] == milestoneType )
            {
                return true;
            }
        }
    }

    return false;
}

function makeAdmin()
{
    if (!window.confirm("Are you sure you want to make this user an administrator?"))
    {
        return;
    }

    id = sessionStorage.getItem('searchedUser');

    fetch(url + '/setAdmin/' + id);

    window.location.href = 'dashboard.html';
}

function makeAlumni()
{
    if (!window.confirm("Are you sure you want to make this user an alumni?"))
    {
        return;
    }

    id = sessionStorage.getItem('searchedUser');

    fetch(url + '/setAlumni/' + id);

    window.location.href = 'dashboard.html';
}
