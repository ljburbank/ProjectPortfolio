const url = "https://ac.nau.edu/egrcn";

document.addEventListener('DOMContentLoaded', function () {
    if (sessionStorage.getItem('id') != null) {
        sessionStorage.removeItem('id');
        sessionStorage.removeItem('type');
    }

    document.querySelector('#email-input').addEventListener("keyup", event => {
        if (event.key !== 'Enter') return;
        buttonClick();
        event.preventDefault();
    });

    document.querySelector('#password-input').addEventListener("keyup", event => {
        if (event.key !== 'Enter') return;
        buttonClick();
        event.preventDefault();
    });
});

function buttonClick() {
    const emailInput = document.querySelector('#email-input');
    const email = emailInput.value;

    const passInput = document.querySelector('#password-input');
    const password = passInput.value;

    fetch(url + '/signUserIn/', {
        headers: {
            'Content-type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
            email : email,
            pass : password
        })
    })
    .then(response => response.json())
    .then(data => checkValid(data));
}

function checkValid( data ) {

    if (data['data'] != false)
    {
        successfulLogin( data['data']);
    }
    else
    {
        failedToLogin();
    }
}

function failedToLogin() {
    alert("Invalid Email or Password!");
}

function successfulLogin(record) {
    sessionStorage.setItem("id", record['recordset'][0]['id']);
    sessionStorage.setItem("type", record['recordset'][0]['type']);
    window.location.href = '/egrcn/dashboard.html';
}
