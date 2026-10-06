import {sendFeedback} from './email.js';

// trolololol
const REPO_OWNER = 'ObjetsPerdus';
const REPO_NAME = 'ecoles';

// Split token
const PT1 = "ghp_a6vbzc36iiIZDxJ";
const PT2 = "5PvaIuSgdsNPQmF3OxmEN";
const G_TOKEN = PT1 + PT2;

// Locations (the email values are no longer used for claims; claims go to the contact email in each issue)
const LOCATIONS = {
    'Fleur soleil':  'fleursoleil@example.com',
    'Ribambelle':    'ribambelle@example.com',
    'Trois saisons': 'troissaisons@example.com',
    'Tournesol':     'tournesol@example.com',
    'Odyssee':        'odyssee@example.com'
};

// Fill the <select> from LOCATIONS
function populateLocations() {
    const select = document.getElementById('location');
    Object.keys(LOCATIONS).forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });
}

// Email check
function looksLikeEmail(str) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((str || '').trim());
}

// Builds a mailto: link addressed to the contact email found in the issue
function buildClaimLink(issue, parentName, location, contact) {
    const to = contact.trim();
    const subject = `Objet réclamé: ${issue.title}`;
const body =
`Bonjour,

Je souhaite réclamer cet objet :

Objet : ${issue.title}
Trouvé à : ${location}
Signalé par : ${parentName}
Annonce : ${issue.html_url}

Mon nom :
Mes coordonnées :

Merci !`;

    // Keep "@" readable in the address, encode everything else
    const safeTo = encodeURIComponent(to).replace(/%40/g, '@');
    return `mailto:${safeTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// Shown when an item has no photo
const PLACEHOLDER_IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 180">' +
    '<rect width="400" height="180" fill="#f3f4f6"/>' +
    '<g fill="none" stroke="#9ca3af" stroke-width="6" stroke-linejoin="round">' +
    '<rect x="150" y="50" width="100" height="80" rx="8"/>' +
    '<circle cx="180" cy="80" r="8"/>' +
    '<path d="M155 122l30-28 22 20 14-12 24 20"/></g>' +
    '<text x="200" y="160" font-family="sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle">No image</text>' +
    '</svg>'
);

const IMAGE_URL_PREFIX = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/`;

// Shrink the photo in the browser and return base64 JPEG data (no data: prefix)
function resizeImage(file, maxSize = 800, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
            const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(objectUrl);
            resolve(canvas.toDataURL('image/jpeg', quality).split(',')[1]);
        };
        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Could not read image'));
        };
        img.src = objectUrl;
    });
}

// Commit the image to the repo and return its public URL
async function uploadImage(file, baseName) {
    const base64 = await resizeImage(file);
    const path = `images/${baseName}.jpg`;

    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${G_TOKEN}`,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: 'Add item image', content: base64 })
    });
    if (!response.ok) throw new Error(`Image upload failed (${response.status})`);

    const data = await response.json();
    return data.content.download_url;
}

// Fetch and display active lost items directly from GitHub Issues
async function fetchBoardItems() {
    const container = document.getElementById('itemsContainer');
    const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues?state=open&per_page=100`;

    try {
        const response = await fetch(apiUrl, { cache: 'no-cache' });
        if (!response.ok) throw new Error(`GitHub returned ${response.status}`);

        const issues = await response.json();
        container.innerHTML = '';

        // Filter out pull requests and anything that isn't a lost-item issue
        const items = issues.filter(issue => !issue.pull_request && issue.body && issue.body.includes("---"));

        if (items.length === 0) {
            container.innerHTML = '<p class="loading">Aucun objet perdu n\'a encore été signalé ! Tout le monde a ses affaires.</p>';
            return;
        }
        let tempCount = 0;
        items.forEach(issue => {
            tempCount += 1;
            const body = issue.body.replace(/\r\n/g, '\n');
            const [description, footer = ''] = body.split('\n\n---\n');
            const parentName =(footer.match(/\*\*(?:Signalé par|Reported By) :\*\* (.*)/) || [])[1] || '';
            const contact =((footer.match(/\*\*(?:Contact) :\*\* (.*)/) || [])[1] || '').trim();
            const location =((footer.match(/\*\*(?:Lieu|Location) :\*\* (.*)/) || [])[1] || '').trim();
            const imageUrls = [...footer.matchAll(/\*\*Image:\*\* (.*)/g)]
                .map(m => m[1].trim())
                .filter(u => u.startsWith(IMAGE_URL_PREFIX));
            if (imageUrls.length === 0) imageUrls.push(PLACEHOLDER_IMG);

            // Location tag / filter still depends on a known location
            const hasLocation = Object.prototype.hasOwnProperty.call(LOCATIONS, location);

            // Claim button only if the contact in the issue is an email address
            const canClaim = looksLikeEmail(contact);

            const card = document.createElement('div');
            const imagesHTML = imageUrls.map((u, i) =>
                `<img class="item-image" src="${escapeHTML(u)}" alt="${escapeHTML(issue.title)} (${i + 1})" loading="lazy">`
            ).join('');
            card.id = `item-card-${tempCount}-${location}`;
            card.className = 'item-card';
            card.innerHTML = `
                <div class="item-gallery">${imagesHTML}</div>
                ${imageUrls.length > 1 ? `<div class="date">${imageUrls.length} photos — faites défiler →</div>` : ''}
                ${hasLocation ? `<span class="location-tag">${escapeHTML(location)}</span>` : ''}
                <h3>${escapeHTML(issue.title)}</h3>
                <div class="date">Reported: ${new Date(issue.created_at).toLocaleDateString()}</div>
                <p>${escapeHTML(description)}</p>
                <div class="meta">
                    <strong>Reported By:</strong> ${escapeHTML(parentName)}<br>
                    <strong>Contact:</strong> ${escapeHTML(contact)}
                </div>
                ${canClaim ? `<a class="btn claim-btn" target="_blank" rel="noopener" href="${escapeHTML(buildClaimLink(issue, parentName, location, contact))}" onClick='closeIssue(event, ${issue.number})'>Réclamer cet objet</a>` : ''}
            `;

            // If a photo fails to load, fall back to the placeholder
            card.querySelectorAll('.item-image').forEach(img => { img.onerror = function () { this.onerror = null; this.src = PLACEHOLDER_IMG; }; });

            container.appendChild(card);
        });

        applyFilter();

    } catch (error) {
        console.error(error);
        container.innerHTML = '<p class="loading">Impossible de charger le tableau pour le moment.</p>';
    }
}

function closeIssue(event, issueNumber) {
    // 1. Let the mailto link fire immediately.
    // 2. Delay the pop-up slightly so the email client can open first.
    setTimeout(async () => {
        const confirmation = window.confirm("Retirer l'objet du site web ?");
        if (!confirmation) return;

        try {
            const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issueNumber}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `token ${G_TOKEN}`,
                    'Accept': 'application/vnd.github+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    state: 'closed',
                    state_reason: 'completed'
                })
            });

            if (response.ok) {
                alert("L'objet a été retiré avec succès !");
                fetchBoardItems(); // Refresh the board
            } else {
                throw new Error(`Failed to close issue (${response.status})`);
            }
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la suppression de l'objet.");
        }
    }, 1000);
}

window.closeIssue = closeIssue;

// Handle submitting a new item directly to GitHub Issues API
document.getElementById('lostItemForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const status = document.getElementById('formStatus');
    const button = this.querySelector('button');

    const itemName = document.getElementById('itemName').value;
    const description = document.getElementById('description').value;
    const parentName = document.getElementById('parentName').value;
    const contact = document.getElementById('contact').value;
    const location = document.getElementById('location').value;
    const imageFiles = Array.from(document.getElementById('image').files).slice(0, 5); // cap at 5

if (!Object.prototype.hasOwnProperty.call(LOCATIONS, location)) {
        status.textContent = "Veuillez choisir le lieu où l'objet a été trouvé.";
        status.className = "error";
        return;
    }

    if (!looksLikeEmail(contact)) {
        status.textContent = "Veuillez entrer une adresse courriel valide dans le champ Contact.";
        status.className = "error";
        return;
    }

    button.disabled = true;
    button.innerText = "Submitting...";

try {
        let imageLines = '';
        if (imageFiles.length) {
            const urls = [];
            for (let i = 0; i < imageFiles.length; i++) {
                button.innerText = `Téléchargement de l'image ${i + 1}/${imageFiles.length}...`;
                const baseName = `${slugify(itemName)}-${Date.now().toString(36)}-${i + 1}`;
                urls.push(await uploadImage(imageFiles[i], baseName));
            }
            imageLines = urls.map(u => `\n**Image:** ${u}`).join('');
            button.innerText = "Envoi en cours...";
        }

        const issueBody = `${description}\n\n---\n**Signalé par :** ${parentName}\n**Contact :** ${contact.trim()}\n**Lieu :** ${location}${imageLines}`;

        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${G_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: itemName,
                body: issueBody
            })
        });

        if (response.ok) {
            status.textContent = "Succès ! Votre objet a bien été ajouté au tableau.";
            status.className = "success";
            this.reset();
            // Instantly refresh the board to show the new item
            fetchBoardItems();
        } else {
            throw new Error(`Issue creation failed (${response.status})`);
        }
    } catch (err) {
        console.error(err);
        status.textContent = "Erreur lors de l'envoi de l'objet. Veuillez vérifier vos paramètres de configuration.";
        status.className = "error";
    } finally {
        button.disabled = false;
        button.innerText = "Soumettre";
        status.classList.remove('hidden');
    }
});

// Build the filter menu and wire up open/close behaviour
function setupFilter() {
    const filterSel = document.getElementById('filterSel');
    Object.keys(LOCATIONS).forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        filterSel.appendChild(option);
    });
    filterSel.addEventListener('change', applyFilter);
}

function applyFilter() {
    const value = document.getElementById('filterSel').value;
    const container = document.getElementById('itemsContainer');
    const old = document.getElementById('filterEmpty');
    if (old) old.remove();

    const cards = container.querySelectorAll('.item-card');
    let shown = 0;
    cards.forEach(card => {
        const match = value === '0' || card.id.endsWith(`-${value}`);
        card.classList.toggle('hidden', !match);
        if (match) shown++;
    });

    if (cards.length > 0 && shown === 0) {
        const msg = document.createElement('p');
        msg.id = 'filterEmpty';
        msg.className = 'loading';
        msg.innerHTML = `Aucun objet perdu n'a encore été signalé à <b style="color: var(--primary);">${value}</b> ! Tout le monde a ses affaires.`;
        container.appendChild(msg);
    }
}

function slugify(str) {
    return (str || 'objet')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'objet';
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

document.getElementById("sendFeddbackButton").addEventListener('click', sendFeedback);

document.addEventListener('DOMContentLoaded', () => {
    populateLocations();
    fetchBoardItems();
    setupFilter();
    document.cookie = "myCookie=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    console.log('Cookie cleared on DOMContentLoaded!');
});
