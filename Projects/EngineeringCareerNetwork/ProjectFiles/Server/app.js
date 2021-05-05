const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
var sql = require('mssql');
const bcrypt = require('bcrypt');

dotenv.config();

const port = 9007;

var config = {
    user: process.env.USER,
    password: process.env.PASSWORD,
    server: process.env.HOST,
    database: process.env.DATABASE
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended : false }));

app.use('/static', express.static(path.join(__dirname, '/public')));

// ============================================================================
// ========================= START PAGE RESPONSES =============================
// ============================================================================
app.get('/', (request, response) => {
    response.sendFile(path.join(__dirname, 'html/signIn.html'));
});

app.get('/adminTools.html', (request, response) => {
    response.sendFile(path.join(__dirname, 'html/adminTools.html'));
});

app.get('/dashboard.html', (request, response) => {
    response.sendFile(path.join(__dirname, 'html/dashboard.html'));
});

app.get('/programTools.html', (request, response) => {
    response.sendFile(path.join(__dirname, 'html/programTools.html'));
});

app.get('/register.html', (request, response) => {
    response.sendFile(path.join(__dirname, 'html/register.html'));
});

app.get('/searchedProfile.html', (request, response) => {
    response.sendFile(path.join(__dirname, 'html/searchedProfile.html'));
});

app.get('/signIn.html', (request, response) => {
    response.sendFile(path.join(__dirname, 'html/signIn.html'));
});

app.get('/userProfile.html', (request, response) => {
    response.sendFile(path.join(__dirname, 'html/userProfile.html'));
});

app.get('/userSearch.html', (request, response) => {
    response.sendFile(path.join(__dirname, 'html/userSearch.html'));
});

// ============================================================================
// ========================= START USER READ METHODS ==========================
// ============================================================================
app.get('/getAllUsers', (request, response) => {
    sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        var queryString = "SELECT * FROM user_table WHERE type != 'Admin'";

        request.query(queryString, function (err, recordSet) {
            if (err) console.log(err);
            response.json({data: recordSet});
        });
    });
});

app.get('/getUserById/:id', (request, response) => {
    const { id } = request.params;

    sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        var queryString = "SELECT * FROM user_table WHERE id = '" + id + "'";

        request.query(queryString, function (err, recordSet) {
            if (err) console.log(err);
            response.json({data: recordSet});
        });
    });
});

app.post('/signUserIn/', (request, response) => {
    const { email, pass } = request.body;

    sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        var queryString = "SELECT * FROM user_table WHERE email = '" + email + "'"; 
    
        request.query(queryString, function (err, result) {
            if (err) console.log(err);
            if (result['recordset'].length == 0)
            {
                response.json({data: false});
            }
            else
            {
                bcrypt.compare(pass, result['recordset'][0]['password'], (err, res) => {
                    if (res)
                    {
                        response.json({data: result});
                    }
                    else
                    {
                        response.json({data: false});
                    }
                });
            }
        });
    });
});

app.get('/getUsersByCollege/:college', (request, response) => {
    const { college } = request.params;

    sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        var queryString = "SELECT * FROM user_table WHERE college = '" + college + "' AND type != 'Admin'";

        request.query(queryString, function (err, recordSet) {
            if (err) console.log(err);
            response.json({data: recordSet});
        });
    });
});

app.get('/getUsersByDepartment/:department', (request, response) => {
    const { department } = request.params;

    sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        var queryString = "SELECT * FROM user_table WHERE department = '" + department + "' AND type != 'Admin'";

        request.query(queryString, function (err, recordSet) {
            if (err) console.log(err);
            response.json({data: recordSet});
        });
    });
});

app.get('/getUsersByProgram/:program', (request, response) => {
    const { program } = request.params;

    sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        var queryString = "SELECT * FROM user_table WHERE program = '" + program + "' AND type != 'Admin'";

        request.query(queryString, function (err, recordSet) {
            if (err) console.log(err);
            response.json({data: recordSet});
        });
    });
});

// ============================================================================
// ========================= START GROUP READ METHODS =========================
// ============================================================================
app.get('/getColleges', (request, response) => {
    sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        var queryString = "SELECT DISTINCT college FROM program";

        request.query(queryString, function (err, recordSet) {
            if (err) console.log(err);
            response.json({data: recordSet});
        });
    });
});

app.get('/getDepartmentsByCollege/:college', (request, response) => {
    const { college } = request.params;

    sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        var queryString = "SELECT DISTINCT department FROM program WHERE college = '" + college + "'";

        request.query(queryString, function (err, recordSet) {
            if (err) console.log(err);
            response.json({data: recordSet});
        });
    });
});

app.get('/getProgramsByDepartment/:department', (request, response) => {
    const { department } = request.params;

    sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        var queryString = "SELECT program_name FROM program WHERE department = '" + department + "'";

        request.query(queryString, function (err, recordSet) {
            if (err) console.log(err);
            response.json({data: recordSet});
        });
    });
});

app.get('/getAllPrograms', (request, response) => {
    sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        var queryString = "SELECT * FROM program";

        request.query(queryString, function (err, recordSet) {
            if (err) console.log(err);
            response.json({data: recordSet});
        });
    });
});

app.post('/addProgram', (request, response) => {
    const { program, department, college } = request.body;

    sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        var queryString = "INSERT INTO program (program_name, department, college) VALUES ('" + program + "','" + department + "','" + college + "')";

        request.query(queryString, function (err, recordSet) {
            if (err) console.log(err);
            response.json({data: recordSet});
        });
    });
});

app.get('/deleteProgram/:id', (request, response) => {
    const { id } = request.params;

    sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        var queryString = "DELETE FROM program WHERE program_id = '" + id + "'";

        request.query(queryString, function (err, recordSet) {
            if (err) console.log(err);
            response.json({data: recordSet});
        });
    });
});

// ============================================================================
// ========================= START MILESTONE READ METHODS =====================
// ============================================================================
app.get('/getAllMilestones', (request, response) => {
    sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        var queryString = "SELECT * FROM milestone";

        request.query(queryString, function (err, recordSet) {
            if (err) console.log(err);
            response.json({data: recordSet});
        });
    });
});

app.get('/getMilestonesByUserId/:id', (request, response) => {
    const { id } = request.params;

    sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        var queryString = "SELECT * FROM milestone WHERE user_id = '" + id + "'";

        request.query(queryString, function (err, recordSet) {
            if (err) console.log(err);
            response.json({data: recordSet});
        });
    });
});

app.get('/getUnverifiedMilestones', (request, response) => {
    sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        var queryString = "SELECT * FROM milestone WHERE verified = 'FALSE'";

        request.query(queryString, function (err, recordSet) {
            if (err) console.log(err);
            response.json({data: recordSet});
        });
    });
});



// ============================================================================
// ========================= START USER WRITE METHODS =========================
// ============================================================================
app.post('/insertUser', (request, response) => {
    const { email, pass, first, last, college, department, program } = request.body;

    const saltRounds = 10;

    bcrypt.hash(pass, saltRounds, (err, hash) => {
        if (err)
        {
            console.error(err);
            return;
        }

        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();
            var queryString = ("INSERT INTO user_table (email, password, first_name, last_name, college, department, program) VALUES ('" 
                              + email + "','" + hash + "','" + first + "','" + last + "','"
                              + college + "','" + department + "','" + program + "')");
    
            request.query(queryString, function (err, result) {
                if (err) console.log(err);
                response.json({data: result});
            });
        });
    })
});

app.get('/setUserPublic/:id', (request, response) => {
    const { id } = request.params;

    sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        var queryString = "UPDATE user_table SET visibility = 'PUBLIC' WHERE id = '" + id + "'";

        request.query(queryString, function (err, recordSet) {
            if (err) console.log(err);
            response.json({data: recordSet});
        });
    });
});

app.get('/setUserPrivate/:id', (request, response) => {
    const { id } = request.params;

    sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        var queryString = "UPDATE user_table SET visibility = 'PRIVATE' WHERE id = '" + id + "'";

        request.query(queryString, function (err, recordSet) {
            if (err) console.log(err);
            response.json({data: recordSet});
        });
    });
});

app.post('/setUserUrl', (request, response) => {
    const { user_id, inputUrl } = request.body;

    sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        var queryString = "UPDATE user_table SET linkedin_url = '" + inputUrl + "' WHERE id = '" + user_id + "'";

        request.query(queryString, function (err, recordSet) {
            if (err) console.log(err);
            response.json({data: recordSet});
        });
    });
});

app.get('/setAdmin/:id', (request, response) => {
    const { id } = request.params;

    sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        var queryString = "UPDATE user_table SET type = 'Admin' WHERE id = '" + id + "'";

        request.query(queryString, function (err, recordSet) {
            if (err) console.log(err);
            response.json({data: recordSet});
        });
    });
});

app.get('/setAlumni/:id', (request, response) => {
    const { id } = request.params;

    sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        var queryString = "UPDATE user_table SET type = 'Alumni' WHERE id = '" + id + "'";

        request.query(queryString, function (err, recordSet) {
            if (err) console.log(err);
            response.json({data: recordSet});
        });
    });
});

// ============================================================================
// ========================= START MILESTONE WRITE METHODS ====================
// ============================================================================
app.post('/insertMilestone', (request, response) => {
    const { company, type, user_id, visibility } = request.body;

    sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        var queryString = "INSERT INTO milestone (company, type, user_id, visibility) VALUES ('" + company + "','" + type + "','" + user_id + "','" + visibility + "')";

        request.query(queryString, function (err, recordSet) {
            if (err) console.log(err);
            response.json({data: recordSet});
        });
    });
});

app.get('/deleteMilestone/:id', (request, response) => {
    const { id } = request.params;

    sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        var queryString = "DELETE FROM milestone WHERE milestone_id = '" + id + "'";

        request.query(queryString, function (err, recordSet) {
            if (err) console.log(err);
            response.json({data: recordSet});
        });
    });
});

/* NEVER CALLED

app.get('/setMilestonePublic/:id', (request, response) => {
    const { id } = request.params;

    sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        var queryString = "UPDATE milestone SET visibility = 'PUBLIC' WHERE milestone_id = '" + id + "'";

        request.query(queryString, function (err, recordSet) {
            if (err) console.log(err);
            response.json({data: recordSet});
        });
    });
});

app.get('/setMilestonePrivate/:id', (request, response) => {
    const { id } = request.params;

    sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        var queryString = "UPDATE milestone SET visibility = 'PRIVATE' WHERE milestone_id = '" + id + "'";

        request.query(queryString, function (err, recordSet) {
            if (err) console.log(err);
            response.json({data: recordSet});
        });
    });
});

*/

app.patch('/updateMilestone', (request, response) => {
    const { id, company, type, vis } = request.body;

    sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        var queryString = "UPDATE milestone SET company = '" + company + "', type = '" + type + "', visibility = '" + vis + "' WHERE milestone_id = '" + id + "'";

        request.query(queryString, function (err, recordSet) {
            if (err) console.log(err);
            response.json({data: recordSet});
        });
    });
});

app.patch('/updateAdmin', (request, response) => {
    const { id, company, type } = request.body;

    sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        var queryString = "UPDATE milestone SET company = '" + company + "', type = '" + type + "' WHERE milestone_id = '" + id + "'";

        request.query(queryString, function (err, recordSet) {
            if (err) console.log(err);
            response.json({data: recordSet});
        });
    });
});

app.get('/verifyMilestone/:id', (request, response) => {
    const { id } = request.params;

    sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        var queryString = "UPDATE milestone SET verified = 'TRUE' WHERE milestone_id = '" + id + "'";

        request.query(queryString, function (err, recordSet) {
            if (err) console.log(err);
            response.json({data: recordSet});
        });
    });
});

// ============================================================================
// ========================= START LINKEDIN METHODS ===========================
// ============================================================================
app.post('/getLinkedInData/', async (request, response) => {
    const { inputUrl } = request.body;
    if (!inputUrl) {
        response.status(400).send("Bad request: url param is missing!");
        return;
    }

    try {
        const html = await getPageHTML(inputUrl);
        response.json({pageHTML: html})
    } catch (error) {
        console.log(error);
        response.status(500).send(error);
    }
});

async function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

async function getPageHTML(pageUrl)
{
    const myUsername = 'ecbnau2021@gmail.com';              // LinkedIn Email
    const myPassword = 'Engineering_CB2021';              // LinkedIn Password
    const browser = await puppeteer.launch({args: ['--no-sandbox']});
    const page = await browser.newPage();
    await page.goto(pageUrl, {waitUntil: 'networkidle2'});

    // when it asks to sign in immediately
    try
    {
        await page.$eval('.form-toggle', e => e.click());
        await page.$eval('#login-email', (e, email) => {e.value = email}, myUsername);
        await page.$eval('#login-password', (e, pass) => {e.value = pass}, myPassword);
        await page.$eval('#login-submit', e => e.click( {waitUntil: 'networkidle0'}));

        await timeout(3000);

        // when it asks if you want to stay signed in
        try
        {
            await page.$eval('.btn__secondary--large-muted', e => e.click( {waitUntil: 'networkidle0'}));

            await timeout(3000);
        }
        catch (notAsking) {}
    }
    catch(pageNotThere) {}

    // when it goes to the page successfully
    try
    {
        await page.$eval('.cta-modal__primary-btn', e => e.click());
        await page.$eval('#username', (e, email) => {e.value = email}, myUsername);
        await page.$eval('#password', (e, pass) => {e.value = pass}, myPassword);
        await page.$eval('.btn__primary--large', e => e.click( {waitUntil: 'networkidle0'}));

        await timeout(3000);
    }
    catch(pageNotThere) {}

    await autoScroll(page);

    const pageHTML = await page.evaluate('new XMLSerializer().serializeToString(document.doctype) + document.documentElement.outerHTML');
    await browser.close();
    return pageHTML;
}


app.listen(port, () => console.log('App is running!'));
