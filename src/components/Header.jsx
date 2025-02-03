import { Button } from './ui/button'
import { Loader2 } from 'lucide-react'

export default function Header({ onCreateBash, isCreateBashDisabled, isLoading }) {
  return (
    <header className="bg-primary text-primary-foreground py-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">Repository Registry</h1>
        <Button onClick={onCreateBash} disabled={isCreateBashDisabled}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Bash'
          )}
        </Button>
      </div>
    </header>
  )
}

