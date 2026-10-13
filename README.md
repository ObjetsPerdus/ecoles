# Objets Perdus

Tableau d'objets perdus pour les écoles de **Mont-Tremblant, QC**, conçu pour les parents.

Un parent qui trouve un objet l'ajoute au tableau avec une description et, au besoin, jusqu'à 5 photos. Le propriétaire n'a qu'à parcourir le tableau (ou le filtrer par école) et à réclamer l'objet par courriel auprès de la personne qui l'a signalé.

> ⚠️ Le projet en est à ses débuts. Vos commentaires sont les bienvenus : utilisez la boîte à commentaires en bas de la page du site, ou envoyez un courriel à `skiwitholio@gmail.com`.

## Fonctionnalités

- Signaler un objet : nom, description, école, nom du parent, courriel de contact et photos facultatives (jusqu'à 5)
- Tableau en direct des objets signalés, avec galerie de photos défilante pour chaque objet
- Filtre par école (« Toutes les écoles » par défaut)
- Réclamation par courriel : le bouton **Réclamer cet objet** ouvre un message déjà rédigé, adressé au **courriel de contact indiqué sur l'annonce** (et non à l'école)
- Retrait de l'objet du tableau : après avoir cliqué sur « Réclamer », le site propose de retirer l'objet ; si on accepte, l'annonce est fermée
- Boîte à commentaires (envoyée par courriel avec [EmailJS](https://www.emailjs.com/))

# Pour développeurs

## Comment ça fonctionne

Le site est entièrement statique (HTML, CSS, JavaScript, sans framework) et utilise GitHub comme « base de données ». Les opérations d'écriture (créer une annonce, téléverser une photo, fermer une annonce) passent par un petit **proxy Cloudflare Worker**, de sorte qu'aucun jeton GitHub n'est exposé dans le code du site. La lecture se fait directement avec l'API publique de GitHub.

| Élément | Stockage |
|---|---|
| Un objet perdu | Une *issue* GitHub ouverte de ce dépôt (le titre = le nom de l'objet) |
| Détails (signalé par, contact, lieu, images) | Dans le corps de l'issue, après un séparateur `---` |
| Photos | Fichiers committés dans ce dépôt par le proxy, servis depuis `raw.githubusercontent.com` |
| Objet réclamé / retiré | Issue fermée (n'apparaît plus sur le tableau) |

### Format d'une issue

```
Description de l'objet

---
**Signalé par :** Jeanne Martin
**Contact :** jeanne.martin@email.com
**Lieu :** Tournesol
**Image:** https://raw.githubusercontent.com/ObjetsPerdus/ecoles/...
**Image:** https://raw.githubusercontent.com/ObjetsPerdus/ecoles/...
```

- Seules les issues ouvertes dont le corps contient `---` sont affichées (les pull requests sont ignorées).
- Une ligne `**Image:**` par photo. Seules les URL commençant par `https://raw.githubusercontent.com/ObjetsPerdus/ecoles/` sont acceptées ; sinon, une image de remplacement s'affiche.
- Le tableau charge au maximum les **100** issues ouvertes les plus récentes (`per_page=100`).

### Le proxy (Cloudflare Worker)

L'adresse du proxy est la constante `API` au début de `script.js`. Le site utilise ces trois points d'accès (tous en `POST`, corps JSON) :

| Point d'accès | Corps envoyé | Réponse attendue |
|---|---|---|
| `/images` | `{ content: <JPEG en base64> }` | `{ url: <URL publique de l'image> }` |
| `/issues` | `{ title, body }` | Succès (`2xx`) si l'issue est créée |
| `/close` | `{ number }` | Succès (`2xx`) si l'issue est fermée |

> Le code du Worker n'est pas dans ce dépôt. Il doit autoriser (CORS) l'origine où le site est hébergé, y compris `http://localhost:8000` pour le développement local.

### Photos

Avant l'envoi, chaque photo est réduite dans le navigateur (côté le plus long : 800 px max., JPEG à qualité 0,8) puis téléversée une à une via `/images`. Un maximum de 5 photos est conservé par annonce.

### Réclamer un objet

1. Le site construit un lien `mailto:` vers le courriel de contact de l'annonce, avec un message pré-rempli (objet, école, nom du parent, lien vers l'annonce).
2. Le bouton n'apparaît que si le champ **Contact** de l'annonce est une adresse courriel valide (le formulaire n'accepte d'ailleurs que des courriels).
3. Environ une seconde après le clic, une boîte de dialogue demande s'il faut retirer l'objet du site ; si oui, le site appelle `/close` et rafraîchit le tableau.

### Commentaires

`email.js` exporte `sendFeedback()`, qui envoie le contenu de la boîte à commentaires avec EmailJS (bibliothèque chargée depuis le CDN jsDelivr dans `index.html`). Les identifiants de service et de modèle EmailJS se trouvent dans `email.js`, et la clé publique dans `index.html`.

## Structure du projet

```
├── index.html   # Page principale (formulaire, tableau, filtre, commentaires)
├── styles.css   # Styles
├── script.js    # Tableau, formulaire, images, filtre, réclamation et retrait
└── email.js     # Envoi des commentaires via EmailJS
```

## Ajouter ou modifier une école

Les écoles sont définies dans l'objet `LOCATIONS` au début de `script.js` :

```js
const LOCATIONS = {
    'Fleur soleil':  'fleursoleil@example.com',
    'Ribambelle':    'ribambelle@example.com',
    'Trois saisons': 'troissaisons@example.com',
    'Tournesol':     'tournesol@example.com',
    'Odyssee':       'odyssee@example.com'
};
```

- Seules les **clés** (les noms d'écoles) sont utilisées : elles alimentent la liste déroulante du formulaire, le filtre du tableau et l'étiquette affichée sur chaque carte.
- Les **valeurs** (courriels) ne servent plus aux réclamations, qui sont envoyées au contact indiqué dans chaque annonce. Elles peuvent rester des exemples.
- Le nom d'une école est enregistré tel quel dans l'annonce (`**Lieu :**`) ; renommer une école fait donc perdre l'étiquette et le filtre pour les anciennes annonces.

## Lancer le projet en local

Les scripts utilisent des modules ES (`type="module"`), donc `index.html` ne fonctionne pas en l'ouvrant directement (`file://`). Servez le dossier avec un petit serveur local :

```bash
python3 -m http.server 8000
```

Puis ouvrez <http://localhost:8000>.

## Contribuer

Les suggestions et corrections sont les bienvenues :

1. Envoyez un courriel à `skiwitholio@gmail.com` pour proposer une idée ou signaler un bogue
2. Ou faites un *fork* et soumettez une *pull request*

## Technologies

- HTML / CSS / JavaScript (sans framework, modules ES)
- [API GitHub Issues](https://docs.github.com/fr/rest/issues) (lecture directe) et [API Contents](https://docs.github.com/fr/rest/repos/contents) (via le proxy)
- [Cloudflare Workers](https://workers.cloudflare.com/) (proxy d'écriture)
- [EmailJS](https://www.emailjs.com/) (commentaires)
