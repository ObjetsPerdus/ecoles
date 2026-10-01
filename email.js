// service id: 'service_weg2feu'

export function sendFeedback() {
    document.getElementById("sendFeddbackButton").disabled = true;
    const name = 'Objets-Perdus Feedback';
    const title = `Objets Perdus (feedback)`;
    const message = document.getElementById("feedback").value.trim();

    if (!message) {
        alert("Veuillez rédiger un commentaire avant d'envoyer.");
        document.getElementById("sendFeddbackButton").disabled = false;
        return;
    }

    const templateParams = {
        name: name,
        title: title,
        message: message
    };

    emailjs.send("service_weg2feu", "template_b2j91g6", templateParams).then(
        (response) => {
            console.log("Feedback sent successfully!", response.status, response.text);
            alert("Merci pour vos commentaires !");
            document.getElementById("sendFeddbackButton").disabled = false;
            document.getElementById("feedback").value = '';
        })
        .catch(err => {
            console.error("Error sending feedback:", err);
            alert("Échec de l'envoi du commentaire. Réessayez plus tard.");
            document.getElementById("sendFeddbackButton").disabled = false;
        });
}
