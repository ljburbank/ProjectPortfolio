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

            tableHead = document.querySelector('#table-head');
            tableHead.innerHTML = '<th>Name</th><th>Email</th><th>Visibility</th><th>Link to Profile</th>'
        }
    }
    else
    {
        window.location.href = '/egrcn/signIn.html';
    }

    document.querySelector('#search-term').addEventListener("keyup", event => {
        if (event.key !== 'Enter') return;
        buttonClick();
        event.preventDefault();
    });
});

function buttonClick() {
    const searchField = document.querySelector('#search-term');
    searchTerm = searchField.value;

    searchField.value = "";

    fetch(url + '/getAllUsers')
    .then(response => response.json())
    .then(data => filterSearch(data['data']['recordset'], searchTerm));
}

function filterSearch(userList, searchTerm) {
    filteredUsers = [];
    for (index = 0; index < userList.length; index++) {
        if (userList[index]['visibility'] == 'PRIVATE' && sessionStorage.getItem('type') != 'Admin') {
            continue;
        }
        userFullName = userList[index]['first_name'] + " " + userList[index]['last_name'];
        if (userFullName.toLowerCase().includes(searchTerm.toLowerCase())) {
            filteredUsers.push(userList[index]);
        }
    }

    const table = document.querySelector('table tbody');

    if (filteredUsers.length === 0) {
        table.innerHTML = '<tr><td class="no-data" colspan="5">No Public Users Found</td></tr>';
        return;
    }

    let tableHtml = '';

    if (sessionStorage.getItem('type') == 'Admin')
    {
        filteredUsers.forEach(function ({first_name, last_name, email, visibility, id}) {
            tableHtml += '<tr>';
            tableHtml += '<td>' + first_name + ' ' + last_name + '</td>';
            tableHtml += '<td>' + email + '</td>';
            tableHtml += '<td>' + visibility + '</td>';
            tableHtml += '<td><button onclick=loadUser(' + id + ')>Go to Page</button></td>';
            tableHtml += '</tr>';
        });
    }
    else
    {
        filteredUsers.forEach(function ({first_name, last_name, email, id}) {
            tableHtml += '<tr>';
            tableHtml += '<td>' + first_name + ' ' + last_name + '</td>';
            tableHtml += '<td>' + email + '</td>';
            tableHtml += '<td><button onclick=loadUser(' + id + ')>Go to Page</button></td>';
            tableHtml += '</tr>';
        });
    }

    table.innerHTML = tableHtml;
};

function loadUser(id) {
    sessionStorage.setItem('searchedUser', id);
    window.location.href = 'searchedProfile.html';
}
