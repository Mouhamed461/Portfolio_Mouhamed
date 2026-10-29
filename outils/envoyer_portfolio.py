"""Envoie le portfolio sur le serveur du cégep (dev.timmatane.ca), comme FileZilla.

Usage : double-cliquer sur envoyer_portfolio.bat (dans le même dossier).
Le mot de passe FTP est demandé à chaque envoi et n'est jamais enregistré.
Seuls les fichiers modifiés depuis le dernier envoi sont transférés.
"""
import ftplib
import getpass
import json
import os
import sys

SERVEUR = "ftp.timmatane.ca"
IDENTIFIANT = "dioufm@dev.timmatane.ca"
DOSSIER_DISTANT = "/portfolio"

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ETAT = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".dernier_envoi.json")
EXCLUS = {".git", ".github", ".claude", "outils", "node_modules", "README.md", ".gitignore", ".gitattributes"}


def fichiers_a_envoyer():
    for dossier, sous_dossiers, fichiers in os.walk(RACINE):
        sous_dossiers[:] = [d for d in sous_dossiers if d not in EXCLUS]
        for nom in fichiers:
            if nom in EXCLUS:
                continue
            chemin = os.path.join(dossier, nom)
            yield os.path.relpath(chemin, RACINE).replace("\\", "/"), chemin


def creer_dossiers(ftp, chemin_relatif, deja_crees):
    parties = chemin_relatif.split("/")[:-1]
    courant = DOSSIER_DISTANT
    for partie in parties:
        courant = courant + "/" + partie
        if courant in deja_crees:
            continue
        try:
            ftp.mkd(courant)
        except ftplib.error_perm:
            pass
        deja_crees.add(courant)


def main():
    try:
        with open(ETAT, encoding="utf-8") as f:
            etat = json.load(f)
    except (OSError, ValueError):
        etat = {}

    a_envoyer = []
    for relatif, chemin in fichiers_a_envoyer():
        info = os.stat(chemin)
        signature = f"{info.st_size}-{int(info.st_mtime)}"
        if etat.get(relatif) != signature:
            a_envoyer.append((relatif, chemin, signature))

    if not a_envoyer:
        print("Rien de nouveau à envoyer : le serveur est déjà à jour.")
        return

    print(f"{len(a_envoyer)} fichier(s) à envoyer vers {SERVEUR}{DOSSIER_DISTANT}.")
    mot_de_passe = getpass.getpass(f"Mot de passe FTP pour {IDENTIFIANT} (rien ne s'affiche, c'est normal) : ")

    try:
        ftp = ftplib.FTP(SERVEUR, timeout=60)
        ftp.encoding = "utf-8"
        ftp.login(IDENTIFIANT, mot_de_passe)
    except ftplib.error_perm as erreur:
        print(f"Connexion refusée : {erreur}. Vérifie le mot de passe.")
        return
    except OSError as erreur:
        print(f"Impossible de joindre le serveur : {erreur}")
        return

    deja_crees = set()
    envoyes = 0
    try:
        for relatif, chemin, signature in a_envoyer:
            creer_dossiers(ftp, relatif, deja_crees)
            with open(chemin, "rb") as f:
                ftp.storbinary(f"STOR {DOSSIER_DISTANT}/{relatif}", f)
            etat[relatif] = signature
            envoyes += 1
            print(f"  [{envoyes}/{len(a_envoyer)}] {relatif}")
    finally:
        with open(ETAT, "w", encoding="utf-8") as f:
            json.dump(etat, f, indent=1)
        try:
            ftp.quit()
        except Exception:
            pass

    print(f"Terminé : {envoyes} fichier(s) envoyé(s).")
    print("Site : https://dev.timmatane.ca/etudiants/2024/dioufm/portfolio/")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nEnvoi interrompu.")
        sys.exit(1)
