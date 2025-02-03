#!/bin/bash


echo "Please enter your username and password for each repository host."
declare -A credentials

SUCCESS=()
FAILURE=()

process_repository() {
    local repo_link="$1"
    local repo_location="$2"

    local repo_host=$(echo "$repo_link" | awk -F/ '{print $3}')
    
    if [ -z "${credentials[$repo_host]}" ]; then
        echo "Enter username for host $repo_host:"
        read USERNAME
        echo "Enter password for host $repo_host:"
        read -s PASSWORD
        credentials[$repo_host]="--username=$USERNAME --password=$PASSWORD"
    fi

    echo "Cloning repository: $repo_link"
    git clone ${credentials[$repo_host]} $repo_link

    if [ $? -ne 0 ]; then
        echo "Failed to clone $repo_link"
        FAILURE+=("$repo_link")
        return
    fi

    REPO_DIR=$(basename "$repo_link" .git)
    if [ "$repo_location" == "root" ]; then
        cd "$REPO_DIR"
    else
        cd "$REPO_DIR/$repo_location"
    fi

    echo "Running docker-compose up in $(pwd)"
    sudo docker-compose up -d

    if [ $? -ne 0 ]; then
        echo "Failed to run docker-compose for $repo_link"
        FAILURE+=("$repo_link")
        cd -
        return
    fi

    SUCCESS+=("$repo_link")
    cd -
}

process_repository "http://10.0.1.108/datanotch_client_project/heartily_touch.git" "root"

echo "-------------------------------------------------"
echo "Summary:"
echo "Success:"
for repo in "${SUCCESS[@]}"; do
    echo "  - $repo"
done

echo "Failure:"
for repo in "${FAILURE[@]}"; do
    echo "  - $repo"
done
echo "-------------------------------------------------"

if [ ${#FAILURE[@]} -ne 0 ]; then
    echo "Some repositories failed to process. Please check the errors above."
else
    echo "All repositories were processed successfully."
fi
