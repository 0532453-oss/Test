import { Card, Heading, Text } from '@/atlantis'

interface ActionAreaCardProps {
  title?: string
  description?: string
  imageUrl?: string
  imageAlt?: string
  onClick?: () => void
}

export function ActionAreaCard({
  title = 'Lizard',
  description = 'Lizards are a widespread group of squamate reptiles, with over 6,000 species, ranging across all continents except Antarctica',
  imageUrl = '/static/images/cards/contemplative-reptile.jpg',
  imageAlt = 'green iguana',
  onClick,
}: ActionAreaCardProps) {
  return (
    <Card className="max-w-[345px] overflow-hidden">
      <button
        onClick={onClick}
        className="w-full text-left hover:bg-[var(--color-surface--hover)] transition-colors"
      >
        <img
          src={imageUrl}
          alt={imageAlt}
          className="w-full h-[140px] object-cover"
        />
        <div className="p-4">
          <Heading level={3} className="font-medium mb-1">
            {title}
          </Heading>
          <Text variation="subdued" size="small">
            {description}
          </Text>
        </div>
      </button>
    </Card>
  )
}

export default ActionAreaCard
