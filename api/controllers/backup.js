const generateDynamicBackupScript = require("../libs/crete_bash");
const Backup = require("../models/Backup");

const { MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET } = process.env;

// Create a new Backup
exports.createBackup = async(req, res) => {
    console.log("edusg");
    try {
        const newBackup = new Backup(req.body);
        const savedBackup = await newBackup.save();
        res.status(201).json(savedBackup);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all repositories
exports.getAllBackups = async(req, res) => {
    try {
        const repositories = await Backup.find();
        res.status(200).json(repositories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a Backup by ID
exports.getBackupById = async(req, res) => {
    try {
        const newBackup = await Backup.findById(req.params.id);
        if (!newBackup)
            return res.status(404).json({ message: "Backup not found" });
        res.status(200).json(newBackup);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a Backup
exports.updateBackup = async(req, res) => {
    try {
        const newBackup = await Backup.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        if (!newBackup)
            return res.status(404).json({ message: "Backup not found" });
        res.status(200).json(newBackup);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a Backup
exports.deleteBackup = async(req, res) => {
    console.log(req.params.id);
    try {
        const newBackup = await Backup.findByIdAndDelete(req.params.id);
        if (!newBackup)
            return res.status(404).json({ message: "Backup not found" });
        res.status(200).json({ message: "Backup deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// const Backup = require("../models/Backup");
exports.createBashBackupScript = async(req, res) => {
    try {
        const { recordIds } = req.body;
        if (!recordIds || !Array.isArray(recordIds)) {
            return res.status(400).json({ message: "Invalid record IDs" });
        }

        // Fetch repositories from the database
        const repositories = await Backup.find({ _id: { $in: recordIds } });

        if (repositories.length === 0) {
            return res
                .status(404)
                .json({ message: "No repositories found for the provided IDs" });
        }

        // console.log(repositories)

        let scriptContent = generateDynamicBackupScript(repositories, {
            MINIO_ENDPOINT,
            MINIO_ACCESS_KEY,
            MINIO_SECRET_KEY,
            MINIO_BUCKET,
        });

        // Send the script as a downloadable file
        res.setHeader("Content-Type", "text/plain");
        res.setHeader("Content-Disposition", 'attachment; filename="backup.sh"');
        res.send(scriptContent);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};