const url = "https://ac.nau.edu/egrcn";

document.addEventListener('DOMContentLoaded', function () {

    document.querySelector('#first').addEventListener("keyup", event => {
        if (event.key !== 'Enter') return;
        buttonClick();
        event.preventDefault();
    });

    document.querySelector('#last').addEventListener("keyup", event => {
        if (event.key !== 'Enter') return;
        buttonClick();
        event.preventDefault();
    });

    document.querySelector('#email').addEventListener("keyup", event => {
        if (event.key !== 'Enter') return;
        buttonClick();
        event.preventDefault();
    });

    document.querySelector('#pass').addEventListener("keyup", event => {
        if (event.key !== 'Enter') return;
        buttonClick();
        event.preventDefault();
    });

    document.querySelector('#pass-repeat').addEventListener("keyup", event => {
        if (event.key !== 'Enter') return;
        buttonClick();
        event.preventDefault();
    });

    loadColleges();
});

function buttonClick(){
    userEmail = document.querySelector('#email').value;
    userPass = document.querySelector('#pass').value;
    userPassRepeat = document.querySelector('#pass-repeat').value;
    userFirst = document.querySelector('#first').value;
    userLast = document.querySelector('#last').value;
    userCollege = document.querySelector('#college').value;
    userDepartment = document.querySelector('#department').value;
    userProgram = document.querySelector('#program').value;

    if (userEmail == "" || userPass == "" || userFirst == "" || userLast == "" || userProgram == "")
    {
        alert("You have not filled in every field.")
        return;
    }

    if (/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(userEmail)) {
        // nothing
    }
    else {    
        alert("You have entered an invalid email address!");
        return;
    }

    if(userPass != userPassRepeat) {
        alert("The passwords you entered do not match!");
        return;
    }

    fetch(url + '/insertUser', {
        headers: {
            'Content-type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
            email : userEmail,
            pass : userPass,
            first : userFirst,
            last : userLast,
            college: userCollege,
            department: userDepartment,
            program: userProgram
        })
    })
    .then(response => response.json())
    .then(data => checkRegister(data['data']));

}

function loadColleges() {
    fetch(url + '/getColleges')
    .then(response => response.json())
    .then(data => loadCollegesHelper(data['data']['recordset']));
}

function loadCollegesHelper(colleges) {
    colSelect = document.querySelector('#college');

    colHTML = '<option value="">No Selection</option>';

    colleges.forEach(function ({college}) {
        colHTML += '<option value="' + college +'">' + college + '</option>';
    })

    colSelect.innerHTML = colHTML;
}

function loadDepartments() {
    college = document.querySelector('#college').value;
    departmentSelect = document.querySelector('#department');

    if (college == '')
    {
        departmentSelect.innerHTML = '<option value="">No Selection</option>';
        departmentSelect.disabled = true;
        programSelect.innerHTML = '<option value="">No Selection</option>';
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

    depHTML = '<option value="">No Selection</option>';

    departments.forEach(function ({department}) {
        depHTML += '<option value="' + department +'">' + department + '</option>';
    })

    depSelect.innerHTML = depHTML;
    depSelect.disabled = false;
}

function loadPrograms() {
    department = document.querySelector('#department').value;
    programSelect = document.querySelector('#program');

    if (department == '')
    {
        programSelect.innerHTML = '<option value="">No Selection</option>';
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

    progHTML = '<option value="">No Selection</option>';

    programs.forEach(function ({program_name}) {
        progHTML += '<option value="' + program_name +'">' + program_name + '</option>';
    })

    progSelect.innerHTML = progHTML;
    progSelect.disabled = false;
}

function checkRegister(data) {
    if (data['rowsAffected'].length == 1)
    {
        window.location.href = 'signIn.html';
    }
    else
    {
        alert('Could not add to database.');
    }
}
