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

    loadColleges();

    fetch(url + '/getAllMilestones')
    .then(response => response.json())
    .then(data => loadUserData(data['data']['recordset'], "Milestone", "", "", "", "pie"));
});

// Reads the inputs from the user, then reads all milestones in the database and sends all to loadUserData
function buttonClick() {
    const type = document.querySelector('#graph-filters').value;

    const milestone = document.querySelector('#milestone-filters').value;
    
    const college = document.querySelector('#college').value;

    const department = document.querySelector('#department').value;

    const program = document.querySelector('#program').value;

    fetch(url + '/getAllMilestones')
    .then(response => response.json())
    .then(data => loadUserData(data['data']['recordset'], milestone, college, department, program, type));
}

// Reads the user rows from the database and sends all the obtained information to loadGraph
function loadUserData(milestoneData, milestone, college, department, program, type) {
    if (college == "") {
        fetch(url + '/getAllUsers')
        .then(response => response.json())
        .then(data => loadGraph(data['data']['recordset'], milestoneData, milestone, "NAU", type));
    }
    else if (department == "") {
        fetch(url + '/getUsersByCollege/' + college)
        .then(response => response.json())
        .then(data => loadGraph(data['data']['recordset'], milestoneData, milestone, college, type));
    }
    else if (program == "") {
        fetch(url + '/getUsersByDepartment/' + department)
        .then(response => response.json())
        .then(data => loadGraph(data['data']['recordset'], milestoneData, milestone, department, type));
    }
    else {
        fetch(url + '/getUsersByProgram/' + program)
        .then(response => response.json())
        .then(data => loadGraph(data['data']['recordset'], milestoneData, milestone, program, type));
    }
}

function loadGraph(groupData, milestoneData, milestone, group, type) {
    graphValues = filterData(groupData, milestoneData, milestone);

    if( graphValues[1] == 0) {
        graphContainer = document.querySelector('#graph-container');
        graphContainer.innerHTML = '<h3>No Students within that Group</h3>';
        return;
    }

    if (type == "pie") {
        generatePieGraph(graphValues[0], graphValues[1], milestone, group);
    }
    else if (type == "bar") {
        generateBarGraph(graphValues[0], graphValues[1], milestone, group);
    }
    else if (type == "pyramid") {
        generatePyramidGraph(graphValues[0], graphValues[1], milestone, group);
    }
}

// Takes in a user list and a milestone list, and returns [users]
function filterData(userList, milestoneList, milestone) {
    userIds = [];
    for (index = 0; index < userList.length; index++) {
        userIds.push(userList[index]['id']);
    }

    alreadyAdded = [];
    successfulUsers = 0;

    for (index = 0; index < milestoneList.length; index++) {
        currentUserId = milestoneList[index]['user_id'];
        if (milestone != "Milestone" && milestoneList[index]['type'] != milestone) {
            continue;
        }
        
        if (userIds.includes(currentUserId) && !alreadyAdded.includes(currentUserId)) {
            successfulUsers += 1;
            alreadyAdded.push(currentUserId);
        }
    }
    
    return [successfulUsers, userList.length];
}

function loadColleges() {
    fetch(url + '/getColleges')
    .then(response => response.json())
    .then(data => loadCollegesHelper(data['data']['recordset']));
}

function loadCollegesHelper(colleges) {
    colSelect = document.querySelector('#college');

    colHTML = '<option value="">No College</option>';

    colleges.forEach(function ({college}) {
        colHTML += '<option value="' + college +'">' + college + '</option>';
    });

    colSelect.innerHTML = colHTML;
}

function loadDepartments() {
    college = document.querySelector('#college').value;
    departmentSelect = document.querySelector('#department');

    if (college == '')
    {
        departmentSelect.innerHTML = '<option value="">No Department</option>';
        departmentSelect.disabled = true;
        programSelect.innerHTML = '<option value="">No Program</option>';
        programSelect.disabled = true;
    }
    else
    {
        fetch(url + '/getDepartmentsByCollege/' + college)
        .then(response => response.json())
        .then(data => loadDepartmentsHelper(data['data']['recordset']));
    }
}

function loadDepartmentsHelper(departments) {
    depSelect = document.querySelector('#department');

    depHTML = '<option value="">No Department</option>';

    departments.forEach(function ({department}) {
        depHTML += '<option value="' + department +'">' + department + '</option>';
    });

    depSelect.innerHTML = depHTML;
    depSelect.disabled = false;
}

function loadPrograms() {
    department = document.querySelector('#department').value;
    programSelect = document.querySelector('#program');

    if (department == '')
    {
        programSelect.innerHTML = '<option value="">No Program</option>';
        programSelect.disabled = true; 
    }
    else
    {
        fetch(url + '/getProgramsByDepartment/' + department)
        .then(response => response.json())
        .then(data => loadProgramsHelper(data['data']['recordset']));
    }
}

function loadProgramsHelper(programs) {
    progSelect = document.querySelector('#program');

    progHTML = '<option value="">No Program</option>';

    programs.forEach(function ({program_name}) {
        progHTML += '<option value="' + program_name +'">' + program_name + '</option>';
    });

    progSelect.innerHTML = progHTML;
    progSelect.disabled = false;
}

// BEGIN CHART GENERATION FUNCTIONS --> FUSIONCHARTS IS USED
function generatePieGraph(success, total, milestone, group)
{
    // Chart Data
    const charData = [
    {
        label: "Students with a(n) " + milestone,
        value: success
    },
    {
        label: "Students without a(n) " + milestone,
        value: total - success
    }];

    // Create a JSON object to store the chart configurations
    const dataSource = {
        chart: {
            caption: "Students within " + group + " with A(n) " + milestone,
            subcaption: "Total Students within " + group + ": " + total.toString(),
            showvalues: "1",
            showpercentintooltip: "0",
            enablemultislicing: "1",
            plottooltext:"There are <b>$dataValue</b> <b>$label</b>",
            theme: "fusion"
        },
        data: charData
    };


    FusionCharts.ready(function() {
        var myChart = new FusionCharts({
            type: "pie3d",
            renderAt: "graph-container",
            width: "90%",
            height: "85%",
            dataFormat: "json",
            dataSource
        }).render();
    });
}

function generateBarGraph(success, total, milestone, group)
{
    // Chart Data
    const charData = [
    {
        label: "Students with a(n) " + milestone,
        value: success
    },
    {
        label: "Students without a(n) " + milestone,
        value: total - success
    }];

    // Create a JSON object to store the chart configurations
    const dataSource = {
        chart: {
            caption: "Students within " + group + " with A(n) " + milestone,
            subcaption: "Total Students within " + group + ": " + total.toString(),
            yaxisname: "Population",
            decimals: "1",
            plottooltext:"There are <b>$dataValue</b> <b>$label</b>",
            theme: "fusion"
        },
        data: charData
    };

    FusionCharts.ready(function() {
        var myChart = new FusionCharts({
            type: "column3d",
            renderAt: "graph-container",
            width: "90%",
            height: "85%",
            dataFormat: "json",
            dataSource
        }).render();
    });
}

function generatePyramidGraph(success, total, milestone, group)
{
    // Chart Data
    const charData = [
    {
        label: "Students with a(n) " + milestone,
        value: success
    },
    {
        label: "Students without a(n) " + milestone,
        value: total - success
    }];

    // Create a JSON object to store the chart configurations
    const dataSource = {
        chart: {
            caption: "Students within " + group + " with A(n) " + milestone,
            subcaption: "Total Students within " + group + ": " + total.toString(),
            showvalues: "1",
            plottooltext:"There are <b>$dataValue</b> <b>$label</b>",
            is2d: "0",
            theme: "fusion"
        },
        data: charData
    }

    FusionCharts.ready(function() {
        var myChart = new FusionCharts({
            type: "pyramid",
            renderAt: "graph-container",
            width: "90%",
            height: "85%",
            dataFormat: "json",
            dataSource
        }).render();
    });
}
