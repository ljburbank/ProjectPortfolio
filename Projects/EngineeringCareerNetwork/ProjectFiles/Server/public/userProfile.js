const url = "https://ac.nau.edu/egrcn";

document.addEventListener('DOMContentLoaded', function () {
    if (sessionStorage.getItem('id') == null)
    {
        window.location.href = '/egrcn/signIn.html';
    }

    fetch(url + '/getUserById/' + sessionStorage.getItem('id'))
    .then(response => response.json())
    .then(data => loadUserProfile(data['data']['recordset']));
});

// ============================================================================
// ========================= PROFILE DATA LOADING =============================
// ============================================================================


// begins loading the user profile using the data pulled initially
// calls on function below, loadMilestoneTable
function loadUserProfile(data) {
    fullName = data[0]['first_name'] + ' ' + data[0]['last_name'];
    const nameField = document.querySelector('#name-field');
    nameField.innerHTML = '<h2>' + fullName + '</h2>';

    userEmail = data[0]['email'];
    const emailField = document.querySelector('#email-field');
    emailField.innerHTML = '<h4>' + userEmail + '</h4>';

    userProgram = data[0]['program'];
    const progField = document.querySelector('#program-field');
    progField.innerHTML = '<p> Program: ' + userProgram + '</p>';

    userVisibility = data[0]['visibility'];
    const visField = document.querySelector('#vis-message');
    visField.innerHTML = 'Your profile visibility is currently set to: ' + userVisibility;

    fetch(url + '/getMilestonesByUserId/' + data[0]['id'])
    .then(response => response.json())
    .then(data => loadMilestoneTable(data['data']['recordset']));
}

// called from loadUserProfile, fills in the table with user milestones
function loadMilestoneTable(milestoneArray) {
    const table = document.querySelector('table tbody');

    if (milestoneArray.length === 0) {
        table.innerHTML = '<tr><td class="no-data" colspan="5">No Milestones Found</td></tr>';
        return;
    }

    let tableHtml = "";

    milestoneArray.forEach(function ({milestone_id, company, type, visibility, verified}) {
        tableHtml += '<tr>';
        tableHtml += '<td>' + company + '</td>';
        tableHtml += '<td>' + type + '</td>';
        tableHtml += '<td>' + visibility + '</td>';
        tableHtml += '<td>' + verified + '</td>';
        tableHtml += '<td><button onclick="editMilestone(' + milestone_id + ')">Edit</button></td>';
        tableHtml += '<td><button onclick="deleteMilestone(' + milestone_id + ')">Delete</button></td>';
        tableHtml += '</tr>';
    });

    table.innerHTML = tableHtml;
}

// ============================================================================
// ======================== MILESTONE MANAGING =============================
// ============================================================================

// adds a milestone when the add milestone button is clicked
function addMilestone() {
    const companyField = document.querySelector('#company-name');
    company = companyField.value;

    if(company == "") {
        return;
    }

    const typeField = document.querySelector('#milestone-type');
    type = typeField.value;

    const visField = document.querySelector('#vis-type');
    vis = visField.value;

    user_id = sessionStorage.getItem('id');

    companyField.value = "";

    fetch(url + '/insertMilestone', {
        headers: {
            'Content-type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({company: company, type: type, user_id: user_id, visibility: vis})
    })
    .then(response => location.reload());
}


// deletes a milestone when the delete button is clicked on a specific milestone
function deleteMilestone(milestone_id) {
    fetch(url + '/deleteMilestone/' + milestone_id)
    .then(response => location.reload());;
}


// unhides the edit milestone section and attaches the selected
// milestone id to it
function editMilestone(milestone_id) {
    const updateSection = document.querySelector('#update-row');
    updateSection.hidden = false;
    document.querySelector('#update-milestone-input').dataset.id = milestone_id;
    
}

// updates a milestone with the updated information given
function updateClick() {
    const updateNameInput = document.querySelector('#update-milestone-input');
    const updateTypeInput = document.querySelector('#update-type-input');
    const updateVisInput = document.querySelector('#update-vis-input');

    if( updateNameInput.value === null) {return;}

    fetch(url + '/updateMilestone', {
        method: 'PATCH',
        headers: {
            'Content-type' : 'application/json'
        },
        body: JSON.stringify({
            id: updateNameInput.dataset.id,
            company: updateNameInput.value,
            type: updateTypeInput.value,
            vis: updateVisInput.value
        })
    })
    .then(response => location.reload());
}

// ============================================================================
// ========================= OTHER PROFILE MANAGING ===========================
// ============================================================================

// changes a user's visibility
function changeVisibility() {
    user_id = sessionStorage.getItem('id');

    fetch(url + '/getUserById/' + user_id)
    .then(response => response.json())
    .then(data => changeVisibilityHelper(data['data']['recordset'][0]['visibility']));
}

// called on by changeVisibility to look at the current vis
// and call the right fetch for what it is
function changeVisibilityHelper(currentVis) {
    user_id = sessionStorage.getItem('id');

    if (currentVis == 'PRIVATE') {
        fetch(url + '/setUserPublic/' + user_id)
        .then(response => location.reload());
    }
    else {
        fetch(url + '/setUserPrivate/' + user_id)
        .then(response => location.reload());
    }
}


// updates the user's stored LinkedIn URL with the new one given //////////////////////////////////
function updateLinkedInURL() {
    const profileUrlField = document.querySelector('#linked-in-url');
    profileUrl = profileUrlField.value;
    profileUrlField.value = "";

    if (profileUrl == "")
    {
	alert("You have not put a URL in the field.");
        return;
    }

    if (!window.confirm('Adding your LinkedIn URL will allow our site to pull public information from your LinkedIn profile.'))
    {
        return;
    }

    id = sessionStorage.getItem('id');

    fetch(url + '/setUserUrl', {
        headers: {
            'Content-type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({user_id: id, inputUrl: profileUrl})
    })
    .then(response => alert("Your LinkedIn URL has been updated within our system!"));
}

// ============================================================================
// ========================= LINKEDIN SCRAPING ================================
// ============================================================================

// starts the scraping process; get's the user id and calls the scrape fetch
function scrapeLinkedIn(attempt) {
    id = sessionStorage.getItem('id');
    fetch(url + '/getUserById/' + id)
    .then(response => response.json())
    .then(data => scrapeHelper(data['data']['recordset'][0]['linkedin_url'], attempt));
}

function scrapeHelper(data, attempt) {
    profileUrl = data;

    if (profileUrl == "" || profileUrl == "Not Set")
    {
        alert("Your LinkedIn URL is not set in our system!");
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
    .then(data => getUserMilestones(data, attempt));
}

// passes on the scraped milestones and the current user's milestones
function getUserMilestones(html, attempt)
{
    id = sessionStorage.getItem('id');
    fetch(url + '/getMilestonesByUserId/' + id)
    .then(response => response.json())
    .then(data => parseHTML(html, data['data']['recordset'], attempt));
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
            alert("Scraping system returned null after multiple attempts. Check if the URL is correct.");
        }
        return;
    }

    let experiences = experienceSection.getElementsByClassName('pv-entity__summary-info');

    vis = "PRIVATE";
    user_id = sessionStorage.getItem('id');
    let index = 0;

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
