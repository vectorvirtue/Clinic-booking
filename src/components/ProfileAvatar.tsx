import * as Avatar from '@radix-ui/react-avatar'

type ProfileAvatarProps = {
  src?: string
  name: string
  initials: string
  className?: string
}

export function ProfileAvatar({ src, name, initials, className = '' }: ProfileAvatarProps) {
  return (
    <Avatar.Root className={`inline-flex shrink-0 overflow-hidden rounded-full bg-[#eaf0f7] text-[#294878] ${className}`}>
      {src && <Avatar.Image src={src} alt={name} className="size-full object-cover" />}
      <Avatar.Fallback
        className="flex size-full items-center justify-center font-semibold"
        delayMs={0}
      >
        {initials}
      </Avatar.Fallback>
    </Avatar.Root>
  )
}
