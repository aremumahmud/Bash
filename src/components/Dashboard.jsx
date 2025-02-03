import { useEffect, useState } from "react";
import Header from "./Header";
import RepositoryList from "./RepositoryList";
import FloatingActionButton from "./FloatingActionButton";
import CreateRepositoryModal from "./CreateRepositoryModal";
import { useCreateRepository } from "../lib/useCreateRepository";
import { useGetRepositories } from "../lib/useGetRepositories";
import { useCreateBashScript } from "../lib/useCreateBashScript";
import { useDeleteRepository } from "../lib/useDeleteRepository";
import { useUpdateRepository } from "../lib/useUpdateRepo";
// import { updateRepository } from '../../api/controllers/repositoryController'

export default function Dashboard() {
  const [state, setState] = useState("bash");
  const [repositories, setRepositories] = useState([]);
  const [selectedRepos, setSelectedRepos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { createRepository } = useCreateRepository();
  const { getRepositories } = useGetRepositories();
  const { createBashScript } = useCreateBashScript();
  const { deleteRepository } = useDeleteRepository();
  const { updateRepository } = useUpdateRepository();

  useEffect(() => {
    let fetchRepos = async () => {
      try {
        const data = await getRepositories(state);
        setRepositories(data);
      } catch (error) {
        window.alert("Failed to fetch repositories");
        console.error("Failed to fetch repositories");
      }
    };

    fetchRepos();
  }, [state]);

  const handleCreateBash = async () => {
    setIsLoading(true);
    console.log("Creating bash for:", selectedRepos);
    // Mock API request

    try {
      const data = await createBashScript(selectedRepos, state);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to create repository");
      setIsLoading(false);
      window.alert("Failed to create repository");
    }
    setTimeout(() => {
      // Implement bash creation logic here
    }, 2000);
  };

  const handleAddRepository = async (newRepo) => {
    setIsLoading(true);
    // Mock API request
    let requestData =
      state === "bash"
        ? {
            repository_link: newRepo.link,
            repository_label: newRepo.label,
            repository_docker_compose_root_location:
              newRepo.dockerComposeLocation,
            repository_branch: newRepo.branch,
            repository_database_name: newRepo.repository_database_name,
            repository_database_user: newRepo.repository_database_user,
            repository_database_password: newRepo.repository_database_password,
          }
        : {
            repository_link: newRepo.link,
            repository_label: newRepo.label,
            repository_docker_compose_root_location:
              newRepo.dockerComposeLocation,
            repository_branch: newRepo.branch,
            repository_type: newRepo.file_type,
            repository_file_path: newRepo.file_path,
            repository_database_name: newRepo.repository_database_name,
            repository_database_user: newRepo.repository_database_user,
            repository_database_password: newRepo.repository_database_password,
          };

    try {
      const data = await createRepository(requestData, state);
      console.log("Repository created:", data);
      setRepositories([...repositories, data]);
      setIsModalOpen(false);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to create repository");
      setIsLoading(false);
      window.alert("Failed to create repository");
    }
  };

  const handleSelectRepository = (id, isSelected) => {
    setSelectedRepos((prev) =>
      isSelected ? [...prev, id] : prev.filter((repoId) => repoId !== id)
    );
  };

  const handleSelectAll = (isSelected) => {
    setSelectedRepos(isSelected ? repositories?.map((repo) => repo._id) : []);
  };

  const handleEditRepository = async (id, updatedRepo) => {
    setIsLoading(true);

    try {
      const data = await updateRepository(id, updatedRepo, state);
      setRepositories((repos) =>
        repos.map((repo) =>
          repo._id === id ? { ...repo, ...updatedRepo } : repo
        )
      );
      setIsLoading(false);
    } catch (err) {
      window.alert("error editing record");
      setIsLoading(false);
    }
    // Mock API request
  };

  const handleDeleteRepository = async (id) => {
    setIsLoading(true);
    // Mock API request

    try {
      let data = await deleteRepository(id, state);
      setRepositories((repos) => repos.filter((repo) => repo._id !== id));
      setSelectedRepos((selected) =>
        selected.filter((repoId) => repoId !== id)
      );
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      window.alert("error deleting record");
    }
    // setTimeout(() => {
    //   setRepositories(repos => repos.filter(repo => repo.id !== id))
    //   setSelectedRepos(selected => selected.filter(repoId => repoId !== id))
    //   setIsLoading(false)
    // }, 2000)
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        onCreateBash={handleCreateBash}
        isCreateBashDisabled={selectedRepos.length === 0 || isLoading}
        isLoading={isLoading}
      />
      <div className="toggle_div">
        <div
          onClick={() => setState("bash")}
          className={
            state === "bash" ? "toggle_item active_btn_toggle" : "toggle_item"
          }>
          Restore
        </div>
        <div
          onClick={() => setState("backup")}
          className={
            state !== "bash" ? "toggle_item active_btn_toggle" : "toggle_item"
          }>
          backup
        </div>
      </div>
      <main className="container mx-auto p-4">
        <RepositoryList
          state={state}
          repositories={repositories}
          selectedRepos={selectedRepos}
          onSelectRepository={handleSelectRepository}
          onSelectAll={handleSelectAll}
          onEditRepository={handleEditRepository}
          onDeleteRepository={handleDeleteRepository}
          isLoading={isLoading}
        />
        <FloatingActionButton
          onClick={() => setIsModalOpen(true)}
          disabled={isLoading}
        />
        <CreateRepositoryModal
          state={state}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddRepository={handleAddRepository}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}
