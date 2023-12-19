document.addEventListener('DOMContentLoaded', function () {
    const header = document.getElementById('toggle');
    const headerText = header.querySelector('h1');

    header.addEventListener('click', function () {
        if (header.classList.contains('on')) {
            header.classList.remove('on');
            header.classList.add('off');
            headerText.textContent = 'Deactivated';
        } else {
            header.classList.remove('off');
            header.classList.add('on');
            headerText.textContent = 'Activated';
        }
    });
});

