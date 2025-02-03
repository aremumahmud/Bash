const parseGitUri = (gitUri) => {
    // Replace the @ with %40 and $ with %24 in the URI
    return gitUri.replace(/\$/, "%24");
};

function generateDynamicBackupScript(
    configs, { MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET }
) {
    const bashScript = `#!/bin/bash

set -e


# Check if 'mc' is installed
if ! command -v mc &> /dev/null; then
  echo "'mc' is not installed. Installing MinIO Client..."
  
  # Download the MinIO Client binary
  curl -O https://dl.min.io/client/mc/release/linux-amd64/mc
  
  # Move the binary to a directory in PATH
  chmod +x mc
  sudo mv mc /usr/local/bin/
  
  echo "MinIO Client installed successfully."
else
  echo "'mc' is already installed."
fi

# Ensure awk is installed
if ! command -v awk &> /dev/null; then
  echo "awk not found. Installing..."
  sudo apt update && sudo apt install -y gawk
fi

# Ensure jq is installed
if ! command -v jq &> /dev/null; then
  echo "jq not found. Installing..."
  sudo apt update && sudo apt install -y jq
fi

# Ensure grep is installed
if ! command -v grep &> /dev/null; then
  echo "grep not found. Installing..."
  sudo apt update && sudo apt install -y grep
fi

if ! command -v mysqldump &> /dev/null; then
  echo "mariadb-client not found. Installing..."
  sudo apt-get update && sudo apt-get install -y mariadb-client
fi


# Ensure .gitignore exists and add necessary entries
setup_gitignore() {
  local gitIgnoreFile=".gitignore"

  # Check if .gitignore exists, if not create it
  if [ ! -f "$gitIgnoreFile" ]; then
    touch "$gitIgnoreFile"
  fi

  # Add entries to .gitignore if they do not already exist
  local entries=("data" "data1" "node_modules")
  for entry in "\${entries[@]}"; do
    if ! grep -qx "$entry" "$gitIgnoreFile"; then
      echo "$entry" >> "$gitIgnoreFile"
    fi
  done
}


# Function to process a single backup
process_backup() {
  local filePath=$1
  local dockerComposePath=$2
  local label=$3
  local type=$4
  local branch=$5
  local gitUrl=$6
  local DB_NAME=$7
  local DB_USER=$8
  local DB_PASSWORD=$9
  

  # Variables
  local GIT_REPO_DIR="\${filePath}"
  local DOCKER_COMPOSE_DIR="\${dockerComposePath}"
  local BACKUP_DIR="\${filePath}"
  local LABEL="\${label}"
  local TYPE="\${type}"
  local DATE=$(date +"%Y-%m-%d-%H-%M-%S")
  local CONFIG_FILE="./config_db.json"

  # Navigate to Git directory and ensure we're on the specified branch (default to 'main' if not provided)
  cd "$GIT_REPO_DIR"
  # git branch "\${branch:-main}"
  git checkout "\${branch:-main}"

  setup_gitignore

  # Navigate to the Docker Compose directory
  cd "$DOCKER_COMPOSE_DIR"
  
    # Initialize variable
  DOCKER_COMPOSE_FILE=""

  # Find the appropriate docker-compose file (yml or yaml)
  if [ -f "docker-compose.yml" ]; then
    DOCKER_COMPOSE_FILE="docker-compose.yml"
  elif [ -f "docker-compose.yaml" ]; then
    DOCKER_COMPOSE_FILE="docker-compose.yaml"
  else
    echo "Error: No docker-compose file found (docker-compose.yml or docker-compose.yaml)"
    exit 1
  fi

  # Use awk to extract the service name based on the image type
  DB_CONTAINER_NAME=$(awk -v image_type="$TYPE" '
  /services:/ {in_services=1}
  /image:/ && in_services {
      if ($2 ~ image_type) {
          # Capture the previous line, which is the service name
          print prev;
          exit;
      }
  }
  {prev=$1}
  ' "$DOCKER_COMPOSE_FILE")


  if [ -z "$DB_CONTAINER_NAME" ]; then
    echo "Database container for type '$TYPE' not found in docker-compose.yml."
    exit 1
  fi

  # Split and take the first part (before the colon)
  DB_CONTAINER_NAME=$(echo "$DB_CONTAINER_NAME" | cut -d':' -f1)

  
  echo "Database container identified: $DB_CONTAINER_NAME"

  FILE_BASE=$(basename "$BACKUP_DIR")
  DB_CONTAINER="$FILE_BASE-$DB_CONTAINER_NAME-1"

  # Create a backup (SQL dump)
  local DUMP_FILE="./\${LABEL}_\${DATE}.sql"
  touch "$DUMP_FILE"

  

  # Dynamically get the container IP
  DB_CONTAINER_IP=$(sudo docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$DB_CONTAINER")

  # Check if the IP was successfully retrieved
  if [ -z "$DB_CONTAINER_IP" ]; then
    echo "Error: Could not retrieve IP address for container '$DB_CONTAINER'."
    exit 1
  fi 

  # Perform the database dump
  echo "Performing database dump from container $DB_CONTAINER ($DB_CONTAINER_IP)..."
  mysqldump -h "$DB_CONTAINER_IP" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$DUMP_FILE"

  if [ $? -eq 0 ]; then
    echo "Database dump successful. Backup saved to $DUMP_FILE"
  else
    echo "Database dump failed."
    exit 1
  fi

  # Upload the dump to MinIO
  local DUMP_NAME="\${LABEL}_\${DATE}.sql"
  mc alias set minio https://\${MINIO_ENDPOINT} \${MINIO_ACCESS_KEY} \${MINIO_SECRET_KEY} --insecure
  mc cp --insecure "$DUMP_FILE" "minio/\${MINIO_BUCKET}/\${DUMP_NAME}"

  local DUMP_URL="https://\${MINIO_ENDPOINT}/\${MINIO_BUCKET}/\${DUMP_NAME}"

  echo "$DUMP_URL"
  
  # touch "$CONFIG_FILE"

  # Save the dump URL to config_db.json
  if [ ! -f "$CONFIG_FILE" ]; then
    echo "{}" > "$CONFIG_FILE"
  fi

  jq ".backups |= . + [{type: \\"$TYPE\\", label: \\"$LABEL\\", url: \\"$DUMP_URL\\", date: \\"$DATE\\", container_name: \\"$DB_CONTAINER\\" }]" "$CONFIG_FILE" > "\${CONFIG_FILE}.tmp" && mv "\${CONFIG_FILE}.tmp" "$CONFIG_FILE"

  # Navigate back to the Git directory (if needed)
  if [ "$DOCKER_COMPOSE_DIR" != "./" ]; then
    cd "$GIT_REPO_DIR"
  fi

  # Delete the temporary SQL dump file
  echo "Cleaning up temporary file..."
  rm -f "$DUMP_FILE"

  if [ $? -eq 0 ]; then
      echo "Temporary file deleted successfully."
  else
      echo "Warning: Failed to delete temporary file."
  fi

  git config --global user.name "Mahmud Aremu"
  git config --global user.email "aremumahmud2003@gmail.com"


  # Set Git remote URL and push to Git repository
  git remote set-url origin "$gitUrl"
  git add .
  git add -f app/public/uploads/*
  echo "uploading media files, this might take a while ...."
  git commit -m "Backup added for \${LABEL} (\${TYPE}) on $DATE"
  git push origin "\${branch:-main}"

  echo "Backup process completed successfully for $LABEL ($TYPE)!"


}

# Process multiple items
process_backups() {
  local configs=( ${configs
    .map(
      (config) =>
        `"${config.repository_file_path}|${
          config.repository_docker_compose_root_location == "root"
            ? "./"
            : config.repository_docker_compose_root_location
        }|${config.repository_label}|${config.repository_type}|${
          config.repository_branch || "main"
        }|${parseGitUri(config.repository_link)}|${
          config.repository_database_name
        }|${config.repository_database_user}|${
          config.repository_database_password
        }"`
    )
    .join(" ")} )
  
  for config in "\${configs[@]}"; do
    # Split the string into parts
    IFS='|' read -ra params <<< "$config"
    process_backup "\${params[0]}" "\${params[1]}" "\${params[2]}" "\${params[3]}" "\${params[4]}" "\${params[5]}" "\${params[6]}" "\${params[7]}" "\${params[8]}"
  done
}

# Environment Variables
export MINIO_ENDPOINT="${MINIO_ENDPOINT}"
export MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY}"
export MINIO_SECRET_KEY="${MINIO_SECRET_KEY}"
export MINIO_BUCKET="${MINIO_BUCKET}"

# export MINIO_ENDPOINT="10.0.0.53:9000"
# export MINIO_ACCESS_KEY="G8TphRTwGNYYgZo5BIOl"
# export MINIO_SECRET_KEY="UYIOKeqwyc9CBR5K7oyPGcUKt3Mhj26Hd46xW4Vz"
# export MINIO_BUCKET="backups"

# Execute the backups
process_backups`;

  return bashScript;
}

// mc alias set minio https://10.0.0.53:9002 G8TphRTwGNYYgZo5BIOl UYIOKeqwyc9CBR5K7oyPGcUKt3Mhj26Hd46xW4Vz --insecure

module.exports = generateDynamicBackupScript;