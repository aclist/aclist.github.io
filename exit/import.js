//0.1.1
const modalHTML = `
<span id="close-button" style="float: right;font-size:15px; cursor:pointer">✖</span>
<br>
<h3>Import subscriptions</h3>
<p>Paste the output of the Export Tool into the field below.
<div id="pasteField">
    <input id="pasteBox" type="text"></input>
    <br>
    <button value="null" id="importButton">Import</button>
</div>
<div id="holder">
    <div>
        <p style="margin-bottom: 0rem">ORIGIN</p>
        <hr>
        <p>
            Instance: <span id="origin-instance"></span><br>
            Username: <span id="origin-user"></span><br>
            Subscriptions: <span id="origin-subs"></span>
        </p>
    </div>
    <div>
        <p style="margin-bottom: 0rem">DESTINATION</p>
        <hr>
        <p style="margin-bottom: 0rem">
            Instance: <span id="destination-instance"></span><br>
            Username: <span id="destination-user"></span>
        </p>
    </div>
</div>
    <br>
    <p style="margin-bottom: 0rem">STATUS</p>
    <hr>
<div>
    <p id="status-msg">Waiting for user input</p>
</div>
`

const modalCSS = `
background-color: gray;
width: 600px;
height: 700px;
marginLeft: 100px;
`;

const pass = []
const fail = []

function disableButton (bool) {
    const button = document.querySelector('#import-button')
    button.disabled = bool
}

function makeModal () {
    const migrationModal = document.createElement('dialog');
    migrationModal.id = 'exit-modal'
    migrationModal.innerHTML = modalHTML;
    migrationModal.style.cssText = modalCSS
    const holder = migrationModal.querySelector('#holder')
    const button = migrationModal.querySelector('#importButton')
    const paste = migrationModal.querySelector('#pasteBox')

    button.disabled = true
    paste.disabled = true

    holder.style.display = "none"
    paste.addEventListener('input', (e) =>{
        if (e.target.value != "") {
            button.disabled = false
        } else {
            button.disabled = true
        }
    });

    button.addEventListener('click', ()=>{
        const val = paste.value
        try {
            const json = JSON.parse(val)
            migrationModal.querySelector('#pasteField').remove()
            setup(json);
        } catch (e) {
            console.error("JSON error:", e.message)
            updateTooltip("#status-msg", "ERROR: Error in pasted input")
        }
    })
    migrationModal.querySelector('#close-button').addEventListener('click', () =>{
        migrationModal.remove();
    })

    const outer = document.body.firstElementChild
    outer.appendChild(migrationModal)
    migrationModal.showModal();

    const destination_instance = window.location.hostname;
    const keyw = document.querySelector('meta[name="keywords"]')

    if (!keyw) {
        invalidInstance()
        return
    }
    const instance = keyw.content.split(',')[0]
    if ((instance != 'kbin') && (instance != 'mbin')) {
        invalidInstance()
        return
    }
    const destination_user = document.querySelector('.login');
    const destination_username = destination_user.href.split('/')[4];

    if (!destination_username) {
        updateTooltip('#destination-instance', destination_instance)
        updateTooltip('#destination-user', "not found")
        updateTooltip('#status-msg', "ERROR: Must be logged in")
        return
    }
    paste.disabled = false

}
function setup (json) {
    const origin_instance = json.origin_instance
    const origin_username = json.origin_username
    const destination_instance = window.location.hostname;
    const destination_user = document.querySelector('.login');
    const destination_username = destination_user.href.split('/')[4];
    const arr = json.origin_subs

    updateTooltip('#origin-instance', origin_instance)
    updateTooltip('#origin-user', origin_username)
    updateTooltip('#origin-subs', arr.length)
    updateTooltip('#destination-instance', destination_instance)
    updateTooltip('#destination-user', destination_username)

    document.querySelector('#exit-modal #holder').style.display = ""

    getMagToken(origin_instance, destination_instance, destination_username, arr);
}
function addExitButton (page) {
    const modal = document.querySelector('#exit-modal')
    const closeButton = document.createElement('button')
    closeButton.innerText = 'Click to exit and view subs'
    closeButton.addEventListener('click', () => {
        modal.remove();
        if (page === 'subs') {
            const user = document.querySelector('.login');
            const username = user.href.split('/')[4];
            window.location = `/u/${username}/subscriptions`
        } else {
            window.location.reload();
        }
    })
    modal.appendChild(closeButton)
}
async function getMagToken (origin, host, destination_username, arr) {
    let to_import
    updateTooltip('#status-msg', "Starting subscription process...")
    for (let i = 0; i < arr.length; ++i) {
        let split = arr[i].split('@')
        if ((!split[1]) && (origin != host)) {
            to_import = `${arr[i]}@${origin}`
        } else if (split[1] == host) {
            to_import = split[0]
        } else {
            to_import = arr[i]
        }
        // <sub> from instance1 to instance1 -> <sub>
        // <sub> from instance1 to instance2 -> <sub@instance1>
        // <sub@instance2> from instance1 to instance2 -> <sub>
        // <sub@instance3> from instance1 to instance2 -> <sub@instance3>
        //n.b. some mags may be unfederated/disabled at the destination

        const resp = await fetch(`https://${host}/m/${to_import}`, {
            "credentials": "include",
            "method": "GET",
            "mode": "cors"
        });
        switch (await resp.status) {
        case 200:
            const respText = await resp.text()
            const parser = new DOMParser();
            const XML = parser.parseFromString(respText, "text/html");
            const form = XML.querySelector('[name="magazine_subscribe"]')
            if (form) {
                const token = form.querySelector('input').value
                subscribeToMag(host, to_import, token, (i+1), arr.length)
            }
            break
        default:
            updateTooltip('#status-msg', `Failed to fetch the page '${to_import}'`)
            break
        }
    }
}

function toggleLog () {
    const resultsHTML = `
    <br>
    <p style="margin-bottom: 0rem">PASS (successfully subscribed)</p>
    <hr>
    <div id="pass">
    </div>
    <br>
    <p style="margin-bottom: 0rem">FAIL (nonexistent/unfederated magazine or communication error)</p>
    <hr>
    <div id="fail">
    </div>
    `
    if (document.querySelector('#exit-results-log')) {
        document.querySelector('#exit-results-log').remove();
    } else {
        const results = document.createElement('div')
        results.id = 'exit-results-log'
        results.innerHTML = resultsHTML
        results.querySelector('#pass').innerText = pass.join('\n')
        results.querySelector('#fail').innerText = fail.join('\n')
        document.querySelector('#exit-modal').appendChild(results)
        results.scrollIntoView();
    }
}
function addLogButton () {
    const button = document.createElement('button')
    const hr = document.createElement('hr')
    button.id = 'exit-log-button'
    button.innerText = 'Show/hide log'
    document.querySelector('#exit-modal').appendChild(hr)
    document.querySelector('#exit-modal').appendChild(button)
    button.scrollIntoView();
    button.addEventListener('click', () => {
        toggleLog();
    })
}
async function subscribeToMag (host, mag, token, iter, total) {
    let msg
    const suffix = `'${mag}' (${iter}/${total})`
    const pass_msg = 'Subscribed to ' + suffix
    const fail_msg = 'Failed to subscribe to ' + suffix

    try {
        const resp = await fetch(`https://${host}/m/${mag}/subscribe`, {
            signal: AbortSignal.timeout(8000),
            "credentials": "include",
            "headers": {
                "Content-Type": "multipart/form-data; boundary=---------------------------11111111111111111111111111111"
            },
            "body": `-----------------------------11111111111111111111111111111\r\nContent-Disposition: form-data; name="token"\r\n\r\n${token}\r\n-----------------------------11111111111111111111111111111--\r\n`,
            "method": "POST",
            "mode": "cors"
        });
        switch (await resp.status) {
        case 200:
            msg = pass_msg
            pass.push(mag)
            break
        default:
            msg = fail_msg
            fail.push(mag)
            break
        }
    } catch (e) {
        console.log(e)
        msg = fail_msg
        fail.push(mag)
    }

    if (iter === total) {
        updateTooltip('#status-msg', `Subscription process complete.`)
        addExitButton('subs');
        addLogButton();
    } else {
        updateTooltip('#status-msg', msg)
    }
}
function updateTooltip (id, msg) {
    const modal = document.querySelector('#exit-modal');
    modal.querySelector(id).innerText = msg
}
function invalidInstance () {
    updateTooltip('#status-msg', "ERROR: is this a valid kbin/mbin instance?");
    updateTooltip('#destination-instance', "invalid");
    updateTooltip('#destination-user', "not found");
    disableButton(true);
}

makeModal();
