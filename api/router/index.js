const express = require('express');
const { createBackup, createBashBackupScript, deleteBackup, getAllBackups, updateBackup } = require('../controllers/backup');
const { createRepository, createBashScript, deleteRepository, getAllRepositories, updateRepository } = require('../controllers/repositoryController');
const router = express.Router()


router.route("/backup").post(createBackup);

router.route("/backup").get(getAllBackups);

router.route("/backup/create-bash").post(createBashBackupScript);

router.route("/backup/:id").delete(deleteBackup);

router.route("/backup/:id").put(updateBackup);


router
    .route("/repositories")
    .post(createRepository);


router.route("/repositories").get(getAllRepositories);

router
    .route("/repositories/create-bash")
    .post(createBashScript);

router
    .route("/repositories/:id")
    .delete(deleteRepository);

router.route("/repositories/:id").put(updateRepository);


module.exports = router