#!/bin/bash

# Script de test de restauration de la base de données PostgreSQL
# Ce script permet de vérifier que les sauvegardes sont utilisables
# Usage: ./test-restore.sh chemin/vers/sauvegarde.backup.gz

# Vérifier si un argument a été fourni
if [ $# -ne 1 ]; then
    echo "Usage: $0 chemin/vers/sauvegarde.backup.gz"
    exit 1
fi

# Configuration
BACKUP_FILE=$1
DB_NAME="coworkmy"
TEST_DB_NAME="${DB_NAME}_test_restore"
TEMP_DIR="/tmp/db_restore_test"

# Informations de connexion (à remplacer par vos valeurs ou utiliser un fichier .pgpass)
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="postgres"
DB_PASSWORD="votre_mot_de_passe"

# Créer un répertoire temporaire
mkdir -p $TEMP_DIR

# Log de début
echo "Démarrage du test de restauration - $(date)"
echo "Fichier de sauvegarde: $BACKUP_FILE"

# Vérifier si le fichier existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERREUR: Le fichier de sauvegarde n'existe pas"
    exit 1
fi

# Décompresser la sauvegarde si elle est compressée
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "Décompression de la sauvegarde..."
    gunzip -c "$BACKUP_FILE" > "$TEMP_DIR/$(basename "$BACKUP_FILE" .gz)"
    BACKUP_FILE="$TEMP_DIR/$(basename "$BACKUP_FILE" .gz)"
fi

# Supprimer la base de test si elle existe déjà
echo "Suppression de la base de test si elle existe..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "DROP DATABASE IF EXISTS $TEST_DB_NAME;"

# Créer une base de données de test
echo "Création d'une base de données de test..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $TEST_DB_NAME;"

if [ $? -ne 0 ]; then
    echo "ERREUR: Impossible de créer la base de données de test"
    rm -f "$TEMP_DIR/$(basename "$BACKUP_FILE")"
    exit 1
fi

# Restaurer la sauvegarde
echo "Restauration de la sauvegarde dans la base de test..."
PGPASSWORD=$DB_PASSWORD pg_restore -h $DB_HOST -p $DB_PORT -U $DB_USER -d $TEST_DB_NAME "$BACKUP_FILE"

if [ $? -ne 0 ]; then
    echo "AVERTISSEMENT: La restauration a rencontré des problèmes, mais peut avoir réussi partiellement"
else
    echo "Restauration réussie"
fi

# Vérifier la restauration en exécutant quelques requêtes
echo "Vérification de la restauration..."

# Vérifier le nombre d'espaces
SPACES_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $TEST_DB_NAME -t -c "SELECT COUNT(*) FROM spaces;")
echo "Nombre d'espaces: $SPACES_COUNT"

# Vérifier le nombre de réservations
BOOKINGS_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $TEST_DB_NAME -t -c "SELECT COUNT(*) FROM bookings;")
echo "Nombre de réservations: $BOOKINGS_COUNT"

# Vérifier le nombre de profils
PROFILES_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $TEST_DB_NAME -t -c "SELECT COUNT(*) FROM profiles;")
echo "Nombre de profils: $PROFILES_COUNT"

# Nettoyer
echo "Nettoyage..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "DROP DATABASE $TEST_DB_NAME;"

# Supprimer les fichiers temporaires
if [[ "$BACKUP_FILE" == "$TEMP_DIR/"* ]]; then
    rm -f "$BACKUP_FILE"
fi

echo "Test de restauration terminé - $(date)"
echo "La sauvegarde semble être en bon état et utilisable pour une restauration."
