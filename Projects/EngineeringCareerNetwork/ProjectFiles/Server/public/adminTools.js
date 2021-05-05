const url = "https://ac.nau.edu/egrcn";

document.addEventListener('DOMContentLoaded', function () {
    if (sessionStorage.getItem('id') == null)
    {
        window.location.href = '/egrcn/signIn.html';
    }

    fetch(url + '/getUnverifiedMilestones')
    .then(response => response.json())
    .then(data => loadMilestoneTable(data['data']['recordset']));
});

function loadMilestoneTable(milestoneArray) {
    const table = document.querySelector('table tbody');

    if (milestoneArray.length === 0) {
        table.innerHTML = '<tr><td class="no-data" colspan="5">No Milestones Found</td></tr>';
        return;
    }

    let tableHtml = "";

    milestoneArray.forEach(function ({milestone_id, user_id, company, type, verified}) {
        tableHtml += '<tr>';
        tableHtml += '<td><button onclick="verifyMilestone(' + milestone_id + ')">Verify</button></td>';
        tableHtml += '<td>' + user_id + '</td>';
        tableHtml += '<td>' + company + '</td>';
        tableHtml += '<td>' + type + '</td>';
        tableHtml += '<td><button onclick="editMilestone(' + milestone_id + ')">Edit</button></td>';
        tableHtml += '<td><button onclick="deleteMilestone(' + milestone_id + ')">Delete</button></td>';
        tableHtml += '</tr>';
    });

    table.innerHTML = tableHtml;
}

function deleteMilestone(milestone_id) {
    fetch(url + '/deleteMilestone/' + milestone_id)
    .then(response => location.reload());
}

function verifyMilestone(milestone_id) {
    if (confirm('You are verifying milestone with id: ' + milestone_id + '. Are you sure you wish to proceed?'))
    {
        fetch(url + '/verifyMilestone/' + milestone_id)
        .then(response => location.reload());
    }
    else
    {
        return;
    }
}

function editMilestone(milestone_id) {
    const updateSection = document.querySelector('#update-row');
    updateSection.hidden = false;
    document.querySelector('#update-milestone-input').dataset.id = milestone_id;
}

function updateClick() {
    const updateNameInput = document.querySelector('#update-milestone-input');
    const updateTypeInput = document.querySelector('#update-type-input');

    if( updateNameInput.value === null) {return;}

    fetch(url + '/updateAdmin', {
        method: 'PATCH',
        headers: {
            'Content-type' : 'application/json'
        },
        body: JSON.stringify({
            id: updateNameInput.dataset.id,
            company: updateNameInput.value,
            type: updateTypeInput.value,
        })
    })
    .then(response => location.reload());
}

// BEGIN LINKED IN STUFF
function scrapeAccounts()
{
    fetch(url + '/getAllUsers')
    .then(response => response.json())
    .then(data => scrapeEachAccount(data['data']['recordset']));
}

function scrapeEachAccount(data) {
    data.forEach(function ({id}) {
        fetch(url + '/getUserById/' + id)
        .then(response => response.json())
        .then(data => scrapeHelper(data['data']['recordset'][0]['linkedin_url'], id));
    });
}

function scrapeHelper(data, id) {
    profileUrl = data;

    if (profileUrl == null || profileUrl == "")
    {
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
    .then(data => getUserMilestones(data, id));
}

// passes on the scraped milestones and the current user's milestones
function getUserMilestones(html, id)
{
    fetch(url + '/getMilestonesByUserId/' + id)
    .then(response => response.json())
    .then(data => parseHTML(html, data['data']['recordset'], id));
}

// takes the scraped html and parses it, then adds new milestones to the user
// milestones
function parseHTML(html, milestones, id) {
    let parser = new DOMParser();
    let parsedHTML = parser.parseFromString(html['pageHTML'], 'text/html');
    let experienceSection = parsedHTML.getElementById('experience-section');

    let experiences = experienceSection.getElementsByClassName('pv-entity__summary-info');

    vis = "PRIVATE";

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
            body: JSON.stringify({company: company, type: milestoneType, user_id: id, visibility: vis})
        });
    }
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
