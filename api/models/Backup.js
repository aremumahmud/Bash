const mongoose = require('mongoose')


const Schema = mongoose.Schema

const BackupSchema = new Schema({
    repository_link: {
        type: String,
        required: true,
    },
    repository_label: {
        type: String,
        required: true,
    },
    repository_docker_compose_root_location: {
        type: String,
        required: true,
    },
    repository_branch: {
        type: String,
        required: true,
    },
    repository_type: {
        type: String,
        required: true,
    },
    repository_file_path: {
        type: String,
        required: true,
    },
    repository_database_name: {
        type: String,
        required: true,
    },
    repository_database_password: {
        type: String,
        required: true,
    },
    repository_database_user: {
        type: String,
        required: true,
    },
});


module.exports = mongoose.model('Backup', BackupSchema)