# Objets Perdus

Tableau d'objets perdus pour les écoles de **Mont-Tremblant, QC**, conçu pour les parents.

Un parent qui trouve un objet l'ajoute au tableau avec une description et, au besoin, une photo. Le propriétaire n'a qu'à parcourir le tableau et à réclamer l'objet par courriel auprès de l'école concernée.

> ⚠️ Le projet en est à ses débuts. Vos commentaires sont les bienvenus : utilisez la boîte à commentaires en bas de la page du site, ou envoyez un courriel au `skiwitholio@gmail.com` sur ce dépôt.

## Fonctionnalités

- Signaler un objet (nom, description, école, coordonnées, photo facultative)
- Tableau en direct des objets signalés
- Réclamation par courriel : un bouton ouvre un message préécrit adressé à l'école
- Retrait d'un objet du tableau une fois réclamé
- Boîte à commentaires (envoyée par courriel avec [EmailJS](https://www.emailjs.com/))


# Pour Dévelopeurs:

## Comment ça fonctionne

Il n'y a **pas de serveur** : le site est entièrement statique (HTML, CSS, JavaScript) et utilise GitHub comme « base de données ».

| Élément | Stockage |
|---|---|
| Un objet perdu | Une *issue* GitHub de ce dépôt (le titre = le nom de l'objet) |
| Détails (signalé par, contact, lieu, image) | Dans le corps de l'issue, après un séparateur `---` |
| Photos | Fichiers committés dans le dossier `images/` |
| Objet réclamé | Issue fermée (n'apparaît plus sur le tableau) |


## Structure du projet

```
├── index.html   # Page principale
├── styles.css   # Styles
├── script.js    # Logique du tableau, formulaire, images, filtre
└── email.js     # Envoi des commentaires via EmailJS
```

## Ajouter ou modifier une école

Les écoles sont définies dans l'objet `LOCATIONS` au début de `script.js`. Chaque entrée associe le nom de l'école au courriel qui reçoit les réclamations :

```js
const LOCATIONS = {
    'Fleur soleil': 'fleursoleil@example.com',
    'Tournesol':    'tournesol@example.com',
    // ...
};
```

La liste déroulante du formulaire et le filtre du tableau sont générés automatiquement à partir de cet objet.

> Les adresses courriel actuelles sont des **exemples** à remplacer par les vraies adresses.

## Lancer le projet en local

Les scripts utilisent des modules ES (`type="module"`), donc `index.html` ne fonctionne pas en l'ouvrant directement (`file://`). Servez le dossier avec un petit serveur local :

```bash
python3 -m http.server 8000
```

Puis ouvrez <http://localhost:8000>.

## Contribuer

Les suggestions et corrections sont les bienvenues :

1. Envoyez un courriel au `skiwitholio@gmail.com` pour proposer une idée ou signaler un bogue
2. Ou faites un *fork* et soumettez une *pull request*

## Technologies

- HTML / CSS / JavaScript (sans framework)
- [API GitHub Issues](https://docs.github.com/fr/rest/issues) et [API Contents](https://docs.github.com/fr/rest/repos/contents)
- [EmailJS](https://www.emailjs.com/)