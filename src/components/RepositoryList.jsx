import { useState } from 'react'
import { Checkbox } from './ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { shortenString } from '../utils/stringUtils.js'
import RepositoryModal from './RepositoryModal'

export default function RepositoryList({ 
  repositories, 
  selectedRepos, 
  onSelectRepository, 
  onSelectAll,
  onEditRepository,
  onDeleteRepository,
  isLoading,
  state
}) {
  const [selectedRepository, setSelectedRepository] = useState(null);
  const allSelected = repositories?.length > 0 && selectedRepos?.length === repositories?.length;

  const handleRowClick = (repo) => {
    setSelectedRepository(repo);
  };

  return (
    <div className="mt-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => onSelectAll(checked)}
                disabled={isLoading}
              />
            </TableHead>
            <TableHead>Label</TableHead>
            <TableHead>Repository Link</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Docker Compose Location</TableHead>
            {state !== "bash" && (
              <>
                <TableHead>Database Type (image)</TableHead>
                <TableHead>File Path</TableHead>
              </>
            )}
            <TableHead>Database User</TableHead>
            <TableHead>Database Name</TableHead>
            <TableHead>Database Password</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {repositories?.map((repo) => (
            <TableRow
              key={repo?._id}
              onClick={() => handleRowClick(repo)}
              className="cursor-pointer">
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedRepos.includes(repo?._id)}
                  onCheckedChange={(checked) =>
                    onSelectRepository(repo?._id, checked)
                  }
                  disabled={isLoading}
                />
              </TableCell>
              <TableCell>{shortenString(repo?.repository_label)}</TableCell>
              <TableCell>
                <Popover>
                  <PopoverTrigger>
                    {shortenString(repo?.repository_link)}
                  </PopoverTrigger>
                  <PopoverContent>{repo?.repository_link}</PopoverContent>
                </Popover>
              </TableCell>
              <TableCell>{shortenString(repo?.repository_branch)}</TableCell>
              <TableCell>
                <Popover>
                  <PopoverTrigger>
                    {shortenString(
                      repo?.repository_docker_compose_root_location
                    )}
                  </PopoverTrigger>
                  <PopoverContent>
                    {repo?.repository_docker_compose_root_location}
                  </PopoverContent>
                </Popover>
              </TableCell>
              {state !== "bash" && (
                <>
                  <TableCell>{shortenString(repo?.repository_type)}</TableCell>
                  <TableCell>
                    {shortenString(repo?.repository_file_path)}
                  </TableCell>
                </>
              )}

              <TableCell>
                {shortenString(repo?.repository_database_user)}
              </TableCell>
              <TableCell>
                {shortenString(repo?.repository_database_name)}
              </TableCell>
              <TableCell>
                {shortenString(repo?.repository_database_password)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {selectedRepository && (
        <RepositoryModal
          state={state}
          repository={selectedRepository}
          isOpen={!!selectedRepository}
          onClose={() => setSelectedRepository(null)}
          onEdit={onEditRepository}
          onDelete={onDeleteRepository}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

