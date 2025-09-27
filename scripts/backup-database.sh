#!/bin/bash

# Script de sauvegarde automatique de la base de données PostgreSQL
# À exécuter via un cron job, par exemple tous les jours à 2h du matin:
# 0 2 * * * /chemin/vers/backup-database.sh

# Configuration
DATE=$(date +"%Y%m%d")
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="postgres"
DB_NAME="coworkmy"
BACKUP_DIR="/var/backups/coworkmy/database"
S3_BUCKET="coworkmy-backups"
RETENTION_DAYS=30

# Créer le répertoire de sauvegarde s'il n'existe pas
mkdir -p $BACKUP_DIR

# Log de début
echo "Démarrage de la sauvegarde de $DB_NAME - $(date)"

# Exécuter pg_dump
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -F c -b -v -f "$BACKUP_DIR/$DB_NAME-$DATE.backup"

# Vérifier si pg_dump a réussi
if [ $? -eq 0 ]; then
    echo "Sauvegarde réussie: $BACKUP_DIR/$DB_NAME-$DATE.backup"
    
    # Compresser la sauvegarde
    echo "Compression de la sauvegarde..."
    gzip "$BACKUP_DIR/$DB_NAME-$DATE.backup"
    
    # Vérifier si la compression a réussi
    if [ $? -eq 0 ]; then
        echo "Compression réussie: $BACKUP_DIR/$DB_NAME-$DATE.backup.gz"
        
        # Envoyer vers S3 (décommenter si AWS CLI est configuré)
        echo "Envoi vers S3..."
        aws s3 cp "$BACKUP_DIR/$DB_NAME-$DATE.backup.gz" "s3://$S3_BUCKET/database-backups/"
        
        if [ $? -eq 0 ]; then
            echo "Envoi vers S3 réussi"
        else
            echo "ERREUR: Échec de l'envoi vers S3"
        fi
    else
        echo "ERREUR: Échec de la compression"
    fi
else
    echo "ERREUR: Échec de la sauvegarde"
    exit 1
fi

# Supprimer les anciennes sauvegardes (plus de X jours)
echo "Nettoyage des anciennes sauvegardes (plus de $RETENTION_DAYS jours)..."
find $BACKUP_DIR -name "*.gz" -mtime +$RETENTION_DAYS -delete

echo "Sauvegarde terminée - $(date)"

# Test de restauration (décommenter pour activer)
# ./test-restore.sh "$BACKUP_DIR/$DB_NAME-$DATE.backup.gz"
