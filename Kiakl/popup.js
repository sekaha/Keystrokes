document.addEventListener('DOMContentLoaded', function () {
    const header = document.getElementById('toggle');
    const headerText = header.querySelector('h1');
    let activated = false;

    // Function to update the header state based on the 'activated' variable
    function updateHeaderState() {
        if (activated) {
            header.classList.remove('off');
            header.classList.add('on');
            headerText.textContent = 'Activated';
            chrome.action.setIcon({ path: 'activated.png' });
        } else {
            header.classList.remove('on');
            header.classList.add('off');
            headerText.textContent = 'Deactivated';
            chrome.action.setIcon({ path: 'deactivated.png' });
        }
    }

    chrome.storage.local.get({ activated: false }, (result) => {
        activated = result.activated;
        updateHeaderState(); // Update header state after retrieving the 'activated' value
    });

    header.addEventListener('click', function () {
        activated = !activated;
        chrome.storage.local.set({ activated }, () => {
            updateHeaderState(); // Update header state after toggling 'activated' and saving to storage
        });
    });
});