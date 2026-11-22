
const container = document.querySelector('#intakes-container');
const searchInput = document.querySelector('#search-input');
const filterSelect = document.querySelector('#filter-select');
const message = document.querySelector('#dashboard-message');

let intakes = [];

async function api(url, options = {}) {
    const response = await fetch(url, {
        credentials: 'same-origin',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });

    const result = await response.json();

    if (response.status === 401) {
        window.location.href = '/admin/login.html';
        throw new Error('Session expired.');
    }

    if (!response.ok) {
        throw new Error(result.message || 'Request failed.');
    }

    return result;
}


function escapeHTML(value = '') {
    return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}


async function loadDashboard() {
    message.textContent = 'Loading dashboard...';

    try {
        const data = await api('/api/admin/dashboard');

        intakes = data.intakes || [];

        document.querySelector('#total-intakes').textContent =
            intakes.length;

        document.querySelector('#active-intakes').textContent =
            intakes.filter(intake => intake.active).length;

        document.querySelector('#pending-registrations').textContent =
            data.pendingRegistrations ?? 0;

        document.querySelector('#total-registrations').textContent =
            data.totalRegistrations ?? 0;

        renderIntakes();

        message.textContent = '';

    } catch (error) {
        message.textContent = error.message;
    }
}


function renderIntakes() {
    const search = searchInput.value.trim().toLowerCase();
    const filter = filterSelect.value;

    const filtered = intakes.filter(intake => {

        const matchesSearch =
            intake.name.toLowerCase().includes(search) ||
            intake.id.toLowerCase().includes(search);

        const matchesFilter =
            filter === 'all' ||
            (filter === 'active' && intake.active) ||
            (filter === 'inactive' && !intake.active) ||
            (filter === 'pending' && intake.registrationStatus === 'pending');

        return matchesSearch && matchesFilter;
    });

    if (!filtered.length) {
        container.innerHTML = '<p class="dashboard-message">No intakes found.</p>';
        return;
    }

    container.innerHTML = filtered.map(intake => `
        <article class="intake-card" data-id="${escapeHTML(intake.id)}">

            <div class="intake-header">
                <div>
                    <h3>${escapeHTML(intake.name)}</h3>
                    <p>${escapeHTML(intake.id)}</p>
                </div>

                <span class="status-label ${intake.active ? 'active' : 'inactive'}">
                    ${intake.active ? 'Active' : 'Inactive'}
                </span>
            </div>

            <div class="intake-details">

                <div class="detail">
                    <span>Registrations</span>
                    <strong>${intake.registrations ?? 0}</strong>
                </div>

                <div class="detail">
                    <span>Calendar events</span>
                    <strong>${intake.eventCount ?? '—'}</strong>
                </div>

                <div class="detail">
                    <span>Registration status</span>
                    <strong>${escapeHTML(intake.registrationStatus || 'None')}</strong>
                </div>

            </div>

            <div class="intake-actions">
                <button class="manage-button" data-action="manage">
                    Manage intake
                </button>

                ${
                    intake.registrationStatus === 'pending'
                    ? `<button data-action="verify">Verify registration</button>`
                    : ''
                }

                ${
                    intake.active
                    ? `<button data-action="deactivate">Deactivate</button>`
                    : `<button data-action="activate">Activate</button>`
                }
            </div>

            <div class="manage-panel" hidden>
                <form class="manage-form">

                    <label>
                        WhatsApp group name
                        <input
                            name="destination"
                            value="${escapeHTML(intake.destination || '')}"
                            placeholder="Exact WhatsApp group name"
                            required
                        >
                    </label>

                    <label>
                        WhatsApp invitation link
                        <input
                            name="groupLink"
                            type="url"
                            value="${escapeHTML(intake.groupLink || '')}"
                            placeholder="https://chat.whatsapp.com/..."
                        >
                    </label>

                    <button type="submit">Save changes</button>
                    <button type="button" data-action="cancel">Cancel</button>

                </form>
            </div>

        </article>
    `).join('');
}


container.addEventListener('click', async event => {
    const button = event.target.closest('button[data-action]');

    if (!button) return;

    const card = button.closest('.intake-card');
    const intake = intakes.find(item => item.id === card.dataset.id);

    if (!intake) return;

    const action = button.dataset.action;

    if (action === 'manage') {
        const panel = card.querySelector('.manage-panel');
        panel.hidden = !panel.hidden;
        return;
    }

    if (action === 'cancel') {
        card.querySelector('.manage-panel').hidden = true;
        return;
    }

    if (action === 'verify') {
        if (!confirm(`Verify the Canvas registration for ${intake.name}?`)) {
            return;
        }

        try {
            await api('/api/admin/intake/verify', {
                method: 'POST',
                body: JSON.stringify({ id: intake.id })
            });

            await loadDashboard();

            message.textContent = 'Registration verified successfully.';

        } catch (error) {
            message.textContent = error.message;
        }

        return;
    }

    if (action === 'activate' || action === 'deactivate') {
        const active = action === 'activate';

        if (active && (!intake.destination || !intake.groupLink)) {
            alert('Please configure the WhatsApp group name and invitation link first.');
            card.querySelector('.manage-panel').hidden = false;
            return;
        }

        if (active && intake.registrationStatus !== 'verified') {
            alert('This intake needs a verified Canvas registration before activation.');
            return;
        }

        if (!confirm(`${active ? 'Activate' : 'Deactivate'} ${intake.name}?`)) {
            return;
        }

        await saveIntake(intake.id, {
            active,
            destination: intake.destination,
            groupLink: intake.groupLink
        });

        return;
    }
});


container.addEventListener('submit', async event => {
    if (!event.target.matches('.manage-form')) return;

    event.preventDefault();

    const card = event.target.closest('.intake-card');
    const intake = intakes.find(item => item.id === card.dataset.id);
    const form = event.target;

    const destination = form.elements.destination.value.trim();
    const groupLink = form.elements.groupLink.value.trim();

    await saveIntake(intake.id, {
        active: intake.active,
        destination,
        groupLink
    });
});


async function saveIntake(id, changes) {
    message.textContent = 'Saving...';

    try {
        await api('/api/admin/intake/update', {
            method: 'POST',
            body: JSON.stringify({
                id,
                ...changes
            })
        });

        await loadDashboard();

        message.textContent = 'Changes saved successfully.';

    } catch (error) {
        message.textContent = error.message;
    }
}


searchInput.addEventListener('input', renderIntakes);
filterSelect.addEventListener('change', renderIntakes);

document.querySelector('#refresh-button').addEventListener('click', loadDashboard);

document.querySelector('#logout-button').addEventListener('click', async () => {
    try {
        await api('/api/admin/logout', {
            method: 'POST',
            body: JSON.stringify({})
        });
    } finally {
        window.location.href = '/admin/login.html';
    }
});


async function start() {
    try {
        const session = await api('/api/admin/session');

        if (!session.authenticated) {
            window.location.href = '/admin/login.html';
            return;
        }

        await loadDashboard();

    } catch (error) {
        message.textContent = error.message;
    }
}

start();

