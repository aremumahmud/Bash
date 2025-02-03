import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Loader2 } from 'lucide-react'

export default function CreateRepositoryModal({ isOpen, onClose, onAddRepository, isLoading, state }) {
  const [link, setLink] = useState('')
  const [label, setLabel] = useState('')
  const [dockerComposeLocation, setDockerComposeLocation] = useState('root')
  const [branch, setBranch] = useState('')
  const [file_path, setFilePath] = useState('root')
  const [file_type, setFileType] = useState('')
  const [repository_database_user, setDatabaseUser] = useState('')
  const [repository_database_name, setDatabaseName] = useState("");
  const [repository_database_password, setDatabasePassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault()
    const newRepo = {
      id: Date.now().toString(),
      link: link,
      label: label,
      dockerComposeLocation: dockerComposeLocation || 'root',
      branch,
      file_path,
      file_type,
      repository_database_name,
      repository_database_password,
      repository_database_user
    }
    onAddRepository(newRepo)
    setLink('')
    setLabel('')
    setDockerComposeLocation('root')
    setFileType('')
    setFilePath('')
    setDatabaseName('')
    setDatabasePassword('')
    setDatabaseUser('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {state === "bash" ? "Add New Repository" : "Add New Backup Record"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="link">Repository Link</Label>
            <Input
              id="link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="branch">Branch</Label>
            <Input
              id="branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="dockerComposeLocation">
              Docker Compose Location
            </Label>
            <Input
              id="dockerComposeLocation"
              value={dockerComposeLocation}
              onChange={(e) => setDockerComposeLocation(e.target.value)}
              placeholder="root"
            />
          </div>
          {state !== "bash" && (
            <>
              <div>
                <Label htmlFor="file_type">Type</Label>
                <Input
                  id="file_type"
                  value={file_type}
                  onChange={(e) => setFileType(e.target.value)}
                  placeholder="wordpress | strapi"
                />
              </div>
              <div>
                <Label htmlFor="file_path">File Path</Label>
                <Input
                  id="file_path"
                  value={file_path}
                  onChange={(e) => setFilePath(e.target.value)}
                  placeholder="root"
                />
              </div>
            </>
          )}
          <div>
            <Label htmlFor="database_user">Databse User</Label>
            <Input
              id="database_user"
              value={repository_database_user}
              onChange={(e) => setDatabaseUser(e.target.value)}
              placeholder="john"
            />
          </div>
          <div>
            <Label htmlFor="database_name">Database Name</Label>
            <Input
              id="database_name"
              value={repository_database_name}
              onChange={(e) => setDatabaseName(e.target.value)}
              placeholder="strapi"
            />
          </div>
          <div>
            <Label htmlFor="database_password">Database Password</Label>
            <Input
              id="database_password"
              value={repository_database_password}
              onChange={(e) => setDatabasePassword(e.target.value)}
              placeholder="***********"
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : state === "bash" ? (
              "Add Repository"
            ) : (
              "Add Backup Record"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

