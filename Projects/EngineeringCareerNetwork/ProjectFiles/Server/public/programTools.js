const url = "https://ac.nau.edu/egrcn";

let programs = [];

document.addEventListener('DOMContentLoaded', function () {
    if (sessionStorage.getItem('id') == null)
    {
        window.location.href = '/egrcn/signIn.html';
    }

    fetch(url + '/getAllPrograms')
    .then(response => response.json())
    .then(data => loadProgramTable(data['data']['recordset']));
});

function loadProgramTable(programArray) {
    const table = document.querySelector('table tbody');

    if (programArray.length === 0) {
        table.innerHTML = '<tr><td class="no-data" colspan="5">No Milestones Found</td></tr>';
        return;
    }

    let tableHtml = "";

    programArray.forEach(function ({program_name, department, college, program_id}) {
        tableHtml += '<tr>';
        tableHtml += '<td>' + program_name + '</td>';
        tableHtml += '<td>' + department + '</td>';
        tableHtml += '<td>' + college + '</td>';
        tableHtml += '<td><button onclick="deleteProgram(' + program_id + ')">Delete</button></td>';
        tableHtml += '</tr>';
    });

    table.innerHTML = tableHtml;

    loadOptions(programArray);
}

function deleteProgram(program_id) {
    fetch(url + '/deleteProgram/' + program_id)
    .then(response => location.reload());
}

function addProgram() {
    let programName = document.querySelector('#program-name').value;
    let departmentName = document.querySelector('#department').value;
    let collegeName = document.querySelector('#college').value;

    if (departmentName == "")
    {
        departmentName = document.querySelector('#new-department').value;
    }

    if (collegeName == "")
    {
        collegeName = document.querySelector('#new-college').value;
    }

    if (departmentName == "" || programName == "" || collegeName == "")
    {
        alert("You must fill in all fields.");
	return;
    }

    if (programs.includes(programName))
    {
        alert("That program is already in the table.");
        return;
    }

    fetch(url + '/addProgram', {
        method: 'POST',
        headers: {
            'Content-type' : 'application/json'
        },
        body: JSON.stringify({
            program: programName,
            department: departmentName,
            college: collegeName,
        })
    })
    .then(response => location.reload());
}

function loadOptions(programList)
{
    departments = []
    colleges = []
    for (index = 0; index < programList.length; index++ )
    {
	programs.push(programList[index]['program_name']);

        if (!departments.includes(programList[index]['department']))
        {
            departments.push(programList[index]['department']);
        }
	if (!colleges.includes(programList[index]['college']))
        {
            colleges.push(programList[index]['college']);
        }
    }

    selectHtml = "";

    for (index = 0; index < departments.length; index++ )
    {
        selectHtml += '<option value="' + departments[index] + '">' + departments[index] + '</option>';
    }

    selectHtml += '<option value="">NEW DEPARTMENT</option>';

    document.querySelector('#department').innerHTML = selectHtml;

    selectHtml = "";

    for (index = 0; index < colleges.length; index++ )
    {
        selectHtml += '<option value="' + colleges[index] + '">' + colleges[index] + '</option>';
    }

    selectHtml += '<option value="">NEW COLLEGE</option>';

    document.querySelector('#college').innerHTML = selectHtml;
}

function activateInputs() {
    if (document.querySelector('#department').value == "")
    {
        document.querySelector('#new-department').disabled = false;
    }
    else
    {
        document.querySelector('#new-department').value = "";
        document.querySelector('#new-department').disabled = true;
    }
    if (document.querySelector('#college').value == "")
    {
        document.querySelector('#new-college').disabled = false;
    }
    else
    {
        document.querySelector('#new-college').value = "";
        document.querySelector('#new-college').disabled = true;
    }
}
