#!/bin/bash

echo "Please enter your username and password for each repository host."
declare -A credentials

SUCCESS=()
FAILURE=()

process_repository() {
    local repo_link="$1"
    local repo_location="$2"
    local repo_branch="$3"

    # Extract the host part of the repository link
    local repo_host=$(echo "$repo_link" | awk -F/ '{print $3}')

    # Prompt for credentials if not already entered
    if [ -z "${credentials[$repo_host]}" ]; then
        echo "Enter username for host $repo_host:"
        read USERNAME
        echo "Enter password for host $repo_host:"
        read -s PASSWORD
        credentials[$repo_host]="http://$USERNAME:$PASSWORD@$repo_host"
    fi

    # Replace the host in the repository link with the credentialed version
    local auth_repo_link=$(echo "$repo_link" | sed "s|http://$repo_host|${credentials[$repo_host]}|")

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
    sudo docker-compose up -d

    if [ $? -ne 0 ]; then
        echo "Failed to run docker-compose for $repo_link"
        FAILURE+=("$repo_link")
        cd - || return
        return
    fi

    SUCCESS+=("$repo_link")
    cd - || return
}

repositories=(
    "http://10.0.1.108/datanotch_client_project/heartily_touch.git,root,mahmud"
)

for repo_data in "${repositories[@]}"; do
    IFS=',' read -r repo_link repo_location repo_branch <<< "$repo_data"
    process_repository "$repo_link" "$repo_location" "$repo_branch"
done

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
