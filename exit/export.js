const modalHTML = `
<span id="close-button" style="float: right;font-size:15px; cursor:pointer">✖</span>
<br>
<h3>Export subscriptions</h3>
<div id="holder">
    <div>
        <p style="margin-bottom: 0rem">ORIGIN</p>
        <hr>
        <p>
            Instance: <span id="origin-instance"></span><br>
            Username: <span id="origin-user"></span><br>
        </p>
    </div>
</div>
<div>
<button id="export-button">Export subscriptions</button>
</div>
<div>
    <br>
    <p style="margin-bottom: 0rem">STATUS</p>
    <hr>
</div>
<div>
    <p id="status-msg"></p>
</div>
`;

const modalCSS = `
background-color: gray;
width: 500px;
height: 500px;
marginLeft: 100px;
`;

function setupModal () {
    const migrationModal = document.createElement('dialog');
    migrationModal.id = 'exit-modal';
    migrationModal.innerHTML = modalHTML;
    migrationModal.style.cssText = modalCSS;
    migrationModal.querySelector('#close-button').addEventListener('click', () =>{
        migrationModal.remove();
    })
    const outer = document.body.firstElementChild
    outer.appendChild(migrationModal);
    migrationModal.showModal();
    init();
}
const subs_arr = []

function addExitButton () {
    const modal = document.querySelector('#exit-modal')
    const closeButton = document.createElement('button')
    closeButton.innerText = 'Click to exit'
    closeButton.addEventListener('click', () => {
        modal.remove();
        window.location.reload();
    })
    modal.appendChild(closeButton)
}
async function fetchSubs (host, username, page) {

    updateTooltip('#status-msg', `Fetching subscriptions page ${page}...`)
    try {
        const resp = await fetch (`https://${host}/u/${username}/subscriptions?p=${page}`, {
            signal: AbortSignal.timeout(8000),
            "credentials": "include",
            "method": "GET",
            "mode": "cors"
        });
        const respText = await resp.text()
        const parser = new DOMParser();
        const XML = parser.parseFromString(respText, "text/html");
        const mags = XML.querySelector('#content .magazines')
        if (!mags) {
            updateTooltip('#status-msg', `ERROR: User '${username}' has no subscriptions`)
            return
        }
        const subs = mags.querySelectorAll('.stretched-link')
        subs.forEach((sub) => {
            subs_arr.push(sub.innerText)
        });
        const subCount = XML.querySelector('.options__main a[href$="/subscriptions"]').innerText
        const rawSubCount = subCount.split('(')[1].split(')')[0];
        const subInt = Number(rawSubCount);
        const totalPages = Math.ceil((subInt / 48))

        if (page < totalPages) {
            page++
            fetchSubs(host, username, page)
            return
        }

        const sorted = subs_arr.sort()

        const obj = {
            "origin_username": username,
            "origin_instance": host,
            "origin_subs": sorted
        }

        const j = JSON.stringify(obj)
        navigator.clipboard.writeText(j);

        updateTooltip('#status-msg', `Copied ${sorted.length} subscriptions to clipboard`)
        disableButton(true)
        addExitButton()
    } catch (e) {
        console.log(e)
        updateTooltip('#status-msg', `Failed to fetch subscriptions. Please try again`)
    }
}
function updateTooltip (id, msg) {
    const modal = document.querySelector('#exit-modal');
    modal.querySelector(id).innerText = msg
}
function invalidInstance () {
    updateTooltip('#status-msg', "ERROR: is this a valid kbin/mbin instance?")
    updateTooltip('#origin-instance', "invalid")
    updateTooltip('#origin-user', "not found")
    disableButton(true)
}
function init () {
    const host = window.location.hostname;
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

    const user = document.querySelector('.login');
    const username = user.href.split('/')[4];

    if (!username) {
        updateTooltip('#origin-instance', host)
        updateTooltip('#origin-user', "not found")
        updateTooltip('#status-msg', "ERROR: Must be logged in")
        disableButton(true)
        return
    }

    updateTooltip('#origin-instance', host)
    updateTooltip('#origin-user', username)
    updateTooltip('#status-msg', "Waiting for user input")
    disableButton(false)

    document.querySelector('#export-button').addEventListener('click', () =>{
        fetchSubs(host, username, 1)
    })
}
function disableButton (bool) {
    const button = document.querySelector('#export-button')
    button.disabled = bool
}

setupModal();
