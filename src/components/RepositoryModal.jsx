import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Loader2 } from 'lucide-react'

export default function RepositoryModal({ repository, isOpen, onClose, onEdit, onDelete, isLoading , state}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRepo, setEditedRepo] = useState(repository);

  const handleEdit = () => {
    onEdit(repository._id, editedRepo);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(repository._id);
    onClose();
  };


  console.log(state)
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Repository" : repository.repository_label}
          </DialogTitle>
        </DialogHeader>
        {isEditing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEdit();
            }}
            className="space-y-4">
            <div>
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={editedRepo.repository_label}
                onChange={(e) =>
                  setEditedRepo({
                    ...editedRepo,
                    repository_label: e.target.value,
                  })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="link">Repository Link</Label>
              <Input
                id="link"
                value={editedRepo.repository_link}
                onChange={(e) =>
                  setEditedRepo({
                    ...editedRepo,
                    repository_link: e.target.value,
                  })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="branch">Branch</Label>
              <Input
                id="branch"
                value={editedRepo.repository_branch}
                onChange={(e) =>
                  setEditedRepo({
                    ...editedRepo,
                    repository_branch: e.target.value,
                  })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="dockerComposeLocation">
                Docker Compose Location
              </Label>
              <Input
                id="dockerComposeLocation"
                value={editedRepo.repository_docker_compose_root_location}
                onChange={(e) =>
                  setEditedRepo({
                    ...editedRepo,
                    repository_docker_compose_root_location: e.target.value,
                  })
                }
                placeholder="root"
              />
            </div>
            <div>
              <Label htmlFor="database_user">Databse User</Label>
              <Input
                id="database_user"
                value={editedRepo.repository_database_user}
                onChange={(e) =>
                  setEditedRepo({
                    ...editedRepo,
                    repository_database_user: e.target.value,
                  })
                }
                placeholder="john"
              />
            </div>
            <div>
              <Label htmlFor="database_name">Database Name</Label>
              <Input
                id="database_name"
                value={editedRepo.repository_database_name}
                onChange={(e) =>
                  setEditedRepo({
                    ...editedRepo,
                    repository_database_name: e.target.value,
                  })
                }
                placeholder="root"
              />
            </div>
            <div>
              <Label htmlFor="database_password">Database Password</Label>
              <Input
                id="database_password"
                value={editedRepo.repository_database_password}
                onChange={(e) =>
                  setEditedRepo({
                    ...editedRepo,
                    repository_database_password: e.target.value,
                  })
                }
                placeholder="root"
              />
            </div>
            {state !== "bash" && (
              <>
                <div>
                  <Label htmlFor="file_type">Type</Label>
                  <Input
                    id="file_type"
                    value={editedRepo.repository_type}
                    onChange={(e) =>
                      setEditedRepo({
                        ...editedRepo,
                        repository_type: e.target.value,
                      })
                    }
                    placeholder="wordpress | strapi"
                  />
                </div>
                <div>
                  <Label htmlFor="file_path">File Path</Label>
                  <Input
                    id="file_path"
                    value={editedRepo.repository_file_path}
                    onChange={(e) =>
                      setEditedRepo({
                        ...editedRepo,
                        repository_file_path: e.target.value,
                      })
                    }
                    placeholder="root"
                  />
                </div>
              </>
            )}
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isLoading}>
                Cancel
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}>
            <div className="mt-4">
              <h3 className="font-semibold">Repository Link:</h3>
              <p className="mt-1">{repository.repository_link}</p>
            </div>
            <div className="mt-4">
              <h3 className="font-semibold">Branch:</h3>
              <p className="mt-1">{repository.repository_branch}</p>
            </div>
            <div className="mt-4">
              <h3 className="font-semibold">Docker Compose Location:</h3>
              <p className="mt-1">
                {repository.repository_docker_compose_root_location}
              </p>
            </div>
            {state !== "bash" && (
              <>
                <div className="mt-4">
                  <h3 className="font-semibold">File Type:</h3>
                  <p className="mt-1">{repository.repository_type}</p>
                </div>
                <div className="mt-4">
                  <h3 className="font-semibold">File Path:</h3>
                  <p className="mt-1">{repository.repository_file_path}</p>
                </div>
              </>
            )}
            <div className="mt-4">
              <h3 className="font-semibold">Database User</h3>
              <p className="mt-1">{repository.repository_database_user}</p>
            </div>
            <div className="mt-4">
              <h3 className="font-semibold">Database Name</h3>
              <p className="mt-1">{repository.repository_database_name}</p>
            </div>
            <div className="mt-4">
              <h3 className="font-semibold">Database Password</h3>
              <p className="mt-1">{repository.repository_database_password}</p>
            </div>

            <DialogFooter>
              <Button onClick={() => setIsEditing(true)} disabled={isLoading}>
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

