import { Button } from './ui/button'
import { Plus } from 'lucide-react'

export default function FloatingActionButton({ onClick, disabled }) {
  return (
    <Button 
      className="fixed bottom-6 right-6 rounded-full w-12 h-12 p-0"
      onClick={onClick}
      disabled={disabled}

    >
      <Plus className="w-6 h-6" />
    </Button>
  )
}

