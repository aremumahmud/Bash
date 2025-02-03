# #!/bin/bash
# IMAGE_TYPE="mariadb"

# # Use awk to extract the service name based on the image type
# DB_CONTAINER_NAME=$(awk -v image_type="$IMAGE_TYPE" '
# /services:/ {in_services=1}
# /image:/ && in_services {
#     if ($2 ~ image_type) {
#         print prev; # Capture the previous line (service name)
#         exit;
#     }
# }
# {prev=$1}
# ' ex.yaml)

# # Check if the DB container name was found
# if [ -z "$DB_CONTAINER_NAME" ]; then
#   echo "Database container for type '$IMAGE_TYPE' not found in ex.yaml."
#   exit 1
# fi

# # Split and take the first part (before the colon)
# DB_CONTAINER_NAME=$(echo "$DB_CONTAINER_NAME" | cut -d':' -f1)

# # Debugging output
# echo "'$DB_CONTAINER_NAME'"

# CONFIG_FILE="./gg.json"
# TYPE="mysql"
# DUMP_URL="https://ff.kk"
# DATE="33-4-4-5"
# LABEL="dghb"


# # touch "$CONFIG_FILE"

# # Save the dump URL to config_db.json
# if [ ! -f "$CONFIG_FILE" ]; then
#   echo "{}" > "$CONFIG_FILE"
# fi

# jq ".backups |= . + [{type: \\"$TYPE\\", label: \\"$LABEL\\", url: \\"$DUMP_URL\\", date: \\"$DATE\\"}]" "$CONFIG_FILE" > "\${CONFIG_FILE}.tmp" && mv "\${CONFIG_FILE}.tmp" "$CONFIG_FILE"


SQL_DUMP_PATH="./tmp/test.sql"


# # Environment Variables
# export MINIO_ENDPOINT="10.0.0.53:9000"
# export MINIO_ACCESS_KEY="G8TphRTwGNYYgZo5BIOl"
# export MINIO_SECRET_KEY="UYIOKeqwyc9CBR5K7oyPGcUKt3Mhj26Hd46xW4Vz"
# export MINIO_BUCKET="backups"

CONFIG_FILE_PATH="./gg.json"

process_config_file() {
    if [ ! -f "$CONFIG_FILE_PATH" ]; then
        echo "Warning: config_db.json not found. Skipping this phase."
        return  # Do not exit; allow other operations to proceed
    fi

    echo "Parsing config_db.json..."

    # Extract the latest backup entry
    BACKUP_URL=$(jq -r '.backups[-1].url' "$CONFIG_FILE_PATH")
    CONTAINER_NAME=$(jq -r '.backups[-1].container_name' "$CONFIG_FILE_PATH")

    if [ -z "$BACKUP_URL" ] || [ "$BACKUP_URL" == "null" ]; then
        echo "Error: No valid backup URL found in config_db.json. Skipping this phase."
        return
    fi

    echo "Latest backup URL: $BACKUP_URL"
    echo "Container name: $CONTAINER_NAME"
}


# Function to download the SQL dump using MinIO client
download_backup_with_minio() {
    if [ -n "$BACKUP_URL" ]; then
        echo "Downloading the SQL dump using MinIO client..."

        # Extract the bucket and object path from the URL
        BUCKET=$(echo "$BACKUP_URL" | awk -F/ '{print $4}')
        OBJECT_PATH=$(echo "$BACKUP_URL" | cut -d/ -f5-)

        echo "Bucket: $BUCKET"
        echo "Object Path: $OBJECT_PATH"

        # Download using MinIO client
        mc alias set minio "https://${MINIO_ENDPOINT}" "${MINIO_ACCESS_KEY}" "${MINIO_SECRET_KEY}" --insecure
        mc cp  --insecure "minio/$BUCKET/$OBJECT_PATH" "$SQL_DUMP_PATH"

        if [ $? -eq 0 ]; then
            echo "SQL dump downloaded to $SQL_DUMP_PATH"
        else
            echo "Error: Failed to download the SQL dump."
            return
        fi
    else
        echo "Error: No backup URL provided. Skipping download."
    fi
}


# download_backup_with_minio
process_config_file



echo "Latest backup URL: $BACKUP_URL"
echo "Container name: $CONTAINER_NAME"


# Environment Variables
export MINIO_ENDPOINT="10.0.0.53:9000"
export MINIO_ACCESS_KEY="G8TphRTwGNYYgZo5BIOl"
export MINIO_SECRET_KEY="UYIOKeqwyc9CBR5K7oyPGcUKt3Mhj26Hd46xW4Vz"
export MINIO_BUCKET="backups"

download_backup_with_minio
