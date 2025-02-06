const Repository = require("../models/Repository");

const { MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET } = process.env;

// Create a new repository
exports.createRepository = async(req, res) => {
    console.log("edusg");
    try {
        const repository = new Repository(req.body);
        const savedRepository = await repository.save();
        res.status(201).json(savedRepository);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all repositories
exports.getAllRepositories = async(req, res) => {
    try {
        const repositories = await Repository.find();
        res.status(200).json(repositories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a repository by ID
exports.getRepositoryById = async(req, res) => {
    try {
        const repository = await Repository.findById(req.params.id);
        if (!repository)
            return res.status(404).json({ message: "Repository not found" });
        res.status(200).json(repository);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a repository
exports.updateRepository = async(req, res) => {
    try {
        const repository = await Repository.findByIdAndUpdate(
            req.params.id,
            req.body, { new: true }
        );
        if (!repository)
            return res.status(404).json({ message: "Repository not found" });
        res.status(200).json(repository);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a repository
exports.deleteRepository = async(req, res) => {
    console.log(req.params.id);
    try {
        const repository = await Repository.findByIdAndDelete(req.params.id);
        if (!repository)
            return res.status(404).json({ message: "Repository not found" });
        res.status(200).json({ message: "Repository deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// const Repository = require("../models/Repository");
exports.createBashScript = async(req, res) => {
    try {
        const { recordIds } = req.body;
        if (!recordIds || !Array.isArray(recordIds)) {
            return res.status(400).json({ message: "Invalid record IDs" });
        }

        // Fetch repositories from the database
        const repositories = await Repository.find({ _id: { $in: recordIds } });

        if (repositories.length === 0) {
            return res
                .status(404)
                .json({ message: "No repositories found for the provided IDs" });
        }

        // Generate Bash script content
        let scriptContent = `#!/bin/bash

`;

        scriptContent += `echo "Please enter your username and password for each repository host."
declare -A credentials

SUCCESS=()
FAILURE=()

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


# Ensure jq is installed
if ! command -v jq &> /dev/null; then
  echo "jq not found. Installing..."
  sudo apt update && sudo apt install -y jq
fi

if ! command -v mysqldump &> /dev/null; then
  echo "mariadb-client not found. Installing..."
  sudo apt-get update && sudo apt-get install -y mariadb-client
fi

# Check if grep is installed
if ! command -v grep &>/dev/null; then
    echo "'grep' is not installed. Installing it..."
    if [ -x "$(command -v apt-get)" ]; then
        sudo apt-get update && sudo apt-get install -y grep
    elif [ -x "$(command -v yum)" ]; then
        sudo yum install -y grep
    else
        echo "Package manager not detected. Please install 'grep' manually."
        exit 1
    fi
fi




# Environment Variables
export MINIO_ENDPOINT="${MINIO_ENDPOINT}"
export MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY}"
export MINIO_SECRET_KEY="${MINIO_SECRET_KEY}"
export MINIO_BUCKET="${MINIO_BUCKET}"

# Default paths and variables
CONFIG_FILE_PATH="./config_db.json"
SQL_DUMP_PATH="/tmp/latest_backup.sql"

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
        mc alias set minio "https://\${MINIO_ENDPOINT}" "\${MINIO_ACCESS_KEY}" "\${MINIO_SECRET_KEY}" --insecure
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


# Function to restore the SQL dump to the database
restore_database() {
    
    local DB_NAME="$1"
    local DB_USER="$2"
    local DB_PASSWORD="$3"

    if [ -f "$SQL_DUMP_PATH" ]; then
        echo "Restoring the SQL dump to the database..."

        # Check if all necessary variables are set
        if [ -z "$CONTAINER_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
            echo "Error: Database credentials or name not set. Please ensure DB_USER, DB_PASSWORD, and DB_NAME are provided."
            return
        fi


        # Dynamically get the container IP
        DB_CONTAINER_IP=$(sudo docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$CONTAINER_NAME")

        # Check if the IP was successfully retrieved
        if [ -z "$DB_CONTAINER_IP" ]; then
            echo "Error: Could not retrieve IP address for container '$DB_CONTAINER'."
            exit 1
        fi

        while true; do
            echo "pinging db server $DB_CONTAINER_IP ......."
            mysql -h "$DB_CONTAINER_IP" -u "$DB_USER" -p"$DB_PASSWORD" -e "exit" &> /dev/null
            if [ $? -eq 0 ]; then
                echo "Database server is available"
                break
            fi
            sleep 3
        done

        echo "Checking if database '$DB_NAME' exists..."
        DB_EXISTS=$(mysql -h "$DB_CONTAINER_IP" -u "$DB_USER" -p"$DB_PASSWORD" -e "SHOW DATABASES LIKE '$DB_NAME';" | grep "$DB_NAME")

        if [ -z "$DB_EXISTS" ]; then
            echo "Database '$DB_NAME' does not exist. Creating it..."
            mysql -h "$DB_CONTAINER_IP" -u "$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE $DB_NAME;"
        fi

        mysql -h "$DB_CONTAINER_IP" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$SQL_DUMP_PATH"
        
        if [ $? -eq 0 ]; then
            echo "Database restored successfully."

            # Delete the temporary SQL dump file
            echo "Cleaning up temporary file..."
            rm -f "$SQL_DUMP_PATH"

            if [ $? -eq 0 ]; then
                echo "Temporary file deleted successfully."
            else
                echo "Warning: Failed to delete temporary file."
            fi
        else
            echo "Error: Database restore failed."
        fi
    else
        echo "Error: SQL dump file not found. Skipping database restore."
    fi
}


process_repository() {
    local repo_link="$1"
    local repo_location="$2"
    local repo_branch="$3"
    local DB_NAME="$4"
    local DB_USER="$5"
    local DB_PASSWORD="$6"
   

    # Extract the host part of the repository link
    local repo_host=$(echo "$repo_link" | awk -F/ '{print $3}')

    # Prompt for credentials if not already entered
    if [ -z "\${credentials[$repo_host]}" ]; then
        echo "Enter username for host $repo_host:"
        read USERNAME
        echo "Enter password for host $repo_host:"
        read -s PASSWORD
        credentials[$repo_host]="http://$USERNAME:$PASSWORD@$repo_host"
    fi

    # Replace the host in the repository link with the credentialed version
    local auth_repo_link=$(echo "$repo_link" | sed "s|http://$repo_host|\${credentials[$repo_host]}|")

    echo "Cloning repository: $auth_repo_link"
    git clone "$auth_repo_link"

    if [ $? -ne 0 ]; then
        echo "Failed to clone $repo_link"
        FAILURE+=("$repo_link")
        return
    fi

    # Navigate to the appropriate directory
    local repo_dir=$(basename "$repo_link" .git)
    if [ "$repo_location" == "root" ]; then
        cd "$repo_dir" || { echo "Failed to navigate to $repo_dir"; FAILURE+=("$repo_link"); return; }
    else
        cd "$repo_dir/$repo_location" || { echo "Failed to navigate to $repo_dir/$repo_location"; FAILURE+=("$repo_link"); return; }
    fi

    # Checkout the specified branch
    if [ -n "$repo_branch" ]; then
        echo "Checking out branch: $repo_branch"
        git checkout "$repo_branch" || { echo "Failed to checkout branch $repo_branch for $repo_link"; FAILURE+=("$repo_link"); cd - || return; return; }
    fi

    echo "Running docker-compose up in $(pwd)"
    sudo chown -R 1001:1001 ./wordpress
    sudo chmod -R 775 ./wordpress

    sudo docker-compose up -d

    if [ $? -ne 0 ]; then
        echo "Failed to run docker-compose for $repo_link"
        FAILURE+=("$repo_link")
        cd - || return
        return
    fi

    # Step 1: Check for config_db.json and process it
    process_config_file

    # Step 2: Download the latest SQL dump
    download_backup_with_minio

    # Step 3: Restore the SQL dump to the database
    restore_database  "$DB_NAME" "$DB_USER" "$DB_PASSWORD"
    

    # Step 4: End the restore phase without exiting
    echo "Restore phase completed. Continuing with other operations..."

    SUCCESS+=("$repo_link")
    cd - || return
}

`;

        // Add repositories to the script
        scriptContent += `repositories=(
`;
        repositories.forEach((repo) => {
            const repoData = `${repo.repository_link},${
        repo.repository_docker_compose_root_location
      },${repo.repository_branch || ""},${repo.repository_database_name},${
        repo.repository_database_user
      },${repo.repository_database_password}`;
            scriptContent += `    "${repoData}"
`;
        });
        scriptContent += `)

`;

        // Process each repository
        scriptContent += `for repo_data in "\${repositories[@]}"; do
    IFS=',' read -r repo_link repo_location repo_branch repo_db_name repo_db_user repo_db_password <<< "$repo_data"
    process_repository "$repo_link" "$repo_location" "$repo_branch" "$repo_db_name" "$repo_db_user" "$repo_db_password"
done

`;

        // Add summary
        scriptContent += `echo "-------------------------------------------------"
echo "Summary:"
echo "Success:"
for repo in "\${SUCCESS[@]}"; do
    echo "  - $repo"
done

echo "Failure:"
for repo in "\${FAILURE[@]}"; do
    echo "  - $repo"
done
echo "-------------------------------------------------"

if [ \${#FAILURE[@]} -ne 0 ]; then
    echo "Some repositories failed to process. Please check the errors above."
else
    echo "All repositories were processed successfully."
fi
`;

        // Send the script as a downloadable file
        res.setHeader("Content-Type", "text/plain");
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="deploy_repositories.sh"'
        );
        res.send(scriptContent);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};